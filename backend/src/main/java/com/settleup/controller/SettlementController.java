package com.settleup.controller;

import com.settleup.dto.ParticipantDto.ParticipantRequest;
import com.settleup.dto.ParticipantDto.ParticipantResponse;
import com.settleup.dto.SettlementCreateRequest;
import com.settleup.dto.SettlementResponse;
import com.settleup.dto.SettlementResultDto.SettlementResultResponse;
import com.settleup.exception.ErrorResponse;
import com.settleup.service.ParticipantService;
import com.settleup.service.SettlementService;
import com.settleup.service.SettlementCalculationService;
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
 * Settlement Controller
 * 정산 REST API
 */
@Slf4j
@RestController
@RequestMapping("/settlements")
@RequiredArgsConstructor
@Tag(name = "Settlements", description = "정산 관리 API")
public class SettlementController {

    private final SettlementService settlementService;
    private final ParticipantService participantService;
    private final SettlementCalculationService settlementCalculationService;

    /**
     * 정산 생성
     * POST /api/v1/settlements
     */
    @Operation(
            summary = "정산 생성",
            description = "새로운 여행 정산 또는 게임 정산을 생성합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "정산 생성 성공",
                    content = @Content(schema = @Schema(implementation = SettlementResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (유효성 검증 실패)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<SettlementResponse> createSettlement(
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "정산 생성 요청 정보",
                    required = true
            )
            SettlementCreateRequest request) {

        log.info("POST /settlements - Creating settlement: {}", request.getTitle());

        // TODO: 실제로는 인증된 사용자 ID를 사용
        // 현재는 테스트용으로 샘플 사용자 ID 사용
        UUID creatorId = UUID.fromString("00000000-0000-0000-0000-000000000001");

        SettlementResponse response = settlementService.createSettlement(request, creatorId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 모든 정산 목록 조회
     * GET /api/v1/settlements
     */
    @Operation(
            summary = "정산 목록 조회",
            description = "모든 정산 목록을 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공"
            )
    })
    @GetMapping
    public ResponseEntity<List<SettlementResponse>> getAllSettlements() {
        log.info("GET /settlements - Getting all settlements");

        List<SettlementResponse> settlements = settlementService.getAllSettlements();

        return ResponseEntity.ok(settlements);
    }

    /**
     * 정산 조회
     * GET /api/v1/settlements/{id}
     */
    @Operation(
            summary = "정산 조회",
            description = "ID로 특정 정산의 상세 정보를 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = SettlementResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "정산을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<SettlementResponse> getSettlement(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID id) {
        log.info("GET /settlements/{} - Getting settlement", id);

        SettlementResponse response = settlementService.getSettlement(id);

        return ResponseEntity.ok(response);
    }

    /**
     * 정산 삭제
     * DELETE /api/v1/settlements/{id}
     */
    @Operation(
            summary = "정산 삭제",
            description = "ID로 특정 정산을 삭제합니다. 관련된 모든 데이터도 함께 삭제됩니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "삭제 성공"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "정산을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSettlement(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID id) {
        log.info("DELETE /settlements/{} - Deleting settlement", id);

        settlementService.deleteSettlement(id);

        return ResponseEntity.noContent().build();
    }

    /**
     * 참가자 추가
     * POST /api/v1/settlements/{id}/participants
     */
    @Operation(
            summary = "참가자 추가",
            description = "정산에 새로운 참가자를 추가합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "참가자 추가 성공",
                    content = @Content(schema = @Schema(implementation = ParticipantResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (이미 존재하는 이름 등)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "정산을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping("/{id}/participants")
    public ResponseEntity<ParticipantResponse> addParticipant(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID id,
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "참가자 정보",
                    required = true
            )
            ParticipantRequest request) {

        log.info("POST /settlements/{}/participants - Adding participant: {}",
                id, request.getName());

        ParticipantResponse response = participantService.addParticipant(id, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 참가자 목록 조회
     * GET /api/v1/settlements/{id}/participants
     */
    @Operation(
            summary = "참가자 목록 조회",
            description = "정산의 모든 참가자 목록을 조회합니다."
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
    @GetMapping("/{id}/participants")
    public ResponseEntity<List<ParticipantResponse>> getParticipants(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID id) {

        log.info("GET /settlements/{}/participants - Getting participants", id);

        List<ParticipantResponse> participants = participantService.getParticipantsBySettlement(id);

        return ResponseEntity.ok(participants);
    }

    /**
     * 정산 계산
     * POST /api/v1/settlements/{id}/calculate
     */
    @Operation(
            summary = "정산 계산",
            description = "정산의 모든 지출을 기반으로 참가자 간 정산 결과를 계산합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "계산 성공",
                    content = @Content(schema = @Schema(implementation = SettlementResultResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (참가자 또는 지출 없음)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "정산을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping("/{id}/calculate")
    public ResponseEntity<SettlementResultResponse> calculateSettlement(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID id) {

        log.info("POST /settlements/{}/calculate - Calculating settlement", id);

        SettlementResultResponse response = settlementCalculationService.calculateSettlement(id);

        return ResponseEntity.ok(response);
    }

    /**
     * Health Check
     * GET /api/v1/settlements/health
     */
    @Operation(
            summary = "헬스 체크",
            description = "서버 상태를 확인합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "서버 정상 작동 중"
    )
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("SettleUp Backend is running!");
    }
}
