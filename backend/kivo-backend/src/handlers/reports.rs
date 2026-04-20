// =============================================================================
// handlers/reports.rs — Endpoint de reportes mensuales
//
// GET /reports/monthly?year=2026&month=4
// Retorna el resumen financiero del mes: totales, por categoría y por cuenta.
// Equivale a la hoja de resumen del Excel original.
// =============================================================================

use chrono::Datelike;

use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::middleware::auth::AuthUser;

// ─── Parámetros de query ──────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct MonthlyReportParams {
    pub year: Option<i32>,
    pub month: Option<i32>,
}

// ─── Respuesta del reporte ────────────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct MonthlyReport {
    pub year: i32,
    pub month: i32,
    pub total_income: f64,
    pub total_expense: f64,
    pub total_savings: f64,
    pub balance: f64,
    pub transaction_count: i64,
    pub by_category: Vec<CategorySummary>,
    pub by_payment_method: Vec<PaymentMethodSummary>,
}

#[derive(Debug, Serialize)]
pub struct CategorySummary {
    pub category_id: Uuid,
    pub category_name: String,
    pub category_type: String,
    pub total: f64,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct PaymentMethodSummary {
    pub payment_method_id: Option<Uuid>,
    pub payment_method_name: String,
    pub total: f64,
    pub count: i64,
}

// ─── Handler: GET /reports/monthly ───────────────────────────────────────────
async fn monthly_report(
    auth: AuthUser,
    State(pool): State<PgPool>,
    Query(params): Query<MonthlyReportParams>,
) -> Result<Json<MonthlyReport>, AppError> {
    // Si no se pasa año/mes usamos el mes actual
    let now = chrono::Utc::now().naive_utc().date();
    let year = params.year.unwrap_or(now.year());
    let month = params.month.unwrap_or(now.month() as i32);

    // Rango de fechas del mes
    let start_date = NaiveDate::from_ymd_opt(year, month as u32, 1)
        .ok_or_else(|| AppError::BadRequest("Fecha inválida".to_string()))?;

    let end_date = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(year, (month + 1) as u32, 1)
    }
    .ok_or_else(|| AppError::BadRequest("Fecha inválida".to_string()))?;

    // ── Totales generales ─────────────────────────────────────────────────────
    let totals = sqlx::query!(
        r#"
        SELECT
            COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
            COALESCE(SUM(CASE WHEN type = 'savings' THEN amount ELSE 0 END), 0) as total_savings,
            COUNT(*) as transaction_count
        FROM transactions
        WHERE user_id = $1
            AND deleted_at IS NULL
            AND transaction_date >= $2
            AND transaction_date < $3
        "#,
        auth.user_id,
        start_date,
        end_date
    )
    .fetch_one(&pool)
    .await?;

    let total_income = totals
        .total_income
        .unwrap_or_default()
        .to_string()
        .parse::<f64>()
        .unwrap_or(0.0);
    let total_expense = totals
        .total_expense
        .unwrap_or_default()
        .to_string()
        .parse::<f64>()
        .unwrap_or(0.0);
    let total_savings = totals
        .total_savings
        .unwrap_or_default()
        .to_string()
        .parse::<f64>()
        .unwrap_or(0.0);
    let transaction_count = totals.transaction_count.unwrap_or(0);

    // ── Resumen por categoría ─────────────────────────────────────────────────
    let category_rows = sqlx::query!(
        r#"
        SELECT
            c.id as category_id,
            c.name as category_name,
            c.type as category_type,
            COALESCE(SUM(t.amount), 0) as total,
            COUNT(t.id) as count
        FROM transactions t
        INNER JOIN categories c ON c.id = t.category_id
        WHERE t.user_id = $1
            AND t.deleted_at IS NULL
            AND t.transaction_date >= $2
            AND t.transaction_date < $3
        GROUP BY c.id, c.name, c.type
        ORDER BY total DESC
        "#,
        auth.user_id,
        start_date,
        end_date
    )
    .fetch_all(&pool)
    .await?;

    let by_category = category_rows
        .into_iter()
        .map(|row| CategorySummary {
            category_id: row.category_id,
            category_name: row.category_name,
            category_type: row.category_type,
            total: row
                .total
                .unwrap_or_default()
                .to_string()
                .parse::<f64>()
                .unwrap_or(0.0),
            count: row.count.unwrap_or(0),
        })
        .collect();

    // ── Resumen por método de pago ────────────────────────────────────────────
    let payment_rows = sqlx::query!(
        r#"
        SELECT
            pm.id as "payment_method_id: Option<Uuid>",
            COALESCE(pm.name, 'Sin método') as payment_method_name,
            COALESCE(SUM(t.amount), 0) as total,
            COUNT(t.id) as count
        FROM transactions t
        LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
        WHERE t.user_id = $1
            AND t.deleted_at IS NULL
            AND transaction_date >= $2
            AND transaction_date < $3
        GROUP BY pm.id, pm.name
        ORDER BY total DESC
        "#,
        auth.user_id,
        start_date,
        end_date
    )
    .fetch_all(&pool)
    .await?;

    let by_payment_method = payment_rows
        .into_iter()
        .map(|row| PaymentMethodSummary {
            payment_method_id: row.payment_method_id,
            payment_method_name: row
                .payment_method_name
                .unwrap_or_else(|| "Sin método".to_string()),
            total: row
                .total
                .unwrap_or_default()
                .to_string()
                .parse::<f64>()
                .unwrap_or(0.0),
            count: row.count.unwrap_or(0),
        })
        .collect();

    Ok(Json(MonthlyReport {
        year,
        month,
        total_income,
        total_expense,
        total_savings,
        balance: total_income - total_expense,
        transaction_count,
        by_category,
        by_payment_method,
    }))
}

// ─── Router ───────────────────────────────────────────────────────────────────
pub fn router() -> Router<PgPool> {
    Router::new().route("/reports/monthly", get(monthly_report))
}
