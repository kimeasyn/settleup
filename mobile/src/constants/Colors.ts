/**
 * SettleUp 앱 디자인 시스템 - 색상 팔레트
 * 일관된 UI/UX를 위한 중앙화된 색상 관리
 */

export const Colors = {
  // Primary Colors (메인 브랜드 색상)
  primary: {
    main: '#2196F3',      // 메인 파랑
    light: '#BBDEFB',     // 연한 파랑
    dark: '#1976D2',      // 진한 파랑
    contrast: '#FFFFFF',  // 메인 색상과 대비되는 텍스트
  },

  // Secondary Colors (보조 색상)
  secondary: {
    main: '#4CAF50',      // 메인 초록 (성공)
    light: '#C8E6C9',     // 연한 초록
    dark: '#388E3C',      // 진한 초록
    contrast: '#FFFFFF',  // 보조 색상과 대비되는 텍스트
  },

  // Status Colors (상태 표시 색상)
  status: {
    success: '#4CAF50',   // 성공 (초록)
    warning: '#FF9800',   // 경고 (주황)
    error: '#F44336',     // 에러 (빨강)
    info: '#2196F3',      // 정보 (파랑)
  },

  // Text Colors (텍스트 색상)
  text: {
    primary: '#212121',   // 주요 텍스트 (거의 검정)
    secondary: '#757575', // 보조 텍스트 (회색)
    disabled: '#BDBDBD',  // 비활성화 텍스트 (연한 회색)
    hint: '#9E9E9E',      // 힌트 텍스트 (placeholder)
    inverse: '#FFFFFF',   // 역색 텍스트 (흰색)
  },

  // Background Colors (배경 색상)
  background: {
    default: '#F2F2F7',   // 기본 배경 (연한 회색)
    paper: '#FFFFFF',     // 카드/모달 배경 (흰색)
    elevated: '#FAFAFA',  // 약간 올라온 배경
    disabled: '#F5F5F5',  // 비활성화 배경
  },

  // Border Colors (테두리 색상)
  border: {
    light: '#E0E0E0',     // 연한 테두리
    medium: '#BDBDBD',    // 중간 테두리
    dark: '#757575',      // 진한 테두리
  },

  // Semantic Colors (의미별 색상)
  semantic: {
    // 지출 카테고리
    expense: {
      food: '#FFE0B2',      // 식비 (주황 계열)
      transport: '#B3E5FC', // 교통 (파랑 계열)
      lodging: '#C5E1A5',   // 숙박 (초록 계열)
      tourism: '#F8BBD0',   // 관광 (분홍 계열)
      shopping: '#D1C4E9',  // 쇼핑 (보라 계열)
      other: '#E0E0E0',     // 기타 (회색 계열)
    },

    // 정산 상태
    settlement: {
      active: '#4CAF50',    // 진행중 (초록)
      completed: '#2196F3', // 완료 (파랑)
      archived: '#9E9E9E',  // 보관됨 (회색)
    },
  },

  // Action Colors (액션 버튼 색상)
  action: {
    primary: '#2196F3',   // 주요 액션 (파랑)
    secondary: '#E3F2FD', // 보조 액션 배경 (연한 파랑)
    success: '#E8F5E9',   // 성공 액션 배경 (연한 초록)
    danger: '#FFEBEE',    // 위험 액션 배경 (연한 빨강)
    disabled: '#F5F5F5',  // 비활성화 액션
  },

  // Shadow Colors (그림자 색상)
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',   // 연한 그림자
    medium: 'rgba(0, 0, 0, 0.2)',  // 중간 그림자
    dark: 'rgba(0, 0, 0, 0.3)',    // 진한 그림자
  },

  // Overlay Colors (오버레이 색상)
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',   // 연한 오버레이
    medium: 'rgba(0, 0, 0, 0.5)',  // 중간 오버레이
    dark: 'rgba(0, 0, 0, 0.7)',    // 진한 오버레이
  },
} as const;

// TypeScript 타입 정의
export type ColorScheme = typeof Colors;
export type ColorKey = keyof typeof Colors;

// 다크 테마 지원을 위한 확장 (나중에 구현)
export const DarkColors = {
  // 추후 다크 테마 구현시 사용
  ...Colors,
  background: {
    default: '#121212',
    paper: '#1E1E1E',
    elevated: '#2C2C2C',
    disabled: '#383838',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    disabled: '#666666',
    hint: '#888888',
    inverse: '#000000',
  },
} as const;

export default Colors;