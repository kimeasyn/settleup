-- Settlement Results Table
-- 정산 계산 결과를 영속적으로 저장

CREATE TABLE IF NOT EXISTS settlement_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    total_amount DECIMAL(12, 2) NOT NULL,
    result_data JSONB NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_settlement_results_settlement_id ON settlement_results(settlement_id);
CREATE INDEX idx_settlement_results_calculated_at ON settlement_results(calculated_at DESC);
