export default {
  expo: {
    name: 'Ghost Mode',
    slug: 'GhostMode',
    version: '1.2.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    primaryColor: '#7c3aed',
    backgroundColor: '#0a0a12',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0a0a12',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mjjones.ghostmode',
      userInterfaceStyle: 'dark',
      infoPlist: {
        UIStatusBarStyle: 'UIStatusBarStyleLightContent',
        UIViewControllerBasedStatusBarAppearance: false,
      },
    },
    android: {
      package: 'com.ghostmode.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0a0a12',
      },
      userInterfaceStyle: 'dark',
      permissions: ['android.permission.POST_NOTIFICATIONS'],
    },
    web: {
      favicon: './assets/favicon.png',
      backgroundColor: '#0a0a12',
    },
    plugins: [
      'expo-font',
      ['expo-status-bar', { style: 'light' }],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#7c3aed',
          sounds: [],
        },
      ],
      // LATER (RevenueCat + App Store subscriptions):
      // 1. npm install react-native-purchases
      // 2. Add EXPO_PUBLIC_REVENUECAT_IOS_API_KEY to .env (see config/revenuecat.js)
      // 3. Uncomment and configure the plugin below after App Store Connect products exist
      // ['react-native-purchases', { ios: { usesStoreKit2IfAvailable: true } }],
    ],
    extra: {
      coachApiUrl: process.env.EXPO_PUBLIC_COACH_API_URL || '',
      eas: {
        projectId: '40468da6-38a7-4f72-b9d9-b7419c615631',
      },
    },
  },
};
