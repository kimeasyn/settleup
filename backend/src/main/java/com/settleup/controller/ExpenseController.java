package com.settleup.controller;

import com.settleup.dto.ExpenseDto.*;
import com.settleup.exception.ErrorResponse;
import com.settleup.service.ExpenseService;
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
 * Expense Controller
 * 지출 REST API
 */
@Slf4j
@RestController
@RequestMapping("/settlements/{settlementId}/expenses")
@RequiredArgsConstructor
@Tag(name = "Expenses", description = "지출 관리 API")
public class ExpenseController {

    private final ExpenseService expenseService;

    /**
     * 지출 추가
     * POST /api/v1/settlements/{settlementId}/expenses
     */
    @Operation(
            summary = "지출 추가",
            description = "정산에 새로운 지출 내역을 추가합니다. 지출자와 분담 내역을 함께 등록합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "지출 추가 성공",
                    content = @Content(schema = @Schema(implementation = ExpenseResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (분담 금액 불일치 등)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "정산 또는 참가자를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "지출 정보",
                    required = true
            )
            ExpenseRequest request) {

        log.info("POST /settlements/{}/expenses - Creating expense: {}",
                settlementId, request.getDescription());

        ExpenseResponse response = expenseService.createExpense(settlementId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 지출 목록 조회
     * GET /api/v1/settlements/{settlementId}/expenses
     */
    @Operation(
            summary = "지출 목록 조회",
            description = "정산의 모든 지출 내역을 조회합니다 (최신순)."
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
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId) {

        log.info("GET /settlements/{}/expenses - Getting expenses", settlementId);

        List<ExpenseResponse> expenses = expenseService.getExpensesBySettlement(settlementId);

        return ResponseEntity.ok(expenses);
    }

    /**
     * 지출 단건 조회
     * GET /api/v1/settlements/{settlementId}/expenses/{expenseId}
     */
    @Operation(
            summary = "지출 단건 조회",
            description = "특정 지출의 상세 정보를 조회합니다 (분담 내역 포함)."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ExpenseResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "지출을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponse> getExpense(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @Parameter(description = "지출 ID", required = true)
            @PathVariable UUID expenseId) {

        log.info("GET /settlements/{}/expenses/{} - Getting expense", settlementId, expenseId);

        ExpenseResponse response = expenseService.getExpense(expenseId);

        return ResponseEntity.ok(response);
    }

    /**
     * 지출 수정
     * PUT /api/v1/settlements/{settlementId}/expenses/{expenseId}
     */
    @Operation(
            summary = "지출 수정",
            description = "지출 내역을 수정합니다. 분담 내역도 함께 수정할 수 있습니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "수정 성공",
                    content = @Content(schema = @Schema(implementation = ExpenseResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "지출을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PutMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @Parameter(description = "지출 ID", required = true)
            @PathVariable UUID expenseId,
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "수정할 지출 정보",
                    required = true
            )
            ExpenseUpdateRequest request) {

        log.info("PUT /settlements/{}/expenses/{} - Updating expense", settlementId, expenseId);

        ExpenseResponse response = expenseService.updateExpense(expenseId, request);

        return ResponseEntity.ok(response);
    }

    /**
     * 지출 삭제
     * DELETE /api/v1/settlements/{settlementId}/expenses/{expenseId}
     */
    @Operation(
            summary = "지출 삭제",
            description = "지출 내역을 삭제합니다. 관련 분담 내역도 함께 삭제됩니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "삭제 성공"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "지출을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @Parameter(description = "지출 ID", required = true)
            @PathVariable UUID expenseId) {

        log.info("DELETE /settlements/{}/expenses/{} - Deleting expense", settlementId, expenseId);

        expenseService.deleteExpense(expenseId);

        return ResponseEntity.noContent().build();
    }

    /**
     * 카테고리별 지출 조회
     * GET /api/v1/settlements/{settlementId}/expenses/by-category
     */
    @Operation(
            summary = "카테고리별 지출 조회",
            description = "특정 카테고리의 지출 내역만 조회합니다."
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
    @GetMapping("/by-category")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByCategory(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @Parameter(description = "카테고리", required = true, example = "식비")
            @RequestParam String category) {

        log.info("GET /settlements/{}/expenses/by-category?category={} - Getting expenses by category",
                settlementId, category);

        List<ExpenseResponse> expenses = expenseService.getExpensesByCategory(settlementId, category);

        return ResponseEntity.ok(expenses);
    }
}
