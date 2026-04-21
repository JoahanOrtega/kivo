import { getDatabase } from "@/database/db";
import { getPendingSyncCount } from "@/features/sync/sync-queue.service";

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

// ─── Helper: rango de fechas del mes ─────────────────────────────────────────
// Usa strings YYYY-MM-DD para evitar problemas de timezone en SQLite.
function getMonthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${nextYear}-${pad(nextMonth)}-01`,
  };
}

export async function getDashboardSummary(params: {
  userId: string;
  year: number;
  month: number;
}): Promise<DashboardSummary> {
  const db = await getDatabase();
  const { start, end } = getMonthRange(params.year, params.month);

  // ── Totales ───────────────────────────────────────────────────────────────
  const totalsRow = await db.getFirstAsync<{
    total_income: number | null;
    total_expense: number | null;
    transaction_count: number | null;
  }>(
    `
        SELECT
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
            COUNT(*) AS transaction_count
        FROM transactions
        WHERE user_id = ?
            AND deleted_at IS NULL
            AND transaction_date >= ?
            AND transaction_date < ?
        `,
    [params.userId, start, end]
  );

  // ── Resumen por categoría ─────────────────────────────────────────────────
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

  // ── Resumen por método de pago ────────────────────────────────────────────
  // Cambiado de accounts/account_id a payment_methods/payment_method_id
  const accountsSummary = await db.getAllAsync<{
    accountId: string;
    accountName: string;
    totalAmount: number;
  }>(
    `
        SELECT
            COALESCE(pm.id, 'none') AS accountId,
            COALESCE(pm.name, 'Sin método') AS accountName,
            COALESCE(SUM(t.amount), 0) AS totalAmount
        FROM transactions t
        LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
        WHERE t.user_id = ?
            AND t.deleted_at IS NULL
            AND t.transaction_date >= ?
            AND t.transaction_date < ?
        GROUP BY pm.id, pm.name
        ORDER BY totalAmount DESC
        LIMIT 5
        `,
    [params.userId, start, end]
  );

  const totalIncome = Number(totalsRow?.total_income ?? 0);
  const totalExpense = Number(totalsRow?.total_expense ?? 0);
  const pendingSyncCount = await getPendingSyncCount();

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: Number(totalsRow?.transaction_count ?? 0),
    pendingSyncCount,
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