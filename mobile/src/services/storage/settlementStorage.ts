/**
 * Settlement 로컬 저장소
 * SQLite를 활용한 오프라인 데이터 저장 및 조회
 */

import { executeSql } from './database';
import { Settlement, SettlementType, SettlementStatus } from '../../models/Settlement';
import { Participant } from '../../models/Participant';
import { Expense, ExpenseSplit } from '../../models/Expense';

/**
 * 정산 저장
 * @param settlement 정산 데이터
 */
export const saveSettlement = async (settlement: Settlement): Promise<void> => {
  try {
    const sql = `
      INSERT OR REPLACE INTO settlements (
        id, title, type, status, creator_id, description,
        start_date, end_date, currency, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      settlement.id,
      settlement.title,
      settlement.type,
      settlement.status,
      settlement.creatorId,
      settlement.description || null,
      settlement.startDate || null,
      settlement.endDate || null,
      settlement.currency,
      settlement.createdAt,
      settlement.updatedAt,
    ];

    await executeSql(sql, params);
    console.log(`✅ Settlement saved: ${settlement.id}`);
  } catch (error) {
    console.error('[saveSettlement] Error:', error);
    throw error;
  }
};

/**
 * 정산 ID로 조회
 * @param id 정산 ID
 * @returns 정산 데이터 또는 null
 */
export const getSettlementById = async (
  id: string
): Promise<Settlement | null> => {
  try {
    const sql = 'SELECT * FROM settlements WHERE id = ?';
    const result = await executeSql(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0);
    return mapRowToSettlement(row);
  } catch (error) {
    console.error('[getSettlementById] Error:', error);
    throw error;
  }
};

/**
 * 모든 정산 조회
 * @returns 정산 목록
 */
export const getAllSettlements = async (): Promise<Settlement[]> => {
  try {
    const sql = 'SELECT * FROM settlements ORDER BY created_at DESC';
    const result = await executeSql(sql);

    const settlements: Settlement[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      settlements.push(mapRowToSettlement(row));
    }

    return settlements;
  } catch (error) {
    console.error('[getAllSettlements] Error:', error);
    throw error;
  }
};

/**
 * 정산 삭제
 * @param id 정산 ID
 */
export const deleteSettlement = async (id: string): Promise<void> => {
  try {
    // 관련된 지출 분담, 지출, 참가자도 함께 삭제 (Cascade)
    await executeSql(
      'DELETE FROM expense_splits WHERE expense_id IN (SELECT id FROM expenses WHERE settlement_id = ?)',
      [id]
    );
    await executeSql('DELETE FROM expenses WHERE settlement_id = ?', [id]);
    await executeSql('DELETE FROM participants WHERE settlement_id = ?', [id]);
    await executeSql('DELETE FROM settlements WHERE id = ?', [id]);

    console.log(`✅ Settlement deleted: ${id}`);
  } catch (error) {
    console.error('[deleteSettlement] Error:', error);
    throw error;
  }
};

/**
 * 참가자 저장
 * @param participant 참가자 데이터
 */
export const saveParticipant = async (participant: Participant): Promise<void> => {
  try {
    const sql = `
      INSERT OR REPLACE INTO participants (
        id, settlement_id, user_id, name, is_active, joined_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      participant.id,
      participant.settlementId,
      participant.userId || null,
      participant.name,
      participant.isActive ? 1 : 0,
      participant.joinedAt,
    ];

    await executeSql(sql, params);
    console.log(`✅ Participant saved: ${participant.id}`);
  } catch (error) {
    console.error('[saveParticipant] Error:', error);
    throw error;
  }
};

/**
 * 정산 ID로 참가자 목록 조회
 * @param settlementId 정산 ID
 * @returns 참가자 목록
 */
export const getParticipantsBySettlementId = async (
  settlementId: string
): Promise<Participant[]> => {
  try {
    const sql = 'SELECT * FROM participants WHERE settlement_id = ? ORDER BY joined_at ASC';
    const result = await executeSql(sql, [settlementId]);

    const participants: Participant[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      participants.push(mapRowToParticipant(row));
    }

    return participants;
  } catch (error) {
    console.error('[getParticipantsBySettlementId] Error:', error);
    throw error;
  }
};

/**
 * 참가자 ID로 조회
 * @param id 참가자 ID
 * @returns 참가자 데이터 또는 null
 */
export const getParticipantById = async (
  id: string
): Promise<Participant | null> => {
  try {
    const sql = 'SELECT * FROM participants WHERE id = ?';
    const result = await executeSql(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0);
    return mapRowToParticipant(row);
  } catch (error) {
    console.error('[getParticipantById] Error:', error);
    throw error;
  }
};

/**
 * 참가자 삭제
 * @param id 참가자 ID
 */
export const deleteParticipant = async (id: string): Promise<void> => {
  try {
    await executeSql('DELETE FROM participants WHERE id = ?', [id]);
    console.log(`✅ Participant deleted: ${id}`);
  } catch (error) {
    console.error('[deleteParticipant] Error:', error);
    throw error;
  }
};

/**
 * 지출 저장
 * @param expense 지출 데이터
 */
export const saveExpense = async (expense: Expense): Promise<void> => {
  try {
    const sql = `
      INSERT OR REPLACE INTO expenses (
        id, settlement_id, payer_id, amount, category, category_ai,
        description, expense_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      expense.id,
      expense.settlementId,
      expense.payerId,
      expense.amount,
      expense.category || null,
      expense.categoryAi || null,
      expense.description,
      expense.expenseDate,
      expense.createdAt,
      expense.updatedAt,
    ];

    await executeSql(sql, params);
    console.log(`✅ Expense saved: ${expense.id}`);
  } catch (error) {
    console.error('[saveExpense] Error:', error);
    throw error;
  }
};

/**
 * 정산 ID로 지출 목록 조회
 * @param settlementId 정산 ID
 * @returns 지출 목록
 */
export const getExpensesBySettlementId = async (
  settlementId: string
): Promise<Expense[]> => {
  try {
    const sql = 'SELECT * FROM expenses WHERE settlement_id = ? ORDER BY expense_date DESC';
    const result = await executeSql(sql, [settlementId]);

    const expenses: Expense[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      expenses.push(mapRowToExpense(row));
    }

    return expenses;
  } catch (error) {
    console.error('[getExpensesBySettlementId] Error:', error);
    throw error;
  }
};

/**
 * 지출 ID로 조회
 * @param id 지출 ID
 * @returns 지출 데이터 또는 null
 */
export const getExpenseById = async (id: string): Promise<Expense | null> => {
  try {
    const sql = 'SELECT * FROM expenses WHERE id = ?';
    const result = await executeSql(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0);
    return mapRowToExpense(row);
  } catch (error) {
    console.error('[getExpenseById] Error:', error);
    throw error;
  }
};

/**
 * 지출 삭제
 * @param id 지출 ID
 */
export const deleteExpense = async (id: string): Promise<void> => {
  try {
    // 관련된 지출 분담도 함께 삭제
    await executeSql('DELETE FROM expense_splits WHERE expense_id = ?', [id]);
    await executeSql('DELETE FROM expenses WHERE id = ?', [id]);
    console.log(`✅ Expense deleted: ${id}`);
  } catch (error) {
    console.error('[deleteExpense] Error:', error);
    throw error;
  }
};

/**
 * 지출 분담 저장
 * @param split 지출 분담 데이터
 */
export const saveExpenseSplit = async (split: ExpenseSplit): Promise<void> => {
  try {
    const sql = `
      INSERT OR REPLACE INTO expense_splits (
        id, expense_id, participant_id, share
      ) VALUES (?, ?, ?, ?)
    `;

    const params = [split.id, split.expenseId, split.participantId, split.share];

    await executeSql(sql, params);
    console.log(`✅ ExpenseSplit saved: ${split.id}`);
  } catch (error) {
    console.error('[saveExpenseSplit] Error:', error);
    throw error;
  }
};

/**
 * 지출 ID로 분담 목록 조회
 * @param expenseId 지출 ID
 * @returns 지출 분담 목록
 */
export const getExpenseSplitsByExpenseId = async (
  expenseId: string
): Promise<ExpenseSplit[]> => {
  try {
    const sql = 'SELECT * FROM expense_splits WHERE expense_id = ?';
    const result = await executeSql(sql, [expenseId]);

    const splits: ExpenseSplit[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      splits.push(mapRowToExpenseSplit(row));
    }

    return splits;
  } catch (error) {
    console.error('[getExpenseSplitsByExpenseId] Error:', error);
    throw error;
  }
};

/**
 * 지출 분담 삭제
 * @param id 지출 분담 ID
 */
export const deleteExpenseSplit = async (id: string): Promise<void> => {
  try {
    await executeSql('DELETE FROM expense_splits WHERE id = ?', [id]);
    console.log(`✅ ExpenseSplit deleted: ${id}`);
  } catch (error) {
    console.error('[deleteExpenseSplit] Error:', error);
    throw error;
  }
};

/**
 * 지출 ID로 모든 분담 삭제
 * @param expenseId 지출 ID
 */
export const deleteExpenseSplitsByExpenseId = async (
  expenseId: string
): Promise<void> => {
  try {
    await executeSql('DELETE FROM expense_splits WHERE expense_id = ?', [expenseId]);
    console.log(`✅ ExpenseSplits deleted for expense: ${expenseId}`);
  } catch (error) {
    console.error('[deleteExpenseSplitsByExpenseId] Error:', error);
    throw error;
  }
};

// ==================== 매핑 헬퍼 함수 ====================

/**
 * DB Row를 Settlement 객체로 변환
 */
const mapRowToSettlement = (row: any): Settlement => {
  return {
    id: row.id,
    title: row.title,
    type: row.type as SettlementType,
    status: row.status as SettlementStatus,
    creatorId: row.creator_id,
    description: row.description || undefined,
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * DB Row를 Participant 객체로 변환
 */
const mapRowToParticipant = (row: any): Participant => {
  return {
    id: row.id,
    settlementId: row.settlement_id,
    userId: row.user_id || undefined,
    name: row.name,
    isActive: row.is_active === 1,
    joinedAt: row.joined_at,
  };
};

/**
 * DB Row를 Expense 객체로 변환
 */
const mapRowToExpense = (row: any): Expense => {
  return {
    id: row.id,
    settlementId: row.settlement_id,
    payerId: row.payer_id,
    amount: row.amount,
    category: row.category || undefined,
    categoryAi: row.category_ai || undefined,
    description: row.description,
    expenseDate: row.expense_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * DB Row를 ExpenseSplit 객체로 변환
 */
const mapRowToExpenseSplit = (row: any): ExpenseSplit => {
  return {
    id: row.id,
    expenseId: row.expense_id,
    participantId: row.participant_id,
    share: row.share,
  };
};

/**
 * SettlementStorage 객체 내보내기 (선택적 사용)
 */
export const SettlementStorage = {
  saveSettlement,
  getSettlementById,
  getAllSettlements,
  deleteSettlement,
  saveParticipant,
  getParticipantsBySettlementId,
  getParticipantById,
  deleteParticipant,
  saveExpense,
  getExpensesBySettlementId,
  getExpenseById,
  deleteExpense,
  saveExpenseSplit,
  getExpenseSplitsByExpenseId,
  deleteExpenseSplit,
  deleteExpenseSplitsByExpenseId,
};

export default SettlementStorage;
