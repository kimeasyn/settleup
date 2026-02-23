package com.settleup.repository;

import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /**
     * 제목 또는 설명으로 검색 (페이징)
     */
    Page<Settlement> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByUpdatedAtDesc(
            String title, String description, Pageable pageable);

    /**
     * 상태별 필터링 (페이징)
     */
    Page<Settlement> findByStatusOrderByUpdatedAtDesc(SettlementStatus status, Pageable pageable);

    /**
     * 타입별 필터링 (페이징)
     */
    Page<Settlement> findByTypeOrderByUpdatedAtDesc(SettlementType type, Pageable pageable);

    /**
     * 상태와 타입으로 필터링 (페이징)
     */
    Page<Settlement> findByStatusAndTypeOrderByUpdatedAtDesc(
            SettlementStatus status, SettlementType type, Pageable pageable);

    /**
     * 전체 정산 조회 (페이징, 최신순)
     */
    Page<Settlement> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    /**
     * 사용자별 정산 목록 조회 (생성자이거나 멤버인 정산)
     */
    @Query("SELECT DISTINCT s FROM Settlement s LEFT JOIN SettlementMember sm ON s.id = sm.settlementId " +
           "WHERE s.creatorId = :userId OR sm.userId = :userId " +
           "ORDER BY s.updatedAt DESC")
    List<Settlement> findByUserAccess(@Param("userId") UUID userId);

    /**
     * 사용자별 정산 검색 (페이징)
     */
    @Query("SELECT DISTINCT s FROM Settlement s LEFT JOIN SettlementMember sm ON s.id = sm.settlementId " +
           "WHERE (s.creatorId = :userId OR sm.userId = :userId) " +
           "AND (LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY s.updatedAt DESC")
    Page<Settlement> findByUserAccessAndQuery(@Param("userId") UUID userId, @Param("query") String query, Pageable pageable);

    /**
     * 사용자별 정산 검색 + 타입 필터 (페이징)
     */
    @Query("SELECT DISTINCT s FROM Settlement s LEFT JOIN SettlementMember sm ON s.id = sm.settlementId " +
           "WHERE (s.creatorId = :userId OR sm.userId = :userId) " +
           "AND s.type = :type " +
           "AND (LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY s.updatedAt DESC")
    Page<Settlement> findByUserAccessAndQueryAndType(@Param("userId") UUID userId, @Param("query") String query, @Param("type") SettlementType type, Pageable pageable);

    /**
     * 사용자별 정산 필터링 - 상태 (페이징)
     */
    @Query("SELECT DISTINCT s FROM Settlement s LEFT JOIN SettlementMember sm ON s.id = sm.settlementId " +
           "WHERE (s.creatorId = :userId OR sm.userId = :userId) AND s.status = :status " +
           "ORDER BY s.updatedAt DESC")
    Page<Settlement> findByUserAccessAndStatus(@Param("userId") UUID userId, @Param("status") SettlementStatus status, Pageable pageable);

    /**
     * 사용자별 정산 필터링 - 타입 (페이징)
     */
    @Query("SELECT DISTINCT s FROM Settlement s LEFT JOIN SettlementMember sm ON s.id = sm.settlementId " +
           "WHERE (s.creatorId = :userId OR sm.userId = :userId) AND s.type = :type " +
           "ORDER BY s.updatedAt DESC")
    Page<Settlement> findByUserAccessAndType(@Param("userId") UUID userId, @Param("type") SettlementType type, Pageable pageable);

    /**
     * 사용자별 정산 필터링 - 상태 + 타입 (페이징)
     */
    @Query("SELECT DISTINCT s FROM Settlement s LEFT JOIN SettlementMember sm ON s.id = sm.settlementId " +
           "WHERE (s.creatorId = :userId OR sm.userId = :userId) AND s.status = :status AND s.type = :type " +
           "ORDER BY s.updatedAt DESC")
    Page<Settlement> findByUserAccessAndStatusAndType(@Param("userId") UUID userId, @Param("status") SettlementStatus status, @Param("type") SettlementType type, Pageable pageable);

    /**
     * 사용자별 전체 정산 조회 (페이징)
     */
    @Query("SELECT DISTINCT s FROM Settlement s LEFT JOIN SettlementMember sm ON s.id = sm.settlementId " +
           "WHERE s.creatorId = :userId OR sm.userId = :userId " +
           "ORDER BY s.updatedAt DESC")
    Page<Settlement> findByUserAccessPaged(@Param("userId") UUID userId, Pageable pageable);
}
