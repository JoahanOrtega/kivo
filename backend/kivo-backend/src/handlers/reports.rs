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

// ─── Parámetros del endpoint de tendencia ────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct TrendParams {
    pub year: Option<i32>,
    pub month: Option<i32>,
    /// Número de meses hacia atrás. Default: 6
    pub months: Option<i32>,
}

// ─── Respuesta de tendencia ───────────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct TrendMonth {
    pub year: i32,
    pub month: i32,
    pub total_income: f64,
    pub total_expense: f64,
    pub total_savings: f64,
    pub balance: f64,
}

// ─── Handler: GET /reports/trend ─────────────────────────────────────────────
// Retorna el resumen de ingresos/egresos de los últimos N meses
// en una sola query SQL eficiente con GROUP BY.
//
// Más eficiente que hacer N llamadas a /reports/monthly desde el cliente
// porque es 1 request HTTP y 1 query a PostgreSQL en lugar de N de cada uno.
async fn trend_report(
    auth: AuthUser,
    State(pool): State<PgPool>,
    Query(params): Query<TrendParams>,
) -> Result<Json<Vec<TrendMonth>>, AppError> {
    use chrono::Datelike;

    let now = chrono::Utc::now().naive_utc().date();
    let year = params.year.unwrap_or(now.year());
    let month = params.month.unwrap_or(now.month() as i32);
    let num_months = params.months.unwrap_or(6).min(24); // máximo 24 meses

    // ── Calcular fecha de inicio ──────────────────────────────────────────────
    // Restamos N meses desde el mes actual para obtener el rango completo.
    let mut start_month = month - num_months + 1;
    let mut start_year = year;

    while start_month <= 0 {
        start_month += 12;
        start_year -= 1;
    }

    let start_date = NaiveDate::from_ymd_opt(start_year, start_month as u32, 1)
        .ok_or_else(|| AppError::BadRequest("Fecha inválida".to_string()))?;

    // Fin = primer día del mes siguiente al mes seleccionado
    let end_date = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(year, (month + 1) as u32, 1)
    }
    .ok_or_else(|| AppError::BadRequest("Fecha inválida".to_string()))?;

    // ── Query con GROUP BY año y mes ──────────────────────────────────────────
    // Una sola query que agrupa todas las transacciones del rango
    // por año y mes — mucho más eficiente que N queries separadas.
    let rows = sqlx::query!(
        r#"
        SELECT
            EXTRACT(YEAR FROM transaction_date)::int  AS year,
            EXTRACT(MONTH FROM transaction_date)::int AS month,
            COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
            COALESCE(SUM(CASE WHEN type = 'savings' THEN amount ELSE 0 END), 0) AS total_savings
        FROM transactions
        WHERE user_id = $1
            AND deleted_at IS NULL
            AND transaction_date >= $2
            AND transaction_date < $3
        GROUP BY
            EXTRACT(YEAR FROM transaction_date),
            EXTRACT(MONTH FROM transaction_date)
        ORDER BY year ASC, month ASC
        "#,
        auth.user_id,
        start_date,
        end_date
    )
    .fetch_all(&pool)
    .await?;

    // ── Construir respuesta con todos los meses ───────────────────────────────
    // Incluimos meses sin datos con valores en 0 para que la gráfica
    // muestre el eje X completo aunque no haya movimientos ese mes.
    let mut result: Vec<TrendMonth> = Vec::new();
    let mut cur_month = start_month;
    let mut cur_year = start_year;

    while cur_year < year || (cur_year == year && cur_month <= month) {
        // Buscar si hay datos para este mes en los resultados
        let row = rows
            .iter()
            .find(|r| r.year == Some(cur_year) && r.month == Some(cur_month));

        let total_income = row
            .and_then(|r| r.total_income.as_ref())
            .map(|v| v.to_string().parse::<f64>().unwrap_or(0.0))
            .unwrap_or(0.0);

        let total_expense = row
            .and_then(|r| r.total_expense.as_ref())
            .map(|v| v.to_string().parse::<f64>().unwrap_or(0.0))
            .unwrap_or(0.0);

        let total_savings = row
            .and_then(|r| r.total_savings.as_ref())
            .map(|v| v.to_string().parse::<f64>().unwrap_or(0.0))
            .unwrap_or(0.0);

        result.push(TrendMonth {
            year: cur_year,
            month: cur_month,
            total_income,
            total_expense,
            total_savings,
            balance: total_income - total_expense,
        });

        // Avanzar al siguiente mes
        cur_month += 1;
        if cur_month > 12 {
            cur_month = 1;
            cur_year += 1;
        }
    }

    Ok(Json(result))
}

// ─── Router ───────────────────────────────────────────────────────────────────
pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/reports/monthly", get(monthly_report))
        .route("/reports/trend", get(trend_report))
}
