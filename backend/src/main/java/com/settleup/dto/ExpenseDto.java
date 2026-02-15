package com.settleup.dto;

import com.settleup.domain.expense.Expense;
import com.settleup.domain.expense.ExpenseSplit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Expense DTO
 * 지출 요청/응답 DTO
 */
public class ExpenseDto {

    /**
     * 지출 생성 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "지출 생성 요청")
    public static class ExpenseRequest {

        @Schema(description = "지출자 ID", example = "550e8400-e29b-41d4-a716-446655440000", required = true)
        @NotNull(message = "지출자 ID는 필수입니다")
        private UUID payerId;

        @Schema(description = "지출 금액", example = "50000", required = true)
        @NotNull(message = "금액은 필수입니다")
        @Positive(message = "금액은 0보다 커야 합니다")
        @DecimalMax(value = "100000000", message = "금액은 1억 원 이하여야 합니다")
        private BigDecimal amount;

        @Schema(description = "카테고리 (선택)", example = "식비")
        @Size(max = 50, message = "카테고리는 최대 50자입니다")
        private String category;

        @Schema(description = "지출 설명", example = "저녁 식사", required = true)
        @NotBlank(message = "지출 설명은 필수입니다")
        @Size(min = 1, max = 200, message = "지출 설명은 1-200자 사이여야 합니다")
        private String description;

        @Schema(description = "지출 날짜", example = "2025-01-15T18:30:00", required = true)
        @NotNull(message = "지출 날짜는 필수입니다")
        private LocalDateTime expenseDate;

        @Schema(description = "지출 분담 내역 (선택사항, 나중에 정산 계산 시 지정 가능)", required = false)
        @Valid
        private List<ExpenseSplitRequest> splits;
    }

    /**
     * 지출 수정 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "지출 수정 요청")
    public static class ExpenseUpdateRequest {

        @Schema(description = "지출 금액", example = "50000")
        @Positive(message = "금액은 0보다 커야 합니다")
        @DecimalMax(value = "100000000", message = "금액은 1억 원 이하여야 합니다")
        private BigDecimal amount;

        @Schema(description = "카테고리", example = "식비")
        @Size(max = 50, message = "카테고리는 최대 50자입니다")
        private String category;

        @Schema(description = "지출 설명", example = "저녁 식사")
        @Size(min = 1, max = 200, message = "지출 설명은 1-200자 사이여야 합니다")
        private String description;

        @Schema(description = "지출 날짜", example = "2025-01-15T18:30:00")
        private LocalDateTime expenseDate;

    }


    /**
     * 지출 응답
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "지출 응답")
    public static class ExpenseResponse {

        @Schema(description = "지출 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        private UUID id;

        @Schema(description = "정산 ID", example = "660e8400-e29b-41d4-a716-446655440000")
        private UUID settlementId;

        @Schema(description = "지출자 ID", example = "770e8400-e29b-41d4-a716-446655440000")
        private UUID payerId;

        @Schema(description = "지출자 이름", example = "김철수")
        private String payerName;

        @Schema(description = "지출 금액", example = "50000")
        private BigDecimal amount;

        @Schema(description = "카테고리", example = "식비")
        private String category;

        @Schema(description = "AI 추천 카테고리", example = "음식점")
        private String categoryAi;

        @Schema(description = "유효 카테고리 (사용자 지정 우선)", example = "식비")
        private String effectiveCategory;

        @Schema(description = "지출 설명", example = "저녁 식사")
        private String description;

        @Schema(description = "지출 날짜", example = "2025-01-15T18:30:00")
        private LocalDateTime expenseDate;

        @Schema(description = "생성 일시", example = "2025-01-15T18:30:00")
        private LocalDateTime createdAt;

        @Schema(description = "수정 일시", example = "2025-01-15T18:30:00")
        private LocalDateTime updatedAt;

        @Schema(description = "지출 분담 내역")
        private List<ExpenseSplitResponse> splits;

        /**
         * Entity -> Response DTO 변환
         */
        public static ExpenseResponse from(Expense expense) {
            return ExpenseResponse.builder()
                    .id(expense.getId())
                    .settlementId(expense.getSettlement().getId())
                    .payerId(expense.getPayer().getId())
                    .payerName(expense.getPayer().getName())
                    .amount(expense.getAmount())
                    .category(expense.getCategory())
                    .categoryAi(expense.getCategoryAi())
                    .effectiveCategory(expense.getEffectiveCategory())
                    .description(expense.getDescription())
                    .expenseDate(expense.getExpenseDate())
                    .createdAt(expense.getCreatedAt())
                    .updatedAt(expense.getUpdatedAt())
                    .build();
        }

        /**
         * Entity -> Response DTO 변환 (분담 내역 포함)
         */
        public static ExpenseResponse fromWithSplits(Expense expense, List<ExpenseSplit> splits) {
            ExpenseResponse response = from(expense);
            response.setSplits(
                splits.stream()
                    .map(ExpenseSplitResponse::from)
                    .collect(Collectors.toList())
            );
            return response;
        }
    }

    /**
     * 지출 분담 응답
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "지출 분담 응답")
    public static class ExpenseSplitResponse {

        @Schema(description = "분담 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        private UUID id;

        @Schema(description = "지출 ID", example = "660e8400-e29b-41d4-a716-446655440000")
        private UUID expenseId;

        @Schema(description = "참가자 ID", example = "770e8400-e29b-41d4-a716-446655440000")
        private UUID participantId;

        @Schema(description = "참가자 이름", example = "김철수")
        private String participantName;

        @Schema(description = "분담 금액", example = "16666.67")
        private BigDecimal share;

        @Schema(description = "분담 비율 (%)", example = "33.33")
        private BigDecimal sharePercentage;

        /**
         * Entity -> Response DTO 변환
         */
        public static ExpenseSplitResponse from(ExpenseSplit split) {
            return ExpenseSplitResponse.builder()
                    .id(split.getId())
                    .expenseId(split.getExpense().getId())
                    .participantId(split.getParticipant().getId())
                    .participantName(split.getParticipant().getName())
                    .share(split.getShare())
                    .sharePercentage(split.getSharePercentage())
                    .build();
        }
    }

    /**
     * 지출 분담 설정 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "지출 분담 설정 요청")
    public static class ExpenseSplitRequest {

        @Schema(description = "분담 방식", example = "MANUAL", required = true,
                allowableValues = {"EQUAL", "MANUAL"})
        @NotNull(message = "분담 방식은 필수입니다")
        private SplitType splitType;

        @Schema(description = "참가자별 분담 금액 목록")
        @Valid
        @NotEmpty(message = "분담 내역은 최소 1개 이상이어야 합니다")
        private List<ParticipantSplitRequest> splits;

        /**
         * 분담 방식
         */
        public enum SplitType {
            EQUAL,  // 균등 분할
            MANUAL  // 수동 입력
        }

        /**
         * 참가자별 분담 금액 요청
         */
        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        @Schema(description = "참가자별 분담 금액 요청")
        public static class ParticipantSplitRequest {

            @Schema(description = "참가자 ID", example = "550e8400-e29b-41d4-a716-446655440000", required = true)
            @NotNull(message = "참가자 ID는 필수입니다")
            private UUID participantId;

            @Schema(description = "분담 금액", example = "16666.67", required = true)
            @NotNull(message = "분담 금액은 필수입니다")
            @PositiveOrZero(message = "분담 금액은 0 이상이어야 합니다")
            private BigDecimal share;
        }
    }
}
