package com.settleup.controller;

import com.settleup.dto.ParticipantDto.*;
import com.settleup.exception.ErrorResponse;
import com.settleup.service.ParticipantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Participant Controller
 * 참가자 REST API
 */
@Slf4j
@RestController
@RequestMapping("/settlements/{settlementId}/participants")
@RequiredArgsConstructor
@Tag(name = "Participants", description = "참가자 관리 API")
public class ParticipantController {

    private final ParticipantService participantService;

    /**
     * 참가자 추가
     * POST /api/v1/settlements/{settlementId}/participants
     */
    @Operation(
            summary = "참가자 추가",
            description = "정산에 새로운 참가자를 추가합니다. 같은 정산 내에서 이름은 고유해야 합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "참가자 추가 성공",
                    content = @Content(schema = @Schema(implementation = ParticipantResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (중복된 이름 등)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "정산을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<ParticipantResponse> addParticipant(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "참가자 정보",
                    required = true
            )
            ParticipantRequest request) {

        log.info("POST /settlements/{}/participants - Adding participant: {}",
                settlementId, request.getName());

        ParticipantResponse response = participantService.addParticipant(settlementId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 참가자 목록 조회
     * GET /api/v1/settlements/{settlementId}/participants
     */
    @Operation(
            summary = "참가자 목록 조회",
            description = "정산의 모든 참가자를 조회합니다 (활성/비활성 포함)."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "정산을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping
    public ResponseEntity<List<ParticipantResponse>> getParticipants(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId) {

        log.info("GET /settlements/{}/participants - Getting participants", settlementId);

        List<ParticipantResponse> participants = participantService.getParticipantsBySettlement(settlementId);

        return ResponseEntity.ok(participants);
    }

    /**
     * 참가자 단건 조회
     * GET /api/v1/settlements/{settlementId}/participants/{participantId}
     */
    @Operation(
            summary = "참가자 단건 조회",
            description = "특정 참가자의 상세 정보를 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ParticipantResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "참가자를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{participantId}")
    public ResponseEntity<ParticipantResponse> getParticipant(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @Parameter(description = "참가자 ID", required = true)
            @PathVariable UUID participantId) {

        log.info("GET /settlements/{}/participants/{} - Getting participant", settlementId, participantId);

        ParticipantResponse response = participantService.getParticipant(participantId);

        return ResponseEntity.ok(response);
    }

    /**
     * 참가자 활성/비활성 토글
     * PATCH /api/v1/settlements/{settlementId}/participants/{participantId}/toggle
     */
    @Operation(
            summary = "참가자 활성/비활성 토글",
            description = "참가자의 활성 상태를 변경합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "상태 변경 성공",
                    content = @Content(schema = @Schema(implementation = ParticipantResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "참가자를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PatchMapping("/{participantId}/toggle")
    public ResponseEntity<ParticipantResponse> toggleParticipantStatus(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @Parameter(description = "참가자 ID", required = true)
            @PathVariable UUID participantId,
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "활성/비활성 상태",
                    required = true
            )
            ParticipantToggleRequest request) {

        log.info("PATCH /settlements/{}/participants/{}/toggle - Toggling status: {}",
                settlementId, participantId, request.getIsActive());

        ParticipantResponse response = participantService.toggleParticipantStatus(
                participantId, request.getIsActive());

        return ResponseEntity.ok(response);
    }

    /**
     * 참가자 삭제
     * DELETE /api/v1/settlements/{settlementId}/participants/{participantId}
     */
    @Operation(
            summary = "참가자 삭제",
            description = "참가자를 삭제합니다. 지출 내역에 참조되는 참가자는 삭제할 수 없습니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "삭제 성공"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "참가자를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @DeleteMapping("/{participantId}")
    public ResponseEntity<Void> deleteParticipant(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @Parameter(description = "참가자 ID", required = true)
            @PathVariable UUID participantId) {

        log.info("DELETE /settlements/{}/participants/{} - Deleting participant", settlementId, participantId);

        participantService.deleteParticipant(participantId);

        return ResponseEntity.noContent().build();
    }
}
