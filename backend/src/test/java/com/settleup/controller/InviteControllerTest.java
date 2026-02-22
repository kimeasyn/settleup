package com.settleup.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementInviteCode;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import com.settleup.domain.user.User;
import com.settleup.repository.SettlementInviteCodeRepository;
import com.settleup.repository.SettlementMemberRepository;
import com.settleup.repository.SettlementRepository;
import com.settleup.repository.UserRepository;
import com.settleup.service.SettlementMemberService;
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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * InviteController 통합 테스트
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("InviteController 통합 테스트")
class InviteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private SettlementInviteCodeRepository inviteCodeRepository;

    @Autowired
    private SettlementMemberRepository memberRepository;

    @Autowired
    private SettlementMemberService memberService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User ownerUser;
    private User joiningUser;
    private Settlement settlement;
    private SettlementInviteCode validInviteCode;

    @BeforeEach
    void setUp() {
        // 정산 생성자
        ownerUser = User.builder()
                .name("정산주인")
                .email("owner-invite@example.com")
                .build();
        ownerUser = userRepository.save(ownerUser);

        // 참가할 유저
        joiningUser = User.builder()
                .name("참가자")
                .email("joiner-invite@example.com")
                .build();
        joiningUser = userRepository.save(joiningUser);

        // 정산 생성
        settlement = Settlement.builder()
                .title("포커 게임")
                .description("주말 포커")
                .type(SettlementType.GAME)
                .status(SettlementStatus.ACTIVE)
                .creatorId(ownerUser.getId())
                .currency("KRW")
                .build();
        settlement = settlementRepository.save(settlement);

        // OWNER 멤버 생성
        memberService.createOwnerMember(settlement.getId(), ownerUser.getId());

        // 유효한 초대 코드 생성
        validInviteCode = SettlementInviteCode.builder()
                .settlementId(settlement.getId())
                .code("TEST1234")
                .createdBy(ownerUser.getId())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        validInviteCode = inviteCodeRepository.save(validInviteCode);

        // 참가할 유저로 인증 설정
        setAuthentication(joiningUser.getId());
    }

    private void setAuthentication(UUID userId) {
        var auth = new UsernamePasswordAuthenticationToken(
                userId, "", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("POST /invites/join - 초대 코드로 참가 성공")
    void joinByInviteCode_Success() throws Exception {
        // given
        Map<String, String> request = new HashMap<>();
        request.put("code", "TEST1234");

        // when & then
        mockMvc.perform(post("/invites/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.settlementId").value(settlement.getId().toString()))
                .andExpect(jsonPath("$.role").value("MEMBER"))
                .andExpect(jsonPath("$.settlementTitle").value("포커 게임"))
                .andExpect(jsonPath("$.settlementType").value("GAME"));
    }

    @Test
    @DisplayName("POST /invites/join - 여행 정산 참가 성공")
    void joinByInviteCode_TravelSettlement_Success() throws Exception {
        // given - 여행 정산 생성
        Settlement travelSettlement = Settlement.builder()
                .title("제주도 여행")
                .type(SettlementType.TRAVEL)
                .status(SettlementStatus.ACTIVE)
                .creatorId(ownerUser.getId())
                .currency("KRW")
                .build();
        travelSettlement = settlementRepository.save(travelSettlement);
        memberService.createOwnerMember(travelSettlement.getId(), ownerUser.getId());

        SettlementInviteCode travelCode = SettlementInviteCode.builder()
                .settlementId(travelSettlement.getId())
                .code("TRVL5678")
                .createdBy(ownerUser.getId())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        inviteCodeRepository.save(travelCode);

        Map<String, String> request = new HashMap<>();
        request.put("code", "TRVL5678");

        // when & then
        mockMvc.perform(post("/invites/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.settlementTitle").value("제주도 여행"))
                .andExpect(jsonPath("$.settlementType").value("TRAVEL"));
    }

    @Test
    @DisplayName("POST /invites/join - 유효하지 않은 초대 코드 (400)")
    void joinByInviteCode_InvalidCode() throws Exception {
        // given
        Map<String, String> request = new HashMap<>();
        request.put("code", "INVALID1");

        // when & then
        mockMvc.perform(post("/invites/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /invites/join - 만료된 초대 코드 (400)")
    void joinByInviteCode_ExpiredCode() throws Exception {
        // given - 만료된 코드 생성
        SettlementInviteCode expiredCode = SettlementInviteCode.builder()
                .settlementId(settlement.getId())
                .code("EXPD1234")
                .createdBy(ownerUser.getId())
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();
        inviteCodeRepository.save(expiredCode);

        Map<String, String> request = new HashMap<>();
        request.put("code", "EXPD1234");

        // when & then
        mockMvc.perform(post("/invites/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /invites/join - 이미 사용된 초대 코드 (400)")
    void joinByInviteCode_AlreadyUsedCode() throws Exception {
        // given - 이미 사용된 코드 생성
        SettlementInviteCode usedCode = SettlementInviteCode.builder()
                .settlementId(settlement.getId())
                .code("USED1234")
                .createdBy(ownerUser.getId())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .usedBy(UUID.randomUUID())
                .usedAt(LocalDateTime.now().minusHours(1))
                .build();
        inviteCodeRepository.save(usedCode);

        Map<String, String> request = new HashMap<>();
        request.put("code", "USED1234");

        // when & then
        mockMvc.perform(post("/invites/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /invites/join - 이미 멤버인 경우 (400)")
    void joinByInviteCode_AlreadyMember() throws Exception {
        // given - ownerUser로 인증 (이미 멤버)
        setAuthentication(ownerUser.getId());

        // 새 초대 코드 생성 (기존 코드는 한 번만 사용 가능)
        SettlementInviteCode anotherCode = SettlementInviteCode.builder()
                .settlementId(settlement.getId())
                .code("DUPL1234")
                .createdBy(ownerUser.getId())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        inviteCodeRepository.save(anotherCode);

        Map<String, String> request = new HashMap<>();
        request.put("code", "DUPL1234");

        // when & then
        mockMvc.perform(post("/invites/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
