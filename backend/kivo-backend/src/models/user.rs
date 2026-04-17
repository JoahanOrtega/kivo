// =============================================================================
// models/user.rs — Modelo de usuario
//
// Contiene los structs que representan al usuario en diferentes contextos:
// - User: fila completa de la BD
// - CreateUserDto: datos para registrar un usuario nuevo
// - LoginDto: datos para iniciar sesión
// - AuthResponse: respuesta con JWT tras login/register exitoso
// =============================================================================

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ─── Modelo de BD ─────────────────────────────────────────────────────────────
// Representa exactamente una fila de la tabla users.
// sqlx::FromRow permite mapear el resultado de una query a este struct.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    // password_hash nunca se serializa a JSON — la anotación skip lo excluye.
    // Aunque alguien llame a serde::to_string(&user), el hash no aparece.
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub full_name: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ─── DTO: registro ────────────────────────────────────────────────────────────
// Datos que el cliente envía para crear una cuenta nueva.
// Deserialize permite crearlo desde el JSON del request body.
#[derive(Debug, Deserialize)]
pub struct CreateUserDto {
    pub email: String,
    pub password: String,
    pub full_name: String,
}

// ─── DTO: login ───────────────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct LoginDto {
    pub email: String,
    pub password: String,
}

// ─── Respuesta de auth ────────────────────────────────────────────────────────
// Lo que el servidor retorna tras un login o register exitoso.
#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub token_type: String,
    pub user: UserPublic,
}

// ─── Vista pública del usuario ────────────────────────────────────────────────
// Solo los campos que el cliente necesita ver — sin password_hash.
#[derive(Debug, Serialize)]
pub struct UserPublic {
    pub id: Uuid,
    pub email: String,
    pub full_name: String,
}

// ─── Conversión de User a UserPublic ─────────────────────────────────────────
// impl From<User> permite convertir un User completo a su versión pública
// con la sintaxis: UserPublic::from(user)
impl From<User> for UserPublic {
    fn from(user: User) -> Self {
        UserPublic {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
        }
    }
}