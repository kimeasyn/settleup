import * as SQLite from 'expo-sqlite';

/**
 * SQLite 데이터베이스 설정
 * 오프라인 데이터 저장용
 */

const DB_NAME = 'settleup.db';

/**
 * 데이터베이스 인스턴스
 */
export const db = SQLite.openDatabase(DB_NAME);

/**
 * 데이터베이스 초기화
 * 필요한 테이블 생성
 */
export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Settlements 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS settlements (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            creator_id TEXT,
            description TEXT,
            start_date TEXT,
            end_date TEXT,
            currency TEXT DEFAULT 'KRW',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            version INTEGER DEFAULT 0,
            sync_status TEXT DEFAULT 'PENDING'
          );`
        );

        // Participants 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS participants (
            id TEXT PRIMARY KEY,
            settlement_id TEXT NOT NULL,
            user_id TEXT,
            name TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            joined_at TEXT NOT NULL,
            FOREIGN KEY (settlement_id) REFERENCES settlements(id)
          );`
        );

        // Expenses 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            settlement_id TEXT NOT NULL,
            payer_id TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            category_ai TEXT,
            description TEXT NOT NULL,
            expense_date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            version INTEGER DEFAULT 0,
            FOREIGN KEY (settlement_id) REFERENCES settlements(id),
            FOREIGN KEY (payer_id) REFERENCES participants(id)
          );`
        );

        // Expense Splits 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS expense_splits (
            id TEXT PRIMARY KEY,
            expense_id TEXT NOT NULL,
            participant_id TEXT NOT NULL,
            share REAL NOT NULL,
            FOREIGN KEY (expense_id) REFERENCES expenses(id),
            FOREIGN KEY (participant_id) REFERENCES participants(id)
          );`
        );

        // Sync Queue 테이블 (오프라인 동기화용)
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            operation TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            retry_count INTEGER DEFAULT 0
          );`
        );

        console.log('✅ Database initialized successfully');
      },
      (error) => {
        console.error('❌ Database initialization failed:', error);
        reject(error);
      },
      () => {
        resolve();
      }
    );
  });
};

/**
 * 데이터베이스 초기화 (개발용)
 */
export const clearDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('DROP TABLE IF EXISTS sync_queue;');
        tx.executeSql('DROP TABLE IF EXISTS expense_splits;');
        tx.executeSql('DROP TABLE IF EXISTS expenses;');
        tx.executeSql('DROP TABLE IF EXISTS participants;');
        tx.executeSql('DROP TABLE IF EXISTS settlements;');

        console.log('✅ Database cleared');
      },
      (error) => {
        console.error('❌ Database clear failed:', error);
        reject(error);
      },
      () => {
        resolve();
      }
    );
  });
};

/**
 * SQL 쿼리 실행 헬퍼
 */
export const executeSql = (
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLResultSet> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          console.error('SQL Error:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};
