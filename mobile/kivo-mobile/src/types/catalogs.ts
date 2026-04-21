// =============================================================================
// types/catalogs.ts — Tipos de catálogos alineados con el backend
// =============================================================================

// ─── Tipos de transacción ─────────────────────────────────────────────────────
// Alineados con el CHECK constraint de PostgreSQL
export type CategoryType =
    | "income"
    | "expense"
    | "savings"
    | "debt"
    | "payment";

// ─── Tipos de método de pago ──────────────────────────────────────────────────
export type AccountType =
    | "cash"
    | "debit_card"
    | "credit_card"
    | "transfer"
    | "other";

// ─── Categoría ────────────────────────────────────────────────────────────────
export type Category = {
    id: string;
    name: string;
    type: CategoryType;
    color: string;
    icon: string;
    sortOrder?: number;
    isDefault: boolean;
    isActive: boolean;
};

// ─── Método de pago ───────────────────────────────────────────────────────────
// Reemplaza Account — ahora refleja la tabla payment_methods
export type Account = {
    id: string;
    name: string;
    type: AccountType | string;
    color: string;
    icon: string;
    isDefault: boolean;
    isActive: boolean;
};