package com.settleup.service;

import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.dto.SettlementCreateRequest;
import com.settleup.dto.SettlementResponse;
import com.settleup.dto.SettlementUpdateRequest;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.SettlementRepository;
import com.settleup.repository.ExpenseRepository;
import com.settleup.repository.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private final ExpenseRepository expenseRepository;
    private final ParticipantRepository participantRepository;

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
     * 모든 정산 목록 조회
     */
    public List<SettlementResponse> getAllSettlements() {
        log.info("Getting all settlements");

        List<Settlement> settlements = settlementRepository.findAll();

        return settlements.stream()
                .map(SettlementResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 정산 업데이트
     */
    @Transactional
    public SettlementResponse updateSettlement(UUID id, SettlementUpdateRequest request) {
        log.info("Updating settlement: id={}", id);

        Settlement settlement = settlementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", id));

        // 제공된 필드만 업데이트
        if (request.getTitle() != null) {
            settlement.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            settlement.setDescription(request.getDescription());
        }
        if (request.getStartDate() != null) {
            settlement.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            settlement.setEndDate(request.getEndDate());
        }
        if (request.getCurrency() != null) {
            settlement.setCurrency(request.getCurrency());
        }
        if (request.getStatus() != null) {
            settlement.setStatus(request.getStatus());
        }

        // 날짜 검증
        settlement.validateDates();

        Settlement updated = settlementRepository.save(settlement);
        log.info("Settlement updated successfully: id={}", updated.getId());

        return SettlementResponse.from(updated);
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

        // 외래 키 제약 조건 순서대로 삭제: expenses -> participants -> settlement
        log.info("Deleting related expenses for settlement: id={}", id);
        expenseRepository.deleteBySettlementId(id);

        log.info("Deleting related participants for settlement: id={}", id);
        participantRepository.deleteBySettlementId(id);

        settlementRepository.deleteById(id);
        log.info("Settlement deleted successfully: id={}", id);
    }
}
