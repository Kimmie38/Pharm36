# Pharm36 — Expo frontend

This app is configured to call the existing Pharm36 API at `https://pharm36-backend.onrender.com/api`. The backend health check reported the database connected, and the metadata route and Expo Web CORS preflight responded successfully.

## Run the app

```bash
npm ci
npx expo start
```

For Expo Web, use `npx expo start --web`; Expo Go or a simulator can be used for mobile. The API URL is already the default. To override it for a local backend, copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to an address reachable by that runtime, including `/api` (Android emulator: `http://10.0.2.2:4000/api`; iOS simulator/Web: `http://localhost:4000/api`). The new medicine-info screen calls `/api/public/drugs/info` and `/api/public/drugs/ask`; the currently deployed Render API still returns 404 for the new info route, so deploy the included updated backend before using that new feature in production.

## Current boundaries

Barcode screens use manual batch-code entry until camera capture is implemented. Marketplace orders record stock transfers but do not process payments. Production password-reset delivery requires an SMS/email provider.

## New in this update

- **Languages:** English, Hausa, Yorùbá, Igbo (`src/i18n/`). Picker on the first screen and in Profile. Core screens are translated (role select, login, tabs, home, add batch, scanning, sticker, recall warnings); the rest still show English. Have native speakers review the medical wording before release.
- **Camera barcode scan:** `src/components/CodeCapture.js` (expo-camera) with typed-code fallback, for both the pharmacist and consumer flows.
- **Offline-first:** GET responses are cached and served when the network is down; new batches are queued (`src/offline/`) and uploaded automatically with a client-generated id so retries never create duplicates. A banner shows what is waiting.
- **Verified pharmacy sticker:** Profile → "Verified pharmacy sticker" shows a printable QR that opens the backend page `/p/<id>` (live registration status).
- **NAFDAC number** field on add-batch; buyers are told when a batch has none. **Recalls** show a red "RECALLED" result to buyers.

Install note: this project uses `legacy-peer-deps` (see `.npmrc`) because React Native 0.88 is a release candidate. After pulling, run `npm install`. If you use pnpm, regenerate `pnpm-lock.yaml`.
Rebuild native apps (`npx expo prebuild` / EAS) so the camera permission is included.
