package com.settleup.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.settleup.domain.expense.Expense;
import com.settleup.domain.participant.Participant;
import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import com.settleup.domain.user.User;
import com.settleup.dto.ExpenseDto.ExpenseRequest;
import com.settleup.repository.ExpenseRepository;
import com.settleup.repository.ParticipantRepository;
import com.settleup.repository.SettlementRepository;
import com.settleup.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Expense API 통합 테스트
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Expense API 통합 테스트")
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private Settlement settlement;
    private Participant participant;
    private Expense expense;

    @BeforeEach
    void setUp() {
        // 테스트 유저 생성
        testUser = User.builder()
                .name("테스트유저")
                .email("test-expense@example.com")
                .build();
        testUser = userRepository.save(testUser);

        // SecurityContext에 테스트 유저 인증 설정
        var auth = new UsernamePasswordAuthenticationToken(
                testUser.getId(), "", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        // 테스트 정산 생성
        settlement = Settlement.builder()
                .title("제주도 여행")
                .description("2박 3일 여행")
                .type(SettlementType.TRAVEL)
                .status(SettlementStatus.ACTIVE)
                .creatorId(testUser.getId())
                .currency("KRW")
                .build();
        settlement = settlementRepository.save(settlement);

        // 테스트 참가자 생성
        participant = Participant.builder()
                .settlementId(settlement.getId())
                .name("김철수")
                .isActive(true)
                .build();
        participant = participantRepository.save(participant);

        // 테스트 지출 생성
        expense = Expense.builder()
                .settlement(settlement)
                .payer(participant)
                .amount(new BigDecimal("50000"))
                .category("식비")
                .description("저녁 식사")
                .expenseDate(LocalDateTime.now())
                .build();
        expense = expenseRepository.save(expense);
    }

    @Test
    @DisplayName("POST /settlements/{settlementId}/expenses - 지출 추가 성공")
    void createExpense_Success() throws Exception {
        // given
        ExpenseRequest request = ExpenseRequest.builder()
                .payerId(participant.getId())
                .amount(new BigDecimal("30000"))
                .category("교통비")
                .description("택시비")
                .expenseDate(LocalDateTime.now())
                .build();

        // when & then
        mockMvc.perform(post("/settlements/{settlementId}/expenses", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.settlementId").value(settlement.getId().toString()))
                .andExpect(jsonPath("$.payerId").value(participant.getId().toString()))
                .andExpect(jsonPath("$.payerName").value("김철수"))
                .andExpect(jsonPath("$.amount").value(30000))
                .andExpect(jsonPath("$.category").value("교통비"))
                .andExpect(jsonPath("$.description").value("택시비"))
                .andExpect(jsonPath("$.expenseDate").exists())
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    @DisplayName("POST /settlements/{settlementId}/expenses - 금액 없이 추가 실패 (400)")
    void createExpense_WithoutAmount_BadRequest() throws Exception {
        // given
        ExpenseRequest request = ExpenseRequest.builder()
                .payerId(participant.getId())
                // amount 없음
                .description("택시비")
                .expenseDate(LocalDateTime.now())
                .build();

        // when & then
        mockMvc.perform(post("/settlements/{settlementId}/expenses", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /settlements/{settlementId}/expenses - 음수 금액으로 추가 실패 (400)")
    void createExpense_NegativeAmount_BadRequest() throws Exception {
        // given
        ExpenseRequest request = ExpenseRequest.builder()
                .payerId(participant.getId())
                .amount(new BigDecimal("-1000")) // 음수
                .description("택시비")
                .expenseDate(LocalDateTime.now())
                .build();

        // when & then
        mockMvc.perform(post("/settlements/{settlementId}/expenses", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /settlements/{settlementId}/expenses - 존재하지 않는 정산에 지출 추가 (404)")
    void createExpense_SettlementNotFound() throws Exception {
        // given
        UUID nonExistentId = UUID.randomUUID();
        ExpenseRequest request = ExpenseRequest.builder()
                .payerId(participant.getId())
                .amount(new BigDecimal("30000"))
                .description("택시비")
                .expenseDate(LocalDateTime.now())
                .build();

        // when & then
        mockMvc.perform(post("/settlements/{settlementId}/expenses", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /settlements/{settlementId}/expenses - 존재하지 않는 참가자로 지출 추가 (404)")
    void createExpense_ParticipantNotFound() throws Exception {
        // given
        UUID nonExistentParticipantId = UUID.randomUUID();
        ExpenseRequest request = ExpenseRequest.builder()
                .payerId(nonExistentParticipantId)
                .amount(new BigDecimal("30000"))
                .description("택시비")
                .expenseDate(LocalDateTime.now())
                .build();

        // when & then
        mockMvc.perform(post("/settlements/{settlementId}/expenses", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /settlements/{settlementId}/expenses - 지출 목록 조회 성공")
    void getExpenses_Success() throws Exception {
        // given - 추가 지출 생성
        Expense expense2 = Expense.builder()
                .settlement(settlement)
                .payer(participant)
                .amount(new BigDecimal("20000"))
                .category("식비")
                .description("점심 식사")
                .expenseDate(LocalDateTime.now())
                .build();
        expenseRepository.save(expense2);

        // when & then
        mockMvc.perform(get("/settlements/{settlementId}/expenses", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].description").exists())
                .andExpect(jsonPath("$[0].amount").exists())
                .andExpect(jsonPath("$[0].payerName").value("김철수"))
                .andExpect(jsonPath("$[1].description").exists());
    }

    @Test
    @DisplayName("GET /settlements/{settlementId}/expenses - 지출이 없는 정산 조회")
    void getExpenses_EmptyList() throws Exception {
        // given - 지출이 없는 새 정산 생성
        Settlement emptySettlement = Settlement.builder()
                .title("빈 정산")
                .type(SettlementType.GAME)
                .status(SettlementStatus.ACTIVE)
                .creatorId(testUser.getId())
                .currency("KRW")
                .build();
        emptySettlement = settlementRepository.save(emptySettlement);

        // when & then
        mockMvc.perform(get("/settlements/{settlementId}/expenses", emptySettlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /settlements/{settlementId}/expenses - 존재하지 않는 정산의 지출 조회 (404)")
    void getExpenses_SettlementNotFound() throws Exception {
        // given
        UUID nonExistentId = UUID.randomUUID();

        // when & then
        mockMvc.perform(get("/settlements/{settlementId}/expenses", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /settlements/{settlementId}/expenses/{expenseId} - 지출 단건 조회 성공")
    void getExpense_Success() throws Exception {
        // when & then
        mockMvc.perform(get("/settlements/{settlementId}/expenses/{expenseId}",
                        settlement.getId(), expense.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(expense.getId().toString()))
                .andExpect(jsonPath("$.settlementId").value(settlement.getId().toString()))
                .andExpect(jsonPath("$.payerId").value(participant.getId().toString()))
                .andExpect(jsonPath("$.payerName").value("김철수"))
                .andExpect(jsonPath("$.amount").value(50000))
                .andExpect(jsonPath("$.category").value("식비"))
                .andExpect(jsonPath("$.description").value("저녁 식사"));
    }

    @Test
    @DisplayName("GET /settlements/{settlementId}/expenses/{expenseId} - 존재하지 않는 지출 조회 (404)")
    void getExpense_NotFound() throws Exception {
        // given
        UUID nonExistentExpenseId = UUID.randomUUID();

        // when & then
        mockMvc.perform(get("/settlements/{settlementId}/expenses/{expenseId}",
                        settlement.getId(), nonExistentExpenseId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /settlements/{settlementId}/expenses/{expenseId} - 지출 삭제 성공")
    void deleteExpense_Success() throws Exception {
        // given
        Expense toDelete = Expense.builder()
                .settlement(settlement)
                .payer(participant)
                .amount(new BigDecimal("10000"))
                .description("삭제할 지출")
                .expenseDate(LocalDateTime.now())
                .build();
        toDelete = expenseRepository.save(toDelete);

        // when & then
        mockMvc.perform(delete("/settlements/{settlementId}/expenses/{expenseId}",
                        settlement.getId(), toDelete.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        // 삭제 확인
        mockMvc.perform(get("/settlements/{settlementId}/expenses/{expenseId}",
                        settlement.getId(), toDelete.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /settlements/{settlementId}/expenses/{expenseId} - 존재하지 않는 지출 삭제 (404)")
    void deleteExpense_NotFound() throws Exception {
        // given
        UUID nonExistentExpenseId = UUID.randomUUID();

        // when & then
        mockMvc.perform(delete("/settlements/{settlementId}/expenses/{expenseId}",
                        settlement.getId(), nonExistentExpenseId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
