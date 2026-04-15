import { getDatabase } from "@/database/db";

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

function generateLocalId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getMonthRange(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
    };
}

export async function createTransaction(
    input: CreateTransactionInput
): Promise<{ localId: string }> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const localId = generateLocalId();

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
}

export async function deleteTransaction(localId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

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