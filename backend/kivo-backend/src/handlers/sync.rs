// =============================================================================
// handlers/sync.rs — Endpoint de sincronización offline-first
//
// POST /sync — recibe batch de cambios del móvil y los aplica en PostgreSQL
//
// El móvil envía todos los cambios pendientes en un solo request.
// El servidor los procesa en orden y responde con el resultado.
// =============================================================================

use axum::{extract::State, routing::post, Json, Router};
use bigdecimal::BigDecimal;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::str::FromStr;
use uuid::Uuid;

use crate::errors::AppError;
use crate::middleware::auth::AuthUser;

// ─── Tipos de operación ───────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SyncOperation {
    Create,
    Update,
    Delete,
}

// ─── Item de transacción para sync ───────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct SyncTransactionItem {
    pub operation: SyncOperation,
    pub id: Uuid,
    pub category_id: Option<Uuid>,
    pub payment_method_id: Option<Uuid>,
    pub transaction_date: Option<NaiveDate>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub concept: Option<String>,
    pub amount: Option<f64>,
    pub budgeted_amount: Option<f64>,
    pub notes: Option<String>,
    pub deleted_at: Option<String>,
}

// ─── Payload del request ──────────────────────────────────────────────────────
// El móvil envía todos los cambios pendientes agrupados por entidad.
#[derive(Debug, Deserialize)]
pub struct SyncPayload {
    #[serde(default)]
    pub transactions: Vec<SyncTransactionItem>,
}

// ─── Respuesta del sync ───────────────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct SyncResponse {
    /// Cantidad de operaciones aplicadas exitosamente
    pub synced: usize,
    /// IDs que fallaron con su mensaje de error
    pub errors: Vec<SyncError>,
}

#[derive(Debug, Serialize)]
pub struct SyncError {
    pub id: Uuid,
    pub message: String,
}

// ─── Handler: POST /sync ──────────────────────────────────────────────────────
async fn sync(
    auth: AuthUser,
    State(pool): State<PgPool>,
    Json(payload): Json<SyncPayload>,
) -> Result<Json<SyncResponse>, AppError> {
    let mut synced = 0;
    let mut errors: Vec<SyncError> = Vec::new();

    // ── Procesar transacciones ────────────────────────────────────────────────
    for item in payload.transactions {
        let result = process_transaction(&pool, &auth.user_id, &item).await;

        match result {
            Ok(_) => synced += 1,
            Err(e) => {
                // Un error en una transacción no detiene el batch completo.
                // Registramos el error y continuamos con las demás.
                tracing::warn!("Error sincronizando transacción {}: {:?}", item.id, e);
                errors.push(SyncError {
                    id: item.id,
                    message: format!("{:?}", e),
                });
            }
        }
    }

    Ok(Json(SyncResponse { synced, errors }))
}

// ─── Helper: procesar una transacción individual ──────────────────────────────
// Aplica la operación (create, update, delete) según lo que indica el item.
async fn process_transaction(
    pool: &PgPool,
    user_id: &Uuid,
    item: &SyncTransactionItem,
) -> Result<(), AppError> {
    match item.operation {
        SyncOperation::Create => {
            // Para CREATE necesitamos todos los campos requeridos
            let category_id = item.category_id.ok_or_else(|| {
                AppError::BadRequest("category_id requerido para CREATE".to_string())
            })?;

            let transaction_date = item.transaction_date.ok_or_else(|| {
                AppError::BadRequest("transaction_date requerido para CREATE".to_string())
            })?;

            let type_ = item
                .type_
                .as_deref()
                .ok_or_else(|| AppError::BadRequest("type requerido para CREATE".to_string()))?;

            let amount_f64 = item
                .amount
                .ok_or_else(|| AppError::BadRequest("amount requerido para CREATE".to_string()))?;

            let amount = BigDecimal::from_str(&amount_f64.to_string())
                .map_err(|_| AppError::BadRequest("amount inválido".to_string()))?;

            let budgeted = item
                .budgeted_amount
                .map(|b| BigDecimal::from_str(&b.to_string()))
                .transpose()
                .map_err(|_| AppError::BadRequest("budgeted_amount inválido".to_string()))?;

            // INSERT OR IGNORE — si ya existe (sync duplicado) no falla
            sqlx::query!(
                r#"
                INSERT INTO transactions (
                    id, user_id, category_id, payment_method_id,
                    transaction_date, type, concept,
                    amount, budgeted_amount, notes
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
                "#,
                item.id,
                user_id,
                category_id,
                item.payment_method_id,
                transaction_date,
                type_,
                item.concept,
                amount,
                budgeted,
                item.notes
            )
            .execute(pool)
            .await?;
        }

        SyncOperation::Update => {
            let amount = item
                .amount
                .map(|a| BigDecimal::from_str(&a.to_string()))
                .transpose()
                .map_err(|_| AppError::BadRequest("amount inválido".to_string()))?;

            let budgeted = item
                .budgeted_amount
                .map(|b| BigDecimal::from_str(&b.to_string()))
                .transpose()
                .map_err(|_| AppError::BadRequest("budgeted_amount inválido".to_string()))?;

            sqlx::query!(
                r#"
                UPDATE transactions SET
                    category_id       = COALESCE($1, category_id),
                    payment_method_id = COALESCE($2, payment_method_id),
                    transaction_date  = COALESCE($3, transaction_date),
                    type              = COALESCE($4, type),
                    concept           = COALESCE($5, concept),
                    amount            = COALESCE($6, amount),
                    budgeted_amount   = COALESCE($7, budgeted_amount),
                    notes             = COALESCE($8, notes)
                WHERE id = $9 AND user_id = $10 AND deleted_at IS NULL
                "#,
                item.category_id,
                item.payment_method_id,
                item.transaction_date,
                item.type_,
                item.concept,
                amount,
                budgeted,
                item.notes,
                item.id,
                user_id
            )
            .execute(pool)
            .await?;
        }

        SyncOperation::Delete => {
            // Borrado lógico — igual que el endpoint DELETE /transactions/:id
            sqlx::query!(
                r#"
                UPDATE transactions
                SET deleted_at = NOW()
                WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
                "#,
                item.id,
                user_id
            )
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

// ─── Router ───────────────────────────────────────────────────────────────────
pub fn router() -> Router<PgPool> {
    Router::new().route("/sync", post(sync))
}
