// =============================================================================
// lib.rs — Punto de entrada de la librería
//
// Expone los módulos del backend para que los tests de integración
// en tests/ puedan importarlos con `use kivo_backend::...`
// =============================================================================
#![allow(unused_imports)]
pub mod db;
pub mod errors;
pub mod handlers;
pub mod middleware;
pub mod models;

use axum::Router;

/// Construye el router de Axum con todas las rutas.
/// Expuesto como función pública para que los tests puedan usarlo.
pub fn build_app(pool: sqlx::PgPool) -> Router {
    Router::new()
        .merge(handlers::health::router())
        .merge(handlers::auth::router())
        .merge(handlers::transactions::router())
        .merge(handlers::categories::router())
        .merge(handlers::payment_methods::router())
        .merge(handlers::sync::router())
        .merge(handlers::reports::router())
        .with_state(pool)
}
