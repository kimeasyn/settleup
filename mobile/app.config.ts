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
  };
};
