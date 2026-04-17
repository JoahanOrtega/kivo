# Kivo
> Tu dinero, en movimiento.

Kivo es una aplicación de finanzas personales mobile-first y offline-first
diseñada para registrar ingresos y egresos de forma rápida, sencilla y
confiable desde el celular.

El proyecto nace para resolver un problema cotidiano: registrar gastos en
un Excel manual genera fricción, dependencia de una computadora y retrasos
en la captura. Esa fricción provoca que muchos movimientos no se registren
en el momento en que ocurren, desbalanceando el control financiero mensual.

Kivo sustituye ese flujo manual por una experiencia móvil intuitiva que
permite registrar movimientos en segundos, incluso sin conexión a internet,
sincronizando automáticamente con un servidor central cuando hay red disponible.

---

## ¿Por qué existe Kivo?

Durante 2 años llevé el control de mis finanzas en Excel.
Intenté pasarme a Google Sheets pero tuve problemas con ciertas
funciones, así que regresé a Excel local.

El problema principal era que dependía de una PC para registrar
cualquier gasto — si hacía una compra fuera de casa, tenía que
esperar a llegar y registrarla, y muchas veces simplemente se olvidaba.

Busqué apps que resolvieran esto pero ninguna se adaptaba a lo que
necesitaba. Eso me llevó a construir Kivo a mi manera.

---

## Stack tecnológico

| Capa       | Tecnología            | Razón                                        |
| ---------- | --------------------- | -------------------------------------------- |
| Mobile     | React Native + Expo   | App nativa en iOS y Android                  |
| Navegación | Expo Router           | File-based routing, familiar a Next.js       |
| Estado     | Zustand + React Query | Simple, sin boilerplate innecesario          |
| BD local   | SQLite (expo-sqlite)  | Soporte offline completo                     |
| Backend    | Rust + Axum           | Máximo rendimiento, mínimo uso de memoria    |
| BD central | PostgreSQL            | ACID compliant, ideal para datos financieros |

---

## Cómo correrlo localmente

### Requisitos previos

- [Node.js](https://nodejs.org/) >= 20
- [Rust](https://rustup.rs/) >= 1.75
- [PostgreSQL](https://www.postgresql.org/) >= 15
- [Git](https://git-scm.com/)
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli): `cargo install sqlx-cli --no-default-features --features postgres`

### Backend

```bash
cd backend/kivo-backend
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL
sqlx migrate run
cargo run
```

El servidor corre en `http://localhost:8080`.

### Mobile

```bash
cd mobile/kivo-mobile
npm install
cp .env.example .env
# Edita .env con EXPO_PUBLIC_API_URL=http://localhost:8080
npx expo start
```

Escanea el QR con **Expo Go** en tu celular.

---

## Estado del proyecto

| Fase   | Descripción                                     | Estado           |
| ------ | ----------------------------------------------- | ---------------- |
| Fase 0 | Documentación base y estructura del repositorio | ✅ Completado    |
| Fase 1 | Diseño de base de datos y entidades             | ✅ Completado    |
| Fase 2 | Backend — Rust + Axum + Auth + CRUD             | 🔄 En progreso   |
| Fase 3 | Frontend móvil — estructura y navegación        | ✅ Completado    |
| Fase 4 | Frontend móvil — features principales           | ✅ Completado    |
| Fase 5 | Sincronización offline-first                    | 🔄 En progreso   |
| Fase 6 | Reportes y visualizaciones                      | ⏳ Pendiente     |
| Fase 7 | Seguridad, biometría y pulido UX                | 🔄 En progreso   |
| Fase 8 | Testing y CI/CD                                 | ⏳ Pendiente     |
| Fase 9 | Escalado — versión web                          | ⏳ Pendiente     |

**Estado actual:** Fase 2 — Backend en Rust con Auth JWT y CRUD de transacciones funcionando.