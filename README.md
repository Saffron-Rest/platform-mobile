# Saffron Cashier (Expo)

Mobile app for cashiers — connects to the **production API** on your VPS when built with EAS.

## API URL

| Environment | URL |
|-------------|-----|
| **Production (EAS)** | `https://cash-flow.saffron.waw.pl/api` |
| Local dev | `mobile/.env` → `EXPO_PUBLIC_API_URL` |

Configured in `eas.json` for `preview` and `production` profiles.

## First-time Expo setup

1. Install tools:

```bash
cd mobile
npm install
npm install -g eas-cli   # or: npx eas-cli
```

2. Log in and link the project:

```bash
eas login
eas init
```

`eas init` creates the project on [expo.dev](https://expo.dev) and writes `projectId` into `app.json` → `expo.extra.eas.projectId`.

3. Local dev (optional):

```bash
cp .env.example .env
# Edit EXPO_PUBLIC_API_URL for your LAN backend if needed
npx expo start
```

## Build & publish (EAS)

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

Download builds from the link EAS prints, or from [expo.dev](https://expo.dev) → your project → Builds.

## GitHub Actions

Workflow: `.github/workflows/mobile-eas.yml`

Add repository secret:

| Secret | Value |
|--------|--------|
| `EXPO_TOKEN` | [expo.dev](https://expo.dev) → Account → Access tokens |

Trigger manually (**Actions → mobile-eas → Run workflow**) or push changes under `mobile/`.

## Sign in

Use a **Cashier** account created in the web app (Admin → Users). Default admin is for the website only unless you create a cashier user.
