package com.settleup.repository;

import com.settleup.domain.settlement.SettlementResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementResultRepository extends JpaRepository<SettlementResult, UUID> {

    List<SettlementResult> findBySettlementIdOrderByCalculatedAtDesc(UUID settlementId);

    Optional<SettlementResult> findFirstBySettlementIdOrderByCalculatedAtDesc(UUID settlementId);

    void deleteBySettlementId(UUID settlementId);
}
