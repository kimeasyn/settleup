-- Settlement Members Table
-- 정산 멤버 관리 (OWNER/MEMBER 역할)

CREATE TABLE IF NOT EXISTS settlement_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(settlement_id, user_id)
);

CREATE INDEX idx_settlement_members_settlement_id ON settlement_members(settlement_id);
CREATE INDEX idx_settlement_members_user_id ON settlement_members(user_id);

-- Settlement Invite Codes Table
-- 초대 코드 (8자리, 24시간 유효)

CREATE TABLE IF NOT EXISTS settlement_invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    code VARCHAR(8) NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    used_by UUID REFERENCES users(id),
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settlement_invite_codes_code ON settlement_invite_codes(code);
CREATE INDEX idx_settlement_invite_codes_settlement_id ON settlement_invite_codes(settlement_id);
