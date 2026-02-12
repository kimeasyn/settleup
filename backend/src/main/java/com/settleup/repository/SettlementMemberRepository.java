package com.settleup.repository;

import com.settleup.domain.settlement.SettlementMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementMemberRepository extends JpaRepository<SettlementMember, UUID> {

    List<SettlementMember> findBySettlementId(UUID settlementId);

    List<SettlementMember> findByUserId(UUID userId);

    Optional<SettlementMember> findBySettlementIdAndUserId(UUID settlementId, UUID userId);

    boolean existsBySettlementIdAndUserId(UUID settlementId, UUID userId);

    void deleteBySettlementId(UUID settlementId);
}
