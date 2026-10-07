# Pharm36 — Mobile App (Pharmacist + User Interfaces)

React Native (Expo) app for Pharm36: fighting the sale of expired drugs and
unregistered "pharmacists" by giving verified pharmacists batch-tracking +
expiry alerts, and giving buyers a way to check a drug before they buy it.

This build covers the **Pharmacist app** and the **User (consumer) app**.
The **Admin (PCN) web portal** is a separate build — talk to me about starting
that next.

## What's in this build

- Animated splash screen with the Pharm36 logo (spring pop-in, pulsing ring, loading dots)
- Role picker → Pharmacist or Buyer
- **Pharmacist side**
  - Login (phone/email + password) and Register (name, phone, email, store location, state, password)
  - Dashboard: sales level per drug, batch counts, expiry banner
  - Inventory: searchable batch list
  - Add batch: manufacture date, expiry date, drug name, price, quantity, barcode scan
  - Simulated barcode scanner UI (camera wiring is a follow-up step)
  - Expiry Alerts: batches nearing expiry, urgent ones flash red, Dispose/Mark Sold actions
  - Sales / Marketplace: buy from other pharmacists or list your own batches
  - Profile: pharmacist + store details, PCN verification badge
- **User (consumer) side**
  - Scan or search a drug
  - AI-style verification screen: genuine/not-genuine, expiry status, manufacturer, batch code, selling pharmacy

All data on screen right now is **mock data** (`src/data/mockData.js`) so you
can see and click through the whole flow before we wire up a real backend.

## Run it

You'll need [Node.js](https://nodejs.org) and the **Expo Go** app on your phone
(App Store / Play Store), or an Android/iOS simulator.

```bash
cd Pharm36
npm install
npx expo start
```

This opens a QR code in your terminal / browser. Scan it with the Expo Go app
(Android: Expo Go's built-in scanner; iPhone: the Camera app) and the app will
load on your phone.

- `npx expo start --android` — open directly in an Android emulator
- `npx expo start --ios` — open directly in an iOS simulator (Mac only)
- `npx expo start --web` — preview in a browser (some native bits like the
  camera-style scan screens will look slightly different on web)

## Project structure

```
src/
  screens/
    SplashScreen.js
    RoleSelectScreen.js
    pharmacist/   (Login, Register, Dashboard, Inventory, DataInput,
                    ScanBatchCode, Expiry, Sales, Profile)
    user/         (UserHome, ScanDrug, DrugInfo)
  navigation/     (PharmacistTabs bottom-tab nav, UserStack)
  components/     (Button, Input, Card, Badge, ScreenHeader)
  theme/theme.js  (colors, spacing, radius, type — pulled from the logo)
  data/mockData.js
```

## Not wired up yet (next steps)

- Real camera barcode scanning (`expo-camera`), currently simulated
- Backend/API (auth, batch storage, PCN data sync, expiry push notifications)
- Push notifications for the 1-month / 2-week expiry alerts
- Admin (PCN) web portal
