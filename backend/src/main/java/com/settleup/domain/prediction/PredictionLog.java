package com.settleup.domain.prediction;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PredictionLog Entity
 * AI 예측 로그 (재학습 데이터용)
 */
@Entity
@Table(name = "prediction_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 200)
    @NotBlank
    @Size(max = 200)
    private String description;

    @Column(name = "predicted_category", length = 50)
    @Size(max = 50)
    private String predictedCategory;

    @Column(name = "predicted_confidence")
    private Double predictedConfidence;

    @Column(name = "final_category", nullable = false, length = 50)
    @NotBlank
    @Size(max = 50)
    private String finalCategory;

    @Column(nullable = false, length = 20)
    @NotBlank
    @Size(max = 20)
    private String source;

    @Column(name = "user_id", nullable = false)
    @NotNull
    private UUID userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
