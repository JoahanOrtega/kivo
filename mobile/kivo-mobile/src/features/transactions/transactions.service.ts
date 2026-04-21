import { getDatabase } from "@/database/db";
import {
    enqueueOrMergeSyncOperation,
    removeOpenQueueItems,
} from "@/features/sync/sync-queue.service";
import { randomUUID } from "expo-crypto";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type TransactionType = "income" | "expense" | "savings" | "debt" | "payment";

export type CreateTransactionInput = {
    userId: string;
    type: TransactionType;
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
    type: TransactionType;
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
    type: TransactionType;
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
    type?: "all" | TransactionType;
    categoryId?: string;
    accountId?: string;
    searchText?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateLocalId(): string {
    return randomUUID();
}

function getMonthRange(year: number, month: number) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return {
        start: `${year}-${pad(month)}-01`,
        end: `${nextYear}-${pad(nextMonth)}-01`,
    };
}

// ─── Crear transacción ────────────────────────────────────────────────────────
// Usa el nuevo schema con id (no local_id) y payment_method_id (no account_id)
export async function createTransaction(
    input: CreateTransactionInput
): Promise<{ localId: string }> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const localId = generateLocalId();

    // El transactionDate puede venir como ISO string — extraemos solo la fecha
    const transactionDate = input.transactionDate.split("T")[0];

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
        transactionDate,
    };

    await db.runAsync(
        `
        INSERT INTO transactions (
            id,
            user_id,
            type,
            amount,
            category_id,
            payment_method_id,
            concept,
            budgeted_amount,
            notes,
            transaction_date,
            sync_status,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
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
            transactionDate,
            now,
            now,
        ]
    );

    const result = await enqueueOrMergeSyncOperation({
        entityType: "transaction",
        entityLocalId: localId,
        operationType: "create",
        payload,
    });

    console.log("Enqueue result:", result);

    // ── Disparar sync en background ───────────────────────────────────────────
    // Importamos dinámicamente para evitar dependencia circular
    import("@/features/sync/sync.service").then(({ processSyncQueue }) => {
        void processSyncQueue().then(() => {
            // Notificamos al dashboard que el sync terminó
            import("@/store/sync-store").then(({ useSyncStore }) => {
                useSyncStore.getState().notifySyncCompleted();
            });
        });
    });

    return { localId };
}

// ─── Obtener por ID ───────────────────────────────────────────────────────────
export async function getTransactionByLocalId(
    localId: string
): Promise<TransactionDetail | null> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<{
        id: string;
        user_id: string;
        type: TransactionType;
        amount: number;
        category_id: string;
        payment_method_id: string | null;
        concept: string | null;
        notes: string | null;
        transaction_date: string;
        sync_status: string;
    }>(
        `
        SELECT
            id, user_id, type, amount,
            category_id, payment_method_id,
            concept, notes, transaction_date, sync_status
        FROM transactions
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1
        `,
        [localId]
    );

    if (!row) return null;

    return {
        localId: row.id,
        userId: row.user_id,
        type: row.type,
        amount: row.amount,
        categoryId: row.category_id,
        accountId: row.payment_method_id ?? "",
        concept: row.concept,
        note: row.notes,
        transactionDate: row.transaction_date,
        syncStatus: row.sync_status,
    };
}

// ─── Actualizar transacción ───────────────────────────────────────────────────
export async function updateTransaction(
    input: UpdateTransactionInput
): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const transactionDate = input.transactionDate.split("T")[0];

    const current = await db.getFirstAsync<{ sync_status: string }>(
        `SELECT sync_status FROM transactions WHERE id = ? LIMIT 1`,
        [input.localId]
    );

    // Si aún no se sincronizó, mantenemos 'pending' para que el sync
    // lo envíe como CREATE en lugar de UPDATE
    const nextSyncStatus =
        current?.sync_status === "pending" ? "pending" : "pending_update";

    await db.runAsync(
        `
        UPDATE transactions SET
            type                = ?,
            amount              = ?,
            category_id         = ?,
            payment_method_id   = ?,
            transaction_date    = ?,
            concept             = ?,
            notes               = ?,
            sync_status         = ?,
            updated_at          = ?
        WHERE id = ?
        `,
        [
            input.type,
            input.amount,
            input.categoryId,
            input.accountId,
            transactionDate,
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
        payload: { ...input, transactionDate },
    });
}

// ─── Eliminar transacción ─────────────────────────────────────────────────────
export async function deleteTransaction(localId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const current = await db.getFirstAsync<{ sync_status: string }>(
        `SELECT sync_status FROM transactions WHERE id = ? LIMIT 1`,
        [localId]
    );

    // Si nunca se sincronizó, eliminamos físicamente — el backend no lo conoce
    if (current?.sync_status === "pending") {
        await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [localId]);
        await removeOpenQueueItems({
            entityType: "transaction",
            entityLocalId: localId,
        });
        return;
    }

    // Si ya se sincronizó, borrado lógico para que el sync lo propague
    await db.runAsync(
        `
        UPDATE transactions SET
            deleted_at  = ?,
            sync_status = 'pending_delete',
            updated_at  = ?
        WHERE id = ?
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

// ─── Historial ────────────────────────────────────────────────────────────────
export async function getTransactionHistory(
    userId: string,
    filters: TransactionHistoryFilters
): Promise<Array<{
    localId: string;
    type: TransactionType;
    amount: number;
    concept: string | null;
    transactionDate: string;
    categoryName: string;
    accountName: string;
    syncStatus: string;
}>> {
    const db = await getDatabase();
    const { start, end } = getMonthRange(filters.year, filters.month);

    const conditions: string[] = [
        "t.user_id = ?",
        "t.deleted_at IS NULL",
        "t.transaction_date >= ?",
        "t.transaction_date < ?",
    ];

    const params: string[] = [userId, start, end];

    if (filters.type && filters.type !== "all") {
        conditions.push("t.type = ?");
        params.push(filters.type);
    }

    if (filters.categoryId) {
        conditions.push("t.category_id = ?");
        params.push(filters.categoryId);
    }

    if (filters.accountId) {
        conditions.push("t.payment_method_id = ?");
        params.push(filters.accountId);
    }

    if (filters.searchText?.trim()) {
        conditions.push(`(
            LOWER(COALESCE(t.concept, '')) LIKE ?
            OR LOWER(COALESCE(t.notes, '')) LIKE ?
            OR LOWER(c.name) LIKE ?
        )`);
        const pattern = `%${filters.searchText.trim().toLowerCase()}%`;
        params.push(pattern, pattern, pattern);
    }

    const whereClause = conditions.join(" AND ");

    return db.getAllAsync(
        `
        SELECT
            t.id as localId,
            t.type,
            t.amount,
            t.concept,
            t.transaction_date as transactionDate,
            t.sync_status as syncStatus,
            c.name as categoryName,
            COALESCE(pm.name, 'Sin método') as accountName
        FROM transactions t
        INNER JOIN categories c ON c.id = t.category_id
        LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
        WHERE ${whereClause}
        ORDER BY t.transaction_date DESC, t.created_at DESC
        `,
        params
    );
}

// ─── Dashboard summary ────────────────────────────────────────────────────────
// Esta función la usa el dashboard — resumida por mes
export async function getTransactionsSummary(
    userId: string,
    year: number,
    month: number
) {
    const db = await getDatabase();
    const { start, end } = getMonthRange(year, month);

    return db.getAllAsync<{
        type: TransactionType;
        amount: number;
        category_id: string;
        payment_method_id: string | null;
    }>(
        `
        SELECT type, amount, category_id, payment_method_id
        FROM transactions
        WHERE user_id = ?
            AND deleted_at IS NULL
            AND transaction_date >= ?
            AND transaction_date < ?
        `,
        [userId, start, end]
    );
}