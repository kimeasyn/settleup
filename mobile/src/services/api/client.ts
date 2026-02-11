import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../auth/tokenStorage';
import { LoginResponse } from '../../models/Auth';

/**
 * API 클라이언트 설정
 * Backend API와 통신하기 위한 Axios 인스턴스
 */

// 인증 만료 시 콜백 기반 알림
type AuthExpiredListener = () => void;
let authExpiredListeners: AuthExpiredListener[] = [];

export function onAuthExpired(listener: AuthExpiredListener) {
  authExpiredListeners.push(listener);
  return () => {
    authExpiredListeners = authExpiredListeners.filter((l) => l !== listener);
  };
}

function notifyAuthExpired() {
  authExpiredListeners.forEach((listener) => listener());
}

// 환경에 따른 API URL 설정
const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api/v1'  // 개발 환경
  : 'https://api.settleup.com/api/v1';  // 프로덕션 환경

/**
 * Axios 인스턴스 생성
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 갱신 중복 방지
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * 토큰 갱신 — 순환 참조 방지를 위해 apiClient로 직접 호출
 */
async function callRefreshToken(refreshToken: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/refresh', { refreshToken });
  return response.data;
}

/**
 * Request Interceptor
 * 모든 요청에 인증 토큰 자동 첨부
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 401 응답 시 토큰 갱신 후 원래 요청 재시도
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 응답이고 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // refresh 요청 자체가 실패한 경우 무한 루프 방지
      if (originalRequest.url?.includes('/auth/refresh')) {
        await clearTokens();
        notifyAuthExpired();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 이미 갱신 중이면 대기열에 추가
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await getRefreshToken();
        if (!storedRefreshToken) {
          throw new Error('No refresh token');
        }

        const response = await callRefreshToken(storedRefreshToken);
        await saveTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          accessTokenExpiresIn: response.accessTokenExpiresIn,
        });

        onTokenRefreshed(response.accessToken);
        originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        notifyAuthExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * 네트워크 연결 상태 확인
 */
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health', { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
};
