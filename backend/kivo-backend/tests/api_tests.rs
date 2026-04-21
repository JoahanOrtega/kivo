// =============================================================================
// tests/api_tests.rs — Tests de integración del backend Kivo
//
// Estos tests verifican que los endpoints de la API funcionan correctamente
// de punta a punta — desde el request HTTP hasta la base de datos.
//
// Para correr los tests:
//   cargo test
//
// Para correr un test específico:
//   cargo test test_health_check
// =============================================================================

use axum_test::TestServer;
use serde_json::json;
use std::time::{SystemTime, UNIX_EPOCH};

// ─── Helper: email único por test ─────────────────────────────────────────────
// Genera un email único usando el timestamp para evitar conflictos
// cuando los tests se corren múltiples veces contra la misma BD.
fn unique_email(prefix: &str) -> String {
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    format!("{}_{ts}@kivo.test", prefix)
}

// ─── Helper: construir el servidor de prueba ──────────────────────────────────
// Crea una instancia del servidor Axum en memoria para los tests.
// No levanta un puerto TCP real — los requests van directo al router.
async fn build_test_server() -> TestServer {
    // Cargar variables de entorno del .env
    dotenvy::dotenv().ok();

    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL debe estar definida para los tests");

    let pool = kivo_backend::db::create_pool(&database_url).await;
    let app = kivo_backend::build_app(pool);

    TestServer::new(app).unwrap()
}

// =============================================================================
// Tests de Health
// =============================================================================

#[tokio::test]
async fn test_health_check() {
    let server = build_test_server().await;

    let response = server.get("/health").await;

    // Verificamos que retorna 200 OK
    response.assert_status_ok();

    // Verificamos que el body tiene el campo "status"
    let body: serde_json::Value = response.json();
    assert_eq!(body["status"], "ok");
}

// =============================================================================
// Tests de Auth
// =============================================================================

#[tokio::test]
async fn test_register_returns_jwt() {
    let server = build_test_server().await;
    let email = unique_email("register");

    let response = server
        .post("/auth/register")
        .json(&json!({
            "email": email,
            "password": "123456",
            "full_name": "Test User"
        }))
        .await;

    response.assert_status_ok();
    let body: serde_json::Value = response.json();
    assert!(body["access_token"].is_string());
    assert!(body["refresh_token"].is_string());
    assert_eq!(body["user"]["email"], email);
}

#[tokio::test]
async fn test_login_with_valid_credentials() {
    let server = build_test_server().await;
    let email = unique_email("login");

    server
        .post("/auth/register")
        .json(&json!({
            "email": email,
            "password": "123456",
            "full_name": "Test Login"
        }))
        .await;

    let response = server
        .post("/auth/login")
        .json(&json!({
            "email": email,
            "password": "123456"
        }))
        .await;

    response.assert_status_ok();
    let body: serde_json::Value = response.json();
    assert!(body["access_token"].is_string());
}

#[tokio::test]
async fn test_login_with_invalid_credentials_returns_401() {
    let server = build_test_server().await;

    let response = server
        .post("/auth/login")
        .json(&json!({
            "email": "noexiste@kivo.test",
            "password": "wrongpassword"
        }))
        .await;

    // Debe retornar 401 Unauthorized
    response.assert_status(axum::http::StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_protected_endpoint_without_token_returns_401() {
    let server = build_test_server().await;

    // Intentar acceder a /transactions sin token
    let response = server.get("/transactions").await;

    response.assert_status(axum::http::StatusCode::UNAUTHORIZED);
}
