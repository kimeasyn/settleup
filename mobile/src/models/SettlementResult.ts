/**
 * 정산 결과 모델
 */

export interface ParticipantSummary {
  participantId: string;
  participantName: string;
  totalPaid: number;
  shouldPay: number;
  balance: number; // 양수: 받을 돈, 음수: 줄 돈
}

export interface Transfer {
  fromParticipantId: string;
  fromParticipantName: string;
  toParticipantId: string;
  toParticipantName: string;
  amount: number;
}

export interface SettlementResult {
  settlementId: string;
  totalAmount: number;
  participants: ParticipantSummary[];
  transfers: Transfer[];
  calculatedAt: string;
}
