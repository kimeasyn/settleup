package com.settleup.domain.game;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "game_round_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRoundEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    @Column(name = "participant_id", nullable = false)
    private UUID participantId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    @NotNull(message = "금액은 필수입니다")
    private BigDecimal amount;

    @Column(name = "memo", length = 500)
    private String memo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
