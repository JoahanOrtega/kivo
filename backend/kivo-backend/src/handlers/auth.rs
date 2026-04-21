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

// ─── Helper: crear métodos de pago predefinidos ───────────────────────────────
// Se llama automáticamente al registrar un nuevo usuario.
// Crea los métodos de pago más comunes en México predefinidos.
async fn create_default_payment_methods(
    pool: &PgPool,
    user_id: uuid::Uuid,
) -> Result<(), AppError> {
    let methods = vec![
        ("Efectivo", "cash", "#16A34A", "wallet"),
        ("TDC BBVA", "credit_card", "#004A98", "credit-card"),
        ("TDC DiDi", "credit_card", "#FF6B00", "credit-card"),
        ("TDC Nu", "credit_card", "#820AD1", "credit-card"),
        ("Transferencia", "transfer", "#0891B2", "send"),
        ("Débito", "debit_card", "#6B7280", "credit-card"),
    ];

    for (name, type_, color, icon) in methods {
        sqlx::query!(
            r#"
            INSERT INTO payment_methods (user_id, name, type, color, icon)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, name) DO NOTHING
            "#,
            user_id,
            name,
            type_,
            color,
            icon,
        )
        .execute(pool)
        .await?;
    }

    Ok(())
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
            "La contraseña debe tener al menos 6 caracteres".to_string(),
        ));
    }

    if dto.full_name.trim().is_empty() {
        return Err(AppError::BadRequest("El nombre es requerido".to_string()));
    }

    // ── Hashear contraseña ────────────────────────────────────────────────────
    // bcrypt con costo 12 — balance entre seguridad y velocidad.
    // hash() es una operación costosa intencionalmente para dificultar
    // ataques de fuerza bruta.
    let password_hash =
        hash(&dto.password, DEFAULT_COST).map_err(|e| AppError::InternalError(e.to_string()))?;

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

    // ── Crear métodos de pago predefinidos ───────────────────────────────────────
    create_default_payment_methods(&pool, user.id).await?;

    // ── Generar tokens ────────────────────────────────────────────────────────
    let access_token = generate_jwt(&user)?;
    let refresh_token_value = generate_refresh_token();
    let refresh_token_hash = hash_refresh_token(&refresh_token_value);

    // Guardamos el refresh token hasheado en la BD
    // expires_at = 30 días desde ahora
    let expires_at = chrono::Utc::now() + chrono::Duration::days(30);

    sqlx::query!(
        r#"
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    "#,
        user.id,
        refresh_token_hash,
        expires_at
    )
    .execute(&pool)
    .await?;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token: refresh_token_value,
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
    let user = user.ok_or_else(|| AppError::Unauthorized("Credenciales inválidas".to_string()))?;

    // ── Verificar contraseña ──────────────────────────────────────────────────
    let password_valid = verify(&dto.password, &user.password_hash)
        .map_err(|e| AppError::InternalError(e.to_string()))?;

    if !password_valid {
        return Err(AppError::Unauthorized("Credenciales inválidas".to_string()));
    }

    // ── Generar tokens ────────────────────────────────────────────────────────
    let access_token = generate_jwt(&user)?;
    let refresh_token_value = generate_refresh_token();
    let refresh_token_hash = hash_refresh_token(&refresh_token_value);

    // Guardamos el refresh token hasheado en la BD
    // expires_at = 30 días desde ahora
    let expires_at = chrono::Utc::now() + chrono::Duration::days(30);

    sqlx::query!(
        r#"
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    "#,
        user.id,
        refresh_token_hash,
        expires_at
    )
    .execute(&pool)
    .await?;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token: refresh_token_value,
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

// ─── Helper: generar refresh token ───────────────────────────────────────────
// El refresh token es un UUID aleatorio — no contiene datos del usuario.
// Se almacena hasheado en la BD para que si la BD se compromete,
// los tokens no sean válidos directamente.
fn generate_refresh_token() -> String {
    uuid::Uuid::new_v4().to_string()
}

// ─── Helper: hashear refresh token ───────────────────────────────────────────
fn hash_refresh_token(token: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    token.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

// ─── DTO: refresh token ───────────────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct RefreshTokenDto {
    pub refresh_token: String,
}

// ─── Handler: POST /auth/refresh ─────────────────────────────────────────────
// Recibe un refresh token válido y retorna un nuevo access token.
// No requiere que el usuario esté logueado — es el mecanismo de renovación.
async fn refresh_token(
    State(pool): State<PgPool>,
    Json(dto): Json<RefreshTokenDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    let token_hash = hash_refresh_token(&dto.refresh_token);

    // Buscar el refresh token en la BD
    let token_row = sqlx::query!(
        r#"
        SELECT rt.user_id, rt.expires_at, rt.is_revoked
        FROM refresh_tokens rt
        WHERE rt.token_hash = $1
        "#,
        token_hash
    )
    .fetch_optional(&pool)
    .await?;

    let token_row =
        token_row.ok_or_else(|| AppError::Unauthorized("Refresh token inválido".to_string()))?;

    // Verificar que no está revocado ni expirado
    if token_row.is_revoked {
        return Err(AppError::Unauthorized("Refresh token revocado".to_string()));
    }

    if token_row.expires_at < chrono::Utc::now() {
        return Err(AppError::Unauthorized("Refresh token expirado".to_string()));
    }

    // Obtener datos del usuario
    let user = sqlx::query_as!(
        crate::models::user::User,
        "SELECT * FROM users WHERE id = $1 AND is_active = TRUE",
        token_row.user_id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Usuario no encontrado".to_string()))?;

    // Generar nuevo access token
    let new_access_token = generate_jwt(&user)?;

    Ok(Json(serde_json::json!({
        "access_token": new_access_token,
        "token_type": "Bearer"
    })))
}

// ─── Router ───────────────────────────────────────────────────────────────────
// Expone las rutas de auth para registrarlas en main.rs
pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/refresh", post(refresh_token))
}
