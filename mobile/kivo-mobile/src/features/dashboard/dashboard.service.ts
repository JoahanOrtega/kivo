import { getDatabase } from "@/database/db";

export type SummaryByCategory = {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
};

export type SummaryByAccount = {
  accountId: string;
  accountName: string;
  totalAmount: number;
};

export type DashboardSummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  pendingSyncCount: number;
  categoriesSummary: SummaryByCategory[];
  accountsSummary: SummaryByAccount[];
};

/**
 * Calcula el rango ISO del mes seleccionado.
 */
function getMonthRange(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

/**
 * Obtiene el resumen local del dashboard para un mes específico.
 */
export async function getDashboardSummary(params: {
  userId: string;
  year: number;
  month: number;
}): Promise<DashboardSummary> {
  const db = await getDatabase();
  const { start, end } = getMonthRange(params.year, params.month);

  const totalsRow = await db.getFirstAsync<{
    total_income: number | null;
    total_expense: number | null;
    transaction_count: number | null;
    pending_sync_count: number | null;
  }>(
    `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COUNT(*) AS transaction_count,
        COALESCE(SUM(CASE WHEN sync_status != 'synced' THEN 1 ELSE 0 END), 0) AS pending_sync_count
      FROM transactions
      WHERE user_id = ?
        AND deleted_at IS NULL
        AND transaction_date >= ?
        AND transaction_date < ?
    `,
    [params.userId, start, end]
  );

  const categoriesSummary = await db.getAllAsync<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
  }>(
    `
      SELECT
        c.id AS categoryId,
        c.name AS categoryName,
        COALESCE(SUM(t.amount), 0) AS totalAmount
      FROM transactions t
      INNER JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ?
        AND t.deleted_at IS NULL
        AND t.transaction_date >= ?
        AND t.transaction_date < ?
      GROUP BY c.id, c.name
      ORDER BY totalAmount DESC
      LIMIT 5
    `,
    [params.userId, start, end]
  );

  const accountsSummary = await db.getAllAsync<{
    accountId: string;
    accountName: string;
    totalAmount: number;
  }>(
    `
      SELECT
        a.id AS accountId,
        a.name AS accountName,
        COALESCE(SUM(t.amount), 0) AS totalAmount
      FROM transactions t
      INNER JOIN accounts a ON a.id = t.account_id
      WHERE t.user_id = ?
        AND t.deleted_at IS NULL
        AND t.transaction_date >= ?
        AND t.transaction_date < ?
      GROUP BY a.id, a.name
      ORDER BY totalAmount DESC
      LIMIT 5
    `,
    [params.userId, start, end]
  );

  const totalIncome = Number(totalsRow?.total_income ?? 0);
  const totalExpense = Number(totalsRow?.total_expense ?? 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: Number(totalsRow?.transaction_count ?? 0),
    pendingSyncCount: Number(totalsRow?.pending_sync_count ?? 0),
    categoriesSummary: categoriesSummary.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      totalAmount: Number(item.totalAmount),
    })),
    accountsSummary: accountsSummary.map((item) => ({
      accountId: item.accountId,
      accountName: item.accountName,
      totalAmount: Number(item.totalAmount),
    })),
  };
}