#!/usr/bin/env bash
# Bump mobile/app.json version, commit, push.
#
# Triggers the `mobile-release` GitHub workflow which builds on EAS and
# distributes via Firebase App Distribution. See deploy/FIREBASE_DISTRIBUTION.md.
#
# Usage:
#   ./scripts/release.sh patch                 # 1.0.0 → 1.0.1
#   ./scripts/release.sh minor                 # 1.0.0 → 1.1.0
#   ./scripts/release.sh major                 # 1.0.0 → 2.0.0
#   ./scripts/release.sh 1.2.3                 # explicit
#   ./scripts/release.sh patch --dry-run       # show plan, don't write
#   ./scripts/release.sh patch --no-push       # commit but don't push
#   ./scripts/release.sh patch --message "Hotfix BLIK rounding"

set -euo pipefail

cd "$(dirname "$0")/.."

BUMP=""
DRY=false
PUSH=true
COMMIT_MSG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    patch|minor|major) BUMP="$1"; shift;;
    --dry-run)         DRY=true; shift;;
    --no-push)         PUSH=false; shift;;
    --message)         COMMIT_MSG="${2:-}"; shift 2;;
    [0-9]*.[0-9]*.[0-9]*) BUMP="$1"; shift;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1;;
  esac
done

if [[ -z "$BUMP" ]]; then
  echo "Usage: $0 [patch|minor|major|X.Y.Z] [--dry-run] [--no-push] [--message \"text\"]" >&2
  exit 1
fi

# ---- read current version -------------------------------------------------- #

if ! command -v jq >/dev/null 2>&1; then
  echo "::error::jq is required (brew install jq / apt-get install jq)" >&2
  exit 1
fi

CURRENT=$(jq -r '.expo.version' app.json)
if [[ -z "$CURRENT" || "$CURRENT" == "null" ]]; then
  echo "::error::expo.version missing in app.json" >&2
  exit 1
fi

# ---- compute next version -------------------------------------------------- #

bump_semver() {
  local version="$1" kind="$2"
  IFS='.' read -r major minor patch <<<"$version"
  case "$kind" in
    patch) patch=$((patch + 1));;
    minor) minor=$((minor + 1)); patch=0;;
    major) major=$((major + 1)); minor=0; patch=0;;
    *) echo "$kind"; return;;  # explicit X.Y.Z
  esac
  echo "$major.$minor.$patch"
}

if [[ "$BUMP" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  NEXT="$BUMP"
elif [[ "$BUMP" == "patch" || "$BUMP" == "minor" || "$BUMP" == "major" ]]; then
  NEXT=$(bump_semver "$CURRENT" "$BUMP")
else
  echo "::error::Unrecognised version spec '$BUMP' — use patch|minor|major or X.Y.Z" >&2
  exit 1
fi

# Final guard: the computed next version must be a valid semver triple.
if [[ ! "$NEXT" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "::error::Internal: computed version '$NEXT' is not valid semver." >&2
  exit 1
fi

if [[ "$CURRENT" == "$NEXT" ]]; then
  echo "::error::Version unchanged ($CURRENT) — nothing to release." >&2
  exit 1
fi

# ---- compute next build numbers ------------------------------------------- #
#
# android.versionCode and ios.buildNumber must monotonically increase for the
# store + for upgrade-in-place via Firebase App Tester. They live in app.json
# but are often missing on a fresh Expo project — default to 1 in that case.

ANDROID_CODE=$(jq -r '.expo.android.versionCode // 0' app.json)
NEXT_ANDROID_CODE=$((ANDROID_CODE + 1))

IOS_BUILD=$(jq -r '.expo.ios.buildNumber // "0"' app.json)
# iOS buildNumber is a string; if non-numeric (e.g. "1.0.0"), reset to 1.
if [[ "$IOS_BUILD" =~ ^[0-9]+$ ]]; then
  NEXT_IOS_BUILD=$((IOS_BUILD + 1))
else
  NEXT_IOS_BUILD=1
fi

# ---- preview --------------------------------------------------------------- #

cat <<EOF
Release plan
────────────
  version           $CURRENT → $NEXT
  android.versionCode  $ANDROID_CODE → $NEXT_ANDROID_CODE
  ios.buildNumber      $IOS_BUILD → $NEXT_IOS_BUILD
  push?             $PUSH
  dry-run?          $DRY
EOF

if $DRY; then
  echo "(dry run — exiting without writing)"
  exit 0
fi

# ---- write app.json (atomic) ---------------------------------------------- #

TMP=$(mktemp)
jq \
  --arg version       "$NEXT" \
  --argjson androidCode $NEXT_ANDROID_CODE \
  --arg     iosBuild   "$NEXT_IOS_BUILD" \
  '.expo.version = $version
   | .expo.android.versionCode = $androidCode
   | .expo.ios.buildNumber = $iosBuild' \
  app.json > "$TMP"
mv "$TMP" app.json

echo "✓ app.json bumped"

# ---- git ------------------------------------------------------------------- #

if ! git diff --quiet app.json; then
  : # there are changes to commit
else
  echo "::error::jq update produced no diff — aborting." >&2
  exit 1
fi

if [[ -z "$COMMIT_MSG" ]]; then
  COMMIT_MSG="release(mobile): v$NEXT"
fi

git add app.json
git commit -m "$COMMIT_MSG"
echo "✓ committed: $COMMIT_MSG"

if $PUSH; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "› pushing $BRANCH to origin…"
  git push origin "$BRANCH"
  echo
  echo "✓ Released. Watch the build at:"
  REMOTE=$(git config --get remote.origin.url | sed -E 's#(git@github\.com:|https://github\.com/)([^/]+/[^/.]+)(\.git)?#\2#')
  echo "    https://github.com/$REMOTE/actions/workflows/mobile-release.yml"
else
  echo
  echo "✓ Committed locally. Push with:"
  echo "    git push"
fi
