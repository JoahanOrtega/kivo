import { Text, View } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Props ───────────────────────────────────────────────────────────────────
// Solo necesita los totales de ingresos y egresos del mes seleccionado.
interface IncomeExpenseRowProps {
    /** Total de ingresos del mes. Siempre positivo. */
    totalIncome: number;
    /** Total de egresos del mes. Siempre positivo. */
    totalExpense: number;
}

// ─── Componente ──────────────────────────────────────────────────────────────
// Renderiza dos tarjetas en fila usando flexDirection: "row".
// Cada tarjeta ocupa la mitad del espacio disponible con flex: 1.
export function IncomeExpenseRow({
    totalIncome,
    totalExpense,
}: IncomeExpenseRowProps) {
    return (
        // View contenedor con dirección horizontal y gap entre tarjetas
        <View
            style={{
                flexDirection: "row",
                gap: spacing.md,
                marginBottom: spacing.lg,
            }}
        >
            {/* ── Tarjeta de ingresos ── */}
            <AppCard style={{ flex: 1 }}>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: typography.bodySm,
                        marginBottom: spacing.xs,
                    }}
                >
                    Ingresos
                </Text>

                {/* Verde para ingresos — refuerzo visual positivo */}
                <Text
                    style={{
                        color: colors.success,
                        fontSize: typography.titleSection,
                        fontWeight: typography.weightBold,
                    }}
                >
                    ${totalIncome.toFixed(2)}
                </Text>
            </AppCard>

            {/* ── Tarjeta de egresos ── */}
            <AppCard style={{ flex: 1 }}>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: typography.bodySm,
                        marginBottom: spacing.xs,
                    }}
                >
                    Egresos
                </Text>

                {/* Rojo para egresos — señal visual de salida de dinero */}
                <Text
                    style={{
                        color: colors.danger,
                        fontSize: typography.titleSection,
                        fontWeight: typography.weightBold,
                    }}
                >
                    ${totalExpense.toFixed(2)}
                </Text>
            </AppCard>
        </View>
    );
}