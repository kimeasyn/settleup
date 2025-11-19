package com.settleup.repository;

import com.settleup.domain.expense.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Expense Repository
 * 지출 데이터 접근 계층
 */
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    /**
     * 특정 정산의 모든 지출 조회 (최신순)
     */
    List<Expense> findBySettlementIdOrderByExpenseDateDesc(UUID settlementId);

    /**
     * 특정 정산의 모든 지출 조회 (날짜순)
     */
    List<Expense> findBySettlementIdOrderByExpenseDateAsc(UUID settlementId);

    /**
     * 특정 참가자가 지출한 내역 조회
     */
    List<Expense> findByPayerIdOrderByExpenseDateDesc(UUID payerId);

    /**
     * 특정 정산의 특정 카테고리 지출 조회
     */
    @Query("SELECT e FROM Expense e WHERE e.settlement.id = :settlementId " +
           "AND (e.category = :category OR e.categoryAi = :category) " +
           "ORDER BY e.expenseDate DESC")
    List<Expense> findBySettlementIdAndCategory(
        @Param("settlementId") UUID settlementId,
        @Param("category") String category
    );

    /**
     * 특정 정산의 날짜 범위 내 지출 조회
     */
    @Query("SELECT e FROM Expense e WHERE e.settlement.id = :settlementId " +
           "AND e.expenseDate BETWEEN :startDate AND :endDate " +
           "ORDER BY e.expenseDate ASC")
    List<Expense> findBySettlementIdAndDateRange(
        @Param("settlementId") UUID settlementId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * 특정 정산의 총 지출 건수 조회
     */
    long countBySettlementId(UUID settlementId);

    /**
     * 특정 정산 삭제 시 관련 지출도 삭제 (Cascade)
     */
    void deleteBySettlementId(UUID settlementId);
}
