/**
 * PKCE (Proof Key for Code Exchange) 유틸리티
 * expo-crypto를 사용한 SHA-256 해싱
 */

import * as Crypto from 'expo-crypto';

/**
 * 랜덤 code_verifier 생성 (43~128자, URL-safe 문자)
 */
export function generateCodeVerifier(length = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * code_verifier로부터 code_challenge 생성 (S256)
 * SHA-256 해시 후 base64url 인코딩
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );

  // base64 → base64url: +→- /→_ =제거
  const base64url = digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64url;
}
