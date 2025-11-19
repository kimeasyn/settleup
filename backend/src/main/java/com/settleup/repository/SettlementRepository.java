package com.settleup.repository;

import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Settlement Repository
 * 정산 데이터 액세스
 */
@Repository
public interface SettlementRepository extends JpaRepository<Settlement, UUID> {

    /**
     * 생성자 ID로 정산 목록 조회 (페이징)
     */
    Page<Settlement> findByCreatorIdOrderByCreatedAtDesc(UUID creatorId, Pageable pageable);

    /**
     * 정산 유형으로 조회
     */
    List<Settlement> findByType(SettlementType type);

    /**
     * 정산 상태로 조회
     */
    List<Settlement> findByStatus(SettlementStatus status);

    /**
     * 생성자 ID와 상태로 조회
     */
    List<Settlement> findByCreatorIdAndStatus(UUID creatorId, SettlementStatus status);

    /**
     * 기간 내 정산 조회
     */
    List<Settlement> findByStartDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * 제목으로 검색 (부분 일치)
     */
    List<Settlement> findByTitleContainingIgnoreCase(String title);
}
