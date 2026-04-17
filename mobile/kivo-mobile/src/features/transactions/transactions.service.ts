import { getDatabase } from "@/database/db";
import {
    enqueueOrMergeSyncOperation,
    removeOpenQueueItems,
} from "@/features/sync/sync-queue.service";
import { randomUUID } from "expo-crypto";
export type CreateTransactionInput = {
    userId: string;
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    accountId: string;
    transactionDate: string;
    concept?: string | null;
    budgetAmount?: number | null;
    note?: string | null;
};

export type UpdateTransactionInput = {
    localId: string;
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    accountId: string;
    transactionDate: string;
    concept?: string | null;
    note?: string | null;
};

export type TransactionDetail = {
    localId: string;
    userId: string;
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    accountId: string;
    concept: string | null;
    note: string | null;
    transactionDate: string;
    syncStatus: string;
};

export type TransactionHistoryFilters = {
    year: number;
    month: number;
    type?: "all" | "income" | "expense";
    categoryId?: string;
    accountId?: string;
    searchText?: string;
};

// Ahora — UUID v4 verdadero, garantiza unicidad global.
// expo-crypto usa el generador criptográfico del sistema operativo,
// no Math.random() que es predecible y no es criptográficamente seguro.
function generateLocalId(): string {
    return randomUUID();
}

// Genera el rango de fechas para filtrar transacciones de un mes específico.
// Usamos strings de fecha pura 'YYYY-MM-DD' en lugar de ISO timestamps
// para que la comparación en SQLite sea consistente sin importar el timezone
// del dispositivo.
function getMonthRange(year: number, month: number) {
    // Padding para garantizar formato de 2 dígitos: 1 → "01", 12 → "12"
    const pad = (n: number) => String(n).padStart(2, "0");

    // Mes siguiente para el límite superior del rango.
    // Si estamos en diciembre (mes 12), el siguiente es enero del año siguiente.
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    return {
        // Primer día del mes seleccionado — inclusivo
        start: `${year}-${pad(month)}-01`,
        // Primer día del mes siguiente — exclusivo
        // El filtro usa >= start AND < end, así captura todo el mes exacto
        end: `${nextYear}-${pad(nextMonth)}-01`,
    };
}

export async function createTransaction(
    input: CreateTransactionInput
): Promise<{ localId: string }> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const localId = generateLocalId();

    const payload = {
        localId,
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId,
        accountId: input.accountId,
        concept: input.concept ?? null,
        budgetAmount: input.budgetAmount ?? null,
        note: input.note ?? null,
        transactionDate: input.transactionDate,
    };

    await db.runAsync(
        `
      INSERT INTO transactions (
        local_id,
        server_id,
        user_id,
        type,
        amount,
        category_id,
        account_id,
        concept,
        budget_amount,
        note,
        transaction_date,
        sync_status,
        created_at,
        updated_at,
        deleted_at
      )
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_create', ?, ?, NULL)
    `,
        [
            localId,
            input.userId,
            input.type,
            input.amount,
            input.categoryId,
            input.accountId,
            input.concept ?? null,
            input.budgetAmount ?? null,
            input.note ?? null,
            input.transactionDate,
            now,
            now,
        ]
    );

    await enqueueOrMergeSyncOperation({
        entityType: "transaction",
        entityLocalId: localId,
        operationType: "create",
        payload,
    });

    return { localId };
}

