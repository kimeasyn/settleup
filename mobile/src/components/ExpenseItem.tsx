import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Expense, ExpenseWithDetails } from '../models/Expense';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

interface ExpenseItemProps {
  expense: ExpenseWithDetails;
  currency?: string;
  onPress?: (expense: ExpenseWithDetails) => void;
  onDelete?: (expenseId: string) => void;
  onEdit?: (expense: ExpenseWithDetails) => void;
  onSetSplits?: (expense: ExpenseWithDetails) => void;
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
  onSetSplits,
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
    if (!category) return Colors.semantic.expense.other;

    const colors: { [key: string]: string } = {
      '식비': Colors.semantic.expense.food,
      '교통': Colors.semantic.expense.transport,
      '숙박': Colors.semantic.expense.lodging,
      '관광': Colors.semantic.expense.tourism,
      '쇼핑': Colors.semantic.expense.shopping,
      '기타': Colors.semantic.expense.other,
    };

    return colors[category] || Colors.semantic.expense.other;
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
          {(onSetSplits || onEdit || onDelete) && (
            <View style={styles.actionButtons}>
              {onSetSplits && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.splitButton]}
                  onPress={() => onSetSplits(expense)}
                >
                  <Text style={styles.splitButtonText}>분담설정</Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.component.card,
    marginBottom: Spacing.component.list,
    ...createShadowStyle('sm'),
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
    marginRight: Spacing.spacing.lg,
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
    gap: Spacing.spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.spacing.sm,
    paddingVertical: 2,
    borderRadius: Spacing.radius.lg,
  },
  categoryText: {
    ...Typography.styles.overline,
    color: Colors.text.secondary,
    textTransform: 'none',
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
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  currency: {
    ...Typography.styles.overline,
    color: Colors.text.secondary,
    textTransform: 'none',
  },
  expandedSection: {
    marginTop: Spacing.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginBottom: Spacing.spacing.lg,
  },
  splitsSection: {
    marginBottom: Spacing.spacing.lg,
  },
  splitsTitle: {
    ...Typography.styles.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.sm,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.spacing.sm,
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
    ...Typography.styles.overline,
    color: Colors.text.hint,
    textTransform: 'none',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.spacing.sm,
    marginTop: Spacing.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.spacing.sm,
    borderRadius: Spacing.radius.sm,
    alignItems: 'center',
  },
  splitButton: {
    backgroundColor: Colors.action.success,
  },
  editButton: {
    backgroundColor: Colors.action.secondary,
  },
  deleteButton: {
    backgroundColor: Colors.action.danger,
  },
  splitButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
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
