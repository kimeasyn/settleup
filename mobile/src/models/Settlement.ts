/**
 * Settlement 모델
 * 정산 데이터 구조 정의
 */

/**
 * 정산 타입 (여행 또는 게임)
 */
export enum SettlementType {
  TRAVEL = 'TRAVEL',
  GAME = 'GAME',
}

/**
 * 정산 상태
 */
export enum SettlementStatus {
  ACTIVE = 'ACTIVE',         // 진행 중
  COMPLETED = 'COMPLETED',   // 완료됨
  ARCHIVED = 'ARCHIVED',     // 보관됨
}

/**
 * 정산 인터페이스
 */
export interface Settlement {
  /** 정산 ID (UUID) */
  id: string;

  /** 정산 제목 */
  title: string;

  /** 정산 타입 */
  type: SettlementType;

  /** 정산 상태 */
  status: SettlementStatus;

  /** 생성자 ID (사용자 ID) */
  creatorId: string;

  /** 정산 설명 (선택적) */
  description?: string;

  /** 시작 날짜 (ISO 8601: YYYY-MM-DD) */
  startDate?: string;

  /** 종료 날짜 (ISO 8601: YYYY-MM-DD) */
  endDate?: string;

  /** 통화 코드 (기본값: KRW) */
  currency: string;

  /** 생성 일시 (ISO 8601: YYYY-MM-DDTHH:mm:ss) */
  createdAt: string;

  /** 수정 일시 (ISO 8601: YYYY-MM-DDTHH:mm:ss) */
  updatedAt: string;

  /** 총 지출액 (요약) */
  totalExpense?: number;

  /** 활성 참가자 수 (요약) */
  participantCount?: number;

  /** 게임 라운드 수 (요약) */
  roundCount?: number;
}

/**
 * 정산 생성 요청 데이터
 */
export interface CreateSettlementRequest {
  title: string;
  type: SettlementType;
  description?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
}

/**
 * 정산 업데이트 요청 데이터
 */
export interface UpdateSettlementRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: SettlementStatus;
  currency?: string;
}
