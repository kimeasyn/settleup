/**
 * 게임 정산 API 서비스
 * 라운드별 금액 입출 기록 및 최종 정산 API 호출
 */

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

// API Base URL (환경에 따라 변경)
const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api'
  : 'https://your-production-api.com/api';

/**
 * API 요청 헬퍼
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

// ===== 게임 라운드 관리 API =====

/**
 * 게임 라운드 생성
 */
export const createGameRound = async (
  request: CreateGameRoundRequest
): Promise<GameRound> => {
  return apiRequest<GameRound>(`/settlements/${request.settlementId}/rounds`, {
    method: 'POST',
    body: JSON.stringify({
      title: request.title,
    }),
  });
};

/**
 * 정산의 모든 게임 라운드 조회
 */
export const getGameRounds = async (
  settlementId: string
): Promise<GameRoundWithEntries[]> => {
  return apiRequest<GameRoundWithEntries[]>(`/settlements/${settlementId}/rounds`);
};

/**
 * 특정 게임 라운드 상세 조회
 */
export const getGameRound = async (
  roundId: string
): Promise<GameRoundWithEntries> => {
  return apiRequest<GameRoundWithEntries>(`/rounds/${roundId}`);
};

/**
 * 게임 라운드 삭제
 */
export const deleteGameRound = async (roundId: string): Promise<void> => {
  return apiRequest<void>(`/rounds/${roundId}`, {
    method: 'DELETE',
  });
};

// ===== 게임 라운드 엔트리 관리 API =====

/**
 * 게임 라운드 엔트리 생성/수정
 */
export const upsertGameRoundEntry = async (
  request: CreateGameRoundEntryRequest
): Promise<GameRoundEntry> => {
  return apiRequest<GameRoundEntry>(`/rounds/${request.roundId}/entries`, {
    method: 'POST',
    body: JSON.stringify({
      participantId: request.participantId,
      amount: request.amount,
      memo: request.memo,
    }),
  });
};

/**
 * 게임 라운드의 모든 엔트리 일괄 업데이트
 */
export const updateGameRoundEntries = async (
  request: UpdateGameRoundEntriesRequest
): Promise<GameRoundWithEntries> => {
  return apiRequest<GameRoundWithEntries>(`/rounds/${request.roundId}/entries/batch`, {
    method: 'PUT',
    body: JSON.stringify({
      entries: request.entries,
    }),
  });
};

/**
 * 게임 라운드 엔트리 삭제
 */
export const deleteGameRoundEntry = async (entryId: string): Promise<void> => {
  return apiRequest<void>(`/entries/${entryId}`, {
    method: 'DELETE',
  });
};

// ===== 게임 라운드 상태 관리 API =====

/**
 * 게임 라운드 완료
 */
export const completeGameRound = async (
  request: CompleteGameRoundRequest
): Promise<GameRoundWithEntries> => {
  return apiRequest<GameRoundWithEntries>(`/rounds/${request.roundId}/complete`, {
    method: 'POST',
  });
};

/**
 * 게임 라운드 완료 취소
 */
export const uncompleteGameRound = async (roundId: string): Promise<GameRoundWithEntries> => {
  return apiRequest<GameRoundWithEntries>(`/rounds/${roundId}/uncomplete`, {
    method: 'POST',
  });
};

// ===== 게임 정산 전체 관리 API =====

/**
 * 게임 정산 전체 현황 조회
 */
export const getGameSettlementStatus = async (
  settlementId: string
): Promise<GameSettlementStatus> => {
  return apiRequest<GameSettlementStatus>(`/settlements/${settlementId}/game-status`);
};

/**
 * 게임 정산 최종 결과 계산
 */
export const calculateGameSettlementResult = async (
  settlementId: string
): Promise<GameSettlementResult> => {
  return apiRequest<GameSettlementResult>(`/settlements/${settlementId}/game-result`);
};

/**
 * 게임 정산 완료 (최종 정산 적용)
 */
export const completeGameSettlement = async (
  request: CompleteGameSettlementRequest
): Promise<GameSettlementResult> => {
  return apiRequest<GameSettlementResult>(`/settlements/${request.settlementId}/game-complete`, {
    method: 'POST',
  });
};

import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== 로컬 전용 함수 (백엔드가 준비되기 전 사용) =====

/**
 * AsyncStorage를 사용한 게임 라운드 관리 (개발용)
 */
export const localGameSettlementService = {
  /**
   * AsyncStorage에서 게임 라운드 목록 가져오기
   */
  getLocalGameRounds: async (settlementId: string): Promise<GameRoundWithEntries[]> => {
    try {
      const key = `game_rounds_${settlementId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('게임 라운드 로드 실패:', error);
      return [];
    }
  },

  /**
   * AsyncStorage에 게임 라운드 저장
   */
  saveLocalGameRounds: async (settlementId: string, rounds: GameRoundWithEntries[]): Promise<void> => {
    try {
      const key = `game_rounds_${settlementId}`;
      await AsyncStorage.setItem(key, JSON.stringify(rounds));
    } catch (error) {
      console.error('게임 라운드 저장 실패:', error);
      throw error;
    }
  },

  /**
   * 로컬에서 새 라운드 생성
   */
  createLocalRound: async (settlementId: string, title?: string): Promise<GameRound> => {
    const existingRounds = await localGameSettlementService.getLocalGameRounds(settlementId);
    const nextRoundNumber = existingRounds.length + 1;

    const newRound: GameRound = {
      id: `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      settlementId,
      roundNumber: nextRoundNumber,
      title: title || `${nextRoundNumber}라운드`,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };

    const newRoundWithEntries: GameRoundWithEntries = {
      round: newRound,
      entries: [],
      totalAmount: 0,
      isValid: false,
    };

    const updatedRounds = [...existingRounds, newRoundWithEntries];
    await localGameSettlementService.saveLocalGameRounds(settlementId, updatedRounds);

    return newRound;
  },

  /**
   * 로컬에서 라운드 엔트리 업데이트
   */
  updateLocalRoundEntries: async (
    settlementId: string,
    roundId: string,
    entries: Omit<GameRoundEntry, 'id' | 'createdAt'>[]
  ): Promise<GameRoundWithEntries> => {
    const existingRounds = await localGameSettlementService.getLocalGameRounds(settlementId);
    const roundIndex = existingRounds.findIndex(r => r.round.id === roundId);

    if (roundIndex === -1) {
      throw new Error('라운드를 찾을 수 없습니다.');
    }

    const updatedEntries: GameRoundEntry[] = entries.map(entry => ({
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    }));

    const totalAmount = updatedEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const updatedRound: GameRoundWithEntries = {
      ...existingRounds[roundIndex],
      entries: updatedEntries,
      totalAmount,
      isValid: totalAmount === 0,
    };

    const updatedRounds = [...existingRounds];
    updatedRounds[roundIndex] = updatedRound;
    await localGameSettlementService.saveLocalGameRounds(settlementId, updatedRounds);

    return updatedRound;
  },

  /**
   * 로컬에서 라운드 삭제
   */
  deleteLocalRound: async (settlementId: string, roundId: string): Promise<void> => {
    const existingRounds = await localGameSettlementService.getLocalGameRounds(settlementId);
    const filteredRounds = existingRounds.filter(r => r.round.id !== roundId);
    await localGameSettlementService.saveLocalGameRounds(settlementId, filteredRounds);
  },

  /**
   * AsyncStorage 초기화
   */
  clearLocalGameData: async (settlementId: string): Promise<void> => {
    try {
      const key = `game_rounds_${settlementId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('게임 데이터 삭제 실패:', error);
      throw error;
    }
  },
};