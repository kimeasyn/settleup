/**
 * 인증 관련 TypeScript 타입 정의
 */

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  userId: string;
  userName: string;
  userEmail: string;
}

export type SocialProvider = 'google' | 'kakao';
