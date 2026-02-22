import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Google Client ID에서 딥링크 scheme 추출
 * 예: "XXX.apps.googleusercontent.com" → "com.googleusercontent.apps.XXX"
 */
function getGoogleScheme(clientId?: string): string | null {
  if (!clientId) return null;
  const match = clientId.match(/^(.+)\.apps\.googleusercontent\.com$/);
  return match ? `com.googleusercontent.apps.${match[1]}` : null;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleSchemeIos = getGoogleScheme(process.env.GOOGLE_CLIENT_ID_IOS);
  const googleSchemeAndroid = getGoogleScheme(process.env.GOOGLE_CLIENT_ID_ANDROID);

  const schemes = ['com.settleup.app'];
  if (googleSchemeIos) schemes.push(googleSchemeIos);
  if (googleSchemeAndroid && googleSchemeAndroid !== googleSchemeIos) schemes.push(googleSchemeAndroid);

  return {
  ...config,
  name: 'SettleUp',
  slug: 'settleup',
  version: '0.0.1',
  scheme: schemes,
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
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
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#FFFFFF',
    },
  },
  plugins: [
    [
      '@react-native-seoul/kakao-login',
      {
        kakaoAppKey: process.env.KAKAO_NATIVE_APP_KEY || 'placeholder',
        kotlinVersion: '2.0.21',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
    '@react-native-community/datetimepicker',
    'expo-secure-store',
    'expo-web-browser',
  ],
  extra: {
    eas: {
      projectId: "edd6813d-018e-4d92-a94a-0cf5db882276",
    },
    apiBaseUrl: process.env.API_BASE_URL || 'http://settleup-alb-1837776955.ap-northeast-2.elb.amazonaws.com/api/v1',
    googleClientIdIos: process.env.GOOGLE_CLIENT_ID_IOS || 'placeholder',
    googleClientIdAndroid: process.env.GOOGLE_CLIENT_ID_ANDROID || 'placeholder',
    kakaoNativeAppKey: process.env.KAKAO_NATIVE_APP_KEY || 'placeholder',
  },
  };
};
