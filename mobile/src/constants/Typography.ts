/**
 * SettleUp 앱 디자인 시스템 - 타이포그래피
 * 일관된 텍스트 스타일링을 위한 중앙화된 타이포그래피 관리
 */

export const Typography = {
  // Font Sizes (폰트 크기)
  fontSize: {
    xs: 10,     // Extra Small
    sm: 12,     // Small
    base: 14,   // Base (기본)
    md: 16,     // Medium
    lg: 18,     // Large
    xl: 20,     // Extra Large
    '2xl': 24,  // 2X Large
    '3xl': 28,  // 3X Large
    '4xl': 32,  // 4X Large
    '5xl': 36,  // 5X Large
  },

  // Font Weights (폰트 두께)
  fontWeight: {
    normal: '400',   // Normal
    medium: '500',   // Medium
    semibold: '600', // Semi Bold
    bold: '700',     // Bold
    extrabold: '800', // Extra Bold
  } as const,

  // Line Heights (줄 간격)
  lineHeight: {
    tight: 1.2,    // 좁은 줄간격
    normal: 1.4,   // 일반 줄간격
    relaxed: 1.6,  // 여유로운 줄간격
    loose: 1.8,    // 느슨한 줄간격
  },

  // Font Families (폰트 패밀리)
  fontFamily: {
    default: 'System', // 시스템 기본 폰트
    monospace: 'Menlo, Monaco, monospace', // 고정폭 폰트
  },

  // Predefined Text Styles (미리 정의된 텍스트 스타일)
  // lineHeight는 React Native에서 절대 픽셀값 (fontSize * 배율)
  styles: {
    // Headings (제목)
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,   // 28 * 1.2
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 31,   // 24 * 1.3
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,   // 20 * 1.3
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 25,   // 18 * 1.4
    },
    h5: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,   // 16 * 1.4
    },
    h6: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,   // 14 * 1.4
    },

    // Body Text (본문)
    body1: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,   // 16 * 1.5
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,   // 14 * 1.4
    },

    // Captions and Labels (캡션 및 라벨)
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,   // 12 * 1.3
    },
    label: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 18,   // 14 * 1.3
    },
    overline: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 12,   // 10 * 1.2
      textTransform: 'uppercase' as const,
    },

    // Buttons (버튼)
    button: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 17,   // 14 * 1.2
    },
    buttonLarge: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 19,   // 16 * 1.2
    },
    buttonSmall: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 14,   // 12 * 1.2
    },

    // Special (특수)
    code: {
      fontSize: 14,
      fontWeight: '400' as const,
      fontFamily: 'Menlo, Monaco, monospace',
      lineHeight: 20,   // 14 * 1.4
    },
  },
} as const;

// Helper functions for creating text styles
export const createTextStyle = (
  size: keyof typeof Typography.fontSize,
  weight: keyof typeof Typography.fontWeight = 'normal',
  lineHeight: keyof typeof Typography.lineHeight = 'normal'
) => ({
  fontSize: Typography.fontSize[size],
  fontWeight: Typography.fontWeight[weight],
  lineHeight: Typography.lineHeight[lineHeight] * Typography.fontSize[size],
});

// TypeScript 타입 정의
export type TypographyScheme = typeof Typography;
export type FontSize = keyof typeof Typography.fontSize;
export type FontWeight = keyof typeof Typography.fontWeight;
export type LineHeight = keyof typeof Typography.lineHeight;
export type TextStyle = keyof typeof Typography.styles;

export default Typography;