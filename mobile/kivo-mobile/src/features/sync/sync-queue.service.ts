import { getDatabase } from "@/database/db";
import type {
    SyncEntityType,
    SyncOperationType,
    SyncQueueItem,
} from "@/types/sync";
import { randomUUID } from "expo-crypto";

// Ahora — mismo razonamiento que generateLocalId.
// Un UUID es suficientemente descriptivo sin necesitar prefijo.
function generateQueueId(): string {
    return randomUUID();
}
/**
 * Obtiene la operación pendiente más reciente para una entidad local.
 * Solo considera estados pendientes o fallidos, que siguen siendo reintentables.
 */
async function getLatestOpenQueueItem(params: {
    entityType: SyncEntityType;
    entityLocalId: string;
}): Promise<SyncQueueItem | null> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<{
        id: string;
        entity_type: SyncEntityType;
        entity_local_id: string;
        operation_type: SyncOperationType;
        payload_json: string;
        status: "pending" | "processing" | "completed" | "failed";
        retry_count: number;
        last_error: string | null;
        created_at: string;
        updated_at: string;
    }>(
        `
      SELECT
        id,
        entity_type,
        entity_local_id,
        operation_type,
        payload_json,
        status,
        retry_count,
        last_error,
        created_at,
        updated_at
      FROM sync_queue
      WHERE entity_type = ?
        AND entity_local_id = ?
        AND status IN ('pending', 'failed')
      ORDER BY created_at DESC
      LIMIT 1
    `,
        [params.entityType, params.entityLocalId]
    );

    if (!row) {
        return null;
    }

    return {
        id: row.id,
        entityType: row.entity_type,
        entityLocalId: row.entity_local_id,
        operationType: row.operation_type,
        payloadJson: row.payload_json,
        status: row.status,
        retryCount: row.retry_count,
        lastError: row.last_error,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Inserta un item nuevo de sync queue.
 */
async function insertQueueItem(params: {
    entityType: SyncEntityType;
    entityLocalId: string;
    operationType: SyncOperationType;
    payload: unknown;
}): Promise<{ id: string }> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = generateQueueId();

    await db.runAsync(
        `
      INSERT INTO sync_queue (
        id,
        entity_type,
        entity_local_id,
        operation_type,
        payload_json,
        status,
        retry_count,
        last_error,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL, ?, ?)
    `,
        [
            id,
            params.entityType,
            params.entityLocalId,
            params.operationType,
            JSON.stringify(params.payload),
            now,
            now,
        ]
    );

    return { id };
}

/**
 * Actualiza un item existente de la cola.
 */
async function updateQueueItem(params: {
    id: string;
    operationType: SyncOperationType;
    payload: unknown;
}): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `
      UPDATE sync_queue
      SET
        operation_type = ?,
        payload_json = ?,
        status = 'pending',
        retry_count = 0,
        last_error = NULL,
        updated_at = ?
      WHERE id = ?
    `,
        [params.operationType, JSON.stringify(params.payload), now, params.id]
    );
}

/**
 * Elimina todos los items abiertos de cola para una entidad local.
 */
export async function removeOpenQueueItems(params: {
    entityType: SyncEntityType;
    entityLocalId: string;
}): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
        `
      DELETE FROM sync_queue
      WHERE entity_type = ?
        AND entity_local_id = ?
        AND status IN ('pending', 'failed')
    `,
        [params.entityType, params.entityLocalId]
    );
}

/**
 * Inserta o fusiona una operación en la cola local.
 *
 * Reglas:
 * - create + update => create
 * - update + update => update
 * - update + delete => delete
 * - create + delete => sin cola
 */
