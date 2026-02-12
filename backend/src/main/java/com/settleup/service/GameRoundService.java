package com.settleup.service;

import com.settleup.domain.game.GameRound;
import com.settleup.domain.game.GameRoundEntry;
import com.settleup.domain.participant.Participant;
import com.settleup.dto.GameRoundDto.*;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.GameRoundEntryRepository;
import com.settleup.repository.GameRoundRepository;
import com.settleup.repository.ParticipantRepository;
import com.settleup.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GameRoundService {

    private final GameRoundRepository gameRoundRepository;
    private final GameRoundEntryRepository gameRoundEntryRepository;
    private final SettlementRepository settlementRepository;
    private final ParticipantRepository participantRepository;

    public List<GameRoundWithEntriesResponse> getGameRounds(UUID settlementId) {
        log.info("Getting game rounds for settlement: {}", settlementId);

        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        List<GameRound> rounds = gameRoundRepository.findBySettlementIdOrderByRoundNumberAsc(settlementId);
        if (rounds.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> roundIds = rounds.stream().map(GameRound::getId).toList();
        List<GameRoundEntry> allEntries = gameRoundEntryRepository.findByRoundIdIn(roundIds);

        Map<UUID, List<GameRoundEntry>> entriesByRound = allEntries.stream()
                .collect(Collectors.groupingBy(GameRoundEntry::getRoundId));

        Map<UUID, String> participantNames = getParticipantNames(settlementId);

        return rounds.stream()
                .map(round -> GameRoundWithEntriesResponse.from(
                        round,
                        entriesByRound.getOrDefault(round.getId(), Collections.emptyList()),
                        participantNames))
                .toList();
    }

    @Transactional
    public GameRoundResponse createGameRound(UUID settlementId, CreateGameRoundRequest request) {
        log.info("Creating game round for settlement: {}", settlementId);

        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        int nextNumber = gameRoundRepository.countBySettlementId(settlementId) + 1;
        String title = (request != null && request.getTitle() != null && !request.getTitle().isBlank())
                ? request.getTitle()
                : nextNumber + "라운드";

        GameRound round = GameRound.builder()
                .settlementId(settlementId)
                .roundNumber(nextNumber)
                .title(title)
                .isCompleted(false)
                .excludedParticipantIds("[]")
                .build();

        GameRound saved = gameRoundRepository.save(round);
        log.info("Game round created: id={}, number={}", saved.getId(), saved.getRoundNumber());

        return GameRoundResponse.from(saved);
    }

    @Transactional
    public GameRoundWithEntriesResponse updateRoundEntries(UUID roundId, UpdateEntriesRequest request) {
        log.info("Updating entries for round: {}", roundId);

        GameRound round = gameRoundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("GameRound", "id", roundId));

        // 기존 엔트리 삭제
        gameRoundEntryRepository.deleteByRoundId(roundId);

        // 새 엔트리 일괄 삽입
        List<GameRoundEntry> newEntries = new ArrayList<>();
        if (request.getEntries() != null) {
            for (EntryData data : request.getEntries()) {
                GameRoundEntry entry = GameRoundEntry.builder()
                        .roundId(roundId)
                        .participantId(data.getParticipantId())
                        .amount(data.getAmount())
                        .memo(data.getMemo())
                        .build();
                newEntries.add(entry);
            }
        }
        List<GameRoundEntry> savedEntries = gameRoundEntryRepository.saveAll(newEntries);

        // excludedParticipantIds 저장
        if (request.getExcludedParticipantIds() != null) {
            round.setExcludedParticipantIdList(request.getExcludedParticipantIds());
        } else {
            round.setExcludedParticipantIdList(Collections.emptyList());
        }
        gameRoundRepository.save(round);

        Map<UUID, String> participantNames = getParticipantNames(round.getSettlementId());

        return GameRoundWithEntriesResponse.from(round, savedEntries, participantNames);
    }

    @Transactional
    public void deleteGameRound(UUID roundId) {
        log.info("Deleting game round: {}", roundId);

        if (!gameRoundRepository.existsById(roundId)) {
            throw new ResourceNotFoundException("GameRound", "id", roundId);
        }

        gameRoundEntryRepository.deleteByRoundId(roundId);
        gameRoundRepository.deleteById(roundId);

        log.info("Game round deleted: {}", roundId);
    }

    private Map<UUID, String> getParticipantNames(UUID settlementId) {
        List<Participant> participants = participantRepository.findBySettlementId(settlementId);
        return participants.stream()
                .collect(Collectors.toMap(Participant::getId, Participant::getName));
    }
}
