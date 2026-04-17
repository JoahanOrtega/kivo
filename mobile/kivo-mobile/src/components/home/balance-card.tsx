import { Text, View } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Props ───────────────────────────────────────────────────────────────────
// Definimos exactamente qué datos necesita este componente para funcionar.
// Al tipar las props, TypeScript nos avisa si alguien usa el componente
// sin pasar los valores requeridos.
interface BalanceCardProps {
    /** Saldo neto del mes (ingresos - egresos). Puede ser negativo. */
    balance: number;
    /** Cantidad total de movimientos registrados en el mes. */
    transactionCount: number;
}

// ─── Componente ──────────────────────────────────────────────────────────────
// Recibe balance y transactionCount como props en lugar de leerlos
// directamente del store — esto lo hace reutilizable y fácil de testear.
export function BalanceCard({ balance, transactionCount }: BalanceCardProps) {
    return (
        <AppCard
            style={{
                marginBottom: spacing.lg,
                // Usamos el color primario de Kivo para darle identidad visual
                backgroundColor: colors.primary,
                borderColor: colors.primary,
            }}
        >
            {/* Etiqueta superior — describe qué número estamos viendo */}
            <Text
                style={{
                    color: colors.white,
                    fontSize: typography.bodyMd,
                    marginBottom: spacing.sm,
                }}
            >
                Saldo del mes
            </Text>

            {/* Valor principal — formateado a 2 decimales siempre */}
            <Text
                style={{
                    color: colors.white,
                    fontSize: 32,
                    fontWeight: typography.weightBold,
                    marginBottom: spacing.sm,
                }}
            >
                ${balance.toFixed(2)}
            </Text>

            {/* Contador de movimientos — contexto adicional para el usuario */}
            <Text
                style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: typography.bodySm,
                }}
            >
                Movimientos registrados: {transactionCount}
            </Text>
        </AppCard>
    );
}