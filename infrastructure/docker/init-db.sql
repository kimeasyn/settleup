-- SettleUp Database Schema
-- Purpose: 여행 정산 및 게임 정산을 위한 데이터베이스 스키마

-- Users 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL CHECK (LENGTH(TRIM(name)) >= 2),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Settlements 테이블
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM(title)) >= 1),
    type VARCHAR(20) NOT NULL CHECK (type IN ('TRAVEL', 'GAME')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    creator_id UUID NOT NULL REFERENCES users(id),
    description VARCHAR(500),
    start_date DATE,
    end_date DATE,
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 0,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'SYNCED',
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Participants 테이블
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    name VARCHAR(50) NOT NULL CHECK (LENGTH(TRIM(name)) >= 1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(settlement_id, name)
);

-- Expenses 테이블 (여행 정산)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES participants(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50),
    category_ai VARCHAR(50),
    description VARCHAR(200) NOT NULL CHECK (LENGTH(TRIM(description)) >= 1),
    expense_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 0
);

-- Expense Splits 테이블
CREATE TABLE expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id),
    share DECIMAL(12,2) NOT NULL CHECK (share >= 0)
);

-- Game Rounds 테이블 (게임 정산)
CREATE TABLE game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number > 0),
    name VARCHAR(100),
    base_amount DECIMAL(12,2) CHECK (base_amount IS NULL OR base_amount > 0),
    multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (multiplier >= 0),
    played_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(settlement_id, round_number)
);

-- Game Results 테이블
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id),
    outcome VARCHAR(10) NOT NULL CHECK (outcome IN ('WIN', 'LOSE', 'DRAW')),
    amount DECIMAL(12,2) NOT NULL,
    note VARCHAR(200),
    UNIQUE(round_id, participant_id)
);

-- Transactions 테이블 (최종 정산)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    from_participant_id UUID NOT NULL REFERENCES participants(id),
    to_participant_id UUID NOT NULL REFERENCES participants(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (from_participant_id != to_participant_id)
);

-- 인덱스 생성
CREATE INDEX idx_settlements_creator ON settlements(creator_id, created_at DESC);
CREATE INDEX idx_settlements_type_status ON settlements(type, status);
CREATE INDEX idx_participants_settlement ON participants(settlement_id, name);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_expenses_settlement_date ON expenses(settlement_id, expense_date DESC);
CREATE INDEX idx_expenses_payer ON expenses(payer_id);
CREATE INDEX idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_participant ON expense_splits(participant_id);
CREATE INDEX idx_game_rounds_settlement ON game_rounds(settlement_id, round_number);
CREATE INDEX idx_game_results_round ON game_results(round_id);
CREATE INDEX idx_game_results_participant ON game_results(participant_id);
CREATE INDEX idx_transactions_settlement ON transactions(settlement_id, status);

-- 샘플 데이터 (테스트용)
-- 특정 UUID로 테스트 사용자 생성 (API 테스트용)
INSERT INTO users (id, name, email) VALUES
    ('00000000-0000-0000-0000-000000000001', '테스트 사용자', 'test@example.com'),
    ('00000000-0000-0000-0000-000000000002', '김철수', 'chulsoo@example.com'),
    ('00000000-0000-0000-0000-000000000003', '이영희', 'younghee@example.com');
