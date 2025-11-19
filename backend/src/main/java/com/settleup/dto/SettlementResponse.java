package com.settleup.dto;

import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 정산 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementResponse {

    private UUID id;
    private String title;
    private SettlementType type;
    private SettlementStatus status;
    private UUID creatorId;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String currency;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer version;

    /**
     * Entity -> DTO 변환
     */
    public static SettlementResponse from(Settlement settlement) {
        return SettlementResponse.builder()
                .id(settlement.getId())
                .title(settlement.getTitle())
                .type(settlement.getType())
                .status(settlement.getStatus())
                .creatorId(settlement.getCreatorId())
                .description(settlement.getDescription())
                .startDate(settlement.getStartDate())
                .endDate(settlement.getEndDate())
                .currency(settlement.getCurrency())
                .createdAt(settlement.getCreatedAt())
                .updatedAt(settlement.getUpdatedAt())
                .version(settlement.getVersion())
                .build();
    }
}
