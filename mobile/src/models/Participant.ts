/**
 * Participant 모델
 * 정산 참가자 데이터 구조 정의
 */

/**
 * 참가자 인터페이스
 */
export interface Participant {
  /** 참가자 ID (UUID) */
  id: string;

  /** 정산 ID (외래키) */
  settlementId: string;

  /** 사용자 ID (선택적 - 등록된 사용자만) */
  userId?: string;

  /** 참가자 이름 */
  name: string;

  /** 활성 상태 (true: 활성, false: 비활성) */
  isActive: boolean;

  /** 참가 일시 (ISO 8601: YYYY-MM-DDTHH:mm:ss) */
  joinedAt: string;
}

/**
 * 참가자 추가 요청 데이터
 */
export interface AddParticipantRequest {
  /** 참가자 이름 */
  name: string;

  /** 사용자 ID (선택적) */
  userId?: string;
}

/**
 * 참가자 업데이트 요청 데이터
 */
export interface UpdateParticipantRequest {
  /** 참가자 이름 */
  name?: string;

  /** 활성 상태 */
  isActive?: boolean;
}
