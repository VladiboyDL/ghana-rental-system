# Ghana Rental System - Mobile App

React Native (Expo) mobile application for the Ghana Rental Market Taxation System.

## Overview

This mobile app provides:
- Native iOS and Android experience
- Landlord and tenant workflows
- Property and contract management
- Payment tracking with tax breakdown
- Document scanning and uploads
- Push notifications
- Offline-capable with local storage

## Tech Stack

- **Framework**: React Native 0.76
- **Platform**: Expo SDK 52
- **Navigation**: Expo Router 4.0
- **State Management**: Zustand 5.0 + AsyncStorage
- **HTTP Client**: Axios 1.7
- **Icons**: Expo Vector Icons
- **Camera**: Expo Camera & Image Picker
- **Storage**: AsyncStorage (encrypted)

## Project Structure

```
mobile/
├── src/
│   ├── app/                  # Expo Router screens
│   │   ├── (tabs)/           # Tab navigation
│   │   │   ├── _layout.tsx   # Tab layout config
│   │   │   ├── index.tsx     # Dashboard
│   │   │   ├── properties.tsx
│   │   │   ├── contracts.tsx
│   │   │   ├── payments.tsx
│   │   │   └── profile.tsx
│   │   ├── _layout.tsx       # Root layout
│   │   ├── login.tsx         # Login screen
│   │   └── register.tsx      # Registration
│   ├── components/           # Reusable components
│   │   ├── LoadingScreen.tsx
│   │   ├── EmptyState.tsx
│   │   ├── StatCard.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── ContractCard.tsx
│   │   └── index.ts
│   ├── services/             # API integration
│   │   └── api.ts            # Axios client
│   ├── stores/               # Zustand stores
│   │   ├── authStore.ts      # Auth with persistence
│   │   └── index.ts
│   └── types/                # TypeScript definitions
│       └── index.ts
├── assets/                   # Images and fonts
│   ├── images/
│   └── fonts/
├── app.config.js             # Expo configuration
├── eas.json                  # EAS Build config
├── package.json
├── tsconfig.json
└── babel.config.js
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator
- Backend API running (see backend/README.md)

### Installation

```bash
# Install dependencies
npm install

# Install Expo CLI globally (if not installed)
npm install -g expo-cli eas-cli
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Run on physical device (scan QR code)
npx expo start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Start and open on iOS |
| `npm run android` | Start and open on Android |
| `npm run web` | Run in the browser |

## Configuration

### app.config.js

```javascript
export default {
  expo: {
    name: "Ghana Rental System",
    slug: "ghana-rental-system",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "ghanarentals",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ||
        (__DEV__
          ? "http://localhost:3000/api"
          : "https://ghana-rental-api.onrender.com/api"),
    },
  },
};
```

### Environment Variables

```bash
# Development
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Production (set in EAS)
EXPO_PUBLIC_API_URL=https://ghana-rental-api.onrender.com/api
```

## Screens

### Login (`/login`)
- Email/password authentication
- Demo account buttons
- Secure credential storage
- Auto-login if token valid

### Dashboard (`/(tabs)/`)
- Overview statistics
- Recent properties
- Pending contracts
- Quick actions
- Tax summary

### Properties (`/(tabs)/properties`)
- Property listing
- Search and filters
- Add new property
- Property details
- Edit property

### Contracts (`/(tabs)/contracts`)
- Contract listing
- Status filters
- Contract details
- Tenant confirmation
- Document uploads

### Payments (`/(tabs)/payments`)
- Payment history
- Tax breakdown
- Payment status
- Receipt generation

### Profile (`/(tabs)/profile`)
- User information
- Account settings
- Logout functionality

## Components

### LoadingScreen

```tsx
import { LoadingScreen } from '@/components';

// Full screen loading
<LoadingScreen />

// With custom message
<LoadingScreen message="Loading properties..." />
```

### EmptyState

```tsx
import { EmptyState } from '@/components';

<EmptyState
  icon="home"
  title="No Properties"
  message="You haven't added any properties yet"
  actionLabel="Add Property"
  onAction={() => navigation.navigate('AddProperty')}
/>
```

### StatCard

```tsx
import { StatCard } from '@/components';

<StatCard
  title="Total Properties"
  value={177}
  icon="building"
  trend="+12%"
  color="#10B981"
/>
```

## State Management

### Auth Store (with Persistence)

```typescript
import { useAuthStore } from '@/stores/authStore';

// In component
const { user, token, login, logout, isLoading } = useAuthStore();

// Login
await login(email, password);

// Logout (clears AsyncStorage)
await logout();

// Auto-hydration on app start
// Token persisted in AsyncStorage
```

## API Integration

### API Client

```typescript
import api from '@/services/api';

// GET request
const properties = await api.get('/properties');

// POST request
const newProperty = await api.post('/properties', data);

// With auth header (automatic via interceptor)
```

## Styling

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Green 500 | #10B981 | Primary actions |
| Red 500 | #EF4444 | Destructive/Tax |
| Blue 500 | #3B82F6 | Info/Links |
| Gray 100 | #F3F4F6 | Backgrounds |
| Gray 800 | #1F2937 | Text |

## Building for Production

### EAS Build Setup

```bash
# Login to EAS
eas login

# Configure project
eas init

# Build for iOS TestFlight
eas build --platform ios --profile production

# Build for Android Play Store
eas build --platform android --profile production
```

### Submit to Stores

```bash
# Submit iOS to TestFlight
eas submit --platform ios --profile production

# Submit Android to Play Store
eas submit --platform android --profile production

# Build and submit in one command
eas build --platform ios --profile production --auto-submit
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Landlord | landlord@demo.com | demo123 |
| Tenant | tenant@demo.com | demo123 |
| GRA Officer | gra@demo.com | demo123 |

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear Metro cache
npx expo start --clear

# Reset watchman
watchman watch-del-all
```

### Build Failures

```bash
# Clear EAS cache
eas build --clear-cache --platform ios

# Check native dependencies
npx expo-doctor
```

### iOS Simulator Not Working

```bash
# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15"
```

## Notes

- **Expo Go** supports most Expo SDK modules (camera, image picker, secure store, etc.)
- Screens that use custom native modules may need a [development build](https://docs.expo.dev/develop/development-builds/introduction/) for full functionality
- Backend: point the app's API base URL to your running backend (see `src/services/api.ts`)

## License

Proprietary - Ghana Revenue Authority
