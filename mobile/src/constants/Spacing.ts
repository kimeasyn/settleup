/**
 * SettleUp 앱 디자인 시스템 - 간격
 * 일관된 레이아웃을 위한 중앙화된 간격 관리
 */

export const Spacing = {
  // Base unit (기본 단위) - 4px
  base: 4,

  // Spacing Scale (간격 스케일)
  spacing: {
    xs: 4,    // Extra Small
    sm: 8,    // Small
    md: 12,   // Medium
    lg: 16,   // Large
    xl: 20,   // Extra Large
    '2xl': 24, // 2X Large
    '3xl': 32, // 3X Large
    '4xl': 40, // 4X Large
    '5xl': 48, // 5X Large
  },

  // Container Padding (컨테이너 패딩)
  container: {
    xs: 8,    // 모바일 최소 패딩
    sm: 12,   // 작은 화면
    md: 16,   // 기본 패딩
    lg: 20,   // 큰 화면
    xl: 24,   // 매우 큰 화면
  },

  // Component Spacing (컴포넌트 간격)
  component: {
    button: 12,       // 버튼 내부 패딩
    card: 16,         // 카드 내부 패딩
    list: 8,          // 리스트 아이템 간격
    modal: 20,        // 모달 내부 패딩
    section: 24,      // 섹션 간격
    group: 16,        // 그룹 요소 간격
  },

  // Layout Spacing (레이아웃 간격)
  layout: {
    header: 16,       // 헤더 패딩
    footer: 16,       // 푸터 패딩
    sidebar: 16,      // 사이드바 패딩
    content: 16,      // 메인 콘텐츠 패딩
    gutter: 12,       // 그리드 거터
  },

  // Form Spacing (폼 간격)
  form: {
    field: 16,        // 폼 필드 간격
    group: 24,        // 폼 그룹 간격
    button: 20,       // 폼 버튼 간격
    section: 32,      // 폼 섹션 간격
  },

  // Border Radius (모서리 둥글기)
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,       // 완전히 둥근 모양
  },

  // Elevation/Shadow Heights (그림자 높이)
  elevation: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
  },

  // Icon Sizes (아이콘 크기)
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 32,
    '3xl': 40,
  },

  // Touch Target (터치 타겟 크기)
  touchTarget: {
    min: 44,          // iOS 최소 터치 타겟
    comfortable: 48,  // 편안한 터치 타겟
    large: 56,        // 큰 터치 타겟
  },

  // Safe Area (세이프 에어리어)
  safeArea: {
    top: 44,          // iOS 상단 노치
    bottom: 34,       // iOS 하단 인디케이터
  },
} as const;

// Helper functions for creating spacing styles
export const createPaddingStyle = (
  all?: keyof typeof Spacing.spacing,
  vertical?: keyof typeof Spacing.spacing,
  horizontal?: keyof typeof Spacing.spacing,
  top?: keyof typeof Spacing.spacing,
  right?: keyof typeof Spacing.spacing,
  bottom?: keyof typeof Spacing.spacing,
  left?: keyof typeof Spacing.spacing
) => {
  const style: any = {};

  if (all) {
    style.padding = Spacing.spacing[all];
  }
  if (vertical) {
    style.paddingVertical = Spacing.spacing[vertical];
  }
  if (horizontal) {
    style.paddingHorizontal = Spacing.spacing[horizontal];
  }
  if (top) {
    style.paddingTop = Spacing.spacing[top];
  }
  if (right) {
    style.paddingRight = Spacing.spacing[right];
  }
  if (bottom) {
    style.paddingBottom = Spacing.spacing[bottom];
  }
  if (left) {
    style.paddingLeft = Spacing.spacing[left];
  }

  return style;
};

export const createMarginStyle = (
  all?: keyof typeof Spacing.spacing,
  vertical?: keyof typeof Spacing.spacing,
  horizontal?: keyof typeof Spacing.spacing,
  top?: keyof typeof Spacing.spacing,
  right?: keyof typeof Spacing.spacing,
  bottom?: keyof typeof Spacing.spacing,
  left?: keyof typeof Spacing.spacing
) => {
  const style: any = {};

  if (all) {
    style.margin = Spacing.spacing[all];
  }
  if (vertical) {
    style.marginVertical = Spacing.spacing[vertical];
  }
  if (horizontal) {
    style.marginHorizontal = Spacing.spacing[horizontal];
  }
  if (top) {
    style.marginTop = Spacing.spacing[top];
  }
  if (right) {
    style.marginRight = Spacing.spacing[right];
  }
  if (bottom) {
    style.marginBottom = Spacing.spacing[bottom];
  }
  if (left) {
    style.marginLeft = Spacing.spacing[left];
  }

  return style;
};

export const createShadowStyle = (elevation: keyof typeof Spacing.elevation) => {
  const height = Spacing.elevation[elevation];
  return {
    elevation: height,
    shadowColor: '#000',
    shadowOffset: { width: 0, height },
    shadowOpacity: 0.1 + (height * 0.02),
    shadowRadius: height * 0.8,
  };
};

// TypeScript 타입 정의
export type SpacingScheme = typeof Spacing;
export type SpacingSize = keyof typeof Spacing.spacing;
export type BorderRadius = keyof typeof Spacing.radius;
export type ElevationLevel = keyof typeof Spacing.elevation;
export type IconSize = keyof typeof Spacing.icon;

export default Spacing;