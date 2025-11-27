package com.settleup.service;

import com.settleup.domain.expense.Expense;
import com.settleup.domain.participant.Participant;
import com.settleup.domain.settlement.Settlement;
import com.settleup.dto.SettlementResultDto.*;
import com.settleup.exception.BusinessException;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.ExpenseRepository;
import com.settleup.repository.ParticipantRepository;
import com.settleup.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SettlementCalculation Service
 * 정산 계산 비즈니스 로직
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementCalculationService {

    private final SettlementRepository settlementRepository;
    private final ParticipantRepository participantRepository;
    private final ExpenseRepository expenseRepository;

    /**
     * 정산 계산
     */
    public SettlementResultResponse calculateSettlement(UUID settlementId) {
        return calculateSettlement(settlementId, null, null);
    }

    /**
     * 정산 계산 (나머지 처리자 지정 가능)
     */
    public SettlementResultResponse calculateSettlement(UUID settlementId, UUID remainderPayerId, BigDecimal remainderAmount) {
        log.info("Calculating settlement: settlementId={}, remainderPayerId={}, remainderAmount={}",
                settlementId, remainderPayerId, remainderAmount);

        // 1. 정산 조회
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", settlementId));

        // 2. 활성 참가자 조회
        List<Participant> participants = participantRepository
                .findBySettlementIdAndIsActive(settlementId, true);

        if (participants.isEmpty()) {
            throw new BusinessException("활성 참가자가 없습니다.");
        }

        // 3. 모든 지출 조회
        List<Expense> expenses = expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId);

        if (expenses.isEmpty()) {
            throw new BusinessException("지출 내역이 없습니다.");
        }

        // 4. 총 금액 계산
        BigDecimal totalAmount = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. 참가자별 잔액 계산
        List<ParticipantSummary> participantSummaries =
                calculateParticipantBalances(participants, expenses, totalAmount, remainderPayerId, remainderAmount);

        // 6. 최소 송금 경로 계산
        List<Transfer> transfers = calculateMinimumTransfers(participantSummaries);

        return SettlementResultResponse.builder()
                .settlementId(settlementId)
                .totalAmount(totalAmount)
                .participants(participantSummaries)
                .transfers(transfers)
                .calculatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * 참가자별 잔액 계산
     */
    private List<ParticipantSummary> calculateParticipantBalances(
            List<Participant> participants,
            List<Expense> expenses,
            BigDecimal totalAmount,
            UUID remainderPayerId,
            BigDecimal remainderAmount) {

        int participantCount = participants.size();

        BigDecimal perPersonAmount;
        BigDecimal additionalAmountForPayer = BigDecimal.ZERO;

        if (remainderAmount != null && remainderAmount.compareTo(BigDecimal.ZERO) > 0) {
            // remainderAmount가 제공된 경우: 새로운 로직
            // 남은 총액 = 총액 - 추가 부담 금액
            BigDecimal remainingTotal = totalAmount.subtract(remainderAmount);

            // 1인당 분담 = 남은 총액 / 참가자 수 (정수 나눗셈)
            // BigDecimal로 정수 나눗셈을 하려면 divide with RoundingMode.DOWN
            perPersonAmount = remainingTotal
                    .divide(BigDecimal.valueOf(participantCount), 0, RoundingMode.DOWN);

            // 추가 부담 금액 저장
            additionalAmountForPayer = remainderAmount;
        } else {
            // remainderAmount가 없는 경우: 기존 로직
            // 인당 기본 분담 금액 (소수점 버림)
            perPersonAmount = totalAmount
                    .divide(BigDecimal.valueOf(participantCount), 2, RoundingMode.DOWN);

            // 나머지 금액 계산
            BigDecimal totalDistributed = perPersonAmount.multiply(BigDecimal.valueOf(participantCount));
            BigDecimal remainder = totalAmount.subtract(totalDistributed);

            // 첫 번째 참가자에게 나머지 추가
            additionalAmountForPayer = remainder;
        }

        // 참가자별 총 지출 계산
        Map<UUID, BigDecimal> totalPaidMap = new HashMap<>();
        for (Participant p : participants) {
            totalPaidMap.put(p.getId(), BigDecimal.ZERO);
        }

        for (Expense expense : expenses) {
            UUID payerId = expense.getPayer().getId();
            if (totalPaidMap.containsKey(payerId)) {
                totalPaidMap.put(payerId,
                        totalPaidMap.get(payerId).add(expense.getAmount()));
            }
        }

        // 참가자별 요약 생성
        List<ParticipantSummary> summaries = new ArrayList<>();
        for (Participant p : participants) {
            BigDecimal totalPaid = totalPaidMap.get(p.getId());

            // 지정된 참가자 또는 첫 번째 참가자에게 추가 금액 부담
            boolean shouldPayAdditional = (remainderPayerId != null && p.getId().equals(remainderPayerId))
                    || (remainderPayerId == null && summaries.isEmpty());

            BigDecimal shouldPay = shouldPayAdditional
                    ? perPersonAmount.add(additionalAmountForPayer)
                    : perPersonAmount;

            BigDecimal balance = totalPaid.subtract(shouldPay);

            summaries.add(ParticipantSummary.builder()
                    .participantId(p.getId())
                    .participantName(p.getName())
                    .totalPaid(totalPaid)
                    .shouldPay(shouldPay)
                    .balance(balance)
                    .build());
        }

        return summaries;
    }

    /**
     * 최소 송금 횟수로 정산 경로 계산 (그리디 알고리즘)
     */
    private List<Transfer> calculateMinimumTransfers(List<ParticipantSummary> summaries) {
        List<Transfer> transfers = new ArrayList<>();

        // 받을 사람 (balance > 0)
        List<ParticipantBalance> creditors = summaries.stream()
                .filter(s -> s.getBalance().compareTo(BigDecimal.ZERO) > 0)
                .map(s -> new ParticipantBalance(s.getParticipantId(), s.getParticipantName(), s.getBalance()))
                .sorted((a, b) -> b.amount.compareTo(a.amount)) // 내림차순
                .collect(Collectors.toList());

        // 줄 사람 (balance < 0)
        List<ParticipantBalance> debtors = summaries.stream()
                .filter(s -> s.getBalance().compareTo(BigDecimal.ZERO) < 0)
                .map(s -> new ParticipantBalance(s.getParticipantId(), s.getParticipantName(), s.getBalance().abs()))
                .sorted((a, b) -> b.amount.compareTo(a.amount)) // 내림차순
                .collect(Collectors.toList());

        int i = 0, j = 0;

        while (i < creditors.size() && j < debtors.size()) {
            ParticipantBalance creditor = creditors.get(i);
            ParticipantBalance debtor = debtors.get(j);

            // 송금 금액 = min(받을 금액, 줄 금액)
            BigDecimal transferAmount = creditor.amount.min(debtor.amount);

            // 송금 경로 추가
            transfers.add(Transfer.builder()
                    .fromParticipantId(debtor.id)
                    .fromParticipantName(debtor.name)
                    .toParticipantId(creditor.id)
                    .toParticipantName(creditor.name)
                    .amount(transferAmount)
                    .build());

            // 잔액 업데이트
            creditor.amount = creditor.amount.subtract(transferAmount);
            debtor.amount = debtor.amount.subtract(transferAmount);

            // 잔액이 0이 된 사람은 다음으로 이동
            if (creditor.amount.compareTo(BigDecimal.ZERO) == 0) {
                i++;
            }
            if (debtor.amount.compareTo(BigDecimal.ZERO) == 0) {
                j++;
            }
        }

        return transfers;
    }

    /**
     * 참가자 잔액 (내부 클래스)
     */
    private static class ParticipantBalance {
        UUID id;
        String name;
        BigDecimal amount;

        ParticipantBalance(UUID id, String name, BigDecimal amount) {
            this.id = id;
            this.name = name;
            this.amount = amount;
        }
    }
}
