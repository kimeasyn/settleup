package com.settleup.service;

import com.settleup.domain.participant.Participant;
import com.settleup.dto.ParticipantDto.ParticipantRequest;
import com.settleup.dto.ParticipantDto.ParticipantResponse;
import com.settleup.exception.BusinessException;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.ParticipantRepository;
import com.settleup.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Participant Service
 * 참가자 비즈니스 로직
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ParticipantService {

    private final ParticipantRepository participantRepository;
    private final SettlementRepository settlementRepository;

    /**
     * 참가자 추가
     */
    @Transactional
    public ParticipantResponse addParticipant(UUID settlementId, ParticipantRequest request) {
        log.info("Adding participant to settlement: settlementId={}, name={}",
                settlementId, request.getName());

        // 정산 존재 확인
        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        // 동일 정산에 같은 이름의 참가자가 이미 존재하는지 확인
        if (participantRepository.existsBySettlementIdAndName(settlementId, request.getName())) {
            throw new BusinessException(
                String.format("해당 정산에 이미 '%s' 이름의 참가자가 존재합니다", request.getName())
            );
        }

        Participant participant = Participant.builder()
                .settlementId(settlementId)
                .userId(request.getUserId())
                .name(request.getName())
                .isActive(true)
                .build();

        Participant saved = participantRepository.save(participant);
        log.info("Participant added successfully: id={}", saved.getId());

        return ParticipantResponse.from(saved);
    }

    /**
     * 정산의 모든 참가자 조회
     */
    public List<ParticipantResponse> getParticipantsBySettlement(UUID settlementId) {
        log.info("Getting participants by settlement: settlementId={}", settlementId);

        // 정산 존재 확인
        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        List<Participant> participants = participantRepository.findBySettlementId(settlementId);

        return participants.stream()
                .map(ParticipantResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 정산의 활성 참가자만 조회
     */
    public List<ParticipantResponse> getActiveParticipants(UUID settlementId) {
        log.info("Getting active participants by settlement: settlementId={}", settlementId);

        // 정산 존재 확인
        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        List<Participant> participants = participantRepository
                .findBySettlementIdAndIsActive(settlementId, true);

        return participants.stream()
                .map(ParticipantResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 참가자 단일 조회
     */
    public ParticipantResponse getParticipant(UUID participantId) {
        log.info("Getting participant: id={}", participantId);

        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", participantId));

        return ParticipantResponse.from(participant);
    }

    /**
     * 참가자 활성/비활성 토글
     */
    @Transactional
    public ParticipantResponse toggleParticipantStatus(UUID participantId, Boolean isActive) {
        log.info("Toggling participant status: id={}, isActive={}", participantId, isActive);

        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", participantId));

        participant.setIsActive(isActive);
        Participant updated = participantRepository.save(participant);

        log.info("Participant status toggled successfully: id={}, isActive={}",
                participantId, isActive);

        return ParticipantResponse.from(updated);
    }

    /**
     * 참가자 삭제
     * 주의: 지출 내역에 참조되는 참가자는 삭제할 수 없음
     */
    @Transactional
    public void deleteParticipant(UUID participantId) {
        log.info("Deleting participant: id={}", participantId);

        if (!participantRepository.existsById(participantId)) {
            throw new ResourceNotFoundException("Participant", "id", participantId);
        }

        // TODO: 지출 내역 참조 확인 로직 추가 (Phase 3에서 구현)
        // 현재는 단순 삭제만 수행

        participantRepository.deleteById(participantId);
        log.info("Participant deleted successfully: id={}", participantId);
    }

    /**
     * 참가자 수 조회
     */
    public long countParticipants(UUID settlementId) {
        log.info("Counting participants: settlementId={}", settlementId);

        // 정산 존재 확인
        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        return participantRepository.countBySettlementId(settlementId);
    }

    /**
     * 활성 참가자 수 조회
     */
    public long countActiveParticipants(UUID settlementId) {
        log.info("Counting active participants: settlementId={}", settlementId);

        // 정산 존재 확인
        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        return participantRepository.countBySettlementIdAndIsActive(settlementId, true);
    }
}
