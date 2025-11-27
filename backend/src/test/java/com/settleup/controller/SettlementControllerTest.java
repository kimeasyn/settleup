package com.settleup.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import com.settleup.dto.SettlementCreateRequest;
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

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Settlement API 통합 테스트
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Settlement API 통합 테스트")
class SettlementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Settlement settlement;

    @BeforeEach
    void setUp() {
        // 테스트 정산 생성
        settlement = Settlement.builder()
                .title("제주도 여행")
                .description("2박 3일 여행")
                .type(SettlementType.TRAVEL)
                .status(SettlementStatus.ACTIVE)
                .creatorId(UUID.randomUUID())
                .currency("KRW")
                .startDate(LocalDate.of(2025, 1, 15))
                .endDate(LocalDate.of(2025, 1, 17))
                .build();
        settlement = settlementRepository.save(settlement);
    }

    @Test
    @DisplayName("POST /settlements - 정산 생성 성공")
    void createSettlement_Success() throws Exception {
        // given
        SettlementCreateRequest request = SettlementCreateRequest.builder()
                .title("부산 여행")
                .description("1박 2일 여행")
                .type(SettlementType.TRAVEL)
                .currency("KRW")
                .startDate(LocalDate.of(2025, 2, 1))
                .endDate(LocalDate.of(2025, 2, 2))
                .build();

        // when & then
        mockMvc.perform(post("/settlements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("부산 여행"))
                .andExpect(jsonPath("$.description").value("1박 2일 여행"))
                .andExpect(jsonPath("$.type").value("TRAVEL"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.currency").value("KRW"))
                .andExpect(jsonPath("$.creatorId").exists())
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    @DisplayName("POST /settlements - 제목 없이 생성 실패 (400)")
    void createSettlement_WithoutTitle_BadRequest() throws Exception {
        // given
        SettlementCreateRequest request = SettlementCreateRequest.builder()
                .title("") // 빈 제목
                .type(SettlementType.TRAVEL)
                .build();

        // when & then
        mockMvc.perform(post("/settlements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /settlements - 정산 유형 없이 생성 실패 (400)")
    void createSettlement_WithoutType_BadRequest() throws Exception {
        // given
        SettlementCreateRequest request = SettlementCreateRequest.builder()
                .title("테스트 정산")
                // type 없음
                .build();

        // when & then
        mockMvc.perform(post("/settlements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /settlements - 정산 목록 조회 성공")
    void getAllSettlements_Success() throws Exception {
        // when & then
        mockMvc.perform(get("/settlements")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].title").exists())
                .andExpect(jsonPath("$[0].type").exists());
    }

    @Test
    @DisplayName("GET /settlements/{id} - 정산 조회 성공")
    void getSettlement_Success() throws Exception {
        // when & then
        mockMvc.perform(get("/settlements/{id}", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(settlement.getId().toString()))
                .andExpect(jsonPath("$.title").value("제주도 여행"))
                .andExpect(jsonPath("$.description").value("2박 3일 여행"))
                .andExpect(jsonPath("$.type").value("TRAVEL"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.currency").value("KRW"));
    }

    @Test
    @DisplayName("GET /settlements/{id} - 존재하지 않는 정산 조회 (404)")
    void getSettlement_NotFound() throws Exception {
        // given
        UUID nonExistentId = UUID.randomUUID();

        // when & then
        mockMvc.perform(get("/settlements/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /settlements/{id} - 정산 삭제 성공")
    void deleteSettlement_Success() throws Exception {
        // given
        Settlement toDelete = Settlement.builder()
                .title("삭제할 정산")
                .type(SettlementType.GAME)
                .status(SettlementStatus.ACTIVE)
                .creatorId(UUID.randomUUID())
                .currency("KRW")
                .build();
        toDelete = settlementRepository.save(toDelete);

        // when & then
        mockMvc.perform(delete("/settlements/{id}", toDelete.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        // 삭제 확인
        mockMvc.perform(get("/settlements/{id}", toDelete.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /settlements/{id} - 존재하지 않는 정산 삭제 (404)")
    void deleteSettlement_NotFound() throws Exception {
        // given
        UUID nonExistentId = UUID.randomUUID();

        // when & then
        mockMvc.perform(delete("/settlements/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
