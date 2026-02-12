package com.settleup.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.settleup.domain.participant.Participant;
import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import com.settleup.domain.user.User;
import com.settleup.dto.ParticipantDto.ParticipantRequest;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Participant API 통합 테스트
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Participant API 통합 테스트")
class ParticipantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private Settlement settlement;
    private Participant participant;

    @BeforeEach
    void setUp() {
        // 테스트 유저 생성
        testUser = User.builder()
                .name("테스트유저")
                .email("test-participant@example.com")
                .build();
        testUser = userRepository.save(testUser);

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
    }

    @Test
    @DisplayName("POST /settlements/{id}/participants - 참가자 추가 성공")
    void addParticipant_Success() throws Exception {
        // given
        ParticipantRequest request = ParticipantRequest.builder()
                .name("이영희")
                .userId(null)
                .build();

        // when & then
        mockMvc.perform(post("/settlements/{id}/participants", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.settlementId").value(settlement.getId().toString()))
                .andExpect(jsonPath("$.name").value("이영희"))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.joinedAt").exists());
    }

    @Test
    @DisplayName("POST /settlements/{id}/participants - 중복된 이름으로 추가 실패 (400)")
    void addParticipant_DuplicateName_BadRequest() throws Exception {
        // given - 이미 "김철수" 참가자가 존재
        ParticipantRequest request = ParticipantRequest.builder()
                .name("김철수") // 중복된 이름
                .build();

        // when & then
        mockMvc.perform(post("/settlements/{id}/participants", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("이미")))
                .andExpect(jsonPath("$.message").value(containsString("김철수")));
    }

    @Test
    @DisplayName("POST /settlements/{id}/participants - 이름 없이 추가 실패 (400)")
    void addParticipant_WithoutName_BadRequest() throws Exception {
        // given
        ParticipantRequest request = ParticipantRequest.builder()
                .name("") // 빈 이름
                .build();

        // when & then
        mockMvc.perform(post("/settlements/{id}/participants", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /settlements/{id}/participants - 존재하지 않는 정산에 참가자 추가 (404)")
    void addParticipant_SettlementNotFound() throws Exception {
        // given
        UUID nonExistentId = UUID.randomUUID();
        ParticipantRequest request = ParticipantRequest.builder()
                .name("박민수")
                .build();

        // when & then
        mockMvc.perform(post("/settlements/{id}/participants", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /settlements/{id}/participants - 참가자 목록 조회 성공")
    void getParticipants_Success() throws Exception {
        // given - 추가 참가자 생성
        Participant participant2 = Participant.builder()
                .settlementId(settlement.getId())
                .name("이영희")
                .isActive(true)
                .build();
        participantRepository.save(participant2);

        // when & then
        mockMvc.perform(get("/settlements/{id}/participants", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].settlementId").value(settlement.getId().toString()))
                .andExpect(jsonPath("$[0].isActive").exists())
                .andExpect(jsonPath("$[1].name").exists());
    }

    @Test
    @DisplayName("GET /settlements/{id}/participants - 참가자가 없는 정산 조회")
    void getParticipants_EmptyList() throws Exception {
        // given - 참가자가 없는 새 정산 생성
        Settlement emptySettlement = Settlement.builder()
                .title("빈 정산")
                .type(SettlementType.GAME)
                .status(SettlementStatus.ACTIVE)
                .creatorId(testUser.getId())
                .currency("KRW")
                .build();
        emptySettlement = settlementRepository.save(emptySettlement);

        // when & then
        mockMvc.perform(get("/settlements/{id}/participants", emptySettlement.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /settlements/{id}/participants - 존재하지 않는 정산의 참가자 조회 (404)")
    void getParticipants_SettlementNotFound() throws Exception {
        // given
        UUID nonExistentId = UUID.randomUUID();

        // when & then
        mockMvc.perform(get("/settlements/{id}/participants", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
