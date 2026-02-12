package com.settleup.repository;

import com.settleup.domain.game.GameRound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameRoundRepository extends JpaRepository<GameRound, UUID> {

    List<GameRound> findBySettlementIdOrderByRoundNumberAsc(UUID settlementId);

    void deleteBySettlementId(UUID settlementId);

    int countBySettlementId(UUID settlementId);
}
