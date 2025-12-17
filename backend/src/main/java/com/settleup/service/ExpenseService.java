package com.settleup.service;

import com.settleup.domain.expense.Expense;
import com.settleup.domain.expense.ExpenseSplit;
import com.settleup.domain.participant.Participant;
import com.settleup.domain.settlement.Settlement;
import com.settleup.dto.ExpenseDto.*;
import com.settleup.exception.BusinessException;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.ExpenseRepository;
import com.settleup.repository.ExpenseSplitRepository;
import com.settleup.repository.ParticipantRepository;
import com.settleup.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Expense Service
 * 지출 비즈니스 로직
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final SettlementRepository settlementRepository;
    private final ParticipantRepository participantRepository;

    /**
     * 지출 생성
     */
    @Transactional
    public ExpenseResponse createExpense(UUID settlementId, ExpenseRequest request) {
        log.info("Creating expense: settlementId={}, description={}, amount={}",
                settlementId, request.getDescription(), request.getAmount());

        // 정산 조회
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", settlementId));

        // 지출자 조회 및 검증
        Participant payer = participantRepository.findById(request.getPayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", request.getPayerId()));

        if (!payer.getSettlementId().equals(settlementId)) {
            throw new BusinessException("지출자가 해당 정산에 속하지 않습니다");
        }

        // 지출 생성
        Expense expense = Expense.builder()
                .settlement(settlement)
                .payer(payer)
                .amount(request.getAmount())
                .category(request.getCategory())
                .description(request.getDescription())
                .expenseDate(request.getExpenseDate())
                .build();

        Expense savedExpense = expenseRepository.save(expense);

        // 분담 내역 생성 (선택사항)
        List<ExpenseSplit> splits = List.of();
        // ExpenseRequest에는 분담 내역이 없으므로 이 부분은 제거
        // 분담 설정은 별도의 setExpenseSplits API를 사용
        if (false) {

            // 분담 금액 합계 검증 (분담 내역이 있을 때만)
            validateTotalSplits(savedExpense, splits);

            log.info("Expense created successfully with splits: id={}, splits count={}",
                    savedExpense.getId(), splits.size());
        } else {
            log.info("Expense created successfully without splits: id={} (splits will be calculated later)",
                    savedExpense.getId());
        }

        return ExpenseResponse.fromWithSplits(savedExpense, splits);
    }

    /**
     * 지출 조회 (분담 내역 포함)
     */
    public ExpenseResponse getExpense(UUID expenseId) {
        log.info("Getting expense: id={}", expenseId);

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));

        List<ExpenseSplit> splits = expenseSplitRepository.findByExpenseId(expenseId);

        return ExpenseResponse.fromWithSplits(expense, splits);
    }

    /**
     * 정산의 모든 지출 조회 (최신순)
     */
    public List<ExpenseResponse> getExpensesBySettlement(UUID settlementId) {
        log.info("Getting expenses by settlement: settlementId={}", settlementId);

        // 정산 존재 확인
        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        List<Expense> expenses = expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId);

        return expenses.stream()
                .map(expense -> {
                    List<ExpenseSplit> splits = expenseSplitRepository.findByExpenseId(expense.getId());
                    return ExpenseResponse.fromWithSplits(expense, splits);
                })
                .collect(Collectors.toList());
    }

    /**
     * 지출 수정
     */
    @Transactional
    public ExpenseResponse updateExpense(UUID expenseId, ExpenseUpdateRequest request) {
        log.info("Updating expense: id={}", expenseId);

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));

        // 필드 업데이트 (null이 아닌 값만)
        if (request.getAmount() != null) {
            expense.setAmount(request.getAmount());
        }
        if (request.getCategory() != null) {
            expense.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            expense.setDescription(request.getDescription());
        }
        if (request.getExpenseDate() != null) {
            expense.setExpenseDate(request.getExpenseDate());
        }

        // 분담 내역 업데이트는 별도 API에서 처리

        Expense updated = expenseRepository.save(expense);
        List<ExpenseSplit> splits = expenseSplitRepository.findByExpenseId(expenseId);

        log.info("Expense updated successfully: id={}", expenseId);

        return ExpenseResponse.fromWithSplits(updated, splits);
    }

    /**
     * 지출 삭제
     */
    @Transactional
    public void deleteExpense(UUID expenseId) {
        log.info("Deleting expense: id={}", expenseId);

        if (!expenseRepository.existsById(expenseId)) {
            throw new ResourceNotFoundException("Expense", "id", expenseId);
        }

        // 분담 내역도 함께 삭제
        expenseSplitRepository.deleteByExpenseId(expenseId);
        expenseRepository.deleteById(expenseId);

        log.info("Expense deleted successfully: id={}", expenseId);
    }

    /**
     * 참가자의 지출 내역 조회
     */
    public List<ExpenseResponse> getExpensesByPayer(UUID payerId) {
        log.info("Getting expenses by payer: payerId={}", payerId);

        // 참가자 존재 확인
        if (!participantRepository.existsById(payerId)) {
            throw new ResourceNotFoundException("Participant", "id", payerId);
        }

        List<Expense> expenses = expenseRepository.findByPayerIdOrderByExpenseDateDesc(payerId);

        return expenses.stream()
                .map(expense -> {
                    List<ExpenseSplit> splits = expenseSplitRepository.findByExpenseId(expense.getId());
                    return ExpenseResponse.fromWithSplits(expense, splits);
                })
                .collect(Collectors.toList());
    }

    /**
     * 카테고리별 지출 조회
     */
    public List<ExpenseResponse> getExpensesByCategory(UUID settlementId, String category) {
        log.info("Getting expenses by category: settlementId={}, category={}",
                settlementId, category);

        // 정산 존재 확인
        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        List<Expense> expenses = expenseRepository.findBySettlementIdAndCategory(settlementId, category);

        return expenses.stream()
                .map(expense -> {
                    List<ExpenseSplit> splits = expenseSplitRepository.findByExpenseId(expense.getId());
                    return ExpenseResponse.fromWithSplits(expense, splits);
                })
                .collect(Collectors.toList());
    }

    /**
     * 지출 분담 내역 생성 (헬퍼 메서드)
     */
    private List<ExpenseSplit> createExpenseSplits(
            Expense expense,
            List<ExpenseSplitRequest.ParticipantSplitRequest> splitRequests,
            UUID settlementId) {

        return splitRequests.stream()
                .map(splitRequest -> {
                    // 참가자 조회 및 검증
                    Participant participant = participantRepository.findById(splitRequest.getParticipantId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                "Participant", "id", splitRequest.getParticipantId()));

                    if (!participant.getSettlementId().equals(settlementId)) {
                        throw new BusinessException(
                            String.format("참가자 '%s'가 해당 정산에 속하지 않습니다", participant.getName()));
                    }

                    ExpenseSplit split = ExpenseSplit.builder()
                            .expense(expense)
                            .participant(participant)
                            .share(splitRequest.getShare())
                            .build();

                    return expenseSplitRepository.save(split);
                })
                .collect(Collectors.toList());
    }

    /**
     * 지출 분담 설정
     */
    @Transactional
    public ExpenseResponse setExpenseSplits(UUID expenseId, ExpenseSplitRequest request) {
        log.info("[setExpenseSplits] Setting splits for expense: {}, type: {}",
                expenseId, request.getSplitType());

        // 1. 지출 조회
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));

        // 2. 기존 분담 내역 삭제
        expenseSplitRepository.deleteByExpenseId(expenseId);

        // 3. 새로운 분담 내역 생성
        List<ExpenseSplit> newSplits;
        if (request.getSplitType() == ExpenseSplitRequest.SplitType.EQUAL) {
            // 균등 분할
            newSplits = createEqualSplits(expense, request.getSplits());
        } else {
            // 수동 입력
            newSplits = createManualSplits(expense, request.getSplits());
        }

        // 4. 분담 금액 합계 검증
        validateTotalSplits(expense, newSplits);

        // 5. 응답 생성
        return ExpenseResponse.from(expense);
    }

    /**
     * 균등 분할 생성
     */
    private List<ExpenseSplit> createEqualSplits(Expense expense, List<ExpenseSplitRequest.ParticipantSplitRequest> splitRequests) {
        log.info("[createEqualSplits] Creating equal splits for {} participants", splitRequests.size());

        BigDecimal totalAmount = expense.getAmount();
        int participantCount = splitRequests.size();

        // 1인당 기본 분담 금액 (소수점 2자리, 버림)
        BigDecimal perPersonAmount = totalAmount
                .divide(BigDecimal.valueOf(participantCount), 2, BigDecimal.ROUND_DOWN);

        // 나머지 금액 계산
        BigDecimal totalDistributed = perPersonAmount.multiply(BigDecimal.valueOf(participantCount));
        BigDecimal remainder = totalAmount.subtract(totalDistributed);

        List<ExpenseSplit> splits = new ArrayList<>();
        for (int i = 0; i < splitRequests.size(); i++) {
            ExpenseSplitRequest.ParticipantSplitRequest splitRequest = splitRequests.get(i);

            // 첫 번째 참가자에게 나머지 추가
            BigDecimal share = i == 0
                    ? perPersonAmount.add(remainder)
                    : perPersonAmount;

            Participant participant = participantRepository.findById(splitRequest.getParticipantId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Participant", "id", splitRequest.getParticipantId()));

            ExpenseSplit split = ExpenseSplit.builder()
                    .expense(expense)
                    .participant(participant)
                    .share(share)
                    .build();

            splits.add(expenseSplitRepository.save(split));
        }

        return splits;
    }

    /**
     * 수동 분할 생성
     */
    private List<ExpenseSplit> createManualSplits(Expense expense, List<ExpenseSplitRequest.ParticipantSplitRequest> splitRequests) {
        log.info("[createManualSplits] Creating manual splits for {} participants", splitRequests.size());

        return splitRequests.stream()
                .map(splitRequest -> {
                    Participant participant = participantRepository.findById(splitRequest.getParticipantId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Participant", "id", splitRequest.getParticipantId()));

                    ExpenseSplit split = ExpenseSplit.builder()
                            .expense(expense)
                            .participant(participant)
                            .share(splitRequest.getShare())
                            .build();

                    return expenseSplitRepository.save(split);
                })
                .collect(Collectors.toList());
    }

    /**
     * 분담 금액 합계 검증 (헬퍼 메서드)
     */
    private void validateTotalSplits(Expense expense, List<ExpenseSplit> splits) {
        BigDecimal totalSplits = splits.stream()
                .map(ExpenseSplit::getShare)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 분담 금액 합계가 지출 금액과 일치하는지 확인 (소수점 2자리까지 비교)
        if (totalSplits.setScale(2, BigDecimal.ROUND_HALF_UP)
                .compareTo(expense.getAmount().setScale(2, BigDecimal.ROUND_HALF_UP)) != 0) {
            throw new BusinessException(
                String.format("분담 금액 합계(%s)가 지출 금액(%s)과 일치하지 않습니다",
                    totalSplits, expense.getAmount()));
        }
    }
}
