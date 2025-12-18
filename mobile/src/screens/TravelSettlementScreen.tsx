import React, { useState, useEffect, useCallback } from 'react';
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
import { Settlement } from '../models/Settlement';
import { Participant } from '../models/Participant';
import { ExpenseWithDetails } from '../models/Expense';
import ParticipantList from '../components/ParticipantList';
import ExpenseItem from '../components/ExpenseItem';
import AddParticipantModal from '../components/AddParticipantModal';
import AddExpenseModal from '../components/AddExpenseModal';
import EditExpenseModal from '../components/EditExpenseModal';
import ExpenseSplitModal from '../components/ExpenseSplitModal';
import EditParticipantModal from '../components/EditParticipantModal';
import RemainderHandlingModal from '../components/RemainderHandlingModal';
import ParticipantBalanceSummary from '../components/ParticipantBalanceSummary';
import EditSettlementModal from '../components/EditSettlementModal';
import AnimatedButton from '../components/AnimatedButton';
import {
  getSettlement,
  getParticipants,
  getExpenses,
  deleteExpense,
  updateExpense,
  setExpenseSplits,
  toggleParticipantStatus,
  deleteParticipant,
  updateParticipant,
  addParticipant,
  addExpense,
  updateSettlement,
  deleteSettlement,
} from '../services/api/settlementService';
import { AddParticipantRequest, UpdateParticipantRequest } from '../models/Participant';
import { CreateExpenseRequest, UpdateExpenseRequest, ExpenseSplitRequest } from '../models/Expense';
import { UpdateSettlementRequest } from '../models/Settlement';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

/**
 * TravelSettlementScreen
 * 여행 정산 상세 화면
 */
