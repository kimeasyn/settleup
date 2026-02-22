package com.settleup.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import com.settleup.domain.user.User;
import com.settleup.dto.SettlementCreateRequest;
import com.settleup.dto.SettlementUpdateRequest;
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

import java.time.LocalDate;
import java.util.List;
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
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private Settlement settlement;

    @BeforeEach
    void setUp() {
        // 테스트 유저 생성 (settlements.creator_id FK 제약 조건 충족)
        testUser = User.builder()
                .name("테스트유저")
                .email("test-settlement@example.com")
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
                .startDate(LocalDate.of(2025, 1, 15))
                .endDate(LocalDate.of(2025, 1, 17))
                .build();
        settlement = settlementRepository.save(settlement);

        // SecurityContext에 테스트 유저 인증 설정
        var auth = new UsernamePasswordAuthenticationToken(
                testUser.getId(), "", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
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
    @DisplayName("PUT /settlements/{id} - 정산 업데이트 성공")
    void updateSettlement_Success() throws Exception {
        // given
        SettlementUpdateRequest request = SettlementUpdateRequest.builder()
                .title("제주도 여행 (수정)")
                .description("3박 4일 여행으로 변경")
                .startDate(LocalDate.of(2025, 1, 15))
                .endDate(LocalDate.of(2025, 1, 18))
                .status(SettlementStatus.COMPLETED)
                .currency("USD")
                .build();

        // when & then
        mockMvc.perform(put("/settlements/{id}", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(settlement.getId().toString()))
                .andExpect(jsonPath("$.title").value("제주도 여행 (수정)"))
                .andExpect(jsonPath("$.description").value("3박 4일 여행으로 변경"))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.startDate").value("2025-01-15"))
                .andExpect(jsonPath("$.endDate").value("2025-01-18"));
    }

    @Test
    @DisplayName("PUT /settlements/{id} - 부분 업데이트 성공 (제목만)")
    void updateSettlement_PartialUpdate_Success() throws Exception {
        // given
        SettlementUpdateRequest request = SettlementUpdateRequest.builder()
                .title("새로운 제목")
                .build();

        // when & then
        mockMvc.perform(put("/settlements/{id}", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(settlement.getId().toString()))
                .andExpect(jsonPath("$.title").value("새로운 제목"))
                .andExpect(jsonPath("$.description").value("2박 3일 여행")) // 기존 값 유지
                .andExpect(jsonPath("$.status").value("ACTIVE")); // 기존 값 유지
    }

    @Test
    @DisplayName("PUT /settlements/{id} - 상태만 업데이트 성공")
    void updateSettlement_StatusOnly_Success() throws Exception {
        // given
        SettlementUpdateRequest request = SettlementUpdateRequest.builder()
                .status(SettlementStatus.ARCHIVED)
                .build();

        // when & then
        mockMvc.perform(put("/settlements/{id}", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(settlement.getId().toString()))
                .andExpect(jsonPath("$.title").value("제주도 여행")) // 기존 값 유지
                .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    @Test
    @DisplayName("PUT /settlements/{id} - 존재하지 않는 정산 업데이트 (404)")
    void updateSettlement_NotFound() throws Exception {
        // given
        UUID nonExistentId = UUID.randomUUID();
        SettlementUpdateRequest request = SettlementUpdateRequest.builder()
                .title("새 제목")
                .build();

        // when & then
        mockMvc.perform(put("/settlements/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /settlements/{id} - 잘못된 통화 코드 (400)")
    void updateSettlement_InvalidCurrency_BadRequest() throws Exception {
        // given
        SettlementUpdateRequest request = SettlementUpdateRequest.builder()
                .currency("INVALID") // 3글자 초과
                .build();

        // when & then
        mockMvc.perform(put("/settlements/{id}", settlement.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /settlements/{id} - 정산 삭제 성공")
    void deleteSettlement_Success() throws Exception {
        // given
        Settlement toDelete = Settlement.builder()
                .title("삭제할 정산")
                .type(SettlementType.GAME)
                .status(SettlementStatus.ACTIVE)
                .creatorId(testUser.getId())
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

    @Test
    @DisplayName("GET /settlements/search - 검색어로 조회 성공")
    void searchSettlements_ByQuery_Success() throws Exception {
        // given - 검색용 추가 정산 생성
        Settlement settlement2 = Settlement.builder()
                .title("제주도 가족여행")
                .description("여름 휴가")
                .type(SettlementType.TRAVEL)
                .status(SettlementStatus.ACTIVE)
                .creatorId(testUser.getId())
                .currency("KRW")
                .build();
        settlementRepository.save(settlement2);

        Settlement settlement3 = Settlement.builder()
                .title("서울 게임모임")
                .type(SettlementType.GAME)
                .status(SettlementStatus.ACTIVE)
                .creatorId(testUser.getId())
                .currency("KRW")
                .build();
        settlementRepository.save(settlement3);

        // when & then - "제주" 검색
        mockMvc.perform(get("/settlements/search")
                        .param("query", "제주")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.number").value(0));
    }

    @Test
    @DisplayName("GET /settlements/search - 타입 필터 조회 성공")
    void searchSettlements_ByType_Success() throws Exception {
        // given - 게임 정산 추가
        Settlement gameSettlement = Settlement.builder()
                .title("보드게임 정산")
                .type(SettlementType.GAME)
                .status(SettlementStatus.ACTIVE)
                .creatorId(testUser.getId())
                .currency("KRW")
                .build();
        settlementRepository.save(gameSettlement);

        // when & then - GAME 타입 필터
        mockMvc.perform(get("/settlements/search")
                        .param("type", "GAME")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[*].type", everyItem(is("GAME"))));
    }

    @Test
    @DisplayName("GET /settlements/search - 결과 없음")
    void searchSettlements_NoResults() throws Exception {
        // when & then - 존재하지 않는 검색어
        mockMvc.perform(get("/settlements/search")
                        .param("query", "존재하지않는정산명XYZ")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }
}
