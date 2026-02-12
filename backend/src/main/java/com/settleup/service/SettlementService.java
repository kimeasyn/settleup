package com.settleup.service;

import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.dto.SettlementCreateRequest;
import com.settleup.dto.SettlementResponse;
import com.settleup.dto.SettlementUpdateRequest;
import com.settleup.exception.BusinessException;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.SettlementRepository;
import com.settleup.repository.SettlementResultRepository;
import com.settleup.repository.SettlementMemberRepository;
import com.settleup.repository.SettlementInviteCodeRepository;
import com.settleup.repository.ExpenseRepository;
import com.settleup.repository.ExpenseSplitRepository;
import com.settleup.repository.ParticipantRepository;
import com.settleup.repository.GameRoundRepository;
import com.settleup.repository.GameRoundEntryRepository;
import com.settleup.domain.game.GameRound;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.settleup.domain.settlement.SettlementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
    private final ExpenseSplitRepository expenseSplitRepository;
    private final ParticipantRepository participantRepository;
    private final SettlementResultRepository settlementResultRepository;
    private final SettlementMemberRepository settlementMemberRepository;
    private final SettlementInviteCodeRepository settlementInviteCodeRepository;
    private final GameRoundRepository gameRoundRepository;
    private final GameRoundEntryRepository gameRoundEntryRepository;

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
     * 정산 목록 조회 (페이징, 필터링, 검색)
     */
    public Page<SettlementResponse> searchSettlements(
            String query,
            SettlementStatus status,
            SettlementType type,
            int page,
            int size) {

        log.info("Searching settlements: query='{}', status={}, type={}, page={}, size={}",
                query, status, type, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<Settlement> settlements;

        if (query != null && !query.trim().isEmpty()) {
            // 검색어가 있는 경우
            settlements = settlementRepository
                    .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByUpdatedAtDesc(
                            query, query, pageable);
        } else if (status != null && type != null) {
            // 상태와 타입 모두 필터링
            settlements = settlementRepository.findByStatusAndTypeOrderByUpdatedAtDesc(status, type, pageable);
        } else if (status != null) {
            // 상태만 필터링
            settlements = settlementRepository.findByStatusOrderByUpdatedAtDesc(status, pageable);
        } else if (type != null) {
            // 타입만 필터링
            settlements = settlementRepository.findByTypeOrderByUpdatedAtDesc(type, pageable);
        } else {
            // 필터링 없이 전체 조회
            settlements = settlementRepository.findAllByOrderByUpdatedAtDesc(pageable);
        }

        return settlements.map(SettlementResponse::from);
    }

    /**
     * 정산 업데이트
     */
    @Transactional
    public SettlementResponse updateSettlement(UUID id, SettlementUpdateRequest request) {
        log.info("Updating settlement: id={}", id);

        Settlement settlement = settlementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", id));

        // COMPLETED 상태에서는 status 변경만 허용 (다시 열기)
        if (settlement.getStatus() == SettlementStatus.COMPLETED) {
            boolean hasNonStatusChange = request.getTitle() != null || request.getDescription() != null
                    || request.getStartDate() != null || request.getEndDate() != null
                    || request.getCurrency() != null;
            if (hasNonStatusChange) {
                throw new BusinessException("완료된 정산은 수정할 수 없습니다. 먼저 정산을 다시 열어주세요.");
            }
        }

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
     * 정산이 COMPLETED 상태인지 확인하고, 그렇다면 예외 발생
     */
    public void validateSettlementNotCompleted(UUID settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", settlementId));
        if (settlement.getStatus() == SettlementStatus.COMPLETED) {
            throw new BusinessException("완료된 정산은 수정할 수 없습니다.");
        }
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

        // 외래 키 제약 조건 순서대로 삭제
        // 0a. invite_codes 삭제
        log.info("Deleting related invite codes for settlement: id={}", id);
        settlementInviteCodeRepository.deleteBySettlementId(id);

        // 0b. members 삭제
        log.info("Deleting related members for settlement: id={}", id);
        settlementMemberRepository.deleteBySettlementId(id);

        // 0c. settlement_results 삭제
        log.info("Deleting related settlement results for settlement: id={}", id);
        settlementResultRepository.deleteBySettlementId(id);

        // 0d. game_round_entries + game_rounds 삭제
        log.info("Deleting related game rounds for settlement: id={}", id);
        List<GameRound> gameRounds = gameRoundRepository.findBySettlementIdOrderByRoundNumberAsc(id);
        if (!gameRounds.isEmpty()) {
            List<UUID> roundIds = gameRounds.stream().map(GameRound::getId).toList();
            gameRoundEntryRepository.deleteByRoundIdIn(roundIds);
            gameRoundRepository.deleteBySettlementId(id);
        }

        // 1. expense_splits 삭제 (expenses를 참조)
        log.info("Deleting related expense splits for settlement: id={}", id);
        var expenses = expenseRepository.findBySettlementIdOrderByExpenseDateDesc(id);
        for (var expense : expenses) {
            expenseSplitRepository.deleteByExpenseId(expense.getId());
        }

        // 2. expenses 삭제 (settlement을 참조)
        log.info("Deleting related expenses for settlement: id={}", id);
        expenseRepository.deleteBySettlementId(id);

        // 3. participants 삭제 (settlement을 참조)
        log.info("Deleting related participants for settlement: id={}", id);
        participantRepository.deleteBySettlementId(id);

        // 4. settlement 삭제
        settlementRepository.deleteById(id);
        log.info("Settlement deleted successfully: id={}", id);
    }
}
