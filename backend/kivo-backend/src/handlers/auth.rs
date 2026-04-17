// =============================================================================
// handlers/auth.rs — Endpoints de autenticación
//
// POST /auth/register — crear cuenta nueva
// POST /auth/login    — iniciar sesión, retorna JWT
// =============================================================================

use axum::{extract::State, routing::post, Json, Router};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::user::{AuthResponse, CreateUserDto, LoginDto, User, UserPublic};

// ─── Claims del JWT ───────────────────────────────────────────────────────────
// Los claims son los datos que viajan dentro del token JWT.
// Se verifican en cada request autenticado.
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// ID del usuario — dato principal del token
    pub sub: String,
    /// Email del usuario
    pub email: String,
    /// Timestamp de expiración (Unix timestamp)
    pub exp: usize,
    /// Timestamp de emisión
    pub iat: usize,
}

// ─── Handler: POST /auth/register ────────────────────────────────────────────
// Crea una cuenta nueva con email, contraseña y nombre.
// Retorna un JWT listo para usar — el usuario queda logueado inmediatamente.
async fn register(
    // State extrae el pool de conexiones del estado de Axum
    State(pool): State<PgPool>,
    // Json deserializa el body del request a CreateUserDto
    Json(dto): Json<CreateUserDto>,
) -> Result<Json<AuthResponse>, AppError> {

    // ── Validaciones básicas ──────────────────────────────────────────────────
    let email = dto.email.trim().to_lowercase();

    if email.is_empty() || !email.contains('@') {
        return Err(AppError::BadRequest("Email inválido".to_string()));
    }

    if dto.password.len() < 6 {
        return Err(AppError::BadRequest(
            "La contraseña debe tener al menos 6 caracteres".to_string()
        ));
    }

    if dto.full_name.trim().is_empty() {
        return Err(AppError::BadRequest("El nombre es requerido".to_string()));
    }

    // ── Hashear contraseña ────────────────────────────────────────────────────
    // bcrypt con costo 12 — balance entre seguridad y velocidad.
    // hash() es una operación costosa intencionalmente para dificultar
    // ataques de fuerza bruta.
    let password_hash = hash(&dto.password, DEFAULT_COST)
        .map_err(|e| AppError::InternalError(e.to_string()))?;

    // ── Insertar usuario en BD ────────────────────────────────────────────────
    // Si el email ya existe, sqlx retorna un error de unique violation
    // que nuestro From<sqlx::Error> convierte a 409 Conflict.
    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (email, password_hash, full_name)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
        email,
        password_hash,
        dto.full_name.trim()
    )
    .fetch_one(&pool)
    .await?;

    // ── Generar JWT ───────────────────────────────────────────────────────────
    let token = generate_jwt(&user)?;

    Ok(Json(AuthResponse {
        access_token: token,
        token_type: "Bearer".to_string(),
        user: UserPublic::from(user),
    }))
}

// ─── Handler: POST /auth/login ────────────────────────────────────────────────
// Verifica credenciales y retorna un JWT si son correctas.
async fn login(
    State(pool): State<PgPool>,
    Json(dto): Json<LoginDto>,
) -> Result<Json<AuthResponse>, AppError> {

    let email = dto.email.trim().to_lowercase();

    // ── Buscar usuario por email ──────────────────────────────────────────────
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users
        WHERE email = $1 AND is_active = TRUE
        "#,
        email
    )
    .fetch_optional(&pool)
    .await?;

    // Usamos el mismo mensaje de error para "usuario no encontrado" y
    // "contraseña incorrecta" — no queremos revelar si el email existe.
    let user = user.ok_or_else(|| {
        AppError::Unauthorized("Credenciales inválidas".to_string())
    })?;

    // ── Verificar contraseña ──────────────────────────────────────────────────
    let password_valid = verify(&dto.password, &user.password_hash)
        .map_err(|e| AppError::InternalError(e.to_string()))?;

    if !password_valid {
        return Err(AppError::Unauthorized("Credenciales inválidas".to_string()));
    }

    // ── Generar JWT ───────────────────────────────────────────────────────────
    let token = generate_jwt(&user)?;

    Ok(Json(AuthResponse {
        access_token: token,
        token_type: "Bearer".to_string(),
        user: UserPublic::from(user),
    }))
}

// ─── Helper: generar JWT ──────────────────────────────────────────────────────
// Genera un token JWT firmado con el secreto del entorno.
// Separado en su propia función porque lo usan tanto register como login.
fn generate_jwt(user: &User) -> Result<String, AppError> {
    let jwt_secret = std::env::var("JWT_SECRET")
        .map_err(|_| AppError::InternalError("JWT_SECRET no configurado".to_string()))?;

    let expiration_hours = std::env::var("JWT_EXPIRATION_HOURS")
        .unwrap_or_else(|_| "24".to_string())
        .parse::<i64>()
        .unwrap_or(24);

    let now = Utc::now();
    let expiration = now + Duration::hours(expiration_hours);

    let claims = Claims {
        sub: user.id.to_string(),
        email: user.email.clone(),
        exp: expiration.timestamp() as usize,
        iat: now.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(|e| AppError::InternalError(e.to_string()))
}

// ─── Router ───────────────────────────────────────────────────────────────────
// Expone las rutas de auth para registrarlas en main.rs
pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
}