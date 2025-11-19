import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * API 클라이언트 설정
 * Backend API와 통신하기 위한 Axios 인스턴스
 */

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

/**
 * Request Interceptor
 * 모든 요청에 공통 로직 적용 (인증 토큰 등)
 */
apiClient.interceptors.request.use(
  (config) => {
    // TODO: 인증 토큰이 있으면 헤더에 추가
    // const token = await getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 응답 처리 및 에러 핸들링
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url} - ${response.status}`);
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // 서버가 응답을 반환했지만 2xx가 아닌 경우
      console.error('[API Error Response]', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // 요청이 전송되었지만 응답을 받지 못한 경우
      console.error('[API No Response]', error.request);
    } else {
      // 요청 설정 중 에러가 발생한 경우
      console.error('[API Request Setup Error]', error.message);
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
