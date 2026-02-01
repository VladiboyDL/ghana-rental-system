# Ghana Rental – Mobile (Expo)

iOS and Android app for the Ghana Rental Market system. Built with **Expo** and runs in **Expo Go** for development.

## Run in Expo Go (iOS)

1. **Install Expo Go** on your iPhone from the App Store.

2. **Start the dev server** (from this folder):
   ```bash
   npm start
   ```
   Or for iOS directly:
   ```bash
   npm run ios
   ```

3. **Open the app:**
   - **Physical iPhone:** Ensure your phone and computer are on the same Wi‑Fi. Scan the QR code from the terminal with your iPhone camera; it will open in Expo Go.
   - **iOS Simulator:** Press `i` in the terminal after `npm start`, or run `npm run ios` to open the simulator and load the app.

4. The app will connect to the Metro bundler and load the Ghana Rental UI (Welcome → Login/Register → Landlord or Tenant flows).

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm start`    | Start Expo dev server          |
| `npm run ios`  | Start and open on iOS          |
| `npm run android` | Start and open on Android |
| `npm run web`  | Run in the browser             |

## Notes

- **Expo Go** supports most Expo SDK modules (camera, image picker, secure store, etc.). Screens that use custom native modules (e.g. some OCR or PDF libraries) may need a [development build](https://docs.expo.dev/develop/development-builds/introduction/) for full functionality.
- Backend: point the app’s API base URL to your running backend (see `src/services/api.ts`).
