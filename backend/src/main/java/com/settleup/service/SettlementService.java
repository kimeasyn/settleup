package com.settleup.service;

import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.dto.SettlementCreateRequest;
import com.settleup.dto.SettlementResponse;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Settlement Service
 * 정산 비즈니스 로직
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementService {

    private final SettlementRepository settlementRepository;

    /**
     * 정산 생성
     */
    @Transactional
    public SettlementResponse createSettlement(SettlementCreateRequest request, UUID creatorId) {
        log.info("Creating settlement: title={}, type={}, creatorId={}",
                request.getTitle(), request.getType(), creatorId);

        Settlement settlement = Settlement.builder()
                .title(request.getTitle())
                .type(request.getType())
                .status(SettlementStatus.ACTIVE)
                .creatorId(creatorId)
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .currency(request.getCurrency() != null ? request.getCurrency() : "KRW")
                .build();

        // 날짜 검증
        settlement.validateDates();

        Settlement saved = settlementRepository.save(settlement);
        log.info("Settlement created successfully: id={}", saved.getId());

        return SettlementResponse.from(saved);
    }

    /**
     * 정산 조회
     */
    public SettlementResponse getSettlement(UUID id) {
        log.info("Getting settlement: id={}", id);

        Settlement settlement = settlementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", id));

        return SettlementResponse.from(settlement);
    }

    /**
     * 정산 삭제
     */
    @Transactional
    public void deleteSettlement(UUID id) {
        log.info("Deleting settlement: id={}", id);

        if (!settlementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Settlement", "id", id);
        }

        settlementRepository.deleteById(id);
        log.info("Settlement deleted successfully: id={}", id);
    }
}
