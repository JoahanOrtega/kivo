// =============================================================================
// errors.rs — Tipos de error centralizados
//
// En Axum, para que un handler pueda retornar errores como respuestas HTTP,
// el tipo de error debe implementar IntoResponse.
//
// Centralizamos todos los errores aquí para que los handlers sean limpios:
// en lugar de manejar cada error individualmente, solo usan ? y este
// módulo se encarga de convertirlos a la respuesta HTTP correcta.
// =============================================================================

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

// ─── Tipo de error principal ──────────────────────────────────────────────────
// Cada variante representa una categoría de error con su código HTTP.
#[derive(Debug)]
pub enum AppError {
    /// 400 Bad Request — datos inválidos del cliente
    BadRequest(String),
    /// 401 Unauthorized — credenciales inválidas o token expirado
    Unauthorized(String),
    /// 404 Not Found — recurso no encontrado
    NotFound(String),
    /// 409 Conflict — recurso ya existe (ej: email duplicado)
    Conflict(String),
    /// 500 Internal Server Error — error inesperado del servidor
    InternalError(String),
}

// ─── Respuesta de error JSON ──────────────────────────────────────────────────
// Estructura del body JSON que retornamos en cada error.
#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

// ─── Conversión a respuesta HTTP ──────────────────────────────────────────────
// IntoResponse le dice a Axum cómo convertir AppError en una respuesta HTTP.
// Con esto, los handlers pueden retornar Result<T, AppError> y Axum
// automáticamente convierte el error en la respuesta correcta.
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::BadRequest(msg)     => (StatusCode::BAD_REQUEST, msg),
            AppError::Unauthorized(msg)   => (StatusCode::UNAUTHORIZED, msg),
            AppError::NotFound(msg)       => (StatusCode::NOT_FOUND, msg),
            AppError::Conflict(msg)       => (StatusCode::CONFLICT, msg),
            AppError::InternalError(msg)  => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        (status, Json(ErrorResponse { error: message })).into_response()
    }
}

// ─── Conversión automática desde errores de sqlx ─────────────────────────────
// Con From<sqlx::Error> podemos usar ? en queries de BD y el error
// se convierte automáticamente a AppError::InternalError.
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        if let sqlx::Error::Database(db_err) = &err {
            if db_err.is_unique_violation() {
                return AppError::Conflict(
                    "Ya existe un registro con ese valor único".to_string()
                );
            }
        }

        tracing::error!("Error de base de datos: {:?}", err);
        AppError::InternalError("Error interno del servidor".to_string())
    }
}