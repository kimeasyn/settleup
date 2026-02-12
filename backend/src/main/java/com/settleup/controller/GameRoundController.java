package com.settleup.controller;

import com.settleup.dto.GameRoundDto.*;
import com.settleup.service.GameRoundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Game Rounds", description = "게임 정산 라운드 관리 API")
public class GameRoundController {

    private final GameRoundService gameRoundService;

    @Operation(summary = "게임 라운드 목록 조회", description = "정산에 속한 모든 게임 라운드와 엔트리를 조회합니다.")
    @GetMapping("/settlements/{settlementId}/game-rounds")
    public ResponseEntity<List<GameRoundWithEntriesResponse>> getGameRounds(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId) {
        log.info("GET /settlements/{}/game-rounds", settlementId);
        List<GameRoundWithEntriesResponse> rounds = gameRoundService.getGameRounds(settlementId);
        return ResponseEntity.ok(rounds);
    }

    @Operation(summary = "게임 라운드 생성", description = "새로운 게임 라운드를 생성합니다.")
    @PostMapping("/settlements/{settlementId}/game-rounds")
    public ResponseEntity<GameRoundResponse> createGameRound(
            @Parameter(description = "정산 ID", required = true)
            @PathVariable UUID settlementId,
            @RequestBody(required = false) CreateGameRoundRequest request) {
        log.info("POST /settlements/{}/game-rounds", settlementId);
        GameRoundResponse response = gameRoundService.createGameRound(settlementId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "라운드 엔트리 일괄 업데이트", description = "라운드의 엔트리를 일괄 교체합니다.")
    @PutMapping("/game-rounds/{roundId}/entries")
    public ResponseEntity<GameRoundWithEntriesResponse> updateRoundEntries(
            @Parameter(description = "라운드 ID", required = true)
            @PathVariable UUID roundId,
            @RequestBody UpdateEntriesRequest request) {
        log.info("PUT /game-rounds/{}/entries", roundId);
        GameRoundWithEntriesResponse response = gameRoundService.updateRoundEntries(roundId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게임 라운드 삭제", description = "게임 라운드와 관련 엔트리를 삭제합니다.")
    @DeleteMapping("/game-rounds/{roundId}")
    public ResponseEntity<Void> deleteGameRound(
            @Parameter(description = "라운드 ID", required = true)
            @PathVariable UUID roundId) {
        log.info("DELETE /game-rounds/{}", roundId);
        gameRoundService.deleteGameRound(roundId);
        return ResponseEntity.noContent().build();
    }
}
