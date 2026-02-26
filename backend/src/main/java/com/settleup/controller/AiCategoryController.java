package com.settleup.controller;

import com.settleup.dto.AiCategoryDto;
import com.settleup.service.ai.AiClassifierClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
@Tag(name = "AI Category", description = "AI 카테고리 추천 API")
public class AiCategoryController {

    private final AiClassifierClient aiClassifierClient;

    @Operation(
            summary = "AI 카테고리 예측",
            description = "지출 설명을 기반으로 AI가 카테고리를 추천합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "예측 성공"),
            @ApiResponse(responseCode = "503", description = "AI 분류 서비스 불가")
    })
    @PostMapping("/predict-category")
    public ResponseEntity<AiCategoryDto.PredictResponse> predictCategory(
            @Valid @RequestBody AiCategoryDto.PredictRequest request) {

        var result = aiClassifierClient.predictCategory(request.getDescription());
        if (result == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        var response = AiCategoryDto.PredictResponse.builder()
                .category(result.getCategory())
                .confidence(result.getConfidence())
                .build();
        return ResponseEntity.ok(response);
    }
}
