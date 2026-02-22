package com.settleup.controller;

import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementMember;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.SettlementRepository;
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
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/invites")
@RequiredArgsConstructor
@Tag(name = "Invites", description = "초대 코드 API")
public class InviteController {

    private final SettlementMemberService memberService;
    private final SettlementRepository settlementRepository;

    @Operation(summary = "초대 코드로 정산 참가")
    @PostMapping("/join")
    public ResponseEntity<Map<String, Object>> joinByInviteCode(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UUID userId) {

        String code = request.get("code");
        log.info("POST /invites/join - code={}, userId={}", code, userId);

        SettlementMember member = memberService.joinByInviteCode(code, userId);

        Settlement settlement = settlementRepository.findById(member.getSettlementId())
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", member.getSettlementId()));

        Map<String, Object> response = new HashMap<>();
        response.put("id", member.getId());
        response.put("settlementId", member.getSettlementId());
        response.put("role", member.getRole().name());
        response.put("settlementTitle", settlement.getTitle());
        response.put("settlementType", settlement.getType().name());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
