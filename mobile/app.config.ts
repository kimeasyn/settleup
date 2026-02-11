import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SettleUp',
  slug: 'settleup',
  version: '0.0.1',
  scheme: ['com.settleup.app', 'com.googleusercontent.apps.378883944979-66l2d08kd55vlpj98gpppdkelhnf5qti'],
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  splash: {
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.settleup.app',
    infoPlist: {
      LSApplicationQueriesSchemes: ['kakaokompassauth', 'kakaolink'],
    },
  },
  android: {
    package: 'com.settleup.app',
    permissions: ['INTERNET'],
  },
  plugins: [
    [
      '@react-native-seoul/kakao-login',
      {
        nativeAppKey: process.env.KAKAO_NATIVE_APP_KEY ?? '',
      },
    ],
    '@react-native-community/datetimepicker',
    'expo-secure-store',
    'expo-web-browser',
  ],
  extra: {
    googleClientIdIos: process.env.GOOGLE_CLIENT_ID_IOS ?? '',
    googleClientIdAndroid: process.env.GOOGLE_CLIENT_ID_ANDROID ?? '',
    kakaoNativeAppKey: process.env.KAKAO_NATIVE_APP_KEY ?? '',
  },
});
