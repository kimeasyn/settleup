/**
 * Settlement API 서비스
 * 정산 관련 API 호출 로직
 */

import { apiClient } from './client';
import {
  Settlement,
  CreateSettlementRequest,
  UpdateSettlementRequest,
} from '../../models/Settlement';
import {
  Participant,
  AddParticipantRequest,
  UpdateParticipantRequest,
} from '../../models/Participant';
import {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseSplitRequest,
} from '../../models/Expense';
import { SettlementResult } from '../../models/SettlementResult';

/**
 * 정산 생성
 * @param data 정산 생성 요청 데이터
 * @returns 생성된 정산 정보
 */
export const createSettlement = async (
  data: CreateSettlementRequest
): Promise<Settlement> => {
  try {
    const response = await apiClient.post<Settlement>('/settlements', data);
    return response.data;
  } catch (error) {
    console.error('[createSettlement] Error:', error);
    throw error;
  }
};

/**
 * 정산 조회
 * @param id 정산 ID
 * @returns 정산 정보
 */
export const getSettlement = async (id: string): Promise<Settlement> => {
  try {
    const response = await apiClient.get<Settlement>(`/settlements/${id}`);
    return response.data;
  } catch (error) {
    console.error('[getSettlement] Error:', error);
    throw error;
  }
};

/**
 * 정산 목록 조회
 * @returns 정산 목록
 */
export const getSettlements = async (): Promise<Settlement[]> => {
  try {
    const response = await apiClient.get<Settlement[]>('/settlements');
    return response.data;
  } catch (error) {
    console.error('[getSettlements] Error:', error);
    throw error;
  }
};

/**
 * 정산 검색 및 필터링 (페이징)
 * @param query 검색어
 * @param status 정산 상태
 * @param type 정산 타입
 * @param page 페이지 번호
 * @param size 페이지 크기
 * @returns 페이징된 정산 목록
 */
