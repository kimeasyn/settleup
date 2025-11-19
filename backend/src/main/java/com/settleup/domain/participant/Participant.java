package com.settleup.domain.participant;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Participant Entity
 * 정산에 참여하는 사람
 */
@Entity
@Table(
    name = "participants",
    uniqueConstraints = @UniqueConstraint(columnNames = {"settlement_id", "name"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "settlement_id", nullable = false)
    private UUID settlementId;

    @Column(name = "user_id")
    private UUID userId;  // 등록된 사용자의 경우

    @NotBlank(message = "참가자 이름은 필수입니다")
    @Size(min = 1, max = 50, message = "이름은 1-50자 사이여야 합니다")
    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }
}
