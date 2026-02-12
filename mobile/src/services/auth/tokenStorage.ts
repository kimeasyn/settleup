import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, User } from '../../models/Auth';

// SecureStore를 동적으로 로드 — 네이티브 모듈 없으면 AsyncStorage로 폴백
let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  console.warn('[tokenStorage] expo-secure-store 사용 불가, AsyncStorage로 폴백합니다.');
}

const KEYS = {
  ACCESS_TOKEN: 'settleup_access_token',
  REFRESH_TOKEN: 'settleup_refresh_token',
  ACCESS_TOKEN_EXPIRES_IN: 'settleup_access_token_expires_in',
  USER: 'settleup_user',
};

async function setSecureItem(key: string, value: string): Promise<void> {
  if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function getSecureItem(key: string): Promise<string | null> {
  if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

async function deleteSecureItem(key: string): Promise<void> {
  if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await setSecureItem(KEYS.ACCESS_TOKEN, tokens.accessToken);
  await setSecureItem(KEYS.REFRESH_TOKEN, tokens.refreshToken);
  await setSecureItem(KEYS.ACCESS_TOKEN_EXPIRES_IN, String(tokens.accessTokenExpiresIn));
}

export async function getAccessToken(): Promise<string | null> {
  return getSecureItem(KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecureItem(KEYS.REFRESH_TOKEN);
}

export async function clearTokens(): Promise<void> {
  await deleteSecureItem(KEYS.ACCESS_TOKEN);
  await deleteSecureItem(KEYS.REFRESH_TOKEN);
  await deleteSecureItem(KEYS.ACCESS_TOKEN_EXPIRES_IN);
  await AsyncStorage.removeItem(KEYS.USER);
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function getUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  if (!raw) return null;
  return JSON.parse(raw) as User;
}
