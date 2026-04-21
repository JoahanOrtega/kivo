// =============================================================================
// sync.service.ts — Servicio de sincronización offline-first
//
// Procesa la cola de cambios pendientes y los envía al backend real.
// Se ejecuta cuando hay conexión a internet disponible.
// =============================================================================

import * as api from "@/services/api";
import {
    getPendingSyncQueueItems,
    markSyncQueueItemCompleted,
    markSyncQueueItemFailed,
    markSyncQueueItemProcessing,
} from "@/features/sync/sync-queue.service";
import type { SyncQueueItem } from "@/types/sync";

// ─── Resultado del proceso de sync ───────────────────────────────────────────
export interface SyncResult {
    processed: number;
    completed: number;
    failed: number;
}

// ─── Función principal de sync ────────────────────────────────────────────────
// Lee todos los items pendientes de la cola local y los envía al backend
// en un solo request batch para minimizar el uso de red.
export async function processSyncQueue(): Promise<SyncResult> {
    const items = await getPendingSyncQueueItems();

    console.log("Sync queue items:", items.length, items.map(i => i.status));

    if (items.length === 0) {
        return { processed: 0, completed: 0, failed: 0 };
    }

    // ── Construir el payload del batch ────────────────────────────────────────
    // Convertimos los items de la cola al formato que espera el backend.
    const transactions: api.SyncItem[] = [];

    for (const item of items) {
        // Solo procesamos transacciones por ahora
        if (item.entityType !== "transaction") continue;

        try {
            const payload = JSON.parse(item.payloadJson);
            console.log("Sync payload:", JSON.stringify(payload, null, 2));
            const operation = item.operationType as "create" | "update" | "delete";

            transactions.push({
                operation,
                id: payload.localId ?? payload.id,
                category_id: payload.categoryId,
                payment_method_id: payload.accountId ?? undefined,
                transaction_date: payload.transactionDate
                    ? payload.transactionDate.split("T")[0]
                    : undefined,
                // El backend usa type_, la app usa type
                type: payload.type,
                concept: payload.concept ?? undefined,
                amount: payload.amount,
                budgeted_amount: payload.budgetAmount ?? undefined,
                notes: payload.note ?? undefined,
            });
        } catch {
            // Si el payload no se puede parsear, marcamos el item como fallido
        }
    }

    // ── Enviar batch al backend ───────────────────────────────────────────────
    let completed = 0;
    let failed = 0;

    if (transactions.length > 0) {
        try {
            // Marcar todos como processing antes de enviar
            for (const item of items) {
                await markSyncQueueItemProcessing(item.id);
            }

            const result = await api.syncToServer({ transactions });

            // Marcar como completados los que el backend confirmó
            const syncedIds = new Set(
                transactions
                    .slice(0, result.synced)
                    .map((t) => t.id)
            );

            const failedIds = new Set(
                result.errors.map((e) => e.id)
            );

            for (const item of items) {
                const payload = JSON.parse(item.payloadJson);
                const itemId = payload.localId ?? payload.id;

                if (failedIds.has(itemId)) {
                    await markSyncQueueItemFailed(item.id, "Error en el servidor");
                    failed += 1;
                } else {
                    await markSyncQueueItemCompleted(item.id);
                    completed += 1;
                }
            }
        } catch (error) {
            // Si el request falla por completo (sin conexión, timeout, etc.)
            // marcamos todos los items como fallidos para reintento posterior
            const message = error instanceof Error ? error.message : "Error de red";

            for (const item of items) {
                await markSyncQueueItemFailed(item.id, message);
                failed += 1;
            }
        }
    }

    return {
        processed: items.length,
        completed,
        failed,
    };
}