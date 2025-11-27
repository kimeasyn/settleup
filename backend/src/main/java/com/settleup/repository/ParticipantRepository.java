package com.settleup.repository;

import com.settleup.domain.participant.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Participant Repository
 * 참가자 데이터 액세스
 */
@Repository
public interface ParticipantRepository extends JpaRepository<Participant, UUID> {

    /**
     * 정산 ID로 참가자 목록 조회
     */
    List<Participant> findBySettlementId(UUID settlementId);

    /**
     * 정산 ID와 활성 상태로 조회
     */
    List<Participant> findBySettlementIdAndIsActive(UUID settlementId, Boolean isActive);

    /**
     * 정산 ID와 이름으로 조회 (고유 제약조건)
     */
    Optional<Participant> findBySettlementIdAndName(UUID settlementId, String name);

    /**
     * 사용자 ID로 참가 중인 정산 조회
     */
    List<Participant> findByUserId(UUID userId);

    /**
     * 정산 ID와 이름 존재 여부 확인
     */
    boolean existsBySettlementIdAndName(UUID settlementId, String name);

    /**
     * 정산의 참가자 수 조회
     */
    long countBySettlementId(UUID settlementId);

    /**
     * 정산의 활성 참가자 수 조회
     */
    long countBySettlementIdAndIsActive(UUID settlementId, Boolean isActive);

    /**
     * 정산 삭제 시 관련 참가자도 삭제 (Cascade)
     */
    void deleteBySettlementId(UUID settlementId);
}
