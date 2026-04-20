// =============================================================================
// main.rs — Punto de entrada del servidor Kivo
//
// Responsabilidades:
// 1. Cargar variables de entorno desde .env
// 2. Inicializar el sistema de logging
// 3. Conectar al pool de PostgreSQL
// 4. Construir el router de Axum con todas las rutas
// 5. Iniciar el servidor HTTP
// =============================================================================

use std::net::SocketAddr;

use axum::Router;
use tokio::net::TcpListener;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

// Declaramos los módulos del proyecto.
// Cada módulo vive en su propia carpeta dentro de src/.
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;

#[tokio::main]
async fn main() {
    // ─── 1. Cargar variables de entorno ──────────────────────────────────────
    // dotenvy lee el archivo .env y carga las variables en el proceso.
    // Si no existe el archivo, no falla — usa las variables del sistema.
    dotenvy::dotenv().ok();

    // ─── 2. Inicializar logging ───────────────────────────────────────────────
    // tracing-subscriber lee RUST_LOG del entorno para determinar
    // qué nivel de logs mostrar (debug, info, warn, error).
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "kivo_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Iniciando servidor Kivo...");

    // ─── 3. Conectar a PostgreSQL ─────────────────────────────────────────────
    // El pool de conexiones se crea una vez y se comparte entre todos
    // los handlers mediante el estado de Axum (AppState).
    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL debe estar definida en .env");

    let pool = db::create_pool(&database_url).await;

    info!("Conexión a PostgreSQL establecida");

    // ─── 4. Construir el router ───────────────────────────────────────────────
    // Todas las rutas se definen aquí. Cada módulo de handlers
    // expone una función que retorna su sub-router.
    let app = Router::new()
        .merge(handlers::health::router())
        .merge(handlers::auth::router())
        .merge(handlers::transactions::router())
        .merge(handlers::categories::router())
        .with_state(pool);

    // ─── 5. Iniciar el servidor ───────────────────────────────────────────────
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .expect("PORT debe ser un número válido");

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await.unwrap();

    info!("Servidor corriendo en http://localhost:{}", port);

    axum::serve(listener, app).await.unwrap();
}
