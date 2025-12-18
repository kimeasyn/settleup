import {
  TimePeriodStatistics,
  CategoryStatistics,
  ParticipantStatistics,
  SettlementSummary,
  DashboardStatistics,
  StatisticDataPoint,
  ChartData,
  DateRange,
  RecentActivity
} from '../models/Statistics';
import { Settlement } from '../models/Settlement';
import { ExpenseWithDetails } from '../models/Expense';
import { Participant } from '../models/Participant';

/**
 * 통계 계산 유틸리티 함수들
 */

// 카테고리 색상 매핑
const CATEGORY_COLORS: { [key: string]: string } = {
  '식비': '#FF6B6B',
  '교통': '#4ECDC4',
  '숙박': '#45B7D1',
  '관광': '#96CEB4',
  '쇼핑': '#FFEAA7',
  '기타': '#DDA0DD',
};

/**
 * 월별 통계 계산
 */
export const calculateMonthlyStatistics = (
  expenses: ExpenseWithDetails[],
  dateRange: DateRange
): TimePeriodStatistics[] => {
  const monthlyData: { [key: string]: ExpenseWithDetails[] } = {};

  // 날짜 범위 내 지출을 월별로 그룹핑
  expenses
    .filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      return expenseDate >= startDate && expenseDate <= endDate;
    })
    .forEach(expense => {
      const month = new Date(expense.expenseDate).toISOString().slice(0, 7); // "2024-01"
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(expense);
    });

  // 각 월의 통계 계산
  return Object.entries(monthlyData)
    .map(([month, monthExpenses]) => ({
      period: month,
      totalAmount: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      expenseCount: monthExpenses.length,
      averageExpense: monthExpenses.length > 0
        ? monthExpenses.reduce((sum, expense) => sum + expense.amount, 0) / monthExpenses.length
        : 0,
      categories: calculateCategoryStatistics(monthExpenses),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
};

/**
 * 카테고리별 통계 계산
 */
export const calculateCategoryStatistics = (
  expenses: ExpenseWithDetails[]
): CategoryStatistics[] => {
  const categoryData: { [key: string]: ExpenseWithDetails[] } = {};
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 카테고리별로 그룹핑
  expenses.forEach(expense => {
    const category = expense.effectiveCategory || '기타';
    if (!categoryData[category]) {
      categoryData[category] = [];
    }
    categoryData[category].push(expense);
  });

  // 각 카테고리의 통계 계산
  return Object.entries(categoryData)
    .map(([category, categoryExpenses]) => {
      const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      return {
        category,
        totalAmount: categoryTotal,
        expenseCount: categoryExpenses.length,
        percentage: totalAmount > 0 ? (categoryTotal / totalAmount) * 100 : 0,
        color: CATEGORY_COLORS[category] || '#95A5A6',
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);
};

/**
 * 참가자별 통계 계산
 */
export const calculateParticipantStatistics = (
  participants: Participant[],
  expenses: ExpenseWithDetails[]
): ParticipantStatistics[] => {
  return participants.map(participant => {
    // 해당 참가자가 지출한 총액
    const totalPaid = expenses
      .filter(expense => expense.payerId === participant.id)
      .reduce((sum, expense) => sum + expense.amount, 0);

    // 해당 참가자가 분담해야 할 총액
    const totalOwed = expenses
      .filter(expense => expense.splits?.some(split => split.participantId === participant.id))
      .reduce((sum, expense) => {
        const split = expense.splits?.find(s => s.participantId === participant.id);
        return sum + (split?.share || 0);
      }, 0);

    // 해당 참가자가 지출한 건수
    const expenseCount = expenses
      .filter(expense => expense.payerId === participant.id).length;

    return {
      participantId: participant.id,
      participantName: participant.name,
      totalPaid,
      totalOwed,
      balance: totalPaid - totalOwed,
      expenseCount,
    };
  });
};

/**
 * 정산 요약 통계 계산
 */
export const calculateSettlementSummary = (
  settlement: Settlement,
  participants: Participant[],
  expenses: ExpenseWithDetails[]
): SettlementSummary => {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgAmountPerParticipant = participants.length > 0 ? totalAmount / participants.length : 0;

  // 기간 계산
  const settlementDate = new Date(settlement.createdAt);
  const lastExpenseDate = expenses.length > 0
    ? new Date(Math.max(...expenses.map(e => new Date(e.expenseDate).getTime())))
    : settlementDate;
  const duration = Math.ceil((lastExpenseDate.getTime() - settlementDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    settlementId: settlement.id,
    settlementTitle: settlement.title,
    totalAmount,
    participantCount: participants.length,
    expenseCount: expenses.length,
    avgAmountPerParticipant,
    duration: Math.max(duration, 1), // 최소 1일
    categories: calculateCategoryStatistics(expenses),
  };
};

/**
 * 대시보드 통계 계산
 */
export const calculateDashboardStatistics = (
  settlements: Settlement[],
  allExpenses: ExpenseWithDetails[]
): DashboardStatistics => {
  const totalAmount = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const activeSettlements = settlements.filter(s => s.status === 'ACTIVE').length;
  const avgSettlementAmount = settlements.length > 0 ? totalAmount / settlements.length : 0;

  // 최근 6개월 데이터
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentExpenses = allExpenses.filter(
    expense => new Date(expense.expenseDate) >= sixMonthsAgo
  );

  const recentMonths = calculateMonthlyStatistics(recentExpenses, {
    startDate: sixMonthsAgo.toISOString(),
    endDate: new Date().toISOString(),
  });

  // 상위 카테고리 (전체 기간)
  const topCategories = calculateCategoryStatistics(allExpenses).slice(0, 5);

  // 최근 활동 (임시 - 실제로는 활동 로그에서 가져와야 함)
  const recentActivity: RecentActivity[] = allExpenses
    .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    .slice(0, 10)
    .map(expense => ({
      id: expense.id,
      type: 'expense_added' as const,
      title: '지출 추가',
      description: expense.description,
      amount: expense.amount,
      date: expense.expenseDate,
      settlementTitle: expense.settlementId || '알 수 없음',
    }));

  return {
    totalSettlements: settlements.length,
    totalExpenses: allExpenses.length,
    totalAmount,
    avgSettlementAmount,
    activeSettlements,
    recentMonths,
    topCategories,
    recentActivity,
  };
};

/**
 * 차트 데이터로 변환
 */
export const convertToChartData = (
  data: StatisticDataPoint[],
  type: 'line' | 'bar' | 'pie' = 'bar'
): ChartData => {
  const labels = data.map(item => item.label);
  const values = data.map(item => item.value);
  const colors = data.map(item => item.color || '#3498db');

  return {
    labels,
    datasets: [
      {
        label: '금액',
        data: values,
        backgroundColor: type === 'pie' ? colors : colors[0],
        borderColor: type === 'line' ? colors[0] : undefined,
        borderWidth: type === 'line' ? 2 : 0,
      },
    ],
  };
};

/**
 * 날짜 범위 유틸리티
 */
export const getDateRanges = () => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);
  const lastYear = new Date(now.getFullYear() - 1, 0, 1);

  return {
    thisMonth: {
      startDate: thisMonth.toISOString(),
      endDate: now.toISOString(),
    },
    lastMonth: {
      startDate: lastMonth.toISOString(),
      endDate: thisMonth.toISOString(),
    },
    thisYear: {
      startDate: thisYear.toISOString(),
      endDate: now.toISOString(),
    },
    lastYear: {
      startDate: lastYear.toISOString(),
      endDate: thisYear.toISOString(),
    },
    last6Months: {
      startDate: new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString(),
      endDate: now.toISOString(),
    },
  };
};

/**
 * 숫자 포맷팅
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

/**
 * 퍼센티지 포맷팅
 */
export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};