import { getDatabase } from "@/database/db";
import type { Account, Category, CategoryType } from "@/types/catalogs";

/**
 * Obtiene categorías activas por tipo de movimiento.
 */
export async function getCategoriesByType(
    type: CategoryType
): Promise<Category[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{
        id: string;
        name: string;
        type: CategoryType;
        is_default: number;
        is_active: number;
    }>(
        `
      SELECT id, name, type, is_default, is_active
      FROM categories
      WHERE type = ?
        AND is_active = 1
      ORDER BY name ASC
    `,
        [type]
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        isDefault: Boolean(row.is_default),
        isActive: Boolean(row.is_active),
    }));
}

/**
 * Obtiene cuentas válidas según el tipo de movimiento.
 * - expense: expense + both
 * - income: income + both
 */
export async function getAccountsByTransactionType(
    transactionType: CategoryType
): Promise<Account[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{
        id: string;
        name: string;
        type: "income" | "expense" | "both";
        is_default: number;
        is_active: number;
    }>(
        `
      SELECT id, name, type, is_default, is_active
      FROM accounts
      WHERE is_active = 1
        AND (
          type = 'both'
          OR type = ?
        )
      ORDER BY name ASC
    `,
        [transactionType]
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        isDefault: Boolean(row.is_default),
        isActive: Boolean(row.is_active),
    }));
}