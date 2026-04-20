// =============================================================================
// handlers/categories.rs — Endpoints de categorías
//
// GET  /categories — lista categorías del sistema y del usuario autenticado
// POST /categories — crear categoría personalizada
// =============================================================================

use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::middleware::auth::AuthUser;

// ─── Modelo de respuesta ──────────────────────────────────────────────────────
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CategoryResponse {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub name: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub color: String,
    pub icon: String,
    pub sort_order: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ─── DTO: crear categoría ─────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct CreateCategoryDto {
    pub name: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i32>,
}

// ─── Handler: GET /categories ─────────────────────────────────────────────────
// Retorna las categorías del sistema (user_id IS NULL) más las
// categorías personalizadas del usuario autenticado.
async fn list_categories(
    auth: AuthUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<CategoryResponse>>, AppError> {
    let categories = sqlx::query_as!(
        CategoryResponse,
        r#"
        SELECT
            id, user_id, name,
            type as type_,
            color, icon, sort_order, is_active,
            created_at, updated_at
        FROM categories
        WHERE (user_id IS NULL OR user_id = $1)
            AND is_active = TRUE
        ORDER BY sort_order ASC, name ASC
        "#,
        auth.user_id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(categories))
}

// ─── Handler: POST /categories ────────────────────────────────────────────────
// Crea una categoría personalizada para el usuario autenticado.
async fn create_category(
    auth: AuthUser,
    State(pool): State<PgPool>,
    Json(dto): Json<CreateCategoryDto>,
) -> Result<Json<CategoryResponse>, AppError> {
    // Validaciones
    if dto.name.trim().is_empty() {
        return Err(AppError::BadRequest("El nombre es requerido".to_string()));
    }

    let valid_types = ["income", "expense", "savings", "debt", "payment"];
    if !valid_types.contains(&dto.type_.as_str()) {
        return Err(AppError::BadRequest("Tipo inválido".to_string()));
    }

    let category = sqlx::query_as!(
        CategoryResponse,
        r#"
        INSERT INTO categories (user_id, name, type, color, icon, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id, user_id, name,
            type as type_,
            color, icon, sort_order, is_active,
            created_at, updated_at
        "#,
        auth.user_id,
        dto.name.trim(),
        dto.type_,
        dto.color.unwrap_or_else(|| "#6B7280".to_string()),
        dto.icon.unwrap_or_else(|| "tag".to_string()),
        dto.sort_order.unwrap_or(0)
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(category))
}

// ─── Router ───────────────────────────────────────────────────────────────────
pub fn router() -> Router<PgPool> {
    Router::new().route("/categories", get(list_categories).post(create_category))
}
