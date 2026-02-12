package com.settleup.domain.settlement;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Settlement Entity
 * 여행 정산 또는 게임 정산 세션
 */
@Entity
@Table(name = "settlements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotBlank(message = "제목은 필수입니다")
    @Size(min = 1, max = 100, message = "제목은 1-100자 사이여야 합니다")
    @Column(nullable = false, length = 100)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SettlementType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SettlementStatus status = SettlementStatus.ACTIVE;

    @Column(name = "creator_id", nullable = false)
    private UUID creatorId;

    @Size(max = 500, message = "설명은 최대 500자입니다")
    @Column(length = 500)
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "KRW";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    @Builder.Default
    private Integer version = 0;

    @Column(name = "sync_status", nullable = false, length = 20)
    @Builder.Default
    private String syncStatus = "SYNCED";

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = SettlementStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 종료일이 시작일 이후인지 검증
     */
    public void validateDates() {
        if (endDate != null && startDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("종료일은 시작일 이후여야 합니다");
        }
    }
}
