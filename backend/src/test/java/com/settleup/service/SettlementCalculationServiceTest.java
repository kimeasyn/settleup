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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * SettlementCalculationService 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SettlementCalculationService 테스트")
class SettlementCalculationServiceTest {

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private ParticipantRepository participantRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private SettlementCalculationService settlementCalculationService;

    private UUID settlementId;
    private Settlement settlement;
    private List<Participant> participants;
    private List<Expense> expenses;

    @BeforeEach
    void setUp() {
        settlementId = UUID.randomUUID();
        settlement = Settlement.builder()
                .id(settlementId)
                .title("테스트 정산")
                .build();

        // 참가자 생성 (3명)
        participants = new ArrayList<>();
        Participant p1 = createParticipant("김철수");
        Participant p2 = createParticipant("이영희");
        Participant p3 = createParticipant("박민수");
        participants.add(p1);
        participants.add(p2);
        participants.add(p3);

        // 지출 생성
        expenses = new ArrayList<>();
        expenses.add(createExpense(p1, new BigDecimal("30000"))); // 김철수: 30000원
        expenses.add(createExpense(p2, new BigDecimal("20000"))); // 이영희: 20000원
        expenses.add(createExpense(p3, new BigDecimal("10000"))); // 박민수: 10000원
        // 총액: 60000원, 1인당: 20000원
    }

    private Participant createParticipant(String name) {
        return Participant.builder()
                .id(UUID.randomUUID())
                .name(name)
                .settlementId(settlementId)
                .isActive(true)
                .build();
    }