export const searchSettlements = async (
  query?: string,
  status?: SettlementStatus,
  type?: SettlementType,
  page: number = 0,
  size: number = 20
): Promise<{
  content: Settlement[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}> => {
  try {
    const params: any = { page, size };
    if (query) params.query = query;
    if (status) params.status = status;
    if (type) params.type = type;

    const response = await apiClient.get('/settlements/search', { params });
    return response.data;
  } catch (error) {
    console.error('[searchSettlements] Error:', error);
    throw error;
  }
};

/**
 * 정산 업데이트
 * @param id 정산 ID
 * @param data 업데이트 요청 데이터
 * @returns 업데이트된 정산 정보
 */
export const updateSettlement = async (
  id: string,
  data: UpdateSettlementRequest
): Promise<Settlement> => {
  try {
    const response = await apiClient.put<Settlement>(
      `/settlements/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('[updateSettlement] Error:', error);
    throw error;
  }
};

/**
 * 정산 삭제
 * @param id 정산 ID
 */
export const deleteSettlement = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/settlements/${id}`);
  } catch (error) {
    console.error('[deleteSettlement] Error:', error);
    throw error;
  }
};

/**
 * 참가자 추가
 * @param settlementId 정산 ID
 * @param data 참가자 추가 요청 데이터
 * @returns 추가된 참가자 정보
 */
export const addParticipant = async (
  settlementId: string,
  data: AddParticipantRequest
): Promise<Participant> => {
  try {
    const response = await apiClient.post<Participant>(
      `/settlements/${settlementId}/participants`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('[addParticipant] Error:', error);
    throw error;
  }
};

/**
 * 참가자 목록 조회
 * @param settlementId 정산 ID
 * @returns 참가자 목록
 */
export const getParticipants = async (
  settlementId: string
): Promise<Participant[]> => {
  try {
    const response = await apiClient.get<Participant[]>(
      `/settlements/${settlementId}/participants`
    );
    return response.data;
  } catch (error) {
    console.error('[getParticipants] Error:', error);
    throw error;
  }
};

/**
 * 참가자 업데이트
 * @param settlementId 정산 ID
 * @param participantId 참가자 ID
 * @param data 업데이트 요청 데이터
 * @returns 업데이트된 참가자 정보
 */
export const updateParticipant = async (
  settlementId: string,
  participantId: string,
  data: UpdateParticipantRequest
): Promise<Participant> => {
  try {
    const response = await apiClient.put<Participant>(
      `/settlements/${settlementId}/participants/${participantId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('[updateParticipant] Error:', error);
    throw error;
  }
};

/**
 * 참가자 삭제
 * @param settlementId 정산 ID
 * @param participantId 참가자 ID
 */
export const deleteParticipant = async (
  settlementId: string,
  participantId: string
): Promise<void> => {
  try {
    await apiClient.delete(
      `/settlements/${settlementId}/participants/${participantId}`
    );
  } catch (error) {
    console.error('[deleteParticipant] Error:', error);
    throw error;
  }
};

/**
 * 지출 추가
 * @param settlementId 정산 ID
 * @param data 지출 추가 요청 데이터
 * @returns 추가된 지출 정보
 */
export const addExpense = async (
  settlementId: string,
  data: CreateExpenseRequest
): Promise<Expense> => {
  try {
    const response = await apiClient.post<Expense>(
      `/settlements/${settlementId}/expenses`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('[addExpense] Error:', error);
    throw error;
  }
};

/**
 * 지출 목록 조회
 * @param settlementId 정산 ID
 * @returns 지출 목록
 */
export const getExpenses = async (settlementId: string): Promise<Expense[]> => {
  try {
    const response = await apiClient.get<Expense[]>(
      `/settlements/${settlementId}/expenses`
    );
    return response.data;
  } catch (error) {
    console.error('[getExpenses] Error:', error);
    throw error;
  }
};

/**
 * 지출 업데이트
 * @param settlementId 정산 ID
 * @param expenseId 지출 ID
 * @param data 업데이트 요청 데이터
 * @returns 업데이트된 지출 정보
 */
export const updateExpense = async (
  settlementId: string,
  expenseId: string,
  data: UpdateExpenseRequest
): Promise<Expense> => {
  try {
    const response = await apiClient.put<Expense>(
      `/settlements/${settlementId}/expenses/${expenseId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('[updateExpense] Error:', error);
    throw error;
  }
};

/**
 * 지출 삭제
 * @param settlementId 정산 ID
 * @param expenseId 지출 ID
 */
export const deleteExpense = async (
  settlementId: string,
  expenseId: string
): Promise<void> => {
  try {
    await apiClient.delete(
      `/settlements/${settlementId}/expenses/${expenseId}`
    );
  } catch (error) {
    console.error('[deleteExpense] Error:', error);
    throw error;
  }
};

/**
 * 지출 분담 설정
 * @param settlementId 정산 ID
 * @param expenseId 지출 ID
 * @param data 분담 설정 데이터
 * @returns 업데이트된 지출 정보
 */
export const setExpenseSplits = async (
  settlementId: string,
  expenseId: string,
  data: ExpenseSplitRequest
): Promise<Expense> => {
  try {
    const response = await apiClient.put<Expense>(
      `/settlements/${settlementId}/expenses/${expenseId}/splits`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('[setExpenseSplits] Error:', error);
    throw error;
  }
};

/**
 * 정산 계산
 * @param settlementId 정산 ID
 * @param remainderPayerId 나머지 지불 참가자 ID (선택)
 * @param remainderAmount 추가 부담 금액 (선택)
 * @returns 정산 결과
 */
export const calculateSettlement = async (
  settlementId: string,
  remainderPayerId?: string,
  remainderAmount?: number
): Promise<SettlementResult> => {
  try {
    const params: any = {};
    if (remainderPayerId) {
      params.remainderPayerId = remainderPayerId;
    }
    if (remainderAmount !== undefined && remainderAmount !== null) {
      params.remainderAmount = remainderAmount;
    }

    const response = await apiClient.post<SettlementResult>(
      `/settlements/${settlementId}/calculate`,
      null,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('[calculateSettlement] Error:', error);
    throw error;
  }
};

/**
 * SettlementService 객체 내보내기 (선택적 사용)
 */
export const SettlementService = {
  createSettlement,
  getSettlement,
  getSettlements,
  updateSettlement,
  deleteSettlement,
  addParticipant,
  getParticipants,
  updateParticipant,
  deleteParticipant,
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  setExpenseSplits,
  calculateSettlement,
};

export default SettlementService;
