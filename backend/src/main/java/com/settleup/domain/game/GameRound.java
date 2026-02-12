package com.settleup.domain.game;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "game_rounds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRound {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "settlement_id", nullable = false)
    private UUID settlementId;

    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    @Column(name = "title", length = 100)
    private String title;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(name = "excluded_participant_ids", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String excludedParticipantIds = "[]";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public List<UUID> getExcludedParticipantIdList() {
        if (excludedParticipantIds == null || excludedParticipantIds.isBlank()) {
            return Collections.emptyList();
        }
        try {
            List<String> ids = objectMapper.readValue(excludedParticipantIds, new TypeReference<>() {});
            return ids.stream().map(UUID::fromString).toList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public void setExcludedParticipantIdList(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            this.excludedParticipantIds = "[]";
            return;
        }
        try {
            List<String> stringIds = ids.stream().map(UUID::toString).toList();
            this.excludedParticipantIds = objectMapper.writeValueAsString(stringIds);
        } catch (Exception e) {
            this.excludedParticipantIds = "[]";
        }
    }
}
