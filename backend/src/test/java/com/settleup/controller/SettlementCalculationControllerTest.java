package com.settleup.controller;

import com.settleup.domain.expense.Expense;
import com.settleup.domain.participant.Participant;
import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementType;
import com.settleup.repository.ExpenseRepository;
import com.settleup.repository.ParticipantRepository;
import com.settleup.repository.SettlementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * SettlementCalculation API 통합 테스트
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("정산 계산 API 통합 테스트")
class SettlementCalculationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    private Settlement settlement;
    private Participant p1, p2, p3;

    @BeforeEach
    void setUp() {
        // 정산 생성
        settlement = Settlement.builder()
                .title("제주도 여행")
                .description("2박 3일 여행")
                .type(SettlementType.TRAVEL)
                .creatorId(UUID.randomUUID())
                .currency("KRW")
                .build();
        settlement = settlementRepository.save(settlement);

        // 참가자 생성
        p1 = createAndSaveParticipant("김철수");
        p2 = createAndSaveParticipant("이영희");
        p3 = createAndSaveParticipant("박민수");

        // 지출 생성
        createAndSaveExpense(p1, new BigDecimal("30000"), "숙박비");
        createAndSaveExpense(p2, new BigDecimal("20000"), "식사비");
        createAndSaveExpense(p3, new BigDecimal("10000"), "교통비");
        // 총액: 60000원, 1인당: 20000원
    }

    private Participant createAndSaveParticipant(String name) {
        Participant participant = Participant.builder()
                .settlementId(settlement.getId())
                .name(name)
                .isActive(true)
                .build();
        return participantRepository.save(participant);
    }

    private Expense createAndSaveExpense(Participant payer, BigDecimal amount, String description) {
        Expense expense = Expense.builder()
                .settlement(settlement)
                .payer(payer)
                .amount(amount)
                .description(description)
                .expenseDate(LocalDateTime.now())
                .build();
        return expenseRepository.save(expense);
    }

    @Test
    @DisplayName("POST /settlements/{id}/calculate - 정산 계산 성공")
    void calculateSettlement_Success() throws Exception {
        mockMvc.perform(post("/settlements/{id}/calculate", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settlementId").value(settlement.getId().toString()))
                .andExpect(jsonPath("$.totalAmount").value(60000))
                .andExpect(jsonPath("$.participants").isArray())
                .andExpect(jsonPath("$.participants", hasSize(3)))
                .andExpect(jsonPath("$.transfers").isArray())
                .andExpect(jsonPath("$.calculatedAt").exists());
    }

    @Test
    @DisplayName("POST /settlements/{id}/calculate - 참가자별 잔액 확인")
    void calculateSettlement_ParticipantBalances() throws Exception {
        mockMvc.perform(post("/settlements/{id}/calculate", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                // 김철수: 30000 지출, 20000 분담 → +10000 (받을 돈)
                .andExpect(jsonPath("$.participants[?(@.participantName == '김철수')].totalPaid").value(hasItem(30000)))
                .andExpect(jsonPath("$.participants[?(@.participantName == '김철수')].shouldPay").value(hasItem(20000.00)))
                .andExpect(jsonPath("$.participants[?(@.participantName == '김철수')].balance").value(hasItem(10000.00)))
                // 이영희: 20000 지출, 20000 분담 → 0 (동일)
                .andExpect(jsonPath("$.participants[?(@.participantName == '이영희')].balance").value(hasItem(0.00)))
                // 박민수: 10000 지출, 20000 분담 → -10000 (줄 돈)
                .andExpect(jsonPath("$.participants[?(@.participantName == '박민수')].balance").value(hasItem(-10000.00)));
    }

    @Test
    @DisplayName("POST /settlements/{id}/calculate - 송금 경로 확인")
    void calculateSettlement_Transfers() throws Exception {
        mockMvc.perform(post("/settlements/{id}/calculate", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transfers", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.transfers[0].fromParticipantName").exists())
                .andExpect(jsonPath("$.transfers[0].toParticipantName").exists())
                .andExpect(jsonPath("$.transfers[0].amount").exists());
    }

    @Test
    @DisplayName("POST /settlements/{id}/calculate - 정산 없음 (404)")
    void calculateSettlement_NotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        mockMvc.perform(post("/settlements/{id}/calculate", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /settlements/{id}/calculate - 참가자 없음 (400)")
    void calculateSettlement_NoParticipants() throws Exception {
        // 새 정산 생성 (참가자 없음)
        Settlement emptySettlement = Settlement.builder()
                .title("빈 정산")
                .type(SettlementType.TRAVEL)
                .creatorId(UUID.randomUUID())
                .currency("KRW")
                .build();
        emptySettlement = settlementRepository.save(emptySettlement);

        mockMvc.perform(post("/settlements/{id}/calculate", emptySettlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("활성 참가자가 없습니다")));
    }

    @Test
    @DisplayName("POST /settlements/{id}/calculate - 지출 없음 (400)")
    void calculateSettlement_NoExpenses() throws Exception {
        // 새 정산 생성 (참가자만 있고 지출 없음)
        Settlement noExpenseSettlement = Settlement.builder()
                .title("지출 없는 정산")
                .type(SettlementType.TRAVEL)
                .creatorId(UUID.randomUUID())
                .currency("KRW")
                .build();
        noExpenseSettlement = settlementRepository.save(noExpenseSettlement);

        Participant participant = Participant.builder()
                .settlementId(noExpenseSettlement.getId())
                .name("테스트 참가자")
                .isActive(true)
                .build();
        participantRepository.save(participant);

        mockMvc.perform(post("/settlements/{id}/calculate", noExpenseSettlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("지출 내역이 없습니다")));
    }
}
