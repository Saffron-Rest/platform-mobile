# Saffron Cashier (Expo)

Mobile app for cashiers — connects to the **production API** on the Saffron VPS when built with EAS.

## API URL

| Environment | URL |
|-------------|-----|
| **Production (EAS)** | `https://cash-flow.saffron.waw.pl/api` |
| Local dev | `.env` → `EXPO_PUBLIC_API_URL` |

Configured in `eas.json` for `preview` and `production` profiles.

## First-time Expo setup

```bash
npm install
npm install -g eas-cli   # or: npx eas-cli
eas login
eas init                 # only if expo.extra.eas.projectId is empty
```

`eas init` creates the project on [expo.dev](https://expo.dev) and writes `projectId` into `app.json`. This repo already has one (`a6f5cebb-…`) so you usually skip this step.

## Local dev

```bash
cp .env.example .env
# Edit EXPO_PUBLIC_API_URL for your LAN backend if needed
npx expo start
```

## Cutting a release (automated)

Everything below is automated by GitHub Actions. From a clean working tree on `main`:

```bash
npm run release:patch       # 1.0.0 → 1.0.1 — most common, fast feedback
# or:
npm run release:minor       # 1.0.0 → 1.1.0
npm run release:major       # 1.0.0 → 2.0.0
npm run release:dry         # preview the bump, do not write anything
bash scripts/release.sh 1.2.3 --message "Hotfix BLIK rounding"
```

The script bumps `expo.version`, `android.versionCode`, and `ios.buildNumber` in `app.json`, commits with `release(mobile): vX.Y.Z`, and pushes.

The single GitHub Action `ci` then takes over:

1. Detects the version change.
2. Builds on EAS with the `preview` profile (preview = internal APK / ad‑hoc IPA).
3. Uploads to Firebase App Distribution, notifying the configured tester groups.
4. Tags the commit `vX.Y.Z`.
5. Creates a GitHub Release with auto-generated notes (commits since the previous tag).

Testers see the new build inside **Firebase App Tester** within ~10–15 minutes.

## The one workflow — `.github/workflows/ci.yml`

| Trigger | What happens |
|---------|--------------|
| Push to `main` that bumps `expo.version` in `app.json` | Build → Firebase → tag `vX.Y.Z` → GitHub Release |
| Actions → "ci" → **Run workflow** (manual dispatch) | You pick `platform`, `profile`, and `distribute` (`firebase` or `none`). Use this for hotfix re-distribution or for a plain EAS build with no Firebase upload. |
| Push to `main` without a version bump | Workflow runs the `plan` job, sees no version change, and exits cleanly without spending an EAS build. |

## GitHub repository secrets

Add at **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|--------|
| `EXPO_TOKEN` | [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) |
| `FIREBASE_SERVICE_ACCOUNT` | Service-account JSON (paste the **whole file** as one secret) |
| `FIREBASE_APP_ID_ANDROID` | `1:…:android:…` from Firebase console |
| `FIREBASE_APP_ID_IOS` | `1:…:ios:…` (skip if Android-only) |

Optional repo *variables* (Settings → Secrets and variables → Actions → Variables):

| Variable | Default | Purpose |
|----------|---------|---------|
| `FIREBASE_GROUPS` | `testers` | Tester groups to notify |
| `RELEASE_PLATFORMS` | `android` | Platforms the auto-release workflow targets — `android`, `ios`, or `all` |

## Free internal distribution (Firebase App Distribution)

Manual / interactive fallback if you don't want a version bump:

```bash
cp .env.firebase.example .env.firebase   # fill in app IDs + service account path
npm run firebase:release:android         # builds on EAS, uploads APK to Firebase
```

### Build & publish (EAS) directly

**Android APK (internal / sideload):**

```bash
eas build --profile preview --platform android
```

**Production (Android + iOS):**

```bash
eas build --profile production --platform all
```

**App Store / Play Store** (after credentials are set in Expo):

```bash
eas submit --platform android --latest
eas submit --platform ios --latest
```

## Sign in

Use a **Cashier** account created in the web app (Admin → Users). Default admin is for the website only unless you create a cashier user.
