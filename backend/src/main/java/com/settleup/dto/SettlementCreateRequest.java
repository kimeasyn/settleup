package com.settleup.dto;

import com.settleup.domain.settlement.SettlementType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 정산 생성 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementCreateRequest {

    @NotBlank(message = "제목은 필수입니다")
    @Size(min = 1, max = 100, message = "제목은 1-100자 사이여야 합니다")
    private String title;

    @NotNull(message = "정산 유형은 필수입니다")
    private SettlementType type;

    @Size(max = 500, message = "설명은 최대 500자입니다")
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    @Size(min = 3, max = 3, message = "통화 코드는 3글자여야 합니다")
    @Pattern(regexp = "^[A-Z]{3}$", message = "통화 코드는 3글자 대문자여야 합니다 (예: KRW, USD, EUR)")
    @Schema(description = "통화 코드 (ISO 4217)", example = "KRW", defaultValue = "KRW")
    private String currency = "KRW";
}
