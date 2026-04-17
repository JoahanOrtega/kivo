import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface PeriodSelectorProps {
    month: number;
    year: number;
    onPrevious: () => void;
    onNext: () => void;
    onGoToCurrentMonth: () => void;
}

// ─── Helper: nombre del mes ───────────────────────────────────────────────────
// Centralizado aquí para no depender de un util externo.
// Intl.DateTimeFormat usa el locale del dispositivo automáticamente.
function getMonthName(month: number, year: number): string {
    const formatted = new Intl.DateTimeFormat("es-MX", {
        month: "long",
        year: "numeric",
    }).format(new Date(year, month - 1, 1));

    // Capitalize solo la primera letra — no textTransform: "capitalize"
    // que afecta TODAS las palabras incluyendo preposiciones como "de"
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// ─── Helper: detectar mes actual ─────────────────────────────────────────────
// Devuelve true si el mes y año seleccionados son el mes actual.
function isCurrentMonth(month: number, year: number): boolean {
    const now = new Date();
    return month === now.getMonth() + 1 && year === now.getFullYear();
}

// ─── Componente ───────────────────────────────────────────────────────────────
// Reemplaza MonthSelector + PeriodChips en un solo componente.
//
// Resuelve las leyes de UX violadas:
// - Ley de Proximidad: controles relacionados ahora están juntos
// - Ley de Miller: un solo control en lugar de dos
// - Ley de Hick: menos decisiones simultáneas para el usuario
// - Ley de Fitts: flechas más grandes y fáciles de tocar
//
// Diseño:
//   ←  abril 2026  →
//      [Este mes]          ← solo visible cuando no es el mes actual
export function PeriodSelector({
    month,
    year,
    onPrevious,
    onNext,
    onGoToCurrentMonth,
}: PeriodSelectorProps) {
    const showCurrentMonthChip = !isCurrentMonth(month, year);

    const handlePrevious = async () => {
        await Haptics.selectionAsync();
        onPrevious();
    };

    const handleNext = async () => {
        await Haptics.selectionAsync();
        onNext();
    };

    const handleGoToCurrent = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onGoToCurrentMonth();
    };

    return (
        <View style={{ marginBottom: spacing.lg }}>

            {/* ── Fila principal: flechas + mes/año ── */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                }}
            >
                {/* Flecha izquierda — mes anterior */}
                <TouchableOpacity
                    onPress={() => void handlePrevious()}
                    activeOpacity={0.7}
                    // Área de toque generosa — Ley de Fitts
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ padding: spacing.sm }}
                >
                    <Ionicons
                        name="chevron-back"
                        size={20}
                        color={colors.textMuted}
                    />
                </TouchableOpacity>

                {/* Mes y año centrado — texto capitalizado */}
                <Text
                    style={{
                        fontSize: typography.bodyLg,
                        fontWeight: typography.weightBold,
                        color: colors.text,
                    }}
                >
                    {getMonthName(month, year)}
                </Text>

                {/* Flecha derecha — mes siguiente */}
                <TouchableOpacity
                    onPress={() => void handleNext()}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ padding: spacing.sm }}
                >
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textMuted}
                    />
                </TouchableOpacity>
            </View>

            {/* ── Chip "Ir al mes actual" ───────────────────────────────────────
                Solo visible cuando el usuario está viendo un mes diferente
                al actual. Esto sigue la Ley de Prägnanz — no mostramos
                controles que no tienen ninguna acción útil en el momento. */}
            {showCurrentMonthChip && (
                <TouchableOpacity
                    onPress={() => void handleGoToCurrent()}
                    activeOpacity={0.85}
                    style={{
                        alignSelf: "center",
                        marginTop: spacing.sm,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.xs,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        backgroundColor: colors.primarySoft,
                    }}
                >
                    <Text
                        style={{
                            color: colors.primary,
                            fontSize: typography.bodySm,
                            fontWeight: typography.weightSemibold,
                        }}
                    >
                        Ir al mes actual
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}