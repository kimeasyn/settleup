-- game_rounds 테이블
CREATE TABLE IF NOT EXISTS game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL,
    round_number INTEGER NOT NULL,
    title VARCHAR(100),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    excluded_participant_ids JSONB DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_game_rounds_settlement
        FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE
);

CREATE INDEX idx_game_rounds_settlement ON game_rounds(settlement_id);
CREATE INDEX idx_game_rounds_settlement_number ON game_rounds(settlement_id, round_number);

-- game_round_entries 테이블
CREATE TABLE IF NOT EXISTS game_round_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    memo VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_entries_round
        FOREIGN KEY (round_id) REFERENCES game_rounds(id) ON DELETE CASCADE,
    CONSTRAINT fk_entries_participant
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

CREATE INDEX idx_game_round_entries_round ON game_round_entries(round_id);
CREATE INDEX idx_game_round_entries_participant ON game_round_entries(participant_id);

-- updated_at 트리거
CREATE TRIGGER update_game_rounds_updated_at
    BEFORE UPDATE ON game_rounds
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