export async function getTransactionByLocalId(
    localId: string
): Promise<TransactionDetail | null> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<TransactionDetail>(
        `
      SELECT
        local_id as localId,
        user_id as userId,
        type as type,
        amount as amount,
        category_id as categoryId,
        account_id as accountId,
        concept as concept,
        note as note,
        transaction_date as transactionDate,
        sync_status as syncStatus
      FROM transactions
      WHERE local_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
        [localId]
    );

    return row ?? null;
}

export async function updateTransaction(
    input: UpdateTransactionInput
): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const current = await db.getFirstAsync<{ sync_status: string }>(
        `
      SELECT sync_status
      FROM transactions
      WHERE local_id = ?
      LIMIT 1
    `,
        [input.localId]
    );

    const nextSyncStatus =
        current?.sync_status === "pending_create" ? "pending_create" : "pending_update";

    await db.runAsync(
        `
      UPDATE transactions
      SET
        type = ?,
        amount = ?,
        category_id = ?,
        account_id = ?,
        transaction_date = ?,
        concept = ?,
        note = ?,
        sync_status = ?,
        updated_at = ?
      WHERE local_id = ?
    `,
        [
            input.type,
            input.amount,
            input.categoryId,
            input.accountId,
            input.transactionDate,
            input.concept ?? null,
            input.note ?? null,
            nextSyncStatus,
            now,
            input.localId,
        ]
    );

    await enqueueOrMergeSyncOperation({
        entityType: "transaction",
        entityLocalId: input.localId,
        operationType: "update",
        payload: input,
    });
}

export async function deleteTransaction(localId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const current = await db.getFirstAsync<{
        sync_status: string;
    }>(
        `
      SELECT sync_status
      FROM transactions
      WHERE local_id = ?
      LIMIT 1
    `,
        [localId]
    );

    /**
     * Si el registro nunca se sincronizó y todavía estaba como pending_create,
     * al eliminarlo podemos quitarlo por completo de la base y de la cola.
     * Para el backend, es como si nunca hubiera existido.
     */
    if (current?.sync_status === "pending_create") {
        await db.runAsync(
            `
        DELETE FROM transactions
        WHERE local_id = ?
      `,
            [localId]
        );

        await removeOpenQueueItems({
            entityType: "transaction",
            entityLocalId: localId,
        });

        return;
    }

    await db.runAsync(
        `
      UPDATE transactions
      SET
        deleted_at = ?,
        sync_status = 'pending_delete',
        updated_at = ?
      WHERE local_id = ?
    `,
        [now, now, localId]
    );

    await enqueueOrMergeSyncOperation({
        entityType: "transaction",
        entityLocalId: localId,
        operationType: "delete",
        payload: { localId },
    });
}

export async function getTransactionHistory(
    userId: string,
    filters: TransactionHistoryFilters
): Promise<
    Array<{
        localId: string;
        type: "income" | "expense";
        amount: number;
        concept: string | null;
        transactionDate: string;
        categoryName: string;
        accountName: string;
        syncStatus: string;
    }>
> {
    const db = await getDatabase();
    const { start, end } = getMonthRange(filters.year, filters.month);

    const conditions: string[] = [
        "t.user_id = ?",
        "t.deleted_at IS NULL",
        "t.transaction_date >= ?",
        "t.transaction_date < ?",
    ];

    const params: Array<string> = [userId, start, end];

    if (filters.type && filters.type !== "all") {
        conditions.push("t.type = ?");
        params.push(filters.type);
    }

    if (filters.categoryId) {
        conditions.push("t.category_id = ?");
        params.push(filters.categoryId);
    }

    if (filters.accountId) {
        conditions.push("t.account_id = ?");
        params.push(filters.accountId);
    }

    if (filters.searchText?.trim()) {
        conditions.push(`
      (
        LOWER(COALESCE(t.concept, '')) LIKE ?
        OR LOWER(COALESCE(t.note, '')) LIKE ?
        OR LOWER(c.name) LIKE ?
        OR LOWER(a.name) LIKE ?
      )
    `);

        const pattern = `%${filters.searchText.trim().toLowerCase()}%`;
        params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.join(" AND ");

    return db.getAllAsync(
        `
      SELECT
        t.local_id as localId,
        t.type as type,
        t.amount as amount,
        t.concept as concept,
        t.transaction_date as transactionDate,
        t.sync_status as syncStatus,
        c.name as categoryName,
        a.name as accountName
      FROM transactions t
      INNER JOIN categories c ON c.id = t.category_id
      INNER JOIN accounts a ON a.id = t.account_id
      WHERE ${whereClause}
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `,
        params
    );
}