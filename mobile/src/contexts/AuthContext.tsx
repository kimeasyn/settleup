import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform, Linking } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { GOOGLE_CLIENT_ID_IOS, GOOGLE_CLIENT_ID_ANDROID } from '@env';
import { User, SocialProvider } from '../models/Auth';
import * as tokenStorage from '../services/auth/tokenStorage';
import * as authApi from '../services/auth/authApi';
import { generateCodeVerifier, generateCodeChallenge } from '../services/auth/pkce';
import { onAuthExpired } from '../services/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (provider: SocialProvider) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Google Client ID에서 리다이렉트 URI 생성
 * 예: "XXX.apps.googleusercontent.com" → "com.googleusercontent.apps.XXX://"
 */
function buildGoogleRedirectUri(clientId: string): string {
  const match = clientId.match(/^(.+)\.apps\.googleusercontent\.com$/);
  if (!match) return '';
  return `com.googleusercontent.apps.${match[1]}://`;
}

function getGoogleClientId(): string {
  return Platform.select({
    ios: GOOGLE_CLIENT_ID_IOS,
    android: GOOGLE_CLIENT_ID_ANDROID,
  }) ?? '';
}

function getRedirectUri(): string {
  return buildGoogleRedirectUri(getGoogleClientId());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const codeVerifierRef = useRef<string | null>(null);
  const isLoggingIn = useRef(false);

  // 앱 시작 시 저장된 토큰으로 복원
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedUser = await tokenStorage.getUser();
        const accessToken = await tokenStorage.getAccessToken();

        if (storedUser && accessToken) {
          setUser(storedUser);
        } else {
          const refreshToken = await tokenStorage.getRefreshToken();
          if (refreshToken) {
            try {
              const response = await authApi.refreshAccessToken(refreshToken);
              await tokenStorage.saveTokens({
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                accessTokenExpiresIn: response.accessTokenExpiresIn,
              });
              const restoredUser: User = {
                id: response.userId,
                name: response.userName,
                email: response.userEmail,
              };
              await tokenStorage.saveUser(restoredUser);
              setUser(restoredUser);
            } catch {
              await tokenStorage.clearTokens();
            }
          }
        }
      } catch (e) {
        console.error('[Auth] Session restore failed:', e);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Google OAuth 딥링크 콜백
  useEffect(() => {
    async function handleDeepLink(event: { url: string }) {
      const { url } = event;
      const redirectUri = getRedirectUri();
      if (!redirectUri || !url.startsWith(redirectUri)) return;

      const queryString = url.split('?')[1];
      if (!queryString) return;

      const params = new URLSearchParams(queryString);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        console.error('[Auth] Google 인증 에러:', error, params.get('error_description'));
        return;
      }

      if (!code || !codeVerifierRef.current) return;

      try {
        const idToken = await authApi.exchangeGoogleCode(
          code,
          codeVerifierRef.current,
          getGoogleClientId(),
          getRedirectUri(),
        );

        await handleSocialLogin('google', idToken);
      } catch (e) {
        console.error('[Auth] Google code exchange failed:', e);
      } finally {
        codeVerifierRef.current = null;
        isLoggingIn.current = false;
      }
    }

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // 전역 인증 만료 이벤트 감지
  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      setUser(null);
    });
    return unsubscribe;
  }, []);

  async function handleSocialLogin(provider: SocialProvider, token: string) {
    const response =
      provider === 'google'
        ? await authApi.loginWithGoogle(token)
        : await authApi.loginWithKakao(token);

    await tokenStorage.saveTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      accessTokenExpiresIn: response.accessTokenExpiresIn,
    });

    const loggedInUser: User = {
      id: response.userId,
      name: response.userName,
      email: response.userEmail,
    };
    await tokenStorage.saveUser(loggedInUser);
    setUser(loggedInUser);
  }

  const loginWithGoogle = useCallback(async () => {
    if (isLoggingIn.current) return;
    isLoggingIn.current = true;

    const googleClientId = getGoogleClientId();
    if (!googleClientId) {
      isLoggingIn.current = false;
      throw new Error('Google Client ID가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }

    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      codeVerifierRef.current = codeVerifier;

      const params = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: getRedirectUri(),
        response_type: 'code',
        scope: 'openid profile email',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      await Linking.openURL(authUrl);
    } catch (e) {
      isLoggingIn.current = false;
      throw e;
    }
  }, []);

  const loginWithKakao = useCallback(async () => {
    if (isExpoGo) {
      throw new Error('카카오 로그인은 개발 빌드에서만 사용 가능합니다.');
    }

    try {
      const { login: kakaoSdkLogin } = require('@react-native-seoul/kakao-login');
      const result = await kakaoSdkLogin();
      const token = result.idToken || result.accessToken;
      if (token) {
        await handleSocialLogin('kakao', token);
      }
    } catch (e) {
      console.error('[Auth] Kakao login failed:', e);
      throw e;
    }
  }, []);

  const login = useCallback(
    async (provider: SocialProvider) => {
      if (provider === 'google') {
        await loginWithGoogle();
      } else {
        await loginWithKakao();
      }
    },
    [loginWithGoogle, loginWithKakao],
  );

  const logout = useCallback(async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        await authApi.logout(accessToken).catch(() => {});
      }
    } finally {
      await tokenStorage.clearTokens();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
