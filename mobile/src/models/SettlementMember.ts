export interface SettlementMember {
  id: string;
  settlementId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export interface InviteCodeResponse {
  code: string;
  expiresAt: string;
  settlementId: string;
}

export interface JoinByCodeRequest {
  code: string;
}
