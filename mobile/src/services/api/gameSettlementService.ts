/**
 * 게임 정산 API 서비스
 * 라운드별 금액 입출 기록 및 최종 정산 API 호출
 */

import { apiClient } from './client';
import {
  GameRound,
  GameRoundEntry,
  GameRoundWithEntries,
  GameSettlementStatus,
  GameSettlementResult,
  CreateGameRoundRequest,
  CreateGameRoundEntryRequest,
  UpdateGameRoundEntriesRequest,
  CompleteGameRoundRequest,
  CompleteGameSettlementRequest,
} from '../../models/GameSettlement';

// ===== 게임 라운드 관리 API =====

/**
 * 게임 라운드 생성
 */
export const createGameRound = async (
  request: CreateGameRoundRequest
): Promise<GameRound> => {
  const response = await apiClient.post<GameRound>(
    `/settlements/${request.settlementId}/game-rounds`,
    { title: request.title }
  );
  return response.data;
};

/**
 * 정산의 모든 게임 라운드 조회
 */
export const getGameRounds = async (
  settlementId: string
): Promise<GameRoundWithEntries[]> => {
  const response = await apiClient.get<GameRoundWithEntries[]>(
    `/settlements/${settlementId}/game-rounds`
  );
  return response.data;
};

/**
 * 게임 라운드 삭제
 */
export const deleteGameRound = async (roundId: string): Promise<void> => {
  await apiClient.delete(`/game-rounds/${roundId}`);
};

// ===== 게임 라운드 엔트리 관리 API =====

/**
 * 게임 라운드 엔트리 생성/수정
 */
export const upsertGameRoundEntry = async (
  request: CreateGameRoundEntryRequest
): Promise<GameRoundEntry> => {
  const response = await apiClient.post<GameRoundEntry>(
    `/game-rounds/${request.roundId}/entries`,
    {
      participantId: request.participantId,
      amount: request.amount,
      memo: request.memo,
    }
  );
  return response.data;
};

/**
 * 게임 라운드의 모든 엔트리 일괄 업데이트
 */
export const updateGameRoundEntries = async (
  request: UpdateGameRoundEntriesRequest
): Promise<GameRoundWithEntries> => {
  const response = await apiClient.put<GameRoundWithEntries>(
    `/game-rounds/${request.roundId}/entries`,
    { entries: request.entries }
  );
  return response.data;
};

/**
 * 게임 라운드 엔트리 삭제
 */
export const deleteGameRoundEntry = async (entryId: string): Promise<void> => {
  await apiClient.delete(`/game-rounds/entries/${entryId}`);
};

// ===== 게임 라운드 상태 관리 API =====

/**
 * 게임 라운드 완료
 */
export const completeGameRound = async (
  request: CompleteGameRoundRequest
): Promise<GameRoundWithEntries> => {
  const response = await apiClient.post<GameRoundWithEntries>(
    `/game-rounds/${request.roundId}/complete`
  );
  return response.data;
};

/**
 * 게임 라운드 완료 취소
 */
export const uncompleteGameRound = async (roundId: string): Promise<GameRoundWithEntries> => {
  const response = await apiClient.post<GameRoundWithEntries>(
    `/game-rounds/${roundId}/uncomplete`
  );
  return response.data;
};

// ===== 게임 정산 전체 관리 API =====

/**
 * 게임 정산 전체 현황 조회
 */
export const getGameSettlementStatus = async (
  settlementId: string
): Promise<GameSettlementStatus> => {
  const response = await apiClient.get<GameSettlementStatus>(
    `/settlements/${settlementId}/game-status`
  );
  return response.data;
};

/**
 * 게임 정산 최종 결과 계산
 */
export const calculateGameSettlementResult = async (
  settlementId: string
): Promise<GameSettlementResult> => {
  const response = await apiClient.get<GameSettlementResult>(
    `/settlements/${settlementId}/game-result`
  );
  return response.data;
};

/**
 * 게임 정산 완료 (최종 정산 적용)
 */
export const completeGameSettlement = async (
  request: CompleteGameSettlementRequest
): Promise<GameSettlementResult> => {
  const response = await apiClient.post<GameSettlementResult>(
    `/settlements/${request.settlementId}/game-complete`
  );
  return response.data;
};

// ===== 서버 API 기반 게임 정산 서비스 =====

/**
 * 게임 정산 서비스 (서버 API 호출)
 * 기존 localGameSettlementService와 동일한 인터페이스 유지
 */
export const localGameSettlementService = {
  /**
   * 게임 라운드 목록 가져오기
   */
  getLocalGameRounds: async (settlementId: string): Promise<GameRoundWithEntries[]> => {
    try {
      const response = await apiClient.get<GameRoundWithEntries[]>(
        `/settlements/${settlementId}/game-rounds`
      );
      return response.data;
    } catch (error) {
      console.error('게임 라운드 로드 실패:', error);
      return [];
    }
  },

  /**
   * 새 라운드 생성
   */
  createLocalRound: async (settlementId: string, title?: string): Promise<GameRound> => {
    const response = await apiClient.post<GameRound>(
      `/settlements/${settlementId}/game-rounds`,
      { title }
    );
    return response.data;
  },

  /**
   * 라운드 엔트리 업데이트
   */
  updateLocalRoundEntries: async (
    settlementId: string,
    roundId: string,
    entries: Omit<GameRoundEntry, 'id' | 'createdAt'>[],
    excludedParticipantIds?: string[]
  ): Promise<GameRoundWithEntries> => {
    const response = await apiClient.put<GameRoundWithEntries>(
      `/game-rounds/${roundId}/entries`,
      {
        entries: entries.map(e => ({
          participantId: e.participantId,
          amount: e.amount,
          memo: e.memo,
        })),
        excludedParticipantIds,
      }
    );
    return response.data;
  },

  /**
   * 라운드 삭제
   */
  deleteLocalRound: async (settlementId: string, roundId: string): Promise<void> => {
    await apiClient.delete(`/game-rounds/${roundId}`);
  },

  /**
   * 게임 데이터 초기화 (서버에서 settlement 삭제 시 cascade 처리)
   */
  clearLocalGameData: async (settlementId: string): Promise<void> => {
    // 서버에서 settlement 삭제 시 FK cascade로 자동 처리
  },
};
