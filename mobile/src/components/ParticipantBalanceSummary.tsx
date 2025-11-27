import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Participant } from '../models/Participant';
import { ExpenseWithDetails } from '../models/Expense';

interface ParticipantBalanceSummaryProps {
  participants: Participant[];
  expenses: ExpenseWithDetails[];
  currency: string;
}

interface ParticipantBalance {
  id: string;
  name: string;
  totalPaid: number;
  shouldPay: number;
  balance: number;
}

/**
 * ParticipantBalanceSummary
 * 각 참가자의 지출/분담/잔액을 표시하는 컴포넌트
 */
const ParticipantBalanceSummary: React.FC<ParticipantBalanceSummaryProps> = ({
  participants,
  expenses,
  currency,
}) => {
  /**
   * 참가자별 잔액 계산
   */
  const calculateBalances = (): ParticipantBalance[] => {
    const activeParticipants = participants.filter(p => p.isActive);

    if (activeParticipants.length === 0) {
      return [];
    }

    // 총 지출 계산
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 1인당 분담금 (소수점 버림)
    const perPerson = Math.floor(totalExpense / activeParticipants.length);

    // 나머지 계산
    const remainder = totalExpense - (perPerson * activeParticipants.length);

    // 참가자별 지출 집계
    const paidMap = new Map<string, number>();
    activeParticipants.forEach(p => paidMap.set(p.id, 0));

    expenses.forEach(expense => {
      const current = paidMap.get(expense.payerId) || 0;
      paidMap.set(expense.payerId, current + expense.amount);
    });

    // 참가자별 잔액 계산
    return activeParticipants.map((participant, index) => {
      const totalPaid = paidMap.get(participant.id) || 0;

      // 첫 번째 참가자가 나머지 부담
      const shouldPay = index === 0 ? perPerson + remainder : perPerson;

      // 잔액 = 지출 - 분담금 (양수: 받을 돈, 음수: 줄 돈)
      const balance = totalPaid - shouldPay;

      return {
        id: participant.id,
        name: participant.name,
        totalPaid,
        shouldPay,
        balance,
      };
    });
  };

  const balances = calculateBalances();

  if (balances.length === 0) {
    return null;
  }

  /**
   * 금액 포맷팅
   */
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(Math.abs(amount));
  };

  /**
   * 잔액 색상
   */
  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return '#4CAF50'; // 받을 돈 (초록)
    if (balance < 0) return '#F44336'; // 줄 돈 (빨강)
    return '#9E9E9E'; // 정산 완료 (회색)
  };

  /**
   * 잔액 텍스트
   */
  const getBalanceText = (balance: number): string => {
    if (balance > 0) return `+${formatAmount(balance)}`;
    if (balance < 0) return `-${formatAmount(balance)}`;
    return '0';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>참가자별 잔액</Text>
      <View style={styles.balanceList}>
        {balances.map((participant) => (
          <View key={participant.id} style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.participantName}>{participant.name}</Text>
              <Text
                style={[
                  styles.balanceAmount,
                  { color: getBalanceColor(participant.balance) },
                ]}
              >
                {getBalanceText(participant.balance)} {currency}
              </Text>
            </View>
            <View style={styles.balanceDetails}>
              <View style={styles.balanceDetailItem}>
                <Text style={styles.detailLabel}>지출</Text>
                <Text style={styles.detailValue}>
                  {formatAmount(participant.totalPaid)} {currency}
                </Text>
              </View>
              <View style={styles.balanceDetailItem}>
                <Text style={styles.detailLabel}>분담</Text>
                <Text style={styles.detailValue}>
                  {formatAmount(participant.shouldPay)} {currency}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.helpText}>
        * 양수는 받을 돈, 음수는 줄 돈을 의미합니다
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  balanceList: {
    gap: 12,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  balanceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  balanceDetailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },
  helpText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ParticipantBalanceSummary;
