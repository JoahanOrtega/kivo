-- =============================================================================
-- Migration 008: Actualizar categorías a español y agregar faltantes
-- =============================================================================

-- ── Actualizar nombres existentes a español ───────────────────────────────────
UPDATE categories SET name = 'Gastos generales',  icon = 'shopping-bag'   WHERE name = 'Expenses'    AND user_id IS NULL;
UPDATE categories SET name = 'Servicios',          icon = 'zap'            WHERE name = 'Services'    AND user_id IS NULL;
UPDATE categories SET name = 'Transporte',         icon = 'car'            WHERE name = 'Transport'   AND user_id IS NULL;
UPDATE categories SET name = 'Comida',             icon = 'utensils'       WHERE name = 'Food'        AND user_id IS NULL;
UPDATE categories SET name = 'Salud',              icon = 'heart'          WHERE name = 'Health'      AND user_id IS NULL;
UPDATE categories SET name = 'Educación',          icon = 'book'           WHERE name = 'Education'   AND user_id IS NULL;
UPDATE categories SET name = 'Sueldo',             icon = 'briefcase'      WHERE name = 'Salary'      AND user_id IS NULL;
UPDATE categories SET name = 'Freelance',          icon = 'code'           WHERE name = 'Freelance'   AND user_id IS NULL;
UPDATE categories SET name = 'Otros ingresos',     icon = 'plus-circle'    WHERE name = 'Extra income' AND user_id IS NULL;
UPDATE categories SET name = 'Ahorro',             icon = 'piggy-bank'     WHERE name = 'Savings'     AND user_id IS NULL;
UPDATE categories SET name = 'Inversión',          icon = 'trending-up'    WHERE name = 'Investment'  AND user_id IS NULL;
UPDATE categories SET name = 'Deudas',             icon = 'credit-card'    WHERE name = 'Debt'        AND user_id IS NULL;
UPDATE categories SET name = 'Pago de tarjeta',    icon = 'credit-card'    WHERE name = 'Card payment' AND user_id IS NULL;

-- ── Agregar categorías faltantes del Excel ────────────────────────────────────
INSERT INTO categories (user_id, name, type, color, icon, sort_order)
VALUES
    (NULL, 'Gastos',      'expense',  '#EF4444', 'shopping-cart',  1),
    (NULL, 'Entretenimiento', 'expense', '#8B5CF6', 'music',        7),
    (NULL, 'Otros',       'income',   '#6B7280', 'circle',         4)
ON CONFLICT DO NOTHING;