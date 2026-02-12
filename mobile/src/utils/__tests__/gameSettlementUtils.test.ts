/**
 * 게임 정산 유틸리티 함수 테스트
 */

import {
  validateRound,
  calculateParticipantGameStatus,
  calculateGameSettlementResult,
  calculateGameStatistics,
  formatGameAmount,
  initializeRoundEntries,
  createGameSummary,
} from '../gameSettlementUtils';
import {
  GameRoundEntry,
  GameRoundWithEntries,
  GameRound,
} from '../../models/GameSettlement';
import { Participant } from '../../models/Participant';

// 테스트 데이터 생성 헬퍼
const createTestParticipants = (): Participant[] => [
  {
    id: 'p1',
    name: 'Alice',
    isActive: true,
    settlementId: 's1',
    joinedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    name: 'Bob',
    isActive: true,
    settlementId: 's1',
    joinedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p3',
    name: 'Charlie',
    isActive: true,
    settlementId: 's1',
    joinedAt: '2024-01-01T00:00:00Z',
  },
];

const createTestRoundEntries = (amounts: number[]): GameRoundEntry[] =>
  amounts.map((amount, index) => ({
    id: `e${index + 1}`,
    roundId: 'r1',
    participantId: `p${index + 1}`,
    participantName: ['Alice', 'Bob', 'Charlie'][index],
    amount,
    createdAt: '2024-01-01T00:00:00Z',
  }));

const createTestRound = (
  roundId: string,
  roundNumber: number,
  entries: GameRoundEntry[]
): GameRoundWithEntries => ({
  round: {
    id: roundId,
    settlementId: 's1',
    roundNumber,
    createdAt: '2024-01-01T00:00:00Z',
    isCompleted: true,
  },
  entries,
  totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
  isValid: entries.reduce((sum, e) => sum + e.amount, 0) === 0,
});

describe('gameSettlementUtils', () => {
  const participants = createTestParticipants();

  describe('validateRound', () => {
    it('유효한 라운드를 올바르게 검증해야 함 (총합 0, 모든 참가자 포함)', () => {
      const entries = createTestRoundEntries([5000, -3000, -2000]);
      const result = validateRound(entries, participants);

      expect(result.isValid).toBe(true);
      expect(result.totalAmount).toBe(0);
      expect(result.errorMessage).toBeUndefined();
      expect(result.missingParticipants).toHaveLength(0);
    });

    it('총합이 0이 아닌 라운드를 무효로 판단해야 함', () => {
      const entries = createTestRoundEntries([5000, -3000, -1000]);
      const result = validateRound(entries, participants);

      expect(result.isValid).toBe(false);
      expect(result.totalAmount).toBe(1000);
      expect(result.errorMessage).toContain('총합이 1000원입니다');
    });

    it('참가자가 누락된 라운드를 무효로 판단해야 함', () => {
      const entries = createTestRoundEntries([5000, -5000]).slice(0, 2); // Charlie 누락
      const result = validateRound(entries, participants);

      expect(result.isValid).toBe(false);
      expect(result.missingParticipants).toContain('Charlie');
      expect(result.errorMessage).toContain('Charlie 참가자의 금액이 입력되지 않았습니다');
    });

    it('비활성 참가자는 검증에서 제외해야 함', () => {
      const participantsWithInactive = [
        ...participants,
        {
          id: 'p4',
          name: 'David',
          isActive: false,
          settlementId: 's1',
          joinedAt: '2024-01-01T00:00:00Z',
        },
      ];
      const entries = createTestRoundEntries([5000, -3000, -2000]);
      const result = validateRound(entries, participantsWithInactive);

      expect(result.isValid).toBe(true);
      expect(result.missingParticipants).not.toContain('David');
    });
  });

  describe('calculateParticipantGameStatus', () => {
    it('참가자별 게임 누적 현황을 올바르게 계산해야 함', () => {
      const round1 = createTestRound('r1', 1, createTestRoundEntries([5000, -3000, -2000]));
      const round2 = createTestRound('r2', 2, createTestRoundEntries([-2000, 4000, -2000]));
      const rounds = [round1, round2];

      const status = calculateParticipantGameStatus(participants, rounds);

      expect(status).toHaveLength(3);

      // Alice: +5000 - 2000 = +3000
      const alice = status.find(p => p.participantName === 'Alice')!;
      expect(alice.totalAmount).toBe(3000);
      expect(alice.roundCount).toBe(2);
      expect(alice.winCount).toBe(1); // 1라운드에서 승리
      expect(alice.loseCount).toBe(1); // 2라운드에서 패배
      expect(alice.maxWin).toBe(5000);
      expect(alice.maxLoss).toBe(2000);

      // Bob: -3000 + 4000 = +1000
      const bob = status.find(p => p.participantName === 'Bob')!;
      expect(bob.totalAmount).toBe(1000);
      expect(bob.winCount).toBe(1);
      expect(bob.loseCount).toBe(1);

      // Charlie: -2000 - 2000 = -4000
      const charlie = status.find(p => p.participantName === 'Charlie')!;
      expect(charlie.totalAmount).toBe(-4000);
      expect(charlie.winCount).toBe(0);
      expect(charlie.loseCount).toBe(2);
    });

    it('라운드가 없는 경우 모든 값이 0이어야 함', () => {
      const status = calculateParticipantGameStatus(participants, []);

      status.forEach(p => {
        expect(p.totalAmount).toBe(0);
        expect(p.roundCount).toBe(0);
        expect(p.winCount).toBe(0);
        expect(p.loseCount).toBe(0);
        expect(p.maxWin).toBe(0);
        expect(p.maxLoss).toBe(0);
      });
    });
  });

  describe('calculateGameSettlementResult', () => {
    it('최종 게임 정산을 올바르게 계산해야 함', () => {
      const round1 = createTestRound('r1', 1, createTestRoundEntries([5000, -3000, -2000]));
      const round2 = createTestRound('r2', 2, createTestRoundEntries([-2000, 4000, -2000]));
      const rounds = [round1, round2];
      const startTime = '2024-01-01T10:00:00Z';

      const result = calculateGameSettlementResult('s1', participants, rounds, startTime);

      expect(result.settlementId).toBe('s1');
      expect(result.finalBalances).toHaveLength(3);

      // 정산 거래 확인 - Charlie가 Alice와 Bob에게 각각 지불
      expect(result.settlements).toHaveLength(2);

      // 모든 거래가 Charlie로부터 나와야 함
      result.settlements.forEach(settlement => {
        expect(settlement.fromParticipantName).toBe('Charlie');
        expect(settlement.amount).toBeGreaterThan(0);
      });

      // 총 지불 금액이 Charlie의 손실과 같아야 함
      const totalPayment = result.settlements.reduce((sum, s) => sum + s.amount, 0);
      expect(totalPayment).toBe(4000);
    });

    it('수익/손실이 없는 경우 정산 거래가 없어야 함', () => {
      const round1 = createTestRound('r1', 1, createTestRoundEntries([1000, -1000, 0]));
      const round2 = createTestRound('r2', 2, createTestRoundEntries([-1000, 1000, 0]));
      const rounds = [round1, round2];
      const startTime = '2024-01-01T10:00:00Z';

      const result = calculateGameSettlementResult('s1', participants, rounds, startTime);

      // 모든 참가자의 최종 잔액이 0이어야 함
      result.finalBalances.forEach(balance => {
        expect(balance.totalAmount).toBe(0);
      });

      // 정산 거래가 없어야 함
      expect(result.settlements).toHaveLength(0);
    });
  });

  describe('calculateGameStatistics', () => {
    it('게임 통계를 올바르게 계산해야 함', () => {
      const round1 = createTestRound('r1', 1, createTestRoundEntries([5000, -3000, -2000]));
      const round2 = createTestRound('r2', 2, createTestRoundEntries([2000, -1000, -1000]));
      const rounds = [round1, round2];
      const startTime = '2024-01-01T10:00:00Z';
      const endTime = '2024-01-01T12:00:00Z';

      const stats = calculateGameStatistics(rounds, startTime, endTime);

      expect(stats.totalRounds).toBe(2);
      expect(stats.totalAmount).toBe(7000); // 5000 + 2000 (양수만 합산)
      expect(stats.averageRoundAmount).toBe(3500);
      expect(stats.startTime).toBe(startTime);
      expect(stats.endTime).toBe(endTime);
      expect(stats.durationMinutes).toBe(120); // 2시간
    });

    it('라운드가 없는 경우 기본값을 반환해야 함', () => {
      const startTime = '2024-01-01T10:00:00Z';
      const stats = calculateGameStatistics([], startTime);

      expect(stats.totalRounds).toBe(0);
      expect(stats.totalAmount).toBe(0);
      expect(stats.averageRoundAmount).toBe(0);
      expect(stats.startTime).toBe(startTime);
    });
  });

  describe('formatGameAmount', () => {
    it('양수 금액에 + 기호를 추가해야 함', () => {
      expect(formatGameAmount(5000)).toBe('+5,000');
    });

    it('음수 금액은 - 기호만 표시해야 함', () => {
      expect(formatGameAmount(-3000)).toBe('-3,000');
    });

    it('0은 +0으로 표시해야 함', () => {
      expect(formatGameAmount(0)).toBe('+0');
    });

    it('큰 금액도 올바르게 포맷팅해야 함', () => {
      expect(formatGameAmount(1234567)).toBe('+1,234,567');
    });
  });

  describe('initializeRoundEntries', () => {
    it('모든 활성 참가자에 대해 0원 엔트리를 생성해야 함', () => {
      const entries = initializeRoundEntries('r1', participants);

      expect(entries).toHaveLength(3);
      entries.forEach(entry => {
        expect(entry.roundId).toBe('r1');
        expect(entry.amount).toBe(0);
        expect(['p1', 'p2', 'p3']).toContain(entry.participantId);
      });
    });

    it('비활성 참가자는 제외해야 함', () => {
      const participantsWithInactive = [
        ...participants,
        {
          id: 'p4',
          name: 'David',
          isActive: false,
          settlementId: 's1',
          joinedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const entries = initializeRoundEntries('r1', participantsWithInactive);

      expect(entries).toHaveLength(3); // 활성 참가자만
      expect(entries.some(e => e.participantId === 'p4')).toBe(false);
    });
  });

  describe('createGameSummary', () => {
    it('게임 요약 정보를 올바르게 생성해야 함', () => {
      const participantStatus = [
        { participantId: 'p1', participantName: 'Alice', totalAmount: 5000, roundCount: 2, winCount: 2, loseCount: 0, maxWin: 3000, maxLoss: 0 },
        { participantId: 'p2', participantName: 'Bob', totalAmount: 1000, roundCount: 2, winCount: 1, loseCount: 1, maxWin: 2000, maxLoss: 1000 },
        { participantId: 'p3', participantName: 'Charlie', totalAmount: -6000, roundCount: 2, winCount: 0, loseCount: 2, maxWin: 0, maxLoss: 4000 },
      ];

      const summary = createGameSummary(participantStatus, 2);

      expect(summary.totalParticipants).toBe(3);
      expect(summary.totalRounds).toBe(2);
      expect(summary.winnerCount).toBe(2);
      expect(summary.loserCount).toBe(1);
      expect(summary.biggestWinner?.participantName).toBe('Alice');
      expect(summary.biggestWinner?.totalAmount).toBe(5000);
      expect(summary.biggestLoser?.participantName).toBe('Charlie');
      expect(summary.biggestLoser?.totalAmount).toBe(-6000);
    });

    it('모든 참가자가 동점인 경우 승자/패자가 없어야 함', () => {
      const participantStatus = [
        { participantId: 'p1', participantName: 'Alice', totalAmount: 0, roundCount: 1, winCount: 0, loseCount: 0, maxWin: 0, maxLoss: 0 },
        { participantId: 'p2', participantName: 'Bob', totalAmount: 0, roundCount: 1, winCount: 0, loseCount: 0, maxWin: 0, maxLoss: 0 },
      ];

      const summary = createGameSummary(participantStatus, 1);

      expect(summary.winnerCount).toBe(0);
      expect(summary.loserCount).toBe(0);
      expect(summary.biggestWinner).toBeNull();
      expect(summary.biggestLoser).toBeNull();
    });
  });
});