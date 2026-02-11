import axios from 'axios';
import { apiClient } from '../api/client';
import { LoginResponse } from '../../models/Auth';

/**
 * Google authorization code를 id_token으로 교환
 */
export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string,
): Promise<string> {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });
  return response.data.id_token;
}

export async function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login/google', {
    token: idToken,
  });
  return response.data;
}

export async function loginWithKakao(accessToken: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login/kakao', {
    token: accessToken,
  });
  return response.data;
}

export async function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/refresh', {
    refreshToken,
  });
  return response.data;
}

export async function logout(accessToken: string): Promise<void> {
  await apiClient.post('/auth/logout', null, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
