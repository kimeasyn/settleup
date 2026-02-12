package com.settleup.dto;

import com.settleup.domain.participant.Participant;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Participant DTO
 * 참가자 요청/응답 DTO
 */
public class ParticipantDto {

    /**
     * 참가자 추가 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "참가자 추가 요청")
    public static class ParticipantRequest {

        @Schema(description = "참가자 이름", example = "김철수", required = true)
        @NotBlank(message = "참가자 이름은 필수입니다")
        @Size(min = 1, max = 50, message = "이름은 1-50자 사이여야 합니다")
        private String name;

        @Schema(description = "등록된 사용자 ID (선택)", example = "550e8400-e29b-41d4-a716-446655440000")
        private UUID userId;
    }

    /**
     * 참가자 응답
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "참가자 응답")
    public static class ParticipantResponse {

        @Schema(description = "참가자 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        private UUID id;

        @Schema(description = "정산 ID", example = "660e8400-e29b-41d4-a716-446655440000")
        private UUID settlementId;

        @Schema(description = "사용자 ID (등록된 사용자인 경우)", example = "770e8400-e29b-41d4-a716-446655440000")
        private UUID userId;

        @Schema(description = "참가자 이름", example = "김철수")
        private String name;

        @Schema(description = "활성 상태", example = "true")
        private Boolean isActive;

        @Schema(description = "참가 일시", example = "2025-01-15T10:30:00")
        private LocalDateTime joinedAt;

        /**
         * Entity -> Response DTO 변환
         */
        public static ParticipantResponse from(Participant participant) {
            return ParticipantResponse.builder()
                    .id(participant.getId())
                    .settlementId(participant.getSettlementId())
                    .userId(participant.getUserId())
                    .name(participant.getName())
                    .isActive(participant.getIsActive())
                    .joinedAt(participant.getJoinedAt())
                    .build();
        }
    }

    /**
     * 참가자 활성/비활성 토글 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "참가자 활성/비활성 토글 요청")
    public static class ParticipantToggleRequest {

        @Schema(description = "활성 상태", example = "true", required = true)
        private Boolean isActive;
    }
}
