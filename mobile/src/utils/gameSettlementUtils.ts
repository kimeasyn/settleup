/**
 * 게임 정산 유틸리티 함수
 * 라운드별 금액 계산, 검증, 최종 정산 로직
 */

import {
  GameRoundWithEntries,
  GameRoundEntry,
  ParticipantGameStatus,
  GameSettlementResult,
  SettlementTransaction,
  RoundValidationResult,
  GameStatistics,
} from '../models/GameSettlement';
import { Participant } from '../models/Participant';

/**
 * 라운드 유효성 검사
 * 모든 참가자가 엔트리를 가지고 있고, 총합이 0인지 확인
 */
export const validateRound = (
  roundEntries: GameRoundEntry[],
  participants: Participant[],
  excludedParticipantIds: string[] = []
): RoundValidationResult => {
  // 총합 계산
  const totalAmount = roundEntries.reduce((sum, entry) => sum + entry.amount, 0);

  // 참가자별 엔트리 확인 (제외된 참가자는 누락 체크에서 제외)
  const excludedSet = new Set(excludedParticipantIds);
  const entryParticipantIds = new Set(roundEntries.map(entry => entry.participantId));
  const missingParticipants = participants
    .filter(p => p.isActive && !excludedSet.has(p.id) && !entryParticipantIds.has(p.id))
    .map(p => p.name);

  // 검증 결과
  const isValid = totalAmount === 0 && missingParticipants.length === 0;

  let errorMessage: string | undefined;
  if (totalAmount !== 0) {
    errorMessage = `총합이 ${totalAmount}원입니다. 0원이어야 합니다.`;
  } else if (missingParticipants.length > 0) {
    errorMessage = `${missingParticipants.join(', ')} 참가자의 금액이 입력되지 않았습니다.`;
  }

  return {
    isValid,
    totalAmount,
    errorMessage,
    missingParticipants,
  };
};

/**
 * 참가자별 게임 누적 현황 계산
 */
export const calculateParticipantGameStatus = (
  participants: Participant[],
  allRounds: GameRoundWithEntries[]
): ParticipantGameStatus[] => {
  return participants
    .filter(p => p.isActive)
    .map(participant => {
      // 해당 참가자의 모든 엔트리 찾기 (제외된 라운드 제외)
      const participantEntries: GameRoundEntry[] = [];
      allRounds.forEach(round => {
        const excludedSet = new Set(round.excludedParticipantIds || []);
        if (excludedSet.has(participant.id)) return;
        const entry = round.entries.find(e => e.participantId === participant.id);
        if (entry) {
          participantEntries.push(entry);
        }
      });

      // 누적 금액 계산
      const totalAmount = participantEntries.reduce((sum, entry) => sum + entry.amount, 0);

      // 승/패 라운드 계산
      const winCount = participantEntries.filter(entry => entry.amount > 0).length;
      const loseCount = participantEntries.filter(entry => entry.amount < 0).length;

      // 최대 승리/손실 금액
      const amounts = participantEntries.map(entry => entry.amount);
      const maxWin = amounts.length > 0 ? Math.max(...amounts.filter(a => a > 0), 0) : 0;
      const maxLoss = amounts.length > 0 ? Math.min(...amounts.filter(a => a < 0), 0) : 0;

      return {
        participantId: participant.id,
        participantName: participant.name,
        totalAmount,
        roundCount: participantEntries.length,
        winCount,
        loseCount,
        maxWin,
        maxLoss: Math.abs(maxLoss),
      };
    });
};

/**
 * 최종 게임 정산 계산
 * 각 참가자의 최종 수익/손실을 바탕으로 누가 누구에게 얼마 줘야 하는지 계산
 */
