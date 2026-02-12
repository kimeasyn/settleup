/**
 * 로딩 UI 컴포넌트들
 * 일관된 로딩 상태 표시를 위한 중앙화된 컴포넌트
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

const { width } = Dimensions.get('window');

/**
 * 기본 로딩 스피너
 */
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}

export function LoadingSpinner({
  size = 'large',
  color = Colors.primary.main,
  text
}: LoadingSpinnerProps) {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={styles.spinnerText}>{text}</Text>
      )}
    </View>
  );
}

/**
 * 전체 화면 로딩 오버레이
 */
interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  backgroundColor?: string;
}

export function LoadingOverlay({
  visible,
  text = '로딩 중...',
  backgroundColor = Colors.overlay.medium
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor }]}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.overlayText}>{text}</Text>
      </View>
    </View>
  );
}

/**
 * 스켈레톤 박스 (플레이스홀더)
 */
interface SkeletonBoxProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonBox({
  width = '100%',
  height,
  borderRadius = Spacing.radius.sm,
  style
}: SkeletonBoxProps) {
  return (
    <View
      style={[
        styles.skeletonBox,
        { width, height, borderRadius },
        style
      ]}
    />
  );
}

/**
 * 스켈레톤 텍스트 라인
 */
interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string;
  style?: any;
}

export function SkeletonText({
  lines = 1,
  lineHeight = 20,
  lastLineWidth = '60%',
  style
}: SkeletonTextProps) {
  return (
    <View style={[styles.skeletonTextContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight * 0.6}
          style={{ marginBottom: index < lines - 1 ? Spacing.spacing.xs : 0 }}
        />
      ))}
    </View>
  );
}

/**
 * 카드형 스켈레톤 (지출 항목용)
 */
export function ExpenseItemSkeleton() {
  return (
    <View style={styles.expenseSkeletonCard}>
      <View style={styles.expenseSkeletonMain}>
        <View style={styles.expenseSkeletonLeft}>
          <SkeletonBox width="70%" height={16} />
          <View style={styles.expenseSkeletonMeta}>
            <SkeletonBox width={50} height={20} borderRadius={10} />
            <SkeletonBox width={80} height={12} />
          </View>
        </View>
        <View style={styles.expenseSkeletonRight}>
          <SkeletonBox width={60} height={18} />
          <SkeletonBox width={30} height={11} />
        </View>
      </View>
    </View>
  );
}

/**
 * 참가자 항목 스켈레톤
 */
export function ParticipantItemSkeleton() {
  return (
    <View style={styles.participantSkeletonItem}>
      <View style={styles.participantSkeletonInfo}>
        <SkeletonBox width={10} height={10} borderRadius={5} />
        <View style={styles.participantSkeletonDetails}>
          <SkeletonBox width="60%" height={16} />
          <SkeletonBox width="40%" height={12} />
        </View>
      </View>
      <View style={styles.participantSkeletonActions}>
        <SkeletonBox width={40} height={24} borderRadius={6} />
        <SkeletonBox width={50} height={24} borderRadius={6} />
      </View>
    </View>
  );
}

/**
 * 정산 카드 스켈레톤
 */
export function SettlementCardSkeleton() {
  return (
    <View style={styles.settlementSkeletonCard}>
      <View style={styles.settlementSkeletonHeader}>
        <SkeletonBox width="80%" height={17} />
        <View style={styles.settlementSkeletonBadges}>
          <SkeletonBox width={40} height={19} borderRadius={12} />
          <SkeletonBox width={50} height={19} borderRadius={12} />
        </View>
      </View>
      <SkeletonText lines={2} lineHeight={14} lastLineWidth="40%" />
      <View style={styles.settlementSkeletonFooter}>
        <SkeletonBox width={80} height={12} />
        <SkeletonBox width={30} height={12} />
      </View>
    </View>
  );
}

/**
 * 로딩 상태 관리를 위한 래퍼
 */
interface LoadingWrapperProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
}

export function LoadingWrapper({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  onRetry
}: LoadingWrapperProps) {
  if (loading) {
    return loadingComponent ? <>{loadingComponent}</> : <LoadingSpinner text="로딩 중..." />;
  }

  if (error) {
    return errorComponent ? (
      <>{errorComponent}</>
    ) : (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>오류가 발생했습니다</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {onRetry && (
          <Text style={styles.retryText} onPress={onRetry}>
            다시 시도
          </Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  // 스피너 관련
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.spacing['2xl'],
  },
  spinnerText: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
    marginTop: Spacing.spacing.lg,
    textAlign: 'center',
  },

  // 오버레이 관련
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: Colors.background.paper,
    padding: Spacing.spacing['3xl'],
    borderRadius: Spacing.radius.lg,
    alignItems: 'center',
    minWidth: 120,
    ...{
      elevation: 8,
      shadowColor: Colors.shadow.dark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
  },
  overlayText: {
    ...Typography.styles.body2,
    color: Colors.text.primary,
    marginTop: Spacing.spacing.lg,
    textAlign: 'center',
  },

  // 스켈레톤 관련
  skeletonBox: {
    backgroundColor: Colors.background.elevated,
    opacity: 0.7,
  },
  skeletonTextContainer: {
    // 컨테이너 스타일
  },

  // 지출 항목 스켈레톤
  expenseSkeletonCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.component.card,
    marginBottom: Spacing.component.list,
    ...{
      elevation: 2,
      shadowColor: Colors.shadow.light,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
  },
  expenseSkeletonMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseSkeletonLeft: {
    flex: 1,
    marginRight: Spacing.spacing.lg,
  },
  expenseSkeletonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spacing.sm,
    marginTop: Spacing.spacing.sm,
  },
  expenseSkeletonRight: {
    alignItems: 'flex-end',
    gap: 2,
  },

  // 참가자 스켈레톤
  participantSkeletonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.elevated,
  },
  participantSkeletonInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantSkeletonDetails: {
    flex: 1,
    marginLeft: Spacing.spacing.lg,
    gap: Spacing.spacing.xs,
  },
  participantSkeletonActions: {
    flexDirection: 'row',
    gap: Spacing.spacing.sm,
  },

  // 정산 카드 스켈레톤
  settlementSkeletonCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.component.card,
    marginHorizontal: Spacing.container.md,
    marginVertical: Spacing.spacing.sm,
    ...{
      elevation: 2,
      shadowColor: Colors.shadow.light,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  },
  settlementSkeletonHeader: {
    marginBottom: Spacing.spacing.lg,
  },
  settlementSkeletonBadges: {
    flexDirection: 'row',
    gap: Spacing.spacing.sm,
    marginTop: Spacing.spacing.sm,
  },
  settlementSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.spacing.lg,
  },

  // 에러 관련
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.spacing['2xl'],
  },
  errorText: {
    ...Typography.styles.h5,
    color: Colors.status.error,
    marginBottom: Spacing.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.spacing.lg,
  },
  retryText: {
    ...Typography.styles.button,
    color: Colors.primary.main,
    padding: Spacing.spacing.lg,
    textDecorationLine: 'underline',
  },
});