package com.settleup.controller;

import com.settleup.domain.settlement.SettlementInviteCode;
import com.settleup.domain.settlement.SettlementMember;
import com.settleup.service.SettlementMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/settlements/{settlementId}/members")
@RequiredArgsConstructor
@Tag(name = "Settlement Members", description = "정산 멤버 및 초대 관리 API")
public class SettlementMemberController {

    private final SettlementMemberService memberService;

    @Operation(summary = "정산 멤버 목록 조회")
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMembers(
            @PathVariable UUID settlementId,
            @AuthenticationPrincipal UUID userId) {
        log.info("GET /settlements/{}/members", settlementId);

        List<SettlementMember> members = memberService.getMembers(settlementId);
        List<Map<String, Object>> response = members.stream()
                .map(m -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", m.getId());
                    map.put("settlementId", m.getSettlementId());
                    map.put("userId", m.getUserId());
                    map.put("role", m.getRole().name());
                    map.put("joinedAt", m.getJoinedAt());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "초대 코드 생성")
    @PostMapping("/invite")
    public ResponseEntity<Map<String, Object>> generateInviteCode(
            @PathVariable UUID settlementId,
            @AuthenticationPrincipal UUID userId) {
        log.info("POST /settlements/{}/members/invite - userId={}", settlementId, userId);

        SettlementInviteCode inviteCode = memberService.generateInviteCode(settlementId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("code", inviteCode.getCode());
        response.put("expiresAt", inviteCode.getExpiresAt());
        response.put("settlementId", inviteCode.getSettlementId());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "초대 코드로 참가")
    @PostMapping("/join")
    public ResponseEntity<Map<String, Object>> joinByInviteCode(
            @PathVariable UUID settlementId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UUID userId) {

        String code = request.get("code");
        log.info("POST /settlements/{}/members/join - code={}, userId={}", settlementId, code, userId);

        SettlementMember member = memberService.joinByInviteCode(code, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("id", member.getId());
        response.put("settlementId", member.getSettlementId());
        response.put("userId", member.getUserId());
        response.put("role", member.getRole().name());
        response.put("joinedAt", member.getJoinedAt());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
