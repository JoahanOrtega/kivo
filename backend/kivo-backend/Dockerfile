# =============================================================================
# Dockerfile — Build para Kivo Backend en Railway
# =============================================================================

FROM rust:1.85-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar todo el código fuente
COPY . .

# Compilar en modo release
RUN cargo build --release

# Exponer puerto
EXPOSE 8080

CMD ["./target/release/kivo-backend"]