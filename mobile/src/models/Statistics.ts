/**
 * 통계 및 리포트 관련 타입 정의
 */

// 기본 통계 데이터 포인트
export interface StatisticDataPoint {
  label: string;
  value: number;
  color?: string;
}

// 시간별 통계 (월별/연도별)
export interface TimePeriodStatistics {
  period: string; // "2024-01", "2024", etc.
  totalAmount: number;
  expenseCount: number;
  averageExpense: number;
  categories: CategoryStatistics[];
}

// 카테고리별 통계
export interface CategoryStatistics {
  category: string;
  totalAmount: number;
  expenseCount: number;
  percentage: number;
  color: string;
}

// 참가자별 통계
export interface ParticipantStatistics {
  participantId: string;
  participantName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number; // totalPaid - totalOwed
  expenseCount: number;
}

// 정산별 요약 통계
export interface SettlementSummary {
  settlementId: string;
  settlementTitle: string;
  totalAmount: number;
  participantCount: number;
  expenseCount: number;
  avgAmountPerParticipant: number;
  duration: number; // 일수
  categories: CategoryStatistics[];
}

// 전체 대시보드 통계
export interface DashboardStatistics {
  totalSettlements: number;
  totalExpenses: number;
  totalAmount: number;
  avgSettlementAmount: number;
  activeSettlements: number;
  recentMonths: TimePeriodStatistics[];
  topCategories: CategoryStatistics[];
  recentActivity: RecentActivity[];
}

// 최근 활동
export interface RecentActivity {
  id: string;
  type: 'expense_added' | 'settlement_created' | 'settlement_completed';
  title: string;
  description: string;
  amount?: number;
  date: string;
  settlementTitle: string;
}

// 차트 데이터 타입
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

// 필터 옵션
export interface StatisticsFilter {
  dateRange: DateRange;
  settlementIds?: string[];
  categories?: string[];
  participantIds?: string[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// 통계 타입 열거형
export enum StatisticsType {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CATEGORY = 'category',
  PARTICIPANT = 'participant',
  SETTLEMENT = 'settlement',
}

// 차트 타입 열거형
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
}

// API 응답 타입
export interface StatisticsResponse {
  success: boolean;
  data: DashboardStatistics | TimePeriodStatistics[] | CategoryStatistics[];
  message?: string;
}

// 통계 요청 파라미터
export interface StatisticsRequest {
  type: StatisticsType;
  filter: StatisticsFilter;
}

// 내보내기 데이터 타입
export interface ExportData {
  title: string;
  period: string;
  data: any[];
  format: 'csv' | 'json' | 'pdf';
}