export async function enqueueOrMergeSyncOperation(params: {
    entityType: SyncEntityType;
    entityLocalId: string;
    operationType: SyncOperationType;
    payload: unknown;
}): Promise<{ id: string | null; action: "inserted" | "merged" | "removed" }> {
    const existing = await getLatestOpenQueueItem({
        entityType: params.entityType,
        entityLocalId: params.entityLocalId,
    });

    if (!existing) {
        const result = await insertQueueItem(params);
        return { id: result.id, action: "inserted" };
    }

    /**
     * create -> update = keep create
     */
    if (
        existing.operationType === "create" &&
        params.operationType === "update"
    ) {
        await updateQueueItem({
            id: existing.id,
            operationType: "create",
            payload: params.payload,
        });

        return { id: existing.id, action: "merged" };
    }

    /**
     * update -> update = keep one update
     */
    if (
        existing.operationType === "update" &&
        params.operationType === "update"
    ) {
        await updateQueueItem({
            id: existing.id,
            operationType: "update",
            payload: params.payload,
        });

        return { id: existing.id, action: "merged" };
    }

    /**
     * update -> delete = replace with delete
     */
    if (
        existing.operationType === "update" &&
        params.operationType === "delete"
    ) {
        await updateQueueItem({
            id: existing.id,
            operationType: "delete",
            payload: params.payload,
        });

        return { id: existing.id, action: "merged" };
    }

    /**
     * create -> delete = remove queue entirely
     */
    if (
        existing.operationType === "create" &&
        params.operationType === "delete"
    ) {
        await removeOpenQueueItems({
            entityType: params.entityType,
            entityLocalId: params.entityLocalId,
        });

        return { id: null, action: "removed" };
    }

    /**
     * Si llega algo no contemplado, dejamos un nuevo item.
     * Esto evita perder operaciones por un caso no previsto.
     */
    const result = await insertQueueItem(params);
    return { id: result.id, action: "inserted" };
}

/**
 * Obtiene la cantidad de operaciones pendientes o fallidas aún no completadas.
 */
export async function getPendingSyncCount(): Promise<number> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<{ count: number }>(
        `
      SELECT COUNT(*) as count
      FROM sync_queue
      WHERE status IN ('pending', 'failed', 'processing')
    `
    );

    return Number(row?.count ?? 0);
}

/**
 * Obtiene elementos pendientes para una futura sincronización real.
 */
export async function getPendingSyncQueueItems(): Promise<SyncQueueItem[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{
        id: string;
        entity_type: SyncEntityType;
        entity_local_id: string;
        operation_type: SyncOperationType;
        payload_json: string;
        status: "pending" | "processing" | "completed" | "failed";
        retry_count: number;
        last_error: string | null;
        created_at: string;
        updated_at: string;
    }>(
        `
      SELECT
        id,
        entity_type,
        entity_local_id,
        operation_type,
        payload_json,
        status,
        retry_count,
        last_error,
        created_at,
        updated_at
      FROM sync_queue
      WHERE status IN ('pending', 'failed')
      ORDER BY created_at ASC
    `
    );

    return rows.map((row) => ({
        id: row.id,
        entityType: row.entity_type,
        entityLocalId: row.entity_local_id,
        operationType: row.operation_type,
        payloadJson: row.payload_json,
        status: row.status,
        retryCount: row.retry_count,
        lastError: row.last_error,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

// Solo para debug y desarrollo, no se expone en la app final
export async function getAllSyncQueueItems(): Promise<SyncQueueItem[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{
        id: string;
        entity_type: SyncEntityType;
        entity_local_id: string;
        operation_type: SyncOperationType;
        payload_json: string;
        status: "pending" | "processing" | "completed" | "failed";
        retry_count: number;
        last_error: string | null;
        created_at: string;
        updated_at: string;
    }>(
        `
      SELECT
        id,
        entity_type,
        entity_local_id,
        operation_type,
        payload_json,
        status,
        retry_count,
        last_error,
        created_at,
        updated_at
      FROM sync_queue
      ORDER BY created_at DESC
    `
    );

    return rows.map((row) => ({
        id: row.id,
        entityType: row.entity_type,
        entityLocalId: row.entity_local_id,
        operationType: row.operation_type,
        payloadJson: row.payload_json,
        status: row.status,
        retryCount: row.retry_count,
        lastError: row.last_error,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

export async function markSyncQueueItemProcessing(id: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `
      UPDATE sync_queue
      SET
        status = 'processing',
        updated_at = ?
      WHERE id = ?
    `,
        [now, id]
    );
}

export async function markSyncQueueItemCompleted(id: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `
      UPDATE sync_queue
      SET
        status = 'completed',
        updated_at = ?,
        last_error = NULL
      WHERE id = ?
    `,
        [now, id]
    );
}

export async function markSyncQueueItemFailed(
    id: string,
    errorMessage: string
): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `
      UPDATE sync_queue
      SET
        status = 'failed',
        retry_count = retry_count + 1,
        last_error = ?,
        updated_at = ?
      WHERE id = ?
    `,
        [errorMessage, now, id]
    );
}