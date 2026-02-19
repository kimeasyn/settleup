-- ============================================
-- V1_0_0: 기본 테이블 생성
-- users, settlements, participants, expenses, expense_splits
-- ============================================

-- users 테이블
CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(50)  NOT NULL,
    email      VARCHAR(255) UNIQUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- settlements 테이블
CREATE TABLE settlements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(100) NOT NULL,
    type        VARCHAR(20)  NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    creator_id  UUID         NOT NULL,
    description VARCHAR(500),
    start_date  DATE,
    end_date    DATE,
    currency    VARCHAR(3)   NOT NULL DEFAULT 'KRW',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    version     INTEGER      NOT NULL DEFAULT 0,
    sync_status VARCHAR(20)  NOT NULL DEFAULT 'SYNCED'
);

CREATE INDEX idx_settlements_creator_id ON settlements(creator_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_type ON settlements(type);
CREATE INDEX idx_settlements_updated_at ON settlements(updated_at DESC);

-- participants 테이블
CREATE TABLE participants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID        NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    user_id       UUID,
    name          VARCHAR(50) NOT NULL,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    joined_at     TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_participants_settlement_name UNIQUE (settlement_id, name)
);

CREATE INDEX idx_participants_settlement_id ON participants(settlement_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);

-- expenses 테이블
CREATE TABLE expenses (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID           NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    payer_id      UUID           NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    amount        DECIMAL(12, 2) NOT NULL,
    category      VARCHAR(50),
    category_ai   VARCHAR(50),
    description   VARCHAR(200)   NOT NULL,
    expense_date  TIMESTAMP      NOT NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
    version       INTEGER        NOT NULL DEFAULT 0
);

CREATE INDEX idx_expenses_settlement_id ON expenses(settlement_id);
CREATE INDEX idx_expenses_payer_id ON expenses(payer_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);

-- expense_splits 테이블
CREATE TABLE expense_splits (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id     UUID           NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    participant_id UUID           NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    share          DECIMAL(12, 2) NOT NULL
);

CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_participant_id ON expense_splits(participant_id);