    private Expense createExpense(Participant payer, BigDecimal amount) {
        return Expense.builder()
                .id(UUID.randomUUID())
                .settlement(settlement)
                .payer(payer)
                .amount(amount)
                .description("테스트 지출")
                .expenseDate(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("정산 계산 - 정상 케이스")
    void calculateSettlement_Success() {
        // given
        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(participants);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(expenses);

        // when
        SettlementResultResponse result = settlementCalculationService.calculateSettlement(settlementId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getSettlementId()).isEqualTo(settlementId);
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("60000"));
        assertThat(result.getParticipants()).hasSize(3);
        assertThat(result.getTransfers()).isNotEmpty();
    }

    @Test
    @DisplayName("정산 계산 - 정산을 찾을 수 없음")
    void calculateSettlement_SettlementNotFound() {
        // given
        when(settlementRepository.findById(settlementId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> settlementCalculationService.calculateSettlement(settlementId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Settlement");
    }

    @Test
    @DisplayName("정산 계산 - 활성 참가자가 없음")
    void calculateSettlement_NoActiveParticipants() {
        // given
        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(Collections.emptyList());

        // when & then
        assertThatThrownBy(() -> settlementCalculationService.calculateSettlement(settlementId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("활성 참가자가 없습니다");
    }

    @Test
    @DisplayName("정산 계산 - 지출 내역이 없음")
    void calculateSettlement_NoExpenses() {
        // given
        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(participants);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(Collections.emptyList());

        // when & then
        assertThatThrownBy(() -> settlementCalculationService.calculateSettlement(settlementId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("지출 내역이 없습니다");
    }

    @Test
    @DisplayName("참가자별 잔액 계산 - 균등 분할")
    void calculateParticipantBalances_EqualSplit() {
        // given
        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(participants);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(expenses);

        // when
        SettlementResultResponse result = settlementCalculationService.calculateSettlement(settlementId);

        // then
        List<ParticipantSummary> summaries = result.getParticipants();
        assertThat(summaries).hasSize(3);

        // 각 참가자가 20000원씩 분담해야 함
        ParticipantSummary p1Summary = summaries.stream()
                .filter(s -> s.getParticipantName().equals("김철수"))
                .findFirst()
                .orElseThrow();
        assertThat(p1Summary.getTotalPaid()).isEqualByComparingTo(new BigDecimal("30000"));
        assertThat(p1Summary.getShouldPay()).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(p1Summary.getBalance()).isEqualByComparingTo(new BigDecimal("10000.00")); // 받을 돈

        ParticipantSummary p2Summary = summaries.stream()
                .filter(s -> s.getParticipantName().equals("이영희"))
                .findFirst()
                .orElseThrow();
        assertThat(p2Summary.getTotalPaid()).isEqualByComparingTo(new BigDecimal("20000"));
        assertThat(p2Summary.getShouldPay()).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(p2Summary.getBalance()).isEqualByComparingTo(new BigDecimal("0.00")); // 동일

        ParticipantSummary p3Summary = summaries.stream()
                .filter(s -> s.getParticipantName().equals("박민수"))
                .findFirst()
                .orElseThrow();
        assertThat(p3Summary.getTotalPaid()).isEqualByComparingTo(new BigDecimal("10000"));
        assertThat(p3Summary.getShouldPay()).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(p3Summary.getBalance()).isEqualByComparingTo(new BigDecimal("-10000.00")); // 줄 돈
    }

    @Test
    @DisplayName("참가자별 잔액 계산 - 소수점 처리 (RoundingMode.DOWN)")
    void calculateParticipantBalances_DecimalRounding() {
        // given: 총액 10000원을 3명이 분담 (3333.33원씩)
        Participant p1 = createParticipant("A");
        Participant p2 = createParticipant("B");
        Participant p3 = createParticipant("C");
        List<Participant> threeParticipants = Arrays.asList(p1, p2, p3);

        List<Expense> oneExpense = List.of(
                createExpense(p1, new BigDecimal("10000"))
        );

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(threeParticipants);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(oneExpense);

        // when
        SettlementResultResponse result = settlementCalculationService.calculateSettlement(settlementId);

        // then
        // 10000 / 3 = 3333.33... → RoundingMode.DOWN으로 3333.33
        // 나머지 0.01은 첫 번째 참가자(A)에게 추가
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("10000"));

        ParticipantSummary pASummary = result.getParticipants().stream()
                .filter(s -> s.getParticipantName().equals("A"))
                .findFirst()
                .orElseThrow();
        // 첫 번째 참가자는 나머지 금액 포함: 3333.33 + 0.01 = 3333.34
        assertThat(pASummary.getShouldPay()).isEqualByComparingTo(new BigDecimal("3333.34"));
        assertThat(pASummary.getBalance()).isEqualByComparingTo(new BigDecimal("6666.66")); // 10000 - 3333.34
    }

    @Test
    @DisplayName("최소 송금 경로 계산 - 2명 시나리오")
    void calculateMinimumTransfers_TwoParticipants() {
        // given: 2명, A가 100원 지출, B가 0원 지출
        Participant pA = createParticipant("A");
        Participant pB = createParticipant("B");
        List<Participant> twoParticipants = Arrays.asList(pA, pB);

        List<Expense> oneExpense = List.of(
                createExpense(pA, new BigDecimal("100"))
        );

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(twoParticipants);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(oneExpense);

        // when
        SettlementResultResponse result = settlementCalculationService.calculateSettlement(settlementId);

        // then
        assertThat(result.getTransfers()).hasSize(1);
        Transfer transfer = result.getTransfers().get(0);
        assertThat(transfer.getFromParticipantName()).isEqualTo("B");
        assertThat(transfer.getToParticipantName()).isEqualTo("A");
        assertThat(transfer.getAmount()).isEqualByComparingTo(new BigDecimal("50.00"));
    }

    @Test
    @DisplayName("최소 송금 경로 계산 - 복잡한 시나리오")
    void calculateMinimumTransfers_ComplexScenario() {
        // given: 4명, 불균등 지출
        Participant pA = createParticipant("A");
        Participant pB = createParticipant("B");
        Participant pC = createParticipant("C");
        Participant pD = createParticipant("D");
        List<Participant> fourParticipants = Arrays.asList(pA, pB, pC, pD);

        List<Expense> complexExpenses = Arrays.asList(
                createExpense(pA, new BigDecimal("40000")), // A: 40000
                createExpense(pB, new BigDecimal("30000")), // B: 30000
                createExpense(pC, new BigDecimal("20000")), // C: 20000
                createExpense(pD, new BigDecimal("10000"))  // D: 10000
                // 총액: 100000, 1인당: 25000
        );

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(fourParticipants);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(complexExpenses);

        // when
        SettlementResultResponse result = settlementCalculationService.calculateSettlement(settlementId);

        // then
        // A: 40000 - 25000 = +15000 (받을 돈)
        // B: 30000 - 25000 = +5000 (받을 돈)
        // C: 20000 - 25000 = -5000 (줄 돈)
        // D: 10000 - 25000 = -15000 (줄 돈)

        // 최소 송금: C → B (5000), D → A (15000)
        // 또는: D → A (15000), C → B (5000)
        assertThat(result.getTransfers()).hasSizeLessThanOrEqualTo(3); // 최소 송금 경로

        // 송금 총액 검증: 줄 돈의 합계 = 받을 돈의 합계
        BigDecimal totalTransferred = result.getTransfers().stream()
                .map(Transfer::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalTransferred).isEqualByComparingTo(new BigDecimal("20000.00")); // 5000 + 15000
    }

    @Test
    @DisplayName("최소 송금 경로 계산 - 모두 균등 분담 (송금 없음)")
    void calculateMinimumTransfers_AllEqual() {
        // given: 3명이 각각 동일하게 지출
        Participant pA = createParticipant("A");
        Participant pB = createParticipant("B");
        Participant pC = createParticipant("C");
        List<Participant> threeParticipants = Arrays.asList(pA, pB, pC);

        List<Expense> equalExpenses = Arrays.asList(
                createExpense(pA, new BigDecimal("10000")),
                createExpense(pB, new BigDecimal("10000")),
                createExpense(pC, new BigDecimal("10000"))
        );

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(threeParticipants);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(equalExpenses);

        // when
        SettlementResultResponse result = settlementCalculationService.calculateSettlement(settlementId);

        // then
        // 모두 10000원씩 지출, 1인당 10000원 분담 → 잔액 모두 0 → 송금 없음
        assertThat(result.getTransfers()).isEmpty();
    }

    @Test
    @DisplayName("엣지 케이스 - 0원 지출")
    void edgeCase_ZeroAmount() {
        // given
        Participant p1 = createParticipant("A");
        Participant p2 = createParticipant("B");
        List<Participant> twoParticipants = Arrays.asList(p1, p2);

        List<Expense> zeroExpense = List.of(
                createExpense(p1, BigDecimal.ZERO)
        );

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(twoParticipants);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(zeroExpense);

        // when
        SettlementResultResponse result = settlementCalculationService.calculateSettlement(settlementId);

        // then
        assertThat(result.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getTransfers()).isEmpty();
    }

    @Test
    @DisplayName("엣지 케이스 - 1명만 참가")
    void edgeCase_SingleParticipant() {
        // given
        Participant p1 = createParticipant("A");
        List<Participant> oneParticipant = List.of(p1);

        List<Expense> oneExpense = List.of(
                createExpense(p1, new BigDecimal("10000"))
        );

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findBySettlementIdAndIsActive(settlementId, true))
                .thenReturn(oneParticipant);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(oneExpense);

        // when
        SettlementResultResponse result = settlementCalculationService.calculateSettlement(settlementId);

        // then
        assertThat(result.getParticipants()).hasSize(1);
        ParticipantSummary summary = result.getParticipants().get(0);
        assertThat(summary.getBalance()).isEqualByComparingTo(BigDecimal.ZERO); // 혼자 지출 → 혼자 분담 → 잔액 0
        assertThat(result.getTransfers()).isEmpty();
    }
}
