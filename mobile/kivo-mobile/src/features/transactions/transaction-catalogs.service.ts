import { getDatabase } from "@/database/db";
import type { Account, Category } from "@/types/catalogs";

// ─── Tipos ────────────────────────────────────────────────────────────────────
// Los tipos de transacción alineados con el backend
export type TransactionType = "income" | "expense" | "savings" | "debt" | "payment";

// ─── Categorías ───────────────────────────────────────────────────────────────
/**
 * Obtiene categorías activas por tipo de movimiento.
 * Incluye categorías del sistema (user_id NULL) y del usuario.
 */
export async function getCategoriesByType(
    type: TransactionType
): Promise<Category[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{
        id: string;
        name: string;
        type: TransactionType;
        color: string;
        icon: string;
        sort_order: number;
        is_active: number;
    }>(
        `
        SELECT id, name, type, color, icon, sort_order, is_active
        FROM categories
        WHERE type = ?
            AND is_active = 1
        ORDER BY sort_order ASC, name ASC
        `,
        [type]
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        color: row.color,
        icon: row.icon,
        sortOrder: row.sort_order,
        isDefault: true,
        isActive: Boolean(row.is_active),
    }));
}

// ─── Métodos de pago ──────────────────────────────────────────────────────────
/**
 * Obtiene los métodos de pago activos del usuario.
 * Reemplaza getAccountsByTransactionType — ahora usamos payment_methods.
 */
export async function getAccountsByTransactionType(
    _transactionType: TransactionType
): Promise<Account[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{
        id: string;
        name: string;
        type: string;
        color: string;
        icon: string;
        is_active: number;
    }>(
        `
        SELECT id, name, type, color, icon, is_active
        FROM payment_methods
        WHERE is_active = 1
        ORDER BY name ASC
        `
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        color: row.color,
        icon: row.icon,
        isDefault: false,
        isActive: Boolean(row.is_active),
    }));
}