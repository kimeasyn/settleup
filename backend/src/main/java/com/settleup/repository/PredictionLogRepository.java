package com.settleup.repository;

import com.settleup.domain.prediction.PredictionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * PredictionLog Repository
 * AI 예측 로그 데이터 접근 계층
 */
@Repository
public interface PredictionLogRepository extends JpaRepository<PredictionLog, UUID> {
}
