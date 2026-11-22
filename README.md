# A Pay Android Demo (v1.0)

A blue-and-white demo wallet UI inspired by common payment-app layouts. It does **not** process real payments.

## Build APK using Termux

1. Install Node.js and Git in Termux:
   `pkg update && pkg install nodejs-lts git`
2. Extract this ZIP and enter the project folder.
3. Install packages:
   `npm install`
4. Add Android platform:
   `npx cap add android`
5. Sync web files:
   `npx cap sync android`
6. Build the debug APK in an Android build environment with Android SDK:
   `cd android && ./gradlew assembleDebug`

APK output (if build succeeds):
`android/app/build/outputs/apk/debug/app-debug.apk`

## Important
This is a front-end demonstration. The wallet balance is sample data stored only in app memory and resets when the app reloads. The QR screen is decorative. No UPI, bank, card, KYC, cash-out, or real-money functionality is connected. Real payment functionality requires an appropriately authorized payment/banking partner, compliance review, secure backend, and adult/legal oversight.
