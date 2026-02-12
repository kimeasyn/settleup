package com.settleup.dto;

import com.settleup.domain.game.GameRound;
import com.settleup.domain.game.GameRoundEntry;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class GameRoundDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "게임 라운드 생성 요청")
    public static class CreateGameRoundRequest {

        @Schema(description = "라운드 제목 (선택)", example = "1라운드")
        private String title;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "라운드 엔트리 일괄 업데이트 요청")
    public static class UpdateEntriesRequest {

        @Schema(description = "참가자별 엔트리 목록", required = true)
        private List<EntryData> entries;

        @Schema(description = "제외된 참가자 ID 목록")
        private List<UUID> excludedParticipantIds;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "엔트리 데이터")
    public static class EntryData {

        @Schema(description = "참가자 ID", required = true)
        private UUID participantId;

        @Schema(description = "금액 (+: 딴 돈, -: 잃은 돈)", required = true)
        private BigDecimal amount;

        @Schema(description = "메모")
        private String memo;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "게임 라운드 응답")
    public static class GameRoundResponse {

        @Schema(description = "라운드 ID")
        private UUID id;

        @Schema(description = "정산 ID")
        private UUID settlementId;

        @Schema(description = "라운드 번호")
        private Integer roundNumber;

        @Schema(description = "라운드 제목")
        private String title;

        @Schema(description = "생성 일시")
        private LocalDateTime createdAt;

        @Schema(description = "완료 여부")
        private Boolean isCompleted;

        public static GameRoundResponse from(GameRound round) {
            return GameRoundResponse.builder()
                    .id(round.getId())
                    .settlementId(round.getSettlementId())
                    .roundNumber(round.getRoundNumber())
                    .title(round.getTitle())
                    .createdAt(round.getCreatedAt())
                    .isCompleted(round.getIsCompleted())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "게임 라운드 엔트리 응답")
    public static class GameRoundEntryResponse {

        @Schema(description = "엔트리 ID")
        private UUID id;

        @Schema(description = "라운드 ID")
        private UUID roundId;

        @Schema(description = "참가자 ID")
        private UUID participantId;

        @Schema(description = "참가자 이름")
        private String participantName;

        @Schema(description = "금액")
        private BigDecimal amount;

        @Schema(description = "메모")
        private String memo;

        @Schema(description = "생성 일시")
        private LocalDateTime createdAt;

        public static GameRoundEntryResponse from(GameRoundEntry entry, String participantName) {
            return GameRoundEntryResponse.builder()
                    .id(entry.getId())
                    .roundId(entry.getRoundId())
                    .participantId(entry.getParticipantId())
                    .participantName(participantName)
                    .amount(entry.getAmount())
                    .memo(entry.getMemo())
                    .createdAt(entry.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "게임 라운드 상세 응답 (엔트리 포함)")
    public static class GameRoundWithEntriesResponse {

        @Schema(description = "라운드 기본 정보")
        private GameRoundResponse round;

        @Schema(description = "엔트리 목록")
        private List<GameRoundEntryResponse> entries;

        @Schema(description = "라운드 총 금액")
        private BigDecimal totalAmount;

        @Schema(description = "유효 여부 (총합이 0인지)")
        private Boolean isValid;

        @Schema(description = "제외된 참가자 ID 목록")
        private List<String> excludedParticipantIds;

        public static GameRoundWithEntriesResponse from(
                GameRound round,
                List<GameRoundEntry> entries,
                Map<UUID, String> participantNames) {

            List<GameRoundEntryResponse> entryResponses = entries.stream()
                    .map(e -> GameRoundEntryResponse.from(e, participantNames.getOrDefault(e.getParticipantId(), "Unknown")))
                    .toList();

            BigDecimal total = entries.stream()
                    .map(GameRoundEntry::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<String> excludedIds = round.getExcludedParticipantIdList().stream()
                    .map(UUID::toString)
                    .toList();

            return GameRoundWithEntriesResponse.builder()
                    .round(GameRoundResponse.from(round))
                    .entries(entryResponses)
                    .totalAmount(total)
                    .isValid(total.compareTo(BigDecimal.ZERO) == 0)
                    .excludedParticipantIds(excludedIds)
                    .build();
        }
    }
}
