package com.settleup.controller;

import com.settleup.dto.SettlementCreateRequest;
import com.settleup.dto.SettlementResponse;
import com.settleup.dto.SettlementResultDto.SettlementResultResponse;
import com.settleup.dto.SettlementUpdateRequest;
import com.settleup.exception.ErrorResponse;
import com.settleup.service.SettlementService;
import com.settleup.service.SettlementCalculationService;
import com.settleup.service.SettlementResultService;
import com.settleup.service.SettlementMemberService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import org.springframework.data.domain.Page;

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
    private final SettlementCalculationService settlementCalculationService;
    private final SettlementResultService settlementResultService;
    private final SettlementMemberService settlementMemberService;

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
            SettlementCreateRequest request,
            @AuthenticationPrincipal UUID userId) {

        log.info("POST /settlements - Creating settlement: {}", request.getTitle());

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        SettlementResponse response = settlementService.createSettlement(request, userId);
        settlementMemberService.createOwnerMember(response.getId(), userId);

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
    public ResponseEntity<List<SettlementResponse>> getAllSettlements(
            @AuthenticationPrincipal UUID userId) {
        log.info("GET /settlements - Getting settlements for user: {}", userId);

        List<SettlementResponse> settlements = settlementService.getAllSettlements(userId);

        return ResponseEntity.ok(settlements);
    }

    /**
     * 정산 검색 및 필터링 (페이징)
     * GET /api/v1/settlements/search
     */
    @Operation(
            summary = "정산 검색 및 필터링",
            description = "제목/설명으로 검색하고 상태/타입으로 필터링된 정산 목록을 페이징으로 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "검색 성공"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 파라미터",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/search")
    public ResponseEntity<Page<SettlementResponse>> searchSettlements(
            @AuthenticationPrincipal UUID userId,
            @Parameter(description = "검색어 (제목 또는 설명)", example = "제주도")
            @RequestParam(required = false) String query,
            @Parameter(description = "정산 상태", example = "ACTIVE")
            @RequestParam(required = false) SettlementStatus status,
            @Parameter(description = "정산 타입", example = "TRAVEL")
            @RequestParam(required = false) SettlementType type,
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기", example = "20")
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /settlements/search - userId={}, query='{}', status={}, type={}, page={}, size={}",
                userId, query, status, type, page, size);

        Page<SettlementResponse> settlements = settlementService.searchSettlements(
                userId, query, status, type, page, size);

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
     * 정산 업데이트
     * PUT /api/v1/settlements/{id}
     */
    @Operation(
            summary = "정산 업데이트",
            description = "ID로 특정 정산의 정보를 업데이트합니다. 제공된 필드만 업데이트됩니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "업데이트 성공",
                    content = @Content(schema = @Schema(implementation = SettlementResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (유효성 검증 실패)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "정산을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PutMapping("/{id}")
    public ResponseEntity<SettlementResponse> updateSettlement(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID id,
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "정산 업데이트 요청 정보",
                    required = true
            )
            SettlementUpdateRequest request) {
        log.info("PUT /settlements/{} - Updating settlement", id);

        SettlementResponse response = settlementService.updateSettlement(id, request);

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
            @PathVariable UUID id,
            @Parameter(description = "나머지 지불 참가자 ID (선택)", required = false)
            @RequestParam(required = false) UUID remainderPayerId,
            @Parameter(description = "추가 부담 금액 (선택)", required = false)
            @RequestParam(required = false) BigDecimal remainderAmount,
            @Parameter(description = "결과를 DB에 저장 여부 (선택)", required = false)
            @RequestParam(required = false, defaultValue = "false") boolean save) {

        log.info("POST /settlements/{}/calculate - Calculating settlement (remainderPayerId: {}, remainderAmount: {}, save: {})",
                id, remainderPayerId, remainderAmount, save);

        SettlementResultResponse response = settlementCalculationService.calculateSettlement(id, remainderPayerId, remainderAmount);

        if (save) {
            settlementResultService.saveResult(response);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 최신 저장된 정산 결과 조회
     * GET /api/v1/settlements/{id}/results/latest
     */
    @Operation(
            summary = "최신 저장된 정산 결과 조회",
            description = "DB에 저장된 가장 최근 정산 결과를 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = SettlementResultResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "저장된 결과 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{id}/results/latest")
    public ResponseEntity<SettlementResultResponse> getLatestResult(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID id) {
        log.info("GET /settlements/{}/results/latest - Getting latest result", id);

        SettlementResultResponse response = settlementResultService.getLatestResult(id);

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
