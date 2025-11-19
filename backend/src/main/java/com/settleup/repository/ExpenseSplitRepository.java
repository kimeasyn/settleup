package com.settleup.repository;

import com.settleup.domain.expense.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * ExpenseSplit Repository
 * 지출 분담 데이터 접근 계층
 */
@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, UUID> {

    /**
     * 특정 지출의 모든 분담 내역 조회
     */
    List<ExpenseSplit> findByExpenseId(UUID expenseId);

    /**
     * 특정 참가자의 모든 분담 내역 조회
     */
    List<ExpenseSplit> findByParticipantId(UUID participantId);

    /**
     * 특정 지출의 특정 참가자 분담 내역 조회
     */
    ExpenseSplit findByExpenseIdAndParticipantId(UUID expenseId, UUID participantId);

    /**
     * 특정 지출의 총 분담 금액 합계
     */
    @Query("SELECT SUM(es.share) FROM ExpenseSplit es WHERE es.expense.id = :expenseId")
    BigDecimal sumSharesByExpenseId(@Param("expenseId") UUID expenseId);

    /**
     * 특정 참가자의 총 분담 금액 합계 (특정 정산 내)
     */
    @Query("SELECT SUM(es.share) FROM ExpenseSplit es " +
           "WHERE es.participant.id = :participantId " +
           "AND es.expense.settlement.id = :settlementId")
    BigDecimal sumSharesByParticipantAndSettlement(
        @Param("participantId") UUID participantId,
        @Param("settlementId") UUID settlementId
    );

    /**
     * 특정 지출 삭제 시 관련 분담 내역도 삭제 (Cascade)
     */
    void deleteByExpenseId(UUID expenseId);

    /**
     * 특정 참가자의 분담 내역 삭제
     */
    void deleteByParticipantId(UUID participantId);
}
