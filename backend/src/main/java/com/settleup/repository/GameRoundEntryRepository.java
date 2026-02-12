package com.settleup.repository;

import com.settleup.domain.game.GameRoundEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameRoundEntryRepository extends JpaRepository<GameRoundEntry, UUID> {

    List<GameRoundEntry> findByRoundId(UUID roundId);

    List<GameRoundEntry> findByRoundIdIn(List<UUID> roundIds);

    void deleteByRoundId(UUID roundId);

    void deleteByRoundIdIn(List<UUID> roundIds);
}
