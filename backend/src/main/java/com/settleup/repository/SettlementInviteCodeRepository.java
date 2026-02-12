package com.settleup.repository;

import com.settleup.domain.settlement.SettlementInviteCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementInviteCodeRepository extends JpaRepository<SettlementInviteCode, UUID> {

    Optional<SettlementInviteCode> findByCode(String code);

    void deleteBySettlementId(UUID settlementId);
}
