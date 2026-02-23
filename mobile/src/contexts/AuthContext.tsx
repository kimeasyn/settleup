import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { User, SocialProvider } from '../models/Auth';
import * as tokenStorage from '../services/auth/tokenStorage';
import * as authApi from '../services/auth/authApi';
import { generateCodeVerifier, generateCodeChallenge } from '../services/auth/pkce';
import { onAuthExpired } from '../services/api/client';
import { clearDatabase } from '../services/storage/database';

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
  // 브라우저 기반 OAuth + 커스텀 스킴 리다이렉트는 iOS 타입 클라이언트 ID만 지원
  // Android 클라이언트 ID는 redirect_uri를 지원하지 않음
  const extra = Constants.expoConfig?.extra;
  return extra?.googleClientIdIos ?? '';
}

function getRedirectUri(): string {
  return buildGoogleRedirectUri(getGoogleClientId());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!googleClientId || googleClientId === 'placeholder') {
      isLoggingIn.current = false;
      throw new Error('Google Client ID가 설정되지 않았습니다. 환경변수를 확인하세요.');
    }

    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

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
      const result = await WebBrowser.openAuthSessionAsync(authUrl, getRedirectUri());

      if (result.type === 'success' && result.url) {
        const queryString = result.url.split('?')[1];
        if (queryString) {
          const urlParams = new URLSearchParams(queryString);
          const code = urlParams.get('code');
          if (code) {
            const idToken = await authApi.exchangeGoogleCode(
              code,
              codeVerifier,
              googleClientId,
              getRedirectUri(),
            );
            await handleSocialLogin('google', idToken);
          }
        }
      }
    } catch (e) {
      throw e;
    } finally {
      isLoggingIn.current = false;
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
        try {
          await handleSocialLogin('kakao', token);
        } catch (apiError: any) {
          console.error('[Auth] Kakao backend API failed:', apiError);
          throw apiError;
        }
      }
    } catch (e: any) {
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
      await clearDatabase().catch(() => {});
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
