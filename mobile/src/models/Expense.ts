/**
 * Expense 모델
 * 지출 데이터 구조 정의
 */

/**
 * 지출 인터페이스
 */
export interface Expense {
  /** 지출 ID (UUID) */
  id: string;

  /** 정산 ID (외래키) */
  settlementId: string;

  /** 지불자 ID (참가자 ID, 외래키) */
  payerId: string;

  /** 지출 금액 */
  amount: number;

  /** 카테고리 (사용자 선택) */
  category?: string;

  /** AI 추천 카테고리 (선택적) */
  categoryAi?: string;

  /** 지출 설명 */
  description: string;

  /** 지출 날짜 (ISO 8601: YYYY-MM-DD) */
  expenseDate: string;

  /** 생성 일시 (ISO 8601: YYYY-MM-DDTHH:mm:ss) */
  createdAt: string;

  /** 수정 일시 (ISO 8601: YYYY-MM-DDTHH:mm:ss) */
  updatedAt: string;
}

/**
 * 지출 분담 인터페이스
 * 각 참가자가 지출한 금액의 비율 또는 금액 정의
 */
export interface ExpenseSplit {
  /** 분담 ID (UUID) */
  id: string;

  /** 지출 ID (외래키) */
  expenseId: string;

  /** 참가자 ID (외래키) */
  participantId: string;

  /** 참가자 이름 (조회 시 포함) */
  participantName?: string;

  /** 분담 비율 (0.0 ~ 1.0) 또는 금액 */
  share: number;

  /** 분담 비율 (%) */
  sharePercentage?: number;
}

/**
 * 지출 상세 정보 (분담 내역 포함)
 * API 응답 또는 조회 시 사용
 */
export interface ExpenseWithDetails extends Expense {
  /** 지불자 이름 */
  payerName: string;

  /** 유효 카테고리 (사용자 지정 우선, 없으면 AI 카테고리) */
  effectiveCategory?: string;

  /** 분담 내역 목록 */
  splits?: ExpenseSplit[];
}

/**
 * 지출 생성 요청 데이터
 */
export interface CreateExpenseRequest {
  /** 지불자 ID */
  payerId: string;

  /** 지출 금액 */
  amount: number;

  /** 카테고리 (선택적) */
  category?: string;

  /** 지출 설명 */
  description: string;

  /** 지출 날짜 (ISO 8601: YYYY-MM-DD) */
  expenseDate: string;

  /** 지출 분담 정보 (선택사항, 나중에 정산 계산 시 지정 가능) */
  splits?: CreateExpenseSplitRequest[];
}

/**
 * 지출 분담 생성 요청 데이터
 */
export interface CreateExpenseSplitRequest {
  /** 참가자 ID */
  participantId: string;

  /** 분담 비율 또는 금액 */
  share: number;
}

/**
 * 지출 업데이트 요청 데이터
 */
export interface UpdateExpenseRequest {
  /** 지불자 ID */
  payerId?: string;

  /** 지출 금액 */
  amount?: number;

  /** 카테고리 */
  category?: string;

  /** 지출 설명 */
  description?: string;

  /** 지출 날짜 */
  expenseDate?: string;

  /** 지출 분담 정보 (업데이트 시 전체 교체) */
  splits?: CreateExpenseSplitRequest[];
}
