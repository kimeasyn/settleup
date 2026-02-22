package com.settleup.repository;

import com.settleup.domain.game.GameRound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameRoundRepository extends JpaRepository<GameRound, UUID> {

    List<GameRound> findBySettlementIdOrderByRoundNumberAsc(UUID settlementId);

    void deleteBySettlementId(UUID settlementId);

    int countBySettlementId(UUID settlementId);

    /**
     * 정산별 라운드 수 배치 조회
     */
    @Query("SELECT g.settlementId, COUNT(g) " +
           "FROM GameRound g WHERE g.settlementId IN :settlementIds " +
           "GROUP BY g.settlementId")
    List<Object[]> countBySettlementIds(@Param("settlementIds") List<UUID> settlementIds);
}
