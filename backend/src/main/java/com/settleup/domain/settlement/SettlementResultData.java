package com.settleup.domain.settlement;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * 정산 결과 JSONB DTO
 * 참가자별 요약 + 송금 경로 스냅샷
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementResultData {

    private List<ParticipantSnapshot> participants;
    private List<TransferSnapshot> transfers;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParticipantSnapshot {
        private UUID participantId;
        private String participantName;
        private BigDecimal totalPaid;
        private BigDecimal shouldPay;
        private BigDecimal balance;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransferSnapshot {
        private UUID fromParticipantId;
        private String fromParticipantName;
        private UUID toParticipantId;
        private String toParticipantName;
        private BigDecimal amount;
    }
}
