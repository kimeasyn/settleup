/**
 * 게임 정산 관련 타입 정의
 * 라운드별 금액 입출 기록 및 최종 정산
 */

/**
 * 게임 라운드 인터페이스
 */
export interface GameRound {
  /** 라운드 ID */
  id: string;

  /** 정산 ID */
  settlementId: string;

  /** 라운드 번호 (1부터 시작) */
  roundNumber: number;

  /** 라운드 제목 (선택사항) */
  title?: string;

  /** 라운드 생성 시간 */
  createdAt: string;

  /** 라운드 완료 여부 */
  isCompleted: boolean;
}

/**
 * 게임 라운드 참가자별 금액 기록
 */
export interface GameRoundEntry {
  /** 엔트리 ID */
  id: string;

  /** 라운드 ID */
  roundId: string;

  /** 참가자 ID */
  participantId: string;

  /** 참가자 이름 (조인된 정보) */
  participantName?: string;

  /** 해당 라운드에서의 금액 (+: 딴 돈, -: 잃은 돈) */
  amount: number;

  /** 메모 (선택사항) */
  memo?: string;

  /** 생성 시간 */
  createdAt: string;
}

/**
 * 게임 라운드 상세 정보 (엔트리 포함)
 */
export interface GameRoundWithEntries {
  /** 라운드 기본 정보 */
  round: GameRound;

  /** 해당 라운드의 모든 엔트리 */
  entries: GameRoundEntry[];

  /** 라운드 총합 (항상 0이어야 함) */
  totalAmount: number;

  /** 라운드 완료 여부 */
  isValid: boolean;
}

/**
 * 참가자별 게임 누적 현황
 */
export interface ParticipantGameStatus {
  /** 참가자 ID */
  participantId: string;

  /** 참가자 이름 */
  participantName: string;

  /** 현재까지 누적 금액 */
  totalAmount: number;

  /** 참여한 라운드 수 */
  roundCount: number;

  /** 이긴 라운드 수 (양수 금액인 라운드) */
  winCount: number;

  /** 진 라운드 수 (음수 금액인 라운드) */
  loseCount: number;

  /** 최대 승리 금액 */
  maxWin: number;

  /** 최대 손실 금액 */
  maxLoss: number;
}

/**
 * 게임 정산 전체 현황
 */
export interface GameSettlementStatus {
  /** 정산 ID */
  settlementId: string;

  /** 모든 라운드 */
  rounds: GameRoundWithEntries[];

  /** 참가자별 누적 현황 */
  participants: ParticipantGameStatus[];

  /** 전체 라운드 수 */
  totalRounds: number;

  /** 완료된 라운드 수 */
  completedRounds: number;

  /** 게임 진행 상태 */
  isGameActive: boolean;
}

/**
 * 최종 게임 정산 결과
 */
export interface GameSettlementResult {
  /** 정산 ID */
  settlementId: string;

  /** 참가자별 최종 수익/손실 */
  finalBalances: ParticipantGameStatus[];

  /** 정산 거래 (누가 누구에게 얼마) */
  settlements: SettlementTransaction[];

  /** 게임 통계 */
  gameStats: GameStatistics;
}

/**
 * 정산 거래
 */
export interface SettlementTransaction {
  /** 지불자 ID */
  fromParticipantId: string;

  /** 지불자 이름 */
  fromParticipantName: string;

  /** 받는자 ID */
  toParticipantId: string;

  /** 받는자 이름 */
  toParticipantName: string;

  /** 금액 */
  amount: number;
}

/**
 * 게임 통계
 */
export interface GameStatistics {
  /** 총 게임 라운드 */
  totalRounds: number;

  /** 총 거래 금액 */
  totalAmount: number;

  /** 평균 라운드당 금액 */
  averageRoundAmount: number;

  /** 게임 시작 시간 */
  startTime: string;

  /** 게임 종료 시간 */
  endTime?: string;

  /** 게임 지속 시간 (분) */
  durationMinutes?: number;
}

// ===== API 요청/응답 타입 =====

/**
 * 게임 라운드 생성 요청
 */
export interface CreateGameRoundRequest {
  /** 정산 ID */
  settlementId: string;

  /** 라운드 제목 (선택사항) */
  title?: string;
}

/**
 * 게임 라운드 엔트리 생성/수정 요청
 */
export interface CreateGameRoundEntryRequest {
  /** 라운드 ID */
  roundId: string;

  /** 참가자 ID */
  participantId: string;

  /** 금액 */
  amount: number;

  /** 메모 (선택사항) */
  memo?: string;
}

/**
 * 게임 라운드 엔트리 일괄 업데이트 요청
 */
export interface UpdateGameRoundEntriesRequest {
  /** 라운드 ID */
  roundId: string;

  /** 모든 참가자의 엔트리 */
  entries: CreateGameRoundEntryRequest[];
}

/**
 * 게임 라운드 완료 요청
 */
export interface CompleteGameRoundRequest {
  /** 라운드 ID */
  roundId: string;
}

/**
 * 게임 정산 완료 요청
 */
export interface CompleteGameSettlementRequest {
  /** 정산 ID */
  settlementId: string;
}

// ===== 유틸리티 타입 =====

/**
 * 라운드 유효성 검사 결과
 */
export interface RoundValidationResult {
  /** 유효 여부 */
  isValid: boolean;

  /** 총합 */
  totalAmount: number;

  /** 오류 메시지 */
  errorMessage?: string;

  /** 누락된 참가자 */
  missingParticipants: string[];
}

/**
 * 게임 정산 설정
 */
export interface GameSettlementSettings {
  /** 자동 라운드 완료 여부 (총합이 0이 되면 자동 완료) */
  autoCompleteRound: boolean;

  /** 최소 참가자 수 */
  minParticipants: number;

  /** 최대 라운드 수 (제한 없으면 null) */
  maxRounds?: number;

  /** 라운드 제목 자동 생성 여부 */
  autoGenerateRoundTitle: boolean;
}