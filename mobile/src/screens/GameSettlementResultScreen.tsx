import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  GameSettlementResult,
  SettlementTransaction,
} from '../models/GameSettlement';
import { Toast } from '../components/ToastMessage';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';
import AnimatedButton from '../components/AnimatedButton';

import {
  formatGameAmount,
  createGameSummary,
} from '../utils/gameSettlementUtils';
import { updateSettlement } from '../services/api/settlementService';
import { SettlementStatus } from '../models/Settlement';

/**
 * GameSettlementResultScreen
 * 게임 정산 최종 결과 화면
 */
export default function GameSettlementResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { settlementId, gameResult } = route.params as {
    settlementId: string;
    gameResult: GameSettlementResult;
  };

  /**
   * 정산 완료 처리
   */
  const handleCompleteSettlement = () => {
    Alert.alert(
      '정산 완료',
      '게임 정산을 완료하시겠습니까?\n정산 결과가 확정되며 수정할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '완료',
          onPress: async () => {
            try {
              await updateSettlement(settlementId, { status: SettlementStatus.COMPLETED });
              Toast.success('게임 정산이 완료되었습니다.');
              navigation.goBack();
            } catch (error) {
              Toast.error('정산 완료 처리에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  /**
   * 게임 통계 렌더링
   */
  const renderGameStatistics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>게임 통계</Text>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>총 라운드</Text>
        <Text style={styles.statValue}>{gameResult.gameStats.totalRounds}라운드</Text>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>총 거래액</Text>
        <Text style={styles.statValue}>
          {new Intl.NumberFormat('ko-KR').format(gameResult.gameStats.totalAmount)}원
        </Text>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>평균 라운드당</Text>
        <Text style={styles.statValue}>
          {new Intl.NumberFormat('ko-KR').format(gameResult.gameStats.averageRoundAmount)}원
        </Text>
      </View>

      {gameResult.gameStats.durationMinutes && (
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>게임 시간</Text>
          <Text style={styles.statValue}>
            {Math.floor(gameResult.gameStats.durationMinutes / 60)}시간 {gameResult.gameStats.durationMinutes % 60}분
          </Text>
        </View>
      )}
    </View>
  );

  /**
   * 최종 수익/손실 렌더링
   */
  const renderFinalBalances = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>최종 수익/손실</Text>
      {gameResult.finalBalances
        .sort((a, b) => b.totalAmount - a.totalAmount) // 수익 높은 순서로 정렬
        .map(balance => (
          <View key={balance.participantId} style={styles.balanceRow}>
            <View style={styles.balanceInfo}>
              <Text style={styles.participantName}>{balance.participantName}</Text>
              <Text style={styles.balanceDetails}>
                승: {balance.winCount}회 / 패: {balance.loseCount}회
              </Text>
            </View>
            <Text
              style={[
                styles.balanceAmount,
                balance.totalAmount > 0 ? styles.positiveAmount : styles.negativeAmount,
              ]}
            >
              {formatGameAmount(balance.totalAmount)}원
            </Text>
          </View>
        ))}
    </View>
  );

  /**
   * 정산 거래 렌더링
   */
  const renderSettlementTransactions = () => {
    if (gameResult.settlements.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정산 내역</Text>
          <View style={styles.noTransactions}>
            <Text style={styles.noTransactionsText}>
              모든 참가자가 동점입니다.
            </Text>
            <Text style={styles.noTransactionsSubText}>
              정산할 금액이 없습니다.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>정산 내역</Text>
        <Text style={styles.sectionSubtitle}>
          누가 누구에게 얼마를 줘야 하는지 정리했습니다
        </Text>

        {gameResult.settlements.map((transaction, index) => (
          <TransactionItem
            key={`${transaction.fromParticipantId}-${transaction.toParticipantId}-${index}`}
            transaction={transaction}
          />
        ))}

        <View style={styles.transactionSummary}>
          <Text style={styles.transactionSummaryText}>
            총 {gameResult.settlements.length}건의 정산이 필요합니다
          </Text>
        </View>
      </View>
    );
  };

  /**
   * 게임 요약 정보 렌더링
   */
  const renderGameSummary = () => {
    const summary = createGameSummary(gameResult.finalBalances, gameResult.gameStats.totalRounds);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>게임 요약</Text>

        {summary.biggestWinner && (
          <View style={styles.summaryHighlight}>
            <Text style={styles.summaryLabel}>🏆 최고 승자</Text>
            <Text style={styles.summaryWinner}>
              {summary.biggestWinner.participantName}
            </Text>
            <Text style={styles.summaryAmount}>
              {formatGameAmount(summary.biggestWinner.totalAmount)}원
            </Text>
          </View>
        )}

        {summary.biggestLoser && (
          <View style={styles.summaryHighlight}>
            <Text style={styles.summaryLabel}>💸 최대 손실</Text>
            <Text style={styles.summaryLoser}>
              {summary.biggestLoser.participantName}
            </Text>
            <Text style={styles.summaryAmount}>
              {formatGameAmount(summary.biggestLoser.totalAmount)}원
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>게임 정산 결과</Text>
          <Text style={styles.subtitle}>
            {gameResult.gameStats.totalRounds}라운드 게임이 완료되었습니다
          </Text>
        </View>

        {/* 게임 요약 */}
        {renderGameSummary()}

        {/* 게임 통계 */}
        {renderGameStatistics()}

        {/* 최종 수익/손실 */}
        {renderFinalBalances()}

        {/* 정산 거래 */}
        {renderSettlementTransactions()}
      </ScrollView>

      {/* 액션 버튼 */}
      <View style={styles.actionButtons}>
        <AnimatedButton
          title="다시 게임하기"
          onPress={() => navigation.goBack()}
          variant="secondary"
          size="medium"
          feedbackType="scale"
          style={styles.playAgainButton}
        />

        <AnimatedButton
          title="정산 완료"
          onPress={handleCompleteSettlement}
          variant="primary"
          size="medium"
          feedbackType="pulse"
          style={styles.completeButton}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * 개별 정산 거래 아이템 컴포넌트
 */
interface TransactionItemProps {
  transaction: SettlementTransaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => (
  <View style={styles.transactionItem}>
    <View style={styles.transactionFlow}>
      <Text style={styles.fromParticipant}>{transaction.fromParticipantName}</Text>
      <Text style={styles.arrow}>→</Text>
      <Text style={styles.toParticipant}>{transaction.toParticipantName}</Text>
    </View>
    <Text style={styles.transactionAmount}>
      {new Intl.NumberFormat('ko-KR').format(transaction.amount)}원
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Spacing.spacing.lg,
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  section: {
    margin: Spacing.spacing.lg,
    padding: Spacing.spacing.lg,
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.md,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  statValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.elevated,
  },
  balanceInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.xs,
  },
  balanceDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  balanceAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  positiveAmount: {
    color: Colors.status.success,
  },
  negativeAmount: {
    color: Colors.status.error,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.spacing.md,
    paddingHorizontal: Spacing.spacing.md,
    marginBottom: Spacing.spacing.sm,
    backgroundColor: Colors.background.elevated,
    borderRadius: Spacing.radius.md,
  },
  transactionFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fromParticipant: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    flex: 1,
  },
  arrow: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginHorizontal: Spacing.spacing.sm,
  },
  toParticipant: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  transactionAmount: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
    marginLeft: Spacing.spacing.md,
  },
  transactionSummary: {
    marginTop: Spacing.spacing.md,
    paddingTop: Spacing.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    alignItems: 'center',
  },
  transactionSummaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  noTransactions: {
    alignItems: 'center',
    paddingVertical: Spacing.spacing.xl,
  },
  noTransactionsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.sm,
  },
  noTransactionsSubText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.hint,
  },
  summaryHighlight: {
    padding: Spacing.spacing.md,
    backgroundColor: Colors.background.elevated,
    borderRadius: Spacing.radius.md,
    marginBottom: Spacing.spacing.md,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.xs,
  },
  summaryWinner: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.success,
    marginBottom: Spacing.spacing.xs,
  },
  summaryLoser: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.error,
    marginBottom: Spacing.spacing.xs,
  },
  summaryAmount: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: Spacing.spacing.lg,
    gap: Spacing.spacing.md,
    backgroundColor: Colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  playAgainButton: {
    flex: 1,
    backgroundColor: Colors.background.elevated,
  },
  completeButton: {
    flex: 1,
    backgroundColor: Colors.primary.main,
  },
});