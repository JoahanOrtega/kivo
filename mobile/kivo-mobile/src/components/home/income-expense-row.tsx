import { Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Props ────────────────────────────────────────────────────────────────────
interface IncomeExpenseRowProps {
    totalIncome: number;
    totalExpense: number;
}

// ─── Subcomponente: tarjeta individual ───────────────────────────────────────
// Reemplaza AppCard con un diseño propio para este contexto específico.
// AppCard usa fondo blanco genérico — aquí necesitamos fondos con color
// para comunicar jerarquía secundaria vs la card de saldo principal.
function MetricCard({
    label,
    amount,
    color,
    backgroundColor,
}: {
    label: string;
    amount: number;
    color: string;
    backgroundColor: string;
}) {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor,
                borderRadius: 16,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: backgroundColor,
            }}
        >
            <Text
                style={{
                    color: colors.textMuted,
                    fontSize: typography.bodySm,
                    marginBottom: spacing.xs,
                }}
            >
                {label}
            </Text>

            <Text
                style={{
                    color,
                    fontSize: typography.titleSection,
                    fontWeight: typography.weightBold,
                }}
            >
                ${amount.toFixed(2)}
            </Text>
        </View>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
// Usa fondos con color en lugar de blanco puro para diferenciar visualmente
// estas cards de las cards de detalle (categorías, cuentas).
// Verde suave para ingresos, rojo suave para egresos — refuerza el significado
// del color sin necesitar leer la etiqueta.
export function IncomeExpenseRow({
    totalIncome,
    totalExpense,
}: IncomeExpenseRowProps) {
    return (
        <View
            style={{
                flexDirection: "row",
                gap: spacing.md,
                marginBottom: spacing.lg,
            }}
        >
            <MetricCard
                label="Ingresos"
                amount={totalIncome}
                color={colors.success}
                backgroundColor={colors.successSoft}
            />

            <MetricCard
                label="Egresos"
                amount={totalExpense}
                color={colors.danger}
                backgroundColor={colors.dangerSoft}
            />
        </View>
    );
}