import { getDatabase } from "@/database/db";

// ─── Versión del schema ───────────────────────────────────────────────────────
const SCHEMA_VERSION = 2;

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();
  await migrate(db, 0);

}

async function migrate(db: any, fromVersion: number): Promise<void> {
  if (fromVersion < 2) {
    await db.execAsync(`PRAGMA foreign_keys = OFF;`);
    await db.execAsync(`DROP TABLE IF EXISTS sync_queue;`);
    await db.execAsync(`DROP TABLE IF EXISTS transactions;`);
    await db.execAsync(`DROP TABLE IF EXISTS accounts;`);
    await db.execAsync(`DROP TABLE IF EXISTS categories;`);
    await db.execAsync(`DROP TABLE IF EXISTS payment_methods;`);

    await db.execAsync(`
            CREATE TABLE categories (
                id          TEXT PRIMARY KEY NOT NULL,
                user_id     TEXT,
                name        TEXT NOT NULL,
                type        TEXT NOT NULL,
                color       TEXT NOT NULL DEFAULT '#6B7280',
                icon        TEXT NOT NULL DEFAULT 'tag',
                sort_order  INTEGER NOT NULL DEFAULT 0,
                is_active   INTEGER NOT NULL DEFAULT 1,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL,
                sync_status TEXT NOT NULL DEFAULT 'synced'
            );
        `);

    await db.execAsync(`
            CREATE TABLE payment_methods (
                id          TEXT PRIMARY KEY NOT NULL,
                user_id     TEXT NOT NULL,
                name        TEXT NOT NULL,
                type        TEXT NOT NULL,
                last_four   TEXT,
                color       TEXT NOT NULL DEFAULT '#6B7280',
                icon        TEXT NOT NULL DEFAULT 'credit-card',
                is_active   INTEGER NOT NULL DEFAULT 1,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL,
                sync_status TEXT NOT NULL DEFAULT 'synced'
            );
        `);

    await db.execAsync(`
            CREATE TABLE transactions (
                id                  TEXT PRIMARY KEY NOT NULL,
                user_id             TEXT NOT NULL,
                category_id         TEXT NOT NULL,
                payment_method_id   TEXT,
                transaction_date    TEXT NOT NULL,
                type                TEXT NOT NULL,
                concept             TEXT,
                amount              REAL NOT NULL,
                budgeted_amount     REAL,
                notes               TEXT,
                deleted_at          TEXT,
                created_at          TEXT NOT NULL,
                updated_at          TEXT NOT NULL,
                sync_status         TEXT NOT NULL DEFAULT 'pending'
            );
        `);

    await db.execAsync(`
            CREATE TABLE sync_queue (
                id              TEXT PRIMARY KEY NOT NULL,
                entity_type     TEXT NOT NULL,
                entity_local_id TEXT NOT NULL,
                operation_type  TEXT NOT NULL,
                payload_json    TEXT NOT NULL,
                status          TEXT NOT NULL,
                retry_count     INTEGER NOT NULL DEFAULT 0,
                last_error      TEXT,
                created_at      TEXT NOT NULL,
                updated_at      TEXT NOT NULL
            );
        `);

    await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (transaction_date);
            CREATE INDEX IF NOT EXISTS idx_transactions_sync ON transactions (sync_status);
            CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status);
        `);

    await db.execAsync(`PRAGMA foreign_keys = ON;`);
    await db.runAsync(`PRAGMA user_version = 2;`);
  }
}