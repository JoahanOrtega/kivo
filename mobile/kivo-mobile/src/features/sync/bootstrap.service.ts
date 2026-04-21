// =============================================================================
// bootstrap.service.ts — Sincronización inicial de catálogos y datos
//
// Se ejecuta una vez tras el login exitoso.
// Descarga del backend:
// 1. Categorías del sistema y del usuario
// 2. Métodos de pago del usuario
// 3. Transacciones del mes actual
// =============================================================================

import { getDatabase } from "@/database/db";
import * as api from "@/services/api";

// ─── Sincronizar categorías ───────────────────────────────────────────────────
async function syncCategories(): Promise<void> {
    const db = await getDatabase();
    const categories = await api.getCategories() as any[];
    const now = new Date().toISOString();

    for (const cat of categories) {
        await db.runAsync(
            `
            INSERT INTO categories (
                id, user_id, name, type, color, icon,
                sort_order, is_active, created_at, updated_at, sync_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'synced')
            ON CONFLICT(id) DO UPDATE SET
                name        = excluded.name,
                type        = excluded.type,
                color       = excluded.color,
                icon        = excluded.icon,
                sort_order  = excluded.sort_order,
                updated_at  = excluded.updated_at,
                sync_status = 'synced'
            `,
            [
                cat.id,
                cat.user_id ?? null,
                cat.name,
                cat.type,
                cat.color,
                cat.icon,
                cat.sort_order ?? 0,
                cat.created_at ?? now,
                cat.updated_at ?? now,
            ]
        );
    }
}

// ─── Sincronizar métodos de pago ──────────────────────────────────────────────
async function syncPaymentMethods(): Promise<void> {
    const db = await getDatabase();
    const methods = await api.getPaymentMethods() as any[];
    const now = new Date().toISOString();

    for (const method of methods) {
        await db.runAsync(
            `
            INSERT INTO payment_methods (
                id, user_id, name, type, last_four,
                color, icon, is_active, created_at, updated_at, sync_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'synced')
            ON CONFLICT(id) DO UPDATE SET
                name        = excluded.name,
                type        = excluded.type,
                last_four   = excluded.last_four,
                color       = excluded.color,
                icon        = excluded.icon,
                updated_at  = excluded.updated_at,
                sync_status = 'synced'
            `,
            [
                method.id,
                method.user_id,
                method.name,
                method.type,
                method.last_four ?? null,
                method.color,
                method.icon,
                method.created_at ?? now,
                method.updated_at ?? now,
            ]
        );
    }
}

// ─── Sincronizar transacciones del mes actual ─────────────────────────────────
// Descarga las transacciones del mes actual del backend y las guarda
// en SQLite con sync_status = 'synced' para que no se vuelvan a subir.
// ─── Sincronizar transacciones históricas ─────────────────────────────────────
// Descarga todos los meses con datos desde el backend.
// No solo el mes actual — el usuario tiene historial de 2025 y 2026.
async function syncTransactions(userId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date();

    // Descargamos desde Enero 2025 hasta el mes actual
    const startYear = 2025;
    const startMonth = 1;
    const endYear = now.getFullYear();
    const endMonth = now.getMonth() + 1;

    let totalDownloaded = 0;

    // Iteramos mes por mes
    let year = startYear;
    let month = startMonth;

    while (year < endYear || (year === endYear && month <= endMonth)) {
        try {
            const transactions = await api.getTransactions(year, month) as any[];

            for (const tx of transactions) {
                await db.runAsync(
                    `
                    INSERT INTO transactions (
                        id, user_id, category_id, payment_method_id,
                        transaction_date, type, concept,
                        amount, budgeted_amount, notes,
                        deleted_at, created_at, updated_at, sync_status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'synced')
                    ON CONFLICT(id) DO UPDATE SET
                        category_id         = excluded.category_id,
                        payment_method_id   = excluded.payment_method_id,
                        transaction_date    = excluded.transaction_date,
                        type                = excluded.type,
                        concept             = excluded.concept,
                        amount              = excluded.amount,
                        budgeted_amount     = excluded.budgeted_amount,
                        notes               = excluded.notes,
                        updated_at          = excluded.updated_at,
                        sync_status         = 'synced'
                    `,
                    [
                        tx.id,
                        userId,
                        tx.category_id,
                        tx.payment_method_id ?? null,
                        tx.transaction_date,
                        tx.type,
                        tx.concept ?? null,
                        tx.amount,
                        tx.budgeted_amount ?? null,
                        tx.notes ?? null,
                        tx.created_at,
                        tx.updated_at,
                    ]
                );
            }

            totalDownloaded += transactions.length;
        } catch {
            // Si un mes falla continuamos con el siguiente
            console.warn(`Bootstrap: falló mes ${year}-${month}`);
        }

        // Avanzar al siguiente mes
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }

    console.log(`Bootstrap: ${totalDownloaded} transacciones descargadas`);
}

// ─── Bootstrap completo ───────────────────────────────────────────────────────
export async function bootstrapCatalogs(userId: string): Promise<void> {
    try {
        console.log("Bootstrap: iniciando...");

        // Catálogos en paralelo — no dependen entre sí
        await Promise.all([
            syncCategories(),
            syncPaymentMethods(),
        ]);

        // Transacciones después — necesita que las categorías existan
        // para que el JOIN del dashboard funcione correctamente
        await syncTransactions(userId);

        console.log("Bootstrap: completado");
    } catch (error) {
        console.warn("Bootstrap de catálogos falló:", error);
    }
}