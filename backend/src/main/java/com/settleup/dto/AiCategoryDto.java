package com.settleup.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class AiCategoryDto {

    @Getter
    @Setter
    public static class PredictRequest {
        @NotBlank(message = "설명은 필수입니다")
        private String description;
    }

    @Getter
    @Setter
    @Builder
    public static class PredictResponse {
        private String category;
        private Double confidence;
    }

    @Getter
    @Setter
    public static class ClassifierResponse {
        private String description;
        private String category;
        private Double confidence;
    }
}