export default function TravelSettlementScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { settlementId } = route.params as { settlementId: string };

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [addParticipantModalVisible, setAddParticipantModalVisible] = useState(false);
  const [editParticipantModalVisible, setEditParticipantModalVisible] = useState(false);
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [editExpenseModalVisible, setEditExpenseModalVisible] = useState(false);
  const [expenseSplitModalVisible, setExpenseSplitModalVisible] = useState(false);
  const [remainderModalVisible, setRemainderModalVisible] = useState(false);
  const [editSettlementModalVisible, setEditSettlementModalVisible] = useState(false);
  const [remainder, setRemainder] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    try {
      setLoading(true);

      // 정산 정보 로드
      const settlementData = await getSettlement(settlementId);
      setSettlement(settlementData);

      // 참가자 목록 로드
      const participantsData = await getParticipants(settlementId);
      setParticipants(participantsData);

      // 지출 목록 로드
      const expensesData = await getExpenses(settlementId);
      setExpenses(expensesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      Alert.alert('오류', '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /**
   * 화면 포커스 시 데이터 새로고침
   */
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [settlementId])
  );

  /**
   * 참가자 활성/비활성 토글
   */
  const handleToggleParticipant = async (participantId: string, isActive: boolean) => {
    try {
      await toggleParticipantStatus(settlementId, participantId, isActive);
      await loadData();
      Alert.alert('완료', isActive ? '참가자를 활성화했습니다.' : '참가자를 비활성화했습니다.');
    } catch (error) {
      console.error('참가자 상태 변경 실패:', error);
      Alert.alert('오류', '참가자 상태를 변경할 수 없습니다.');
    }
  };

  /**
   * 참가자 삭제
   */
  const handleDeleteParticipant = async (participantId: string) => {
    try {
      await deleteParticipant(settlementId, participantId);
      await loadData();
      Alert.alert('완료', '참가자를 삭제했습니다.');
    } catch (error) {
      console.error('참가자 삭제 실패:', error);
      Alert.alert('오류', '참가자를 삭제할 수 없습니다.\n관련 지출 내역이 있을 수 있습니다.');
    }
  };

  /**
   * 지출 삭제
   */
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(settlementId, expenseId);
      await loadData();
      Alert.alert('완료', '지출을 삭제했습니다.');
    } catch (error) {
      console.error('지출 삭제 실패:', error);
      Alert.alert('오류', '지출을 삭제할 수 없습니다.');
    }
  };

  /**
   * 참가자 추가 제출
   */
  const handleAddParticipant = async (data: AddParticipantRequest) => {
    await addParticipant(settlementId, data);
    await loadData();
  };

  /**
   * 지출 추가 제출
   */
  const handleAddExpense = async (data: CreateExpenseRequest) => {
    await addExpense(settlementId, data);
    await loadData();
  };

  /**
   * 지출 수정
   */
  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setSelectedExpense(expense);
    setEditExpenseModalVisible(true);
  };

  /**
   * 지출 수정 제출
   */
  const handleUpdateExpense = async (data: UpdateExpenseRequest) => {
    if (!selectedExpense) return;

    try {
      await updateExpense(settlementId, selectedExpense.id, data);
      await loadData();
    } catch (error) {
      console.error('지출 수정 실패:', error);
      throw error;
    }
  };

  /**
   * 참가자 수정
   */
  const handleEditParticipant = (participant: Participant) => {
    setSelectedParticipant(participant);
    setEditParticipantModalVisible(true);
  };

  /**
   * 참가자 수정 제출
   */
  const handleUpdateParticipant = async (data: UpdateParticipantRequest) => {
    if (!selectedParticipant) return;

    try {
      await updateParticipant(settlementId, selectedParticipant.id, data);
      await loadData();
    } catch (error) {
      console.error('참가자 수정 실패:', error);
      throw error;
    }
  };

  /**
   * 지출 분담 설정
   */
  const handleSetExpenseSplits = (expense: ExpenseWithDetails) => {
    setSelectedExpense(expense);
    setExpenseSplitModalVisible(true);
  };

  /**
   * 지출 분담 설정 제출
   */
  const handleSubmitExpenseSplits = async (data: ExpenseSplitRequest) => {
    if (!selectedExpense) return;

    try {
      await setExpenseSplits(settlementId, selectedExpense.id, data);
      await loadData();
    } catch (error) {
      console.error('지출 분담 설정 실패:', error);
      throw error;
    }
  };

  /**
   * 정산 정보 수정
   */
  const handleUpdateSettlement = async (data: UpdateSettlementRequest) => {
    try {
      await updateSettlement(settlementId, data);
      await loadData();
    } catch (error) {
      console.error('정산 수정 실패:', error);
      throw error;
    }
  };

  /**
   * 정산 삭제
   */
  const handleDeleteSettlement = () => {
    Alert.alert(
      '정산 삭제',
      '정산을 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSettlement(settlementId);
              Alert.alert('완료', '정산을 삭제했습니다.');
              navigation.goBack();
            } catch (error) {
              console.error('정산 삭제 실패:', error);
              Alert.alert('오류', '정산을 삭제할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  /**
   * 통계 계산
   */
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

  const stats = calculateStats();

  /**
   * 금액 포맷팅
   */
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  /**
   * 나머지 계산
   */
  const calculateRemainder = (): number => {
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const activeParticipants = participants.filter(p => p.isActive);

    if (activeParticipants.length === 0) {
      return 0;
    }

    // 1인당 금액 (소수점 버림)
    const perPerson = Math.floor(totalExpense / activeParticipants.length);

    // 나머지 = 총액 - (1인당 금액 * 참가자 수)
    const remainder = totalExpense - (perPerson * activeParticipants.length);

    return remainder;
  };

  /**
   * 정산 결과 보기 핸들러
   */
  const handleViewSettlementResult = () => {
    // 유효성 검사
    const activeParticipants = participants.filter(p => p.isActive);

    if (activeParticipants.length === 0) {
      Alert.alert('오류', '활성 참가자가 없습니다.');
      return;
    }

    if (expenses.length === 0) {
      Alert.alert('오류', '지출 내역이 없습니다.');
      return;
    }

    // 나머지 계산
    const calculatedRemainder = calculateRemainder();

    if (calculatedRemainder > 0) {
      // 나머지가 있으면 모달 표시
      setRemainder(calculatedRemainder);
      setRemainderModalVisible(true);
    } else {
      // 나머지가 없으면 바로 결과 화면으로 이동
      navigation.navigate('SettlementResult', { settlementId });
    }
  };

  /**
   * 나머지 처리 확인 핸들러
   */
  const handleRemainderConfirm = (payerId: string, amount: number) => {
    setRemainderModalVisible(false);
    // 나머지 처리 정보를 포함하여 결과 화면으로 이동
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 정산 정보 헤더 */}
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

          {/* 수정/삭제 버튼 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditSettlementModalVisible(true)}
            >
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteSettlement}
            >
              <Text style={styles.deleteButtonText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 통계 카드 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>총 지출</Text>
            <Text style={styles.statValue}>
              {formatAmount(stats.totalExpense)} {settlement.currency}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>1인당 평균</Text>
            <Text style={styles.statValue}>
              {formatAmount(stats.perPersonAverage)} {settlement.currency}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>참가자</Text>
            <Text style={styles.statValue}>{stats.participantCount}명</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>지출 건수</Text>
            <Text style={styles.statValue}>{stats.expenseCount}건</Text>
          </View>
        </View>

        {/* 참가자별 잔액 요약 */}
        {expenses.length > 0 && participants.length > 0 && (
          <ParticipantBalanceSummary
            participants={participants}
            expenses={expenses}
            currency={settlement.currency}
          />
        )}

        {/* 참가자 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>참가자</Text>
            <AnimatedButton
              title="+ 추가"
              onPress={() => setAddParticipantModalVisible(true)}
              variant="primary"
              size="small"
              feedbackType="scale"
              style={styles.addButton}
              textStyle={styles.addButtonText}
            />
          </View>
          <ParticipantList
            participants={participants}
            onEdit={handleEditParticipant}
            onToggleActive={handleToggleParticipant}
            onDelete={handleDeleteParticipant}
          />
        </View>

        {/* 지출 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>지출 내역</Text>
            <AnimatedButton
              title="+ 추가"
              onPress={() => setAddExpenseModalVisible(true)}
              variant="primary"
              size="small"
              feedbackType="scale"
              style={styles.addButton}
              textStyle={styles.addButtonText}
            />
          </View>
          {expenses.length === 0 ? (
            <View style={styles.emptyExpenses}>
              <Text style={styles.emptyText}>지출 내역이 없습니다</Text>
              <Text style={styles.emptySubText}>지출을 추가해주세요</Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                currency={settlement.currency}
                onSetSplits={handleSetExpenseSplits}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
              />
            ))
          )}
        </View>

        {/* 정산 결과 버튼 */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={handleViewSettlementResult}
        >
          <Text style={styles.calculateButtonText}>정산 결과 보기</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 참가자 추가 모달 */}
      <AddParticipantModal
        visible={addParticipantModalVisible}
        onClose={() => setAddParticipantModalVisible(false)}
        onSubmit={handleAddParticipant}
      />

      {/* 지출 추가 모달 */}
      <AddExpenseModal
        visible={addExpenseModalVisible}
        participants={participants}
        onClose={() => setAddExpenseModalVisible(false)}
        onSubmit={handleAddExpense}
      />

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

      {/* 참가자 수정 모달 */}
      {selectedParticipant && (
        <EditParticipantModal
          visible={editParticipantModalVisible}
          participant={selectedParticipant}
          onClose={() => setEditParticipantModalVisible(false)}
          onSubmit={handleUpdateParticipant}
        />
      )}

      {/* 지출 분담 설정 모달 */}
      {selectedExpense && (
        <ExpenseSplitModal
          visible={expenseSplitModalVisible}
          expense={selectedExpense}
          participants={participants}
          onClose={() => setExpenseSplitModalVisible(false)}
          onSubmit={handleSubmitExpenseSplits}
        />
      )}

      {/* 지출 수정 모달 */}
      {selectedExpense && (
        <EditExpenseModal
          visible={editExpenseModalVisible}
          expense={selectedExpense}
          participants={participants}
          onClose={() => setEditExpenseModalVisible(false)}
          onSubmit={handleUpdateExpense}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 8,
    lineHeight: 20,
  },
  dateRange: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F44336',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  section: {
    marginBottom: Spacing.spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2196F3',
  },
  addButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyExpenses: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing['4xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.styles.body1,
    color: Colors.text.hint,
    marginBottom: Spacing.spacing.sm,
  },
  emptySubText: {
    ...Typography.styles.body2,
    color: Colors.text.disabled,
  },
  calculateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
