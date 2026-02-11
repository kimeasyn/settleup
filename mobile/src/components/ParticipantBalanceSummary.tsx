import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Participant } from '../models/Participant';
import { ExpenseWithDetails } from '../models/Expense';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

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
    if (balance > 0) return Colors.status.success;
    if (balance < 0) return Colors.status.error;
    return Colors.text.disabled;
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
    marginBottom: Spacing.spacing['2xl'],
  },
  title: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.md,
  },
  balanceList: {
    gap: Spacing.spacing.md,
  },
  balanceCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.component.card,
    ...createShadowStyle('sm'),
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spacing.md,
  },
  participantName: {
    ...Typography.styles.body1,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  balanceAmount: {
    ...Typography.styles.h4,
    fontWeight: Typography.fontWeight.bold,
  },
  balanceDetails: {
    flexDirection: 'row',
    gap: Spacing.spacing.lg,
  },
  balanceDetailItem: {
    flex: 1,
  },
  detailLabel: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginBottom: Spacing.spacing.xs,
  },
  detailValue: {
    ...Typography.styles.body2,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  helpText: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginTop: Spacing.spacing.sm,
    fontStyle: 'italic',
  },
});

export default ParticipantBalanceSummary;
