package com.settleup.dto;

import com.settleup.domain.settlement.SettlementStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 정산 업데이트 요청 DTO
 * 모든 필드가 선택적(Optional)이며, 제공된 필드만 업데이트됩니다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementUpdateRequest {

    @Size(min = 1, max = 100, message = "제목은 1-100자 사이여야 합니다")
    private String title;

    @Size(max = 500, message = "설명은 최대 500자입니다")
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @Size(min = 3, max = 3, message = "통화 코드는 3글자여야 합니다")
    @Pattern(regexp = "^[A-Z]{3}$", message = "통화 코드는 3글자 대문자여야 합니다 (예: KRW, USD, EUR)")
    @Schema(description = "통화 코드 (ISO 4217)", example = "KRW")
    private String currency;

    @Schema(description = "정산 상태", example = "ACTIVE")
    private SettlementStatus status;
}
