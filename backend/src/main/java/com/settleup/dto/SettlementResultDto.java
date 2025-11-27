package com.settleup.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * SettlementResult DTO
 * 정산 결과 응답 DTO
 */
public class SettlementResultDto {

    /**
     * 참가자별 정산 요약
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "참가자별 정산 요약")
    public static class ParticipantSummary {

        @Schema(description = "참가자 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        private UUID participantId;

        @Schema(description = "참가자 이름", example = "김철수")
        private String participantName;

        @Schema(description = "총 지출 금액", example = "50000.00")
        private BigDecimal totalPaid;

        @Schema(description = "분담해야 할 금액", example = "30000.00")
        private BigDecimal shouldPay;

        @Schema(description = "잔액 (양수: 받을 돈, 음수: 줄 돈)", example = "20000.00")
        private BigDecimal balance;
    }

    /**
     * 송금 경로
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "송금 경로")
    public static class Transfer {

        @Schema(description = "송금자 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        private UUID fromParticipantId;

        @Schema(description = "송금자 이름", example = "김철수")
        private String fromParticipantName;

        @Schema(description = "수취자 ID", example = "660e8400-e29b-41d4-a716-446655440000")
        private UUID toParticipantId;

        @Schema(description = "수취자 이름", example = "이영희")
        private String toParticipantName;

        @Schema(description = "송금 금액", example = "10000.00")
        private BigDecimal amount;
    }

    /**
     * 정산 결과 응답
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "정산 결과 응답")
    public static class SettlementResultResponse {

        @Schema(description = "정산 ID", example = "770e8400-e29b-41d4-a716-446655440000")
        private UUID settlementId;

        @Schema(description = "총 금액", example = "100000.00")
        private BigDecimal totalAmount;

        @Schema(description = "참가자별 요약")
        private List<ParticipantSummary> participants;

        @Schema(description = "송금 경로 목록")
        private List<Transfer> transfers;

        @Schema(description = "계산 일시", example = "2025-01-15T10:30:00")
        private LocalDateTime calculatedAt;
    }
}
