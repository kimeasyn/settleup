package com.settleup.service;

import com.settleup.domain.settlement.SettlementResult;
import com.settleup.domain.settlement.SettlementResultData;
import com.settleup.dto.SettlementResultDto.*;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.SettlementResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementResultService {

    private final SettlementResultRepository settlementResultRepository;

    /**
     * 정산 결과 저장
     */
    @Transactional
    public SettlementResultResponse saveResult(SettlementResultResponse calculationResult) {
        log.info("Saving settlement result for: settlementId={}", calculationResult.getSettlementId());

        SettlementResultData data = SettlementResultData.builder()
                .participants(calculationResult.getParticipants().stream()
                        .map(p -> SettlementResultData.ParticipantSnapshot.builder()
                                .participantId(p.getParticipantId())
                                .participantName(p.getParticipantName())
                                .totalPaid(p.getTotalPaid())
                                .shouldPay(p.getShouldPay())
                                .balance(p.getBalance())
                                .build())
                        .collect(Collectors.toList()))
                .transfers(calculationResult.getTransfers().stream()
                        .map(t -> SettlementResultData.TransferSnapshot.builder()
                                .fromParticipantId(t.getFromParticipantId())
                                .fromParticipantName(t.getFromParticipantName())
                                .toParticipantId(t.getToParticipantId())
                                .toParticipantName(t.getToParticipantName())
                                .amount(t.getAmount())
                                .build())
                        .collect(Collectors.toList()))
                .build();

        SettlementResult entity = SettlementResult.builder()
                .settlementId(calculationResult.getSettlementId())
                .totalAmount(calculationResult.getTotalAmount())
                .resultData(data)
                .calculatedAt(calculationResult.getCalculatedAt())
                .build();

        SettlementResult saved = settlementResultRepository.save(entity);
        log.info("Settlement result saved: id={}", saved.getId());

        return calculationResult;
    }

    /**
     * 최신 저장된 결과 조회
     */
    public SettlementResultResponse getLatestResult(UUID settlementId) {
        log.info("Getting latest settlement result: settlementId={}", settlementId);

        SettlementResult result = settlementResultRepository
                .findFirstBySettlementIdOrderByCalculatedAtDesc(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("SettlementResult", "settlementId", settlementId));

        return toResponse(result);
    }

    /**
     * 정산 관련 결과 모두 삭제
     */
    @Transactional
    public void deleteBySettlementId(UUID settlementId) {
        log.info("Deleting settlement results: settlementId={}", settlementId);
        settlementResultRepository.deleteBySettlementId(settlementId);
    }

    private SettlementResultResponse toResponse(SettlementResult entity) {
        SettlementResultData data = entity.getResultData();

        return SettlementResultResponse.builder()
                .settlementId(entity.getSettlementId())
                .totalAmount(entity.getTotalAmount())
                .participants(data.getParticipants().stream()
                        .map(p -> ParticipantSummary.builder()
                                .participantId(p.getParticipantId())
                                .participantName(p.getParticipantName())
                                .totalPaid(p.getTotalPaid())
                                .shouldPay(p.getShouldPay())
                                .balance(p.getBalance())
                                .build())
                        .collect(Collectors.toList()))
                .transfers(data.getTransfers().stream()
                        .map(t -> Transfer.builder()
                                .fromParticipantId(t.getFromParticipantId())
                                .fromParticipantName(t.getFromParticipantName())
                                .toParticipantId(t.getToParticipantId())
                                .toParticipantName(t.getToParticipantName())
                                .amount(t.getAmount())
                                .build())
                        .collect(Collectors.toList()))
                .calculatedAt(entity.getCalculatedAt())
                .build();
    }
}
