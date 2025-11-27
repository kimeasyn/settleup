import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Expense, ExpenseWithDetails } from '../models/Expense';

interface ExpenseItemProps {
  expense: ExpenseWithDetails;
  currency?: string;
  onPress?: (expense: ExpenseWithDetails) => void;
  onDelete?: (expenseId: string) => void;
  onEdit?: (expense: ExpenseWithDetails) => void;
}

/**
 * ExpenseItem
 * 지출 항목 컴포넌트
 */
export default function ExpenseItem({
  expense,
  currency = 'KRW',
  onPress,
  onDelete,
  onEdit,
}: ExpenseItemProps) {
  const [expanded, setExpanded] = useState(false);

  /**
   * 금액 포맷팅
   */
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `오늘 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  /**
   * 카테고리 배경색
   */
  const getCategoryColor = (category?: string): string => {
    if (!category) return '#E0E0E0';

    const colors: { [key: string]: string } = {
      '식비': '#FFE0B2',
      '교통': '#B3E5FC',
      '숙박': '#C5E1A5',
      '관광': '#F8BBD0',
      '쇼핑': '#D1C4E9',
      '기타': '#E0E0E0',
    };

    return colors[category] || '#E0E0E0';
  };

  /**
   * 지출 삭제
   */
  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      '지출 삭제',
      `"${expense.description}" 지출을 삭제하시겠습니까?\n관련 분담 내역도 함께 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => onDelete(expense.id),
        },
      ]
    );
  };

  /**
   * 항목 토글
   */
  const handleToggle = () => {
    if (onPress) {
      onPress(expense);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      {/* 메인 정보 */}
      <View style={styles.mainInfo}>
        {/* 왼쪽: 설명 및 카테고리 */}
        <View style={styles.leftSection}>
          <Text style={styles.description} numberOfLines={1}>
            {expense.description}
          </Text>
          <View style={styles.metaInfo}>
            {expense.effectiveCategory && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor(expense.effectiveCategory) }
                ]}
              >
                <Text style={styles.categoryText}>{expense.effectiveCategory}</Text>
              </View>
            )}
            <Text style={styles.payerText}>{expense.payerName}님 지출</Text>
            <Text style={styles.dateText}>· {formatDate(expense.expenseDate)}</Text>
          </View>
        </View>

        {/* 오른쪽: 금액 */}
        <View style={styles.rightSection}>
          <Text style={styles.amount}>{formatAmount(expense.amount)}</Text>
          <Text style={styles.currency}>{currency}</Text>
        </View>
      </View>

      {/* 확장된 상세 정보 */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />

          {/* 분담 내역 */}
          {expense.splits && expense.splits.length > 0 && (
            <View style={styles.splitsSection}>
              <Text style={styles.splitsTitle}>분담 내역</Text>
              {expense.splits.map((split) => (
                <View key={split.id} style={styles.splitItem}>
                  <Text style={styles.splitName}>{split.participantName}</Text>
                  <View style={styles.splitAmount}>
                    <Text style={styles.splitAmountText}>
                      {formatAmount(split.share)} {currency}
                    </Text>
                    {split.sharePercentage !== undefined && (
                      <Text style={styles.splitPercentage}>
                        ({split.sharePercentage.toFixed(1)}%)
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 액션 버튼 */}
          {(onEdit || onDelete) && (
            <View style={styles.actionButtons}>
              {onEdit && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => onEdit(expense)}
                >
                  <Text style={styles.editButtonText}>수정</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 6,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    color: '#424242',
    fontWeight: '500',
  },
  payerText: {
    fontSize: 12,
    color: '#616161',
  },
  dateText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  currency: {
    fontSize: 11,
    color: '#757575',
  },
  expandedSection: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  splitsSection: {
    marginBottom: 12,
  },
  splitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 8,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  splitName: {
    fontSize: 14,
    color: '#424242',
  },
  splitAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  splitAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  splitPercentage: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  editButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
});
