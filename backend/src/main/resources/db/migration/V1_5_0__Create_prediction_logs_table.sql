CREATE TABLE IF NOT EXISTS prediction_logs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description          VARCHAR(200) NOT NULL,
    predicted_category   VARCHAR(50),
    predicted_confidence DOUBLE PRECISION,
    final_category       VARCHAR(50) NOT NULL,
    source               VARCHAR(20) NOT NULL,
    user_id              UUID NOT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prediction_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_prediction_logs_user ON prediction_logs(user_id);
CREATE INDEX idx_prediction_logs_source ON prediction_logs(source);
CREATE INDEX idx_prediction_logs_created_at ON prediction_logs(created_at);
