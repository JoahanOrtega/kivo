-- =============================================================================
-- Migration 009: Agregar métodos de pago predefinidos del sistema
--
-- A diferencia de las categorías, los métodos de pago son por usuario
-- (siempre tienen user_id). Creamos un usuario sistema especial
-- o simplemente documentamos que se crean en el bootstrap.
--
-- Decisión: los métodos de pago predefinidos se crean automáticamente
-- cuando un usuario se registra — no son globales como las categorías.
-- Esto se implementa en el handler de register.
-- =============================================================================

-- Esta migration solo documenta la decisión arquitectural.
-- Los métodos de pago predefinidos se crean en auth.rs al registrar usuario.
SELECT 1;