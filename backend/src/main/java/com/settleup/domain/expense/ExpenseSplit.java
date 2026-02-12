package com.settleup.domain.expense;

import com.settleup.domain.participant.Participant;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * ExpenseSplit Entity
 * 지출 분담 내역
 */
@Entity
@Table(name = "expense_splits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    @NotNull(message = "지출 ID는 필수입니다")
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    @NotNull(message = "참가자 ID는 필수입니다")
    private Participant participant;

    @Column(nullable = false, precision = 12, scale = 2)
    @NotNull(message = "분담 금액은 필수입니다")
    @PositiveOrZero(message = "분담 금액은 0 이상이어야 합니다")
    private BigDecimal share;

    /**
     * 분담 비율 계산 (전체 지출 대비)
     */
    public BigDecimal getSharePercentage() {
        if (expense == null || expense.getAmount() == null) {
            return BigDecimal.ZERO;
        }

        if (expense.getAmount().compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return share.divide(expense.getAmount(), 4, java.math.RoundingMode.HALF_UP)
                   .multiply(BigDecimal.valueOf(100));
    }

    /**
     * 분담 금액이 유효한지 확인
     */
    public boolean isValidShare() {
        if (expense == null || share == null) {
            return false;
        }
        // 분담 금액이 전체 지출 금액을 초과하지 않는지 확인
        return share.compareTo(expense.getAmount()) <= 0;
    }
}
