import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Participant } from '../models/Participant';
import { ExpenseWithDetails } from '../models/Expense';
import { CreateExpenseRequest, UpdateExpenseRequest, ExpenseSplitRequest } from '../models/Expense';
import ExpenseItem from '../components/ExpenseItem';
import AddExpenseModal from '../components/AddExpenseModal';
import EditExpenseModal from '../components/EditExpenseModal';
import ExpenseSplitModal from '../components/ExpenseSplitModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getExpenses,
  getParticipants,
  addExpense,
  updateExpense,
  deleteExpense,
  setExpenseSplits,
} from '../services/api/settlementService';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

export default function ExpenseListScreen() {
  const route = useRoute();
  const { settlementId, isCompleted, currency } = route.params as {
    settlementId: string;
    isCompleted: boolean;
    currency: string;
  };

  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, participantsData] = await Promise.all([
        getExpenses(settlementId),
        getParticipants(settlementId),
      ]);
      setExpenses(expensesData as ExpenseWithDetails[]);
      setParticipants(participantsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      Alert.alert('오류', '데이터를 불러올 수 없습니다.');
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

  const handleAddExpense = async (data: CreateExpenseRequest) => {
    await addExpense(settlementId, data);
    await loadData();
  };

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setSelectedExpense(expense);
    setEditModalVisible(true);
  };

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

  const handleSetExpenseSplits = (expense: ExpenseWithDetails) => {
    setSelectedExpense(expense);
    setSplitModalVisible(true);
  };

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

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isCompleted && (
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ 지출 추가</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            currency={currency}
            onSetSplits={isCompleted ? undefined : handleSetExpenseSplits}
            onEdit={isCompleted ? undefined : handleEditExpense}
            onDelete={isCompleted ? undefined : handleDeleteExpense}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyExpenses}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={48}
              color={Colors.text.disabled}
            />
            <Text style={styles.emptyText}>지출 내역이 없습니다</Text>
            <Text style={styles.emptySubText}>지출을 추가해주세요</Text>
          </View>
        }
      />

      <AddExpenseModal
        visible={addModalVisible}
        participants={participants}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddExpense}
      />

      {selectedExpense && (
        <EditExpenseModal
          visible={editModalVisible}
          expense={selectedExpense}
          participants={participants}
          onClose={() => setEditModalVisible(false)}
          onSubmit={handleUpdateExpense}
        />
      )}

      {selectedExpense && (
        <ExpenseSplitModal
          visible={splitModalVisible}
          expense={selectedExpense}
          participants={participants}
          onClose={() => setSplitModalVisible(false)}
          onSubmit={handleSubmitExpenseSplits}
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
  headerBar: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.md,
    backgroundColor: Colors.background.default,
  },
  addButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.spacing.md,
    borderRadius: Spacing.radius.md,
    alignItems: 'center',
  },
  addButtonText: {
    ...Typography.styles.button,
    color: Colors.primary.contrast,
  },
  listContent: {
    padding: Spacing.spacing.lg,
    paddingBottom: Spacing.spacing['3xl'],
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
});
