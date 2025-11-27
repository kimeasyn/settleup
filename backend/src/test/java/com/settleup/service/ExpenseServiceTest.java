package com.settleup.service;

import com.settleup.domain.expense.Expense;
import com.settleup.domain.participant.Participant;
import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementType;
import com.settleup.dto.ExpenseDto.ExpenseRequest;
import com.settleup.dto.ExpenseDto.ExpenseResponse;
import com.settleup.exception.BusinessException;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.ExpenseRepository;
import com.settleup.repository.ExpenseSplitRepository;
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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ExpenseService 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ExpenseService 테스트")
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private ParticipantRepository participantRepository;

    @InjectMocks
    private ExpenseService expenseService;

    private UUID settlementId;
    private UUID participantId;
    private UUID expenseId;
    private Settlement settlement;
    private Participant participant;
    private Expense expense;

    @BeforeEach
    void setUp() {
        settlementId = UUID.randomUUID();
        participantId = UUID.randomUUID();
        expenseId = UUID.randomUUID();

        settlement = Settlement.builder()
                .id(settlementId)
                .title("제주도 여행")
                .type(SettlementType.TRAVEL)
                .creatorId(UUID.randomUUID())
                .currency("KRW")
                .build();

        participant = Participant.builder()
                .id(participantId)
                .settlementId(settlementId)
                .name("김철수")
                .isActive(true)
                .build();

        expense = Expense.builder()
                .id(expenseId)
                .settlement(settlement)
                .payer(participant)
                .amount(new BigDecimal("50000"))
                .category("식비")
                .description("저녁 식사")
                .expenseDate(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("지출 생성 - 성공")
    void createExpense_Success() {
        // given
        ExpenseRequest request = ExpenseRequest.builder()
                .payerId(participantId)
                .amount(new BigDecimal("50000"))
                .category("식비")
                .description("저녁 식사")
                .expenseDate(LocalDateTime.now())
                .build();

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findById(participantId)).thenReturn(Optional.of(participant));
        when(expenseRepository.save(any(Expense.class))).thenReturn(expense);

        // when
        ExpenseResponse response = expenseService.createExpense(settlementId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(expenseId);
        assertThat(response.getSettlementId()).isEqualTo(settlementId);
        assertThat(response.getPayerId()).isEqualTo(participantId);
        assertThat(response.getPayerName()).isEqualTo("김철수");
        assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("50000"));
        assertThat(response.getCategory()).isEqualTo("식비");
        assertThat(response.getDescription()).isEqualTo("저녁 식사");

        verify(settlementRepository, times(1)).findById(settlementId);
        verify(participantRepository, times(1)).findById(participantId);
        verify(expenseRepository, times(1)).save(any(Expense.class));
    }

    @Test
    @DisplayName("지출 생성 - 정산을 찾을 수 없음")
    void createExpense_SettlementNotFound() {
        // given
        ExpenseRequest request = ExpenseRequest.builder()
                .payerId(participantId)
                .amount(new BigDecimal("50000"))
                .description("저녁 식사")
                .expenseDate(LocalDateTime.now())
                .build();

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> expenseService.createExpense(settlementId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Settlement");

        verify(expenseRepository, never()).save(any());
    }

    @Test
    @DisplayName("지출 생성 - 지출자를 찾을 수 없음")
    void createExpense_PayerNotFound() {
        // given
        ExpenseRequest request = ExpenseRequest.builder()
                .payerId(participantId)
                .amount(new BigDecimal("50000"))
                .description("저녁 식사")
                .expenseDate(LocalDateTime.now())
                .build();

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findById(participantId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> expenseService.createExpense(settlementId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Participant");

        verify(expenseRepository, never()).save(any());
    }

    @Test
    @DisplayName("지출 생성 - 지출자가 해당 정산에 속하지 않음")
    void createExpense_PayerNotInSettlement() {
        // given
        UUID otherSettlementId = UUID.randomUUID();
        Participant otherParticipant = Participant.builder()
                .id(participantId)
                .settlementId(otherSettlementId) // 다른 정산
                .name("김철수")
                .isActive(true)
                .build();

        ExpenseRequest request = ExpenseRequest.builder()
                .payerId(participantId)
                .amount(new BigDecimal("50000"))
                .description("저녁 식사")
                .expenseDate(LocalDateTime.now())
                .build();

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(participantRepository.findById(participantId)).thenReturn(Optional.of(otherParticipant));

        // when & then
        assertThatThrownBy(() -> expenseService.createExpense(settlementId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("해당 정산에 속하지 않습니다");

        verify(expenseRepository, never()).save(any());
    }

    @Test
    @DisplayName("정산의 모든 지출 조회 - 성공")
    void getExpensesBySettlement_Success() {
        // given
        Expense expense2 = Expense.builder()
                .id(UUID.randomUUID())
                .settlement(settlement)
                .payer(participant)
                .amount(new BigDecimal("30000"))
                .description("점심 식사")
                .expenseDate(LocalDateTime.now())
                .build();

        List<Expense> expenses = Arrays.asList(expense, expense2);

        when(settlementRepository.existsById(settlementId)).thenReturn(true);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId)).thenReturn(expenses);
        when(expenseSplitRepository.findByExpenseId(any())).thenReturn(Arrays.asList());

        // when
        List<ExpenseResponse> responses = expenseService.getExpensesBySettlement(settlementId);

        // then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getDescription()).isEqualTo("저녁 식사");
        assertThat(responses.get(1).getDescription()).isEqualTo("점심 식사");

        verify(settlementRepository, times(1)).existsById(settlementId);
        verify(expenseRepository, times(1)).findBySettlementIdOrderByExpenseDateDesc(settlementId);
    }

    @Test
    @DisplayName("정산의 모든 지출 조회 - 정산을 찾을 수 없음")
    void getExpensesBySettlement_SettlementNotFound() {
        // given
        when(settlementRepository.existsById(settlementId)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> expenseService.getExpensesBySettlement(settlementId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Settlement");

        verify(expenseRepository, never()).findBySettlementIdOrderByExpenseDateDesc(any());
    }

    @Test
    @DisplayName("정산의 모든 지출 조회 - 빈 목록")
    void getExpensesBySettlement_EmptyList() {
        // given
        when(settlementRepository.existsById(settlementId)).thenReturn(true);
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId)).thenReturn(Arrays.asList());

        // when
        List<ExpenseResponse> responses = expenseService.getExpensesBySettlement(settlementId);

        // then
        assertThat(responses).isEmpty();
    }

    @Test
    @DisplayName("지출 단건 조회 - 성공")
    void getExpense_Success() {
        // given
        when(expenseRepository.findById(expenseId)).thenReturn(Optional.of(expense));
        when(expenseSplitRepository.findByExpenseId(expenseId)).thenReturn(Arrays.asList());

        // when
        ExpenseResponse response = expenseService.getExpense(expenseId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(expenseId);
        assertThat(response.getDescription()).isEqualTo("저녁 식사");

        verify(expenseRepository, times(1)).findById(expenseId);
    }

    @Test
    @DisplayName("지출 단건 조회 - 지출을 찾을 수 없음")
    void getExpense_NotFound() {
        // given
        when(expenseRepository.findById(expenseId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> expenseService.getExpense(expenseId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Expense");

        verify(expenseRepository, times(1)).findById(expenseId);
    }

    @Test
    @DisplayName("지출 삭제 - 성공")
    void deleteExpense_Success() {
        // given
        when(expenseRepository.existsById(expenseId)).thenReturn(true);
        doNothing().when(expenseSplitRepository).deleteByExpenseId(expenseId);
        doNothing().when(expenseRepository).deleteById(expenseId);

        // when
        expenseService.deleteExpense(expenseId);

        // then
        verify(expenseRepository, times(1)).existsById(expenseId);
        verify(expenseSplitRepository, times(1)).deleteByExpenseId(expenseId);
        verify(expenseRepository, times(1)).deleteById(expenseId);
    }

    @Test
    @DisplayName("지출 삭제 - 지출을 찾을 수 없음")
    void deleteExpense_NotFound() {
        // given
        when(expenseRepository.existsById(expenseId)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> expenseService.deleteExpense(expenseId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Expense");

        verify(expenseRepository, times(1)).existsById(expenseId);
        verify(expenseRepository, never()).deleteById(any());
    }
}
