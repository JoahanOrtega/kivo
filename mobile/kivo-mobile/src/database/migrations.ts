import { getDatabase } from "@/database/db";

/**
 * Inicializa la base local y crea las tablas mínimas del MVP.
 * Este bloque es idempotente y puede ejecutarse en cada arranque.
 */
export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      is_default INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
      is_default INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      local_id TEXT PRIMARY KEY NOT NULL,
      server_id TEXT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL CHECK (amount > 0),
      category_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      concept TEXT,
      budget_amount REAL,
      note TEXT,
      transaction_date TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK (
        sync_status IN ('pending_create', 'pending_update', 'pending_delete', 'synced', 'failed')
      ),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user_id
      ON transactions (user_id);

    CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date
      ON transactions (transaction_date);

    CREATE INDEX IF NOT EXISTS idx_transactions_sync_status
      ON transactions (sync_status);
  `);

  await seedBaseCatalogs();
}

/**
 * Inserta catálogos mínimos solo si aún no existen.
 */
async function seedBaseCatalogs(): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const existingCategories = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM categories`
  );

  if ((existingCategories?.count ?? 0) === 0) {
    await db.runAsync(
      `
        INSERT INTO categories (id, name, type, is_default, is_active, created_at, updated_at)
        VALUES
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?)
      `,
      [
        "cat-expense-general",
        "Gastos",
        "expense",
        now,
        now,

        "cat-expense-services",
        "Servicios",
        "expense",
        now,
        now,

        "cat-expense-debts",
        "Deudas",
        "expense",
        now,
        now,

        "cat-expense-savings",
        "Ahorro",
        "expense",
        now,
        now,

        "cat-income-salary",
        "Ingreso",
        "income",
        now,
        now,

        "cat-income-other",
        "Otros ingresos",
        "income",
        now,
        now,
      ]
    );
  }

  const existingAccounts = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM accounts`
  );

  if ((existingAccounts?.count ?? 0) === 0) {
    await db.runAsync(
      `
        INSERT INTO accounts (id, name, type, is_default, is_active, created_at, updated_at)
        VALUES
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?),
          (?, ?, ?, 1, 1, ?, ?)
      `,
      [
        "acc-cash",
        "Efectivo",
        "both",
        now,
        now,

        "acc-bbva-credit",
        "TDC BBVA",
        "expense",
        now,
        now,

        "acc-didi-credit",
        "TDC DiDi",
        "expense",
        now,
        now,

        "acc-debit",
        "Débito",
        "both",
        now,
        now,

        "acc-transfer",
        "Transferencia",
        "both",
        now,
        now,

        "acc-payroll",
        "Nómina",
        "income",
        now,
        now,
      ]
    );
  }
}