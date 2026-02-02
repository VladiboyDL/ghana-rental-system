// Dynamic Expo configuration
// This replaces app.json for environment-specific settings

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getAppName = () => {
  if (IS_DEV) return 'Ghana Rental (Dev)';
  if (IS_PREVIEW) return 'Ghana Rental (Preview)';
  return 'Ghana Rental';
};

const getBundleId = () => {
  if (IS_DEV) return 'com.ghanarent.app.dev';
  if (IS_PREVIEW) return 'com.ghanarent.app.preview';
  return 'com.ghanarent.app';
};

const getApiUrl = () => {
  if (IS_DEV) return 'http://localhost:5000/api';
  // For preview and production, use Render backend
  return 'https://ghana-rental-api.onrender.com/api';
};

export default {
  name: getAppName(),
  slug: 'ghana-rental',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#006B3F',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: getBundleId(),
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription:
        'Ghana Rental needs camera access to scan ID documents and take property photos.',
      NSPhotoLibraryUsageDescription:
        'Ghana Rental needs photo library access to upload property images and ID documents.',
      NSPhotoLibraryAddUsageDescription:
        'Ghana Rental needs permission to save documents to your photo library.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#006B3F',
    },
    package: getBundleId(),
    versionCode: 1,
    permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
  },
  plugins: [
    [
      'expo-camera',
      {
        cameraPermission: 'Allow Ghana Rental to access your camera to scan ID documents.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Ghana Rental to access your photos to upload documents.',
      },
    ],
    'expo-secure-store',
  ],
  scheme: 'ghanarent',
  extra: {
    apiUrl: getApiUrl(),
  },
};
