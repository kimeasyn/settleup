import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Settlement, SettlementStatus } from '../models/Settlement';
import { Participant } from '../models/Participant';
import { ExpenseWithDetails } from '../models/Expense';
import RemainderHandlingModal from '../components/RemainderHandlingModal';
import EditSettlementModal from '../components/EditSettlementModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getSettlement,
  getParticipants,
  getExpenses,
  updateSettlement,
  deleteSettlement,
} from '../services/api/settlementService';
import { UpdateSettlementRequest } from '../models/Settlement';
import { Toast } from '../components/ToastMessage';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

/**
 * TravelSettlementScreen
 * 여행 정산 상세 화면 (간소화)
 */
export default function TravelSettlementScreen() {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { settlementId } = route.params as { settlementId: string };

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [remainderModalVisible, setRemainderModalVisible] = useState(false);
  const [editSettlementModalVisible, setEditSettlementModalVisible] = useState(false);
  const [remainder, setRemainder] = useState(0);
  const [actionInProgress, setActionInProgress] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settlementData, participantsData, expensesData] = await Promise.all([
        getSettlement(settlementId),
        getParticipants(settlementId),
        getExpenses(settlementId),
      ]);
      setSettlement(settlementData);
      setParticipants(participantsData);
      setExpenses(expensesData as ExpenseWithDetails[]);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      Toast.error('데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [settlementId])
  );

  const isCompleted = settlement?.status === SettlementStatus.COMPLETED;

  const calculateStats = () => {
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const activeParticipants = participants.filter(p => p.isActive);
    const perPersonAverage = activeParticipants.length > 0
      ? totalExpense / activeParticipants.length
      : 0;
    return {
      totalExpense,
      expenseCount: expenses.length,
      participantCount: activeParticipants.length,
      perPersonAverage,
    };
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const calculateRemainder = (): number => {
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const activeParticipants = participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) return 0;
    const perPerson = Math.floor(totalExpense / activeParticipants.length);
    return totalExpense - (perPerson * activeParticipants.length);
  };

  /**
   * 잔액 계산 (ParticipantBalanceSummary 로직 인라인)
   */
  const calculateBalances = () => {
    const activeParticipants = participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) return [];

    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const perPerson = Math.floor(totalExpense / activeParticipants.length);
    const remainderVal = totalExpense - (perPerson * activeParticipants.length);

    const paidMap = new Map<string, number>();
    activeParticipants.forEach(p => paidMap.set(p.id, 0));
    expenses.forEach(expense => {
      const current = paidMap.get(expense.payerId) || 0;
      paidMap.set(expense.payerId, current + expense.amount);
    });

    return activeParticipants.map((participant, index) => {
      const totalPaid = paidMap.get(participant.id) || 0;
      const shouldPay = index === 0 ? perPerson + remainderVal : perPerson;
      const balance = totalPaid - shouldPay;
      return { id: participant.id, name: participant.name, balance };
    });
  };

  const handleUpdateSettlement = async (data: UpdateSettlementRequest) => {
    try {
      await updateSettlement(settlementId, data);
      await loadData();
    } catch (error) {
      console.error('정산 수정 실패:', error);
      throw error;
    }
  };

  const handleDeleteSettlement = () => {
    if (actionInProgress) return;
    Alert.alert(
      '정산 삭제',
      '정산을 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(true);
            try {
              await deleteSettlement(settlementId);
              Toast.success('정산을 삭제했습니다.');
              navigation.goBack();
            } catch (error) {
              console.error('정산 삭제 실패:', error);
              Toast.error('정산을 삭제할 수 없습니다.');
            } finally {
              setActionInProgress(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = () => {
    if (actionInProgress) return;
    if (isCompleted) {
      Alert.alert(
        '정산 다시 열기',
        '정산을 다시 열면 수정이 가능합니다. 계속하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '다시 열기',
            onPress: async () => {
              setActionInProgress(true);
              try {
                await updateSettlement(settlementId, { status: SettlementStatus.ACTIVE });
                await loadData();
              } catch (error) {
                Toast.error('정산 상태를 변경할 수 없습니다.');
              } finally {
                setActionInProgress(false);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        '정산 완료',
        '정산을 완료하시겠습니까?\n완료 후에는 수정할 수 없습니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '완료',
            onPress: async () => {
              setActionInProgress(true);
              try {
                await updateSettlement(settlementId, { status: SettlementStatus.COMPLETED });
                await loadData();
              } catch (error) {
                Toast.error('정산 상태를 변경할 수 없습니다.');
              } finally {
                setActionInProgress(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleViewSettlementResult = () => {
    const activeParticipants = participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      Toast.warning('활성 참가자가 없습니다.');
      return;
    }
    if (expenses.length === 0) {
      Toast.warning('지출 내역이 없습니다.');
      return;
    }
    const calculatedRemainder = calculateRemainder();
    if (calculatedRemainder > 0) {
      setRemainder(calculatedRemainder);
      setRemainderModalVisible(true);
    } else {
      navigation.navigate('SettlementResult', { settlementId });
    }
  };

  const handleRemainderConfirm = (payerId: string, amount: number) => {
    setRemainderModalVisible(false);
    navigation.navigate('SettlementResult', {
      settlementId,
      remainderPayerId: payerId,
      remainderAmount: amount,
    });
  };

  if (loading && !settlement) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  if (!settlement) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>정산을 찾을 수 없습니다</Text>
      </View>
    );
  }

  const stats = calculateStats();
  const balances = calculateBalances();

  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return Colors.status.success;
    if (balance < 0) return Colors.status.error;
    return Colors.text.disabled;
  };

  const getBalanceText = (balance: number): string => {
    const abs = new Intl.NumberFormat('ko-KR').format(Math.abs(balance));
    if (balance > 0) return `+${abs}`;
    if (balance < 0) return `-${abs}`;
    return '0';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 헤더 카드 */}
        <View style={styles.header}>
          <Text style={styles.title}>{settlement.title}</Text>
          {settlement.description && (
            <Text style={styles.description}>{settlement.description}</Text>
          )}
          {settlement.startDate && (
            <Text style={styles.dateRange}>
              {new Date(settlement.startDate).toLocaleDateString('ko-KR')}
              {settlement.endDate && ` ~ ${new Date(settlement.endDate).toLocaleDateString('ko-KR')}`}
            </Text>
          )}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>정산 완료됨</Text>
            </View>
          )}
        </View>

        {/* 통계 카드 (1카드 2줄) */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>총 지출</Text>
            <Text style={styles.statsValue}>
              {formatAmount(stats.totalExpense)} {settlement.currency} · {stats.expenseCount}건
            </Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>참가자</Text>
            <Text style={styles.statsValue}>
              {stats.participantCount}명 · 1인당 {formatAmount(Math.floor(stats.perPersonAverage))} {settlement.currency}
            </Text>
          </View>
        </View>

        {/* 잔액 요약 */}
        {balances.length > 0 && (
          <View style={styles.balanceSection}>
            <Text style={styles.sectionTitle}>잔액 요약</Text>
            {balances.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.balanceRow}
                onPress={() => navigation.navigate('SettlementResult', { settlementId })}
                activeOpacity={0.7}
              >
                <Text style={styles.balanceName}>{item.name}</Text>
                <View style={styles.balanceRight}>
                  <Text style={[styles.balanceAmount, { color: getBalanceColor(item.balance) }]}>
                    {getBalanceText(item.balance)}원
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={Colors.text.hint}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 네비게이션 버튼 행 */}
        <View style={styles.navButtonRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('ParticipantManagement', { settlementId, isCompleted })}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-group-outline" size={20} color={Colors.primary.main} />
            <Text style={styles.navButtonText}>참가자 관리</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('ExpenseList', { settlementId, isCompleted, currency: settlement.currency })}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="receipt-text-outline" size={20} color={Colors.primary.main} />
            <Text style={styles.navButtonText}>지출 내역</Text>
          </TouchableOpacity>
        </View>

        {/* 정산 결과 버튼 */}
        <TouchableOpacity
          style={styles.resultButton}
          onPress={handleViewSettlementResult}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>여행 정산 결과</Text>
        </TouchableOpacity>

        {/* 수정 · 삭제 (완료 상태가 아닐 때만) */}
        {!isCompleted && (
          <View style={styles.editDeleteRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditSettlementModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.primary.contrast} />
              <Text style={styles.actionButtonText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, actionInProgress && styles.disabledAction]}
              onPress={handleDeleteSettlement}
              disabled={actionInProgress}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.primary.contrast} />
              <Text style={styles.actionButtonText}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 정산 완료/다시 열기 */}
        <TouchableOpacity
          style={[styles.toggleCompleteButton, isCompleted ? styles.reopenStyle : styles.completeStyle, actionInProgress && styles.disabledAction]}
          onPress={handleToggleComplete}
          disabled={actionInProgress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isCompleted ? 'lock-open-outline' : 'check-circle-outline'}
            size={18}
            color={Colors.primary.contrast}
          />
          <Text style={styles.actionButtonText}>
            {isCompleted ? '정산 다시 열기' : '정산 완료'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 나머지 처리 모달 */}
      <RemainderHandlingModal
        visible={remainderModalVisible}
        remainder={remainder}
        totalExpense={expenses.reduce((sum, exp) => sum + exp.amount, 0)}
        participants={participants}
        currency={settlement?.currency || 'KRW'}
        onClose={() => setRemainderModalVisible(false)}
        onConfirm={handleRemainderConfirm}
      />

      {/* 정산 수정 모달 */}
      {settlement && (
        <EditSettlementModal
          visible={editSettlementModalVisible}
          settlement={settlement}
          onClose={() => setEditSettlementModalVisible(false)}
          onSubmit={handleUpdateSettlement}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    ...Typography.styles.body1,
    color: Colors.text.hint,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  errorText: {
    ...Typography.styles.body1,
    color: Colors.status.error,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.xl,
    marginBottom: Spacing.spacing.lg,
    ...createShadowStyle('sm'),
  },
  title: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.sm,
  },
  description: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.sm,
    lineHeight: 20,
  },
  dateRange: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
  },
  completedBadge: {
    marginTop: Spacing.spacing.sm,
    backgroundColor: Colors.action.secondary,
    borderRadius: Spacing.radius.md,
    padding: Spacing.spacing.sm,
    alignItems: 'center',
  },
  completedBadgeText: {
    ...Typography.styles.caption,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.main,
  },
  statsCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.lg,
    marginBottom: Spacing.spacing.lg,
    ...createShadowStyle('sm'),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    ...Typography.styles.body2,
    color: Colors.text.hint,
  },
  statsValue: {
    ...Typography.styles.body2,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  statsDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.spacing.md,
  },
  balanceSection: {
    marginBottom: Spacing.spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.paper,
    paddingVertical: Spacing.spacing.md,
    paddingHorizontal: Spacing.spacing.lg,
    borderRadius: Spacing.radius.md,
    marginBottom: Spacing.spacing.xs + 2,
  },
  balanceName: {
    ...Typography.styles.body1,
    color: Colors.text.primary,
  },
  balanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceAmount: {
    ...Typography.styles.body1,
    fontWeight: Typography.fontWeight.semibold,
  },
  navButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.spacing.lg,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.spacing.md,
    borderRadius: Spacing.radius.md,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    backgroundColor: Colors.background.paper,
  },
  navButtonText: {
    ...Typography.styles.button,
    color: Colors.primary.main,
  },
  resultButton: {
    backgroundColor: Colors.status.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Spacing.radius.md,
    marginBottom: Spacing.spacing.md,
  },
  actionButtonText: {
    ...Typography.styles.button,
    color: Colors.text.inverse,
  },
  editDeleteRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.spacing.md,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Spacing.radius.md,
    backgroundColor: Colors.primary.main,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Spacing.radius.md,
    backgroundColor: Colors.status.error,
  },
  toggleCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Spacing.radius.md,
    marginBottom: Spacing.spacing.lg,
  },
  completeStyle: {
    backgroundColor: Colors.status.success,
  },
  reopenStyle: {
    backgroundColor: Colors.status.warning,
  },
  disabledAction: {
    opacity: 0.5,
  },
});
