#!/usr/bin/env bash
# Downloads the latest finished EAS build for a platform and uploads it to
# Firebase App Distribution.
#
# Usage:
#   ./scripts/firebase-distribute.sh android [--release-notes "..."] [--groups testers]
#   ./scripts/firebase-distribute.sh ios     [--release-notes "..."] [--groups testers]
#
# Requirements (one-time):
#   - `eas-cli` (already in devDependencies; run via `npx eas`)
#   - `firebase-tools` (run via `npx firebase-tools`)
#   - `jq` and `curl` (preinstalled on macOS / most CI runners)
#   - `mobile/.env.firebase` populated from `.env.firebase.example`
#   - Either GOOGLE_APPLICATION_CREDENTIALS pointing to a service account JSON,
#     or FIREBASE_TOKEN exported (`firebase login:ci`).
#
# What it does:
#   1) Asks EAS for the most recent successful build for the platform.
#   2) Downloads the .apk / .ipa artifact into mobile/dist/.
#   3) Uploads it to Firebase App Distribution, notifying configured groups.

set -euo pipefail

cd "$(dirname "$0")/.."

PLATFORM="${1:-}"
if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
  cat >&2 <<EOF
Usage: $0 [android|ios] [--release-notes "..."] [--groups "group1,group2"]
EOF
  exit 1
fi
shift

RELEASE_NOTES=""
GROUPS_OVERRIDE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-notes) RELEASE_NOTES="${2:-}"; shift 2;;
    --groups)        GROUPS_OVERRIDE="${2:-}"; shift 2;;
    *) echo "Unknown argument: $1" >&2; exit 1;;
  esac
done

# Load Firebase config if present (doesn't override exported env vars).
if [[ -f .env.firebase ]]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env.firebase
  set +o allexport
fi

APP_ID_VAR="FIREBASE_APP_ID_$(echo "$PLATFORM" | tr '[:lower:]' '[:upper:]')"
APP_ID="${!APP_ID_VAR:-}"
if [[ -z "$APP_ID" ]]; then
  echo "::error::$APP_ID_VAR is not set. Add it to mobile/.env.firebase or export it." >&2
  exit 1
fi

GROUPS="${GROUPS_OVERRIDE:-${FIREBASE_GROUPS:-testers}}"

if ! command -v jq >/dev/null 2>&1; then
  echo "::error::jq is required (install with 'brew install jq' or 'apt-get install jq')" >&2
  exit 1
fi

# Pre-flight: make sure we have an Expo session. eas-cli reads EXPO_TOKEN
# (CI) or the local keychain login. Without it `build:list` returns nothing
# and the user gets a cryptic "no builds found" — we'd rather fail loudly.
if [[ -z "${EXPO_TOKEN:-}" ]] && ! npx --yes eas-cli whoami >/dev/null 2>&1; then
  echo "::error::Not logged in to Expo. Run 'npx eas login' or export EXPO_TOKEN." >&2
  exit 1
fi

echo "› Looking up latest finished EAS build for $PLATFORM…"
BUILD_JSON=$(npx --yes eas-cli build:list \
  --status finished \
  --limit 1 \
  --platform "$PLATFORM" \
  --non-interactive \
  --json)

ARTIFACT=$(echo "$BUILD_JSON" | jq -r '.[0].artifacts.buildUrl // .[0].artifacts.applicationArchiveUrl // empty')
BUILD_ID=$(echo "$BUILD_JSON" | jq -r '.[0].id // empty')
APP_VERSION=$(echo "$BUILD_JSON" | jq -r '.[0].appVersion // empty')

if [[ -z "$ARTIFACT" ]]; then
  cat >&2 <<EOF
::error::No finished $PLATFORM builds found on Expo.
         Kick one off first:
             npx eas build --platform $PLATFORM --profile preview
         Or use the all-in-one command:
             npm run firebase:release:$PLATFORM
EOF
  exit 1
fi

EXT="apk"; [[ "$PLATFORM" == "ios" ]] && EXT="ipa"
OUT="dist/saffron-cashier-$PLATFORM-${APP_VERSION:-latest}.$EXT"
mkdir -p dist
echo "› Build $BUILD_ID (v$APP_VERSION)"
echo "› Downloading $ARTIFACT"
curl -L --fail --silent --show-error -o "$OUT" "$ARTIFACT"

NOTES_FILE=""
if [[ -n "$RELEASE_NOTES" ]]; then
  NOTES_FILE="$(mktemp)"
  printf "%s\n" "$RELEASE_NOTES" > "$NOTES_FILE"
fi

DISTRIBUTE_ARGS=(
  appdistribution:distribute "$OUT"
  --app "$APP_ID"
  --groups "$GROUPS"
)
if [[ -n "$NOTES_FILE" ]]; then
  DISTRIBUTE_ARGS+=(--release-notes-file "$NOTES_FILE")
fi
if [[ -n "${FIREBASE_TOKEN:-}" ]]; then
  DISTRIBUTE_ARGS+=(--token "$FIREBASE_TOKEN")
fi

echo "› Uploading to Firebase App Distribution (app=$APP_ID, groups=$GROUPS)…"
if ! npx --yes firebase-tools "${DISTRIBUTE_ARGS[@]}"; then
  rc=$?
  cat >&2 <<EOF
::error::firebase-tools rejected the upload (exit $rc).
         Common causes:
           • $APP_ID_VAR doesn't match the App ID in Firebase console
             (must be the full "1:…:$PLATFORM:…" string)
           • The service account doesn't have role
             "Firebase App Distribution Admin"
           • Group "$GROUPS" doesn't exist in App Distribution → Testers & groups
EOF
  [[ -n "$NOTES_FILE" && -f "$NOTES_FILE" ]] && rm -f "$NOTES_FILE"
  exit $rc
fi

[[ -n "$NOTES_FILE" && -f "$NOTES_FILE" ]] && rm -f "$NOTES_FILE"

echo "✓ Distributed. Testers will receive an email invite."
echo "  Manage releases at https://console.firebase.google.com → App Distribution."
