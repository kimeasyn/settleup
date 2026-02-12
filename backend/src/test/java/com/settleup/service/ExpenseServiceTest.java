package com.settleup.service;

import com.settleup.domain.expense.Expense;
import com.settleup.domain.expense.ExpenseSplit;
import com.settleup.domain.participant.Participant;
import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementType;
import com.settleup.dto.ExpenseDto.ExpenseRequest;
import com.settleup.dto.ExpenseDto.ExpenseResponse;
import com.settleup.dto.ExpenseDto.ExpenseSplitRequest;
import com.settleup.dto.ExpenseDto.ExpenseSplitRequest.ParticipantSplitRequest;
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
import java.util.ArrayList;
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

    @Mock
    private SettlementService settlementService;

    @InjectMocks
    private ExpenseService expenseService;

    private UUID settlementId;
    private UUID participantId;
    private UUID participantId2;
    private UUID expenseId;
    private Settlement settlement;
    private Participant participant;
    private Participant participant2;
    private Expense expense;

    @BeforeEach
    void setUp() {
        settlementId = UUID.randomUUID();
        participantId = UUID.randomUUID();
        participantId2 = UUID.randomUUID();
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

        participant2 = Participant.builder()
                .id(participantId2)
                .settlementId(settlementId)
                .name("박영희")
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
        when(expenseRepository.findById(expenseId)).thenReturn(Optional.of(expense));
        doNothing().when(expenseSplitRepository).deleteByExpenseId(expenseId);
        doNothing().when(expenseRepository).deleteById(expenseId);

        // when
        expenseService.deleteExpense(expenseId);

        // then
        verify(expenseRepository, times(1)).findById(expenseId);
        verify(expenseSplitRepository, times(1)).deleteByExpenseId(expenseId);
        verify(expenseRepository, times(1)).deleteById(expenseId);
    }

    @Test
    @DisplayName("지출 삭제 - 지출을 찾을 수 없음")
    void deleteExpense_NotFound() {
        // given
        when(expenseRepository.findById(expenseId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> expenseService.deleteExpense(expenseId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Expense");

        verify(expenseRepository, times(1)).findById(expenseId);
        verify(expenseRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("지출 분담 설정 - 균등분할 성공")
    void setExpenseSplits_EqualSplit_Success() {
        // given
        ParticipantSplitRequest split1 = ParticipantSplitRequest.builder()
                .participantId(participantId)
                .share(new BigDecimal("25000"))
                .build();

        ParticipantSplitRequest split2 = ParticipantSplitRequest.builder()
                .participantId(participantId2)
                .share(new BigDecimal("25000"))
                .build();

        ExpenseSplitRequest request = ExpenseSplitRequest.builder()
                .splitType(ExpenseSplitRequest.SplitType.EQUAL)
                .splits(Arrays.asList(split1, split2))
                .build();

        when(expenseRepository.findById(expenseId)).thenReturn(Optional.of(expense));
        when(participantRepository.findById(participantId)).thenReturn(Optional.of(participant));
        when(participantRepository.findById(participantId2)).thenReturn(Optional.of(participant2));
        doNothing().when(expenseSplitRepository).deleteByExpenseId(expenseId);
        when(expenseSplitRepository.save(any(ExpenseSplit.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        ExpenseResponse response = expenseService.setExpenseSplits(expenseId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(expenseId);

        verify(expenseRepository, times(1)).findById(expenseId);
        verify(participantRepository, times(1)).findById(participantId);
        verify(participantRepository, times(1)).findById(participantId2);
        verify(expenseSplitRepository, times(1)).deleteByExpenseId(expenseId);
        verify(expenseSplitRepository, times(2)).save(any(ExpenseSplit.class));
    }

    @Test
    @DisplayName("지출 분담 설정 - 수동분할 성공")
    void setExpenseSplits_ManualSplit_Success() {
        // given
        ParticipantSplitRequest split1 = ParticipantSplitRequest.builder()
                .participantId(participantId)
                .share(new BigDecimal("20000"))
                .build();

        ParticipantSplitRequest split2 = ParticipantSplitRequest.builder()
                .participantId(participantId2)
                .share(new BigDecimal("30000"))
                .build();

        ExpenseSplitRequest request = ExpenseSplitRequest.builder()
                .splitType(ExpenseSplitRequest.SplitType.MANUAL)
                .splits(Arrays.asList(split1, split2))
                .build();

        when(expenseRepository.findById(expenseId)).thenReturn(Optional.of(expense));
        when(participantRepository.findById(participantId)).thenReturn(Optional.of(participant));
        when(participantRepository.findById(participantId2)).thenReturn(Optional.of(participant2));
        doNothing().when(expenseSplitRepository).deleteByExpenseId(expenseId);
        when(expenseSplitRepository.save(any(ExpenseSplit.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        ExpenseResponse response = expenseService.setExpenseSplits(expenseId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(expenseId);

        verify(expenseRepository, times(1)).findById(expenseId);
        verify(participantRepository, times(1)).findById(participantId);
        verify(participantRepository, times(1)).findById(participantId2);
        verify(expenseSplitRepository, times(1)).deleteByExpenseId(expenseId);
        verify(expenseSplitRepository, times(2)).save(any(ExpenseSplit.class));
    }

    @Test
    @DisplayName("지출 분담 설정 - 분담 금액 합계 불일치")
    void setExpenseSplits_InvalidTotalAmount() {
        // given
        ParticipantSplitRequest split1 = ParticipantSplitRequest.builder()
                .participantId(participantId)
                .share(new BigDecimal("20000"))
                .build();

        ParticipantSplitRequest split2 = ParticipantSplitRequest.builder()
                .participantId(participantId2)
                .share(new BigDecimal("20000")) // 총합 40000, 지출은 50000
                .build();

        ExpenseSplitRequest request = ExpenseSplitRequest.builder()
                .splitType(ExpenseSplitRequest.SplitType.MANUAL)
                .splits(Arrays.asList(split1, split2))
                .build();

        when(expenseRepository.findById(expenseId)).thenReturn(Optional.of(expense));
        when(participantRepository.findById(participantId)).thenReturn(Optional.of(participant));
        when(participantRepository.findById(participantId2)).thenReturn(Optional.of(participant2));
        doNothing().when(expenseSplitRepository).deleteByExpenseId(expenseId);
        when(expenseSplitRepository.save(any(ExpenseSplit.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when & then
        assertThatThrownBy(() -> expenseService.setExpenseSplits(expenseId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("분담 금액 합계");

        verify(expenseSplitRepository, times(1)).deleteByExpenseId(expenseId);
        verify(expenseSplitRepository, times(2)).save(any(ExpenseSplit.class));
    }

    @Test
    @DisplayName("지출 분담 설정 - 지출을 찾을 수 없음")
    void setExpenseSplits_ExpenseNotFound() {
        // given
        ExpenseSplitRequest request = ExpenseSplitRequest.builder()
                .splitType(ExpenseSplitRequest.SplitType.EQUAL)
                .splits(new ArrayList<>())
                .build();

        when(expenseRepository.findById(expenseId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> expenseService.setExpenseSplits(expenseId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Expense");

        verify(participantRepository, never()).findById(any());
        verify(expenseSplitRepository, never()).deleteByExpenseId(any());
    }

    @Test
    @DisplayName("지출 분담 설정 - 참가자를 찾을 수 없음")
    void setExpenseSplits_ParticipantNotFound() {
        // given
        ParticipantSplitRequest split1 = ParticipantSplitRequest.builder()
                .participantId(participantId)
                .share(new BigDecimal("25000"))
                .build();

        ParticipantSplitRequest split2 = ParticipantSplitRequest.builder()
                .participantId(participantId2)
                .share(new BigDecimal("25000"))
                .build();

        ExpenseSplitRequest request = ExpenseSplitRequest.builder()
                .splitType(ExpenseSplitRequest.SplitType.EQUAL)
                .splits(Arrays.asList(split1, split2))
                .build();

        when(expenseRepository.findById(expenseId)).thenReturn(Optional.of(expense));
        when(participantRepository.findById(participantId)).thenReturn(Optional.of(participant));
        when(participantRepository.findById(participantId2)).thenReturn(Optional.empty()); // participant2를 찾지 못함
        doNothing().when(expenseSplitRepository).deleteByExpenseId(expenseId);

        // when & then
        assertThatThrownBy(() -> expenseService.setExpenseSplits(expenseId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Participant");

        verify(expenseSplitRepository, times(1)).deleteByExpenseId(expenseId);
    }
}
