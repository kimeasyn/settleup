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
import { Settlement, SettlementStatus } from '../models/Settlement';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  getSettlementMembers,
  generateInviteCode,
} from '../services/api/settlementService';
import { SettlementMember } from '../models/SettlementMember';
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
  const [members, setMembers] = useState<SettlementMember[]>([]);
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

      // 멤버 목록 로드 (실패해도 무시 - 인증 미적용 환경 대응)
      try {
        const membersData = await getSettlementMembers(settlementId);
        setMembers(membersData);
      } catch {
        // 멤버 API 미지원 시 무시
      }
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

  const isCompleted = settlement?.status === SettlementStatus.COMPLETED;

  /**
   * 정산 완료/다시 열기 토글
   */
  /**
   * 초대 코드 생성 및 공유
   */
  const handleInvite = async () => {
    try {
      const invite = await generateInviteCode(settlementId);
      Alert.alert(
        '초대 코드',
        `초대 코드: ${invite.code}\n\n유효 기간: 24시간\n이 코드를 공유하여 멤버를 초대하세요.`,
        [{ text: '확인' }]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || '초대 코드 생성에 실패했습니다.';
      Alert.alert('오류', message);
    }
  };

  const handleToggleComplete = () => {
    if (isCompleted) {
      Alert.alert(
        '정산 다시 열기',
        '정산을 다시 열면 수정이 가능합니다. 계속하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '다시 열기',
            onPress: async () => {
              try {
                await updateSettlement(settlementId, { status: SettlementStatus.ACTIVE });
                await loadData();
              } catch (error) {
                Alert.alert('오류', '정산 상태를 변경할 수 없습니다.');
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
              try {
                await updateSettlement(settlementId, { status: SettlementStatus.COMPLETED });
                await loadData();
              } catch (error) {
                Alert.alert('오류', '정산 상태를 변경할 수 없습니다.');
              }
            },
          },
        ]
      );
    }
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

          {/* 정산 완료/다시 열기 + 수정/삭제 버튼 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.completeToggleButton, isCompleted ? styles.reopenButton : styles.completeButton]}
              onPress={handleToggleComplete}
            >
              <Text style={styles.completeToggleButtonText}>
                {isCompleted ? '다시 열기' : '정산 완료'}
              </Text>
            </TouchableOpacity>
          </View>
          {!isCompleted && (
            <View style={[styles.actionButtons, { marginTop: 8 }]}>
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
          )}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>정산 완료됨</Text>
            </View>
          )}
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

        {/* 멤버 섹션 */}
        {members.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>멤버 ({members.length})</Text>
              <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
                <Text style={styles.inviteButtonText}>초대</Text>
              </TouchableOpacity>
            </View>
            {members.map(member => (
              <View key={member.id} style={styles.memberRow}>
                <Text style={styles.memberName}>{member.userId.substring(0, 8)}...</Text>
                <View style={[styles.roleBadge, member.role === 'OWNER' ? styles.ownerBadge : styles.memberBadge]}>
                  <Text style={styles.roleBadgeText}>{member.role === 'OWNER' ? '소유자' : '멤버'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
            {!isCompleted && (
              <AnimatedButton
                title="+ 추가"
                onPress={() => setAddParticipantModalVisible(true)}
                variant="primary"
                size="small"
                feedbackType="scale"
                style={styles.addButton}
                textStyle={styles.addButtonText}
              />
            )}
          </View>
          <ParticipantList
            participants={participants}
            onEdit={isCompleted ? undefined : handleEditParticipant}
            onToggleActive={isCompleted ? undefined : handleToggleParticipant}
            onDelete={isCompleted ? undefined : handleDeleteParticipant}
          />
        </View>

        {/* 지출 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>지출 내역</Text>
            {!isCompleted && (
              <AnimatedButton
                title="+ 추가"
                onPress={() => setAddExpenseModalVisible(true)}
                variant="primary"
                size="small"
                feedbackType="scale"
                style={styles.addButton}
                textStyle={styles.addButtonText}
              />
            )}
          </View>
          {expenses.length === 0 ? (
            <View style={styles.emptyExpenses}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={48}
                color={Colors.text.disabled}
              />
              <Text style={styles.emptyText}>지출 내역이 없습니다</Text>
              <Text style={styles.emptySubText}>지출을 추가해주세요</Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                currency={settlement.currency}
                onSetSplits={isCompleted ? undefined : handleSetExpenseSplits}
                onEdit={isCompleted ? undefined : handleEditExpense}
                onDelete={isCompleted ? undefined : handleDeleteExpense}
              />
            ))
          )}
        </View>

        {/* 정산 결과 버튼 */}
        <View style={styles.actionButtonsContainer}>
          <AnimatedButton
            title="✈️ 여행 정산 결과"
            onPress={handleViewSettlementResult}
            variant="primary"
            size="medium"
            feedbackType="pulse"
            style={styles.travelResultButton}
          />
        </View>
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  completeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.spacing.lg,
    borderRadius: Spacing.radius.md,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: Colors.status.success,
  },
  reopenButton: {
    backgroundColor: Colors.status.warning,
  },
  completeToggleButtonText: {
    ...Typography.styles.button,
    color: Colors.text.inverse,
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
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.spacing.lg,
    borderRadius: Spacing.radius.md,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
  },
  editButtonText: {
    ...Typography.styles.button,
    color: Colors.text.inverse,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.spacing.lg,
    borderRadius: Spacing.radius.md,
    backgroundColor: Colors.status.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...Typography.styles.button,
    color: Colors.text.inverse,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.lg,
    ...createShadowStyle('sm'),
  },
  statLabel: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginBottom: Spacing.spacing.sm,
  },
  statValue: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
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
    ...Typography.styles.h4,
    color: Colors.text.primary,
  },
  addButton: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.sm,
    borderRadius: Spacing.radius['2xl'],
    backgroundColor: Colors.primary.main,
  },
  addButtonText: {
    ...Typography.styles.label,
    color: Colors.primary.contrast,
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
  actionButtonsContainer: {
    flexDirection: 'row',
    margin: Spacing.spacing.lg,
    gap: Spacing.spacing.md,
  },
  travelResultButton: {
    flex: 1,
    backgroundColor: Colors.status.success,
  },
  inviteButton: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.sm,
    borderRadius: Spacing.radius['2xl'],
    backgroundColor: Colors.status.warning,
  },
  inviteButtonText: {
    ...Typography.styles.label,
    color: Colors.primary.contrast,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.spacing.md,
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.md,
    marginBottom: Spacing.spacing.xs + 2,
  },
  memberName: {
    ...Typography.styles.body2,
    color: Colors.text.primary,
  },
  roleBadge: {
    paddingHorizontal: Spacing.spacing.sm,
    paddingVertical: Spacing.spacing.xs,
    borderRadius: Spacing.radius.lg,
  },
  ownerBadge: {
    backgroundColor: Colors.action.secondary,
  },
  memberBadge: {
    backgroundColor: Colors.background.disabled,
  },
  roleBadgeText: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
});