export const calculateGameSettlementResult = (
  settlementId: string,
  participants: Participant[],
  allRounds: GameRoundWithEntries[],
  startTime: string
): GameSettlementResult => {
  // 참가자별 최종 잔액
  const finalBalances = calculateParticipantGameStatus(participants, allRounds);

  // 수익자(양수)와 손실자(음수) 분리
  const creditors = finalBalances.filter(p => p.totalAmount > 0);
  const debtors = finalBalances.filter(p => p.totalAmount < 0);

  // 정산 거래 계산
  const settlements: SettlementTransaction[] = [];

  // 간단한 정산 알고리즘: 가장 많이 잃은 사람부터 가장 많이 딴 사람에게 지불
  const creditorsCopy = [...creditors.map(c => ({ ...c }))];
  const debtorsCopy = [...debtors.map(d => ({ ...d, totalAmount: Math.abs(d.totalAmount) }))];

  while (creditorsCopy.length > 0 && debtorsCopy.length > 0) {
    const creditor = creditorsCopy[0];
    const debtor = debtorsCopy[0];

    const amount = Math.min(creditor.totalAmount, debtor.totalAmount);

    if (amount > 0) {
      settlements.push({
        fromParticipantId: debtor.participantId,
        fromParticipantName: debtor.participantName,
        toParticipantId: creditor.participantId,
        toParticipantName: creditor.participantName,
        amount: Math.round(amount),
      });

      creditor.totalAmount -= amount;
      debtor.totalAmount -= amount;
    }

    if (creditor.totalAmount <= 0) {
      creditorsCopy.shift();
    }
    if (debtor.totalAmount <= 0) {
      debtorsCopy.shift();
    }
  }

  // 게임 통계 계산
  const gameStats = calculateGameStatistics(allRounds, startTime);

  return {
    settlementId,
    finalBalances,
    settlements,
    gameStats,
  };
};

/**
 * 게임 통계 계산
 */
export const calculateGameStatistics = (
  allRounds: GameRoundWithEntries[],
  startTime: string,
  endTime?: string
): GameStatistics => {
  const totalRounds = allRounds.length;

  // 총 거래 금액 (양수 금액만 합산)
  const totalAmount = allRounds.reduce((sum, round) => {
    const positiveAmounts = round.entries
      .filter(entry => entry.amount > 0)
      .reduce((roundSum, entry) => roundSum + entry.amount, 0);
    return sum + positiveAmounts;
  }, 0);

  const averageRoundAmount = totalRounds > 0 ? totalAmount / totalRounds : 0;

  // 게임 지속 시간 계산
  let durationMinutes: number | undefined;
  const actualEndTime = endTime || new Date().toISOString();

  if (startTime && actualEndTime) {
    const startDate = new Date(startTime);
    const endDate = new Date(actualEndTime);
    durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  }

  return {
    totalRounds,
    totalAmount,
    averageRoundAmount,
    startTime,
    endTime,
    durationMinutes,
  };
};

/**
 * 라운드 제목 자동 생성
 */
export const generateRoundTitle = (roundNumber: number): string => {
  return `${roundNumber}라운드`;
};

/**
 * 금액 포맷팅 (게임용)
 */
export const formatGameAmount = (amount: number): string => {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('ko-KR').format(amount)}`;
};

/**
 * 참가자별 라운드 엔트리 초기화
 * 모든 활성 참가자에 대해 0원으로 초기화된 엔트리 생성
 */
export const initializeRoundEntries = (
  roundId: string,
  participants: Participant[],
  excludedParticipantIds: string[] = []
): Omit<GameRoundEntry, 'id' | 'createdAt'>[] => {
  const excludedSet = new Set(excludedParticipantIds);
  return participants
    .filter(p => p.isActive && !excludedSet.has(p.id))
    .map(participant => ({
      roundId,
      participantId: participant.id,
      participantName: participant.name,
      amount: 0,
    }));
};

/**
 * 게임 정산 요약 정보 생성
 */
export const createGameSummary = (
  participants: ParticipantGameStatus[],
  totalRounds: number
) => {
  const totalParticipants = participants.length;
  const winners = participants.filter(p => p.totalAmount > 0);
  const losers = participants.filter(p => p.totalAmount < 0);

  const biggestWinner = participants.reduce((max, p) =>
    p.totalAmount > max.totalAmount ? p : max
  );

  const biggestLoser = participants.reduce((min, p) =>
    p.totalAmount < min.totalAmount ? p : min
  );

  return {
    totalParticipants,
    totalRounds,
    winnerCount: winners.length,
    loserCount: losers.length,
    biggestWinner: biggestWinner.totalAmount > 0 ? biggestWinner : null,
    biggestLoser: biggestLoser.totalAmount < 0 ? biggestLoser : null,
  };
};