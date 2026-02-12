import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';
import { useAuth } from '../contexts/AuthContext';
import { SocialProvider } from '../models/Auth';

// Expo Go 환경 감지
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Google 로고 컬러 (SVG 대신 텍스트 아이콘)
function GoogleIcon() {
  return (
    <View style={iconStyles.googleIcon}>
      <Text style={iconStyles.googleG}>G</Text>
    </View>
  );
}

// 카카오 말풍선 아이콘
function KakaoIcon() {
  return (
    <View style={iconStyles.kakaoIcon}>
      <View style={iconStyles.kakaoBubble}>
        <View style={iconStyles.kakaoTail} />
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: SocialProvider) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(provider);
    } catch (e: any) {
      const message =
        provider === 'google'
          ? 'Google 로그인에 실패했습니다. 다시 시도해주세요.'
          : '카카오 로그인에 실패했습니다. 다시 시도해주세요.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 로고 영역 */}
      <View style={styles.headerArea}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.appName}>SettleUp</Text>
        <Text style={styles.tagline}>친구들과 간편하게 정산하세요</Text>
        <Text style={styles.description}>
          여행, 모임, 게임 등{'\n'}모든 비용을 쉽고 빠르게 나눌 수 있어요
        </Text>
      </View>

      {/* 로그인 버튼 영역 */}
      <View style={styles.loginArea}>
        {/* Google 버튼 */}
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={() => handleLogin('google')}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <GoogleIcon />
          <Text style={styles.googleButtonText}>Google로 계속하기</Text>
        </TouchableOpacity>

        {/* 카카오 버튼 */}
        <TouchableOpacity
          style={[
            styles.socialButton,
            styles.kakaoButton,
            isExpoGo && styles.disabledButton,
          ]}
          onPress={() => handleLogin('kakao')}
          disabled={isLoading || isExpoGo}
          activeOpacity={0.7}
        >
          <KakaoIcon />
          <Text style={[styles.kakaoButtonText, isExpoGo && styles.disabledButtonText]}>
            카카오로 계속하기
          </Text>
        </TouchableOpacity>
        {isExpoGo && (
          <Text style={styles.kakaoHint}>
            카카오 로그인은 개발 빌드에서 사용 가능합니다
          </Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.terms}>
          계속 진행하면 서비스 이용약관 및{'\n'}개인정보 처리방침에 동의하게 됩니다.
        </Text>
      </View>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>로그인 중...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const iconStyles = StyleSheet.create({
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  kakaoIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoBubble: {
    width: 18,
    height: 16,
    borderRadius: 6,
    backgroundColor: Colors.social.kakao.text,
  },
  kakaoTail: {
    position: 'absolute',
    bottom: -3,
    left: 4,
    width: 6,
    height: 6,
    backgroundColor: Colors.social.kakao.text,
    borderBottomLeftRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.paper,
  },

  // 상단 로고 영역
  headerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.container.xl,
    paddingTop: Spacing.spacing['4xl'],
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: Spacing.radius.xl,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.spacing.lg,
    ...createShadowStyle('md'),
  },
  logoText: {
    fontSize: 36,
    fontWeight: Typography.fontWeight.extrabold,
    color: Colors.primary.contrast,
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.sm,
  },
  tagline: {
    ...Typography.styles.body1,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.spacing.sm,
  },
  description: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // 로그인 버튼 영역
  loginArea: {
    paddingHorizontal: Spacing.container.xl,
    paddingBottom: Spacing.spacing['5xl'],
  },
  socialButton: {
    flexDirection: 'row',
    height: Spacing.touchTarget.large,
    borderRadius: Spacing.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.spacing.md,
    marginBottom: Spacing.spacing.md,
  },
  googleButton: {
    backgroundColor: Colors.social.google.background,
    borderWidth: 1,
    borderColor: Colors.social.google.border,
    ...createShadowStyle('xs'),
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.primary,
  },
  kakaoButton: {
    backgroundColor: Colors.social.kakao.background,
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.social.kakao.text,
  },
  disabledButton: {
    opacity: 0.45,
  },
  disabledButtonText: {
    color: Colors.text.disabled,
  },
  kakaoHint: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    textAlign: 'center',
    marginBottom: Spacing.spacing.sm,
  },
  errorText: {
    ...Typography.styles.body2,
    color: Colors.status.error,
    textAlign: 'center',
    marginTop: Spacing.spacing.sm,
  },
  terms: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    textAlign: 'center',
    marginTop: Spacing.spacing.xl,
    lineHeight: 18,
  },

  // 로딩 오버레이
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay.light,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.spacing.md,
  },
  loadingText: {
    ...Typography.styles.body2,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
});
