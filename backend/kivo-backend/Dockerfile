# =============================================================================
# Dockerfile — Build multi-stage para Kivo Backend
#
# Stage 1: Compilar el binario de Rust
# Stage 2: Imagen mínima solo con el binario
# =============================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM rust:1.85-slim AS builder
WORKDIR /app

# Instalar dependencias del sistema necesarias para sqlx y OpenSSL
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias primero para aprovechar el cache de Docker
COPY Cargo.toml Cargo.lock ./

# Crear src dummy para compilar dependencias sin el código fuente
# Esto hace que las dependencias se cacheen en una capa separada
RUN mkdir src && echo "fn main() {}" > src/main.rs && echo "" > src/lib.rs
RUN cargo build --release
RUN rm -rf src

# Copiar el código fuente real y compilar
COPY src ./src
COPY migrations ./migrations
RUN touch src/main.rs src/lib.rs
RUN cargo build --release

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM debian:bookworm-slim

WORKDIR /app

# Instalar solo las librerías runtime necesarias
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo el binario compilado
COPY --from=builder /app/target/release/kivo-backend ./kivo-backend

# Puerto que expone el servidor
EXPOSE 8080

CMD ["./kivo-backend"]