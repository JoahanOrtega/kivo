// =============================================================================
// bootstrap.service.ts — Sincronización inicial de catálogos
//
// Se ejecuta una vez tras el login exitoso.
// Descarga categorías y métodos de pago del backend y los guarda
// en SQLite local con sus UUIDs reales.
//
// Esto es fundamental para offline-first — los UUIDs locales deben
// coincidir con los del servidor para que el sync funcione correctamente.
// =============================================================================

import { getDatabase } from "@/database/db";
import * as api from "@/services/api";

// ─── Sincronizar categorías ───────────────────────────────────────────────────
// Descarga las categorías del backend y las upserta en SQLite.
// UPSERT = INSERT si no existe, UPDATE si ya existe.
// Esto permite re-ejecutar el bootstrap sin duplicar datos.
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
// Descarga los métodos de pago del usuario y los upserta en SQLite.
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

// ─── Bootstrap completo ───────────────────────────────────────────────────────
// Ejecuta la sincronización de todos los catálogos en paralelo.
// Se llama justo después del login exitoso.
export async function bootstrapCatalogs(): Promise<void> {
    try {
        console.log("Bootstrap: iniciando...");
        await Promise.all([
            syncCategories(),
            syncPaymentMethods(),
        ]);
        console.log("Bootstrap: completado");
    } catch (error) {
        console.warn("Bootstrap de catálogos falló:", error);
    }
}