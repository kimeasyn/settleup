package com.settleup.domain.expense;

import com.settleup.domain.participant.Participant;
import com.settleup.domain.settlement.Settlement;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Expense Entity
 * 지출 내역
 */
@Entity
@Table(name = "expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false)
    @NotNull(message = "정산 ID는 필수입니다")
    private Settlement settlement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id", nullable = false)
    @NotNull(message = "지출자는 필수입니다")
    private Participant payer;

    @Column(nullable = false, precision = 12, scale = 2)
    @NotNull(message = "금액은 필수입니다")
    @Positive(message = "금액은 0보다 커야 합니다")
    private BigDecimal amount;

    @Column(length = 50)
    @Size(max = 50, message = "카테고리는 최대 50자입니다")
    private String category;

    @Column(name = "category_ai", length = 50)
    @Size(max = 50, message = "AI 카테고리는 최대 50자입니다")
    private String categoryAi;

    @Column(nullable = false, length = 200)
    @NotBlank(message = "지출 설명은 필수입니다")
    @Size(min = 1, max = 200, message = "지출 설명은 1-200자 사이여야 합니다")
    private String description;

    @Column(name = "expense_date", nullable = false)
    @NotNull(message = "지출 날짜는 필수입니다")
    private LocalDateTime expenseDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    @Builder.Default
    private Integer version = 0;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 카테고리 설정 (사용자 지정 우선, 없으면 AI 추천)
     */
    public String getEffectiveCategory() {
        return category != null ? category : categoryAi;
    }

    /**
     * AI 카테고리 추천 적용
     */
    public void applyAiCategory(String aiCategory) {
        if (this.category == null) {
            this.categoryAi = aiCategory;
        }
    }
}
