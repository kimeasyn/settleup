import * as SQLite from 'expo-sqlite';

const DB_NAME = 'settleup.db';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return _db;
}

export const initializeDatabase = async (): Promise<void> => {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settlements (
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
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      settlement_id TEXT NOT NULL,
      user_id TEXT,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      joined_at TEXT NOT NULL,
      FOREIGN KEY (settlement_id) REFERENCES settlements(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
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
    );

    CREATE TABLE IF NOT EXISTS expense_splits (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      share REAL NOT NULL,
      FOREIGN KEY (expense_id) REFERENCES expenses(id),
      FOREIGN KEY (participant_id) REFERENCES participants(id)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0
    );
  `);

  console.log('Database initialized successfully');
};

export const clearDatabase = async (): Promise<void> => {
  const db = await getDatabase();

  await db.execAsync(`
    DROP TABLE IF EXISTS sync_queue;
    DROP TABLE IF EXISTS expense_splits;
    DROP TABLE IF EXISTS expenses;
    DROP TABLE IF EXISTS participants;
    DROP TABLE IF EXISTS settlements;
  `);

  console.log('Database cleared');
};

export const executeSql = async (
  sql: string,
  params: any[] = []
): Promise<any[]> => {
  const db = await getDatabase();
  return db.getAllAsync(sql, params);
};

export const runSql = async (
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult> => {
  const db = await getDatabase();
  return db.runAsync(sql, params);
};
