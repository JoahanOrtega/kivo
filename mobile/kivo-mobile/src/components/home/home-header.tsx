import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface HomeHeaderProps {
    /** Nombre del usuario para el saludo */
    userName: string;
    month: number;
    year: number;
    onPreviousMonth: () => void;
    onNextMonth: () => void;
    onGoToCurrentMonth: () => void;
}

// ─── Helper: nombre del mes ───────────────────────────────────────────────────
function getMonthName(month: number, year: number): string {
    const formatted = new Intl.DateTimeFormat("es-MX", {
        month: "long",
        year: "numeric",
    }).format(new Date(year, month - 1, 1));

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// ─── Helper: detectar mes actual ─────────────────────────────────────────────
function isCurrentMonth(month: number, year: number): boolean {
    const now = new Date();
    return month === now.getMonth() + 1 && year === now.getFullYear();
}

// ─── Componente ───────────────────────────────────────────────────────────────
// Combina el saludo y el selector de mes en una sola fila compacta.
//
// Resuelve la Ley de Prägnanz — elimina bloques intermedios innecesarios
// antes de llegar al contenido principal. El usuario ve el saldo
// como primer elemento de la pantalla, no el cuarto.
//
// Diseño:
//   Hola, Johan          Abril de 2026 ›
//                      ‹
export function HomeHeader({
    userName,
    month,
    year,
    onPreviousMonth,
    onNextMonth,
    onGoToCurrentMonth,
}: HomeHeaderProps) {
    const showCurrentMonthChip = !isCurrentMonth(month, year);

    const handlePrevious = async () => {
        await Haptics.selectionAsync();
        onPreviousMonth();
    };

    const handleNext = async () => {
        await Haptics.selectionAsync();
        onNextMonth();
    };

    const handleGoToCurrent = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onGoToCurrentMonth();
    };

    return (
        <View style={{ marginBottom: spacing.lg }}>

            {/* ── Fila principal: saludo + selector de mes ── */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {/* Saludo — izquierda */}
                <View>
                    <Text
                        style={{
                            fontSize: typography.bodySm,
                            color: colors.textMuted,
                            marginBottom: 2,
                        }}
                    >
                        Hola, {userName}
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.titleSection,
                            fontWeight: typography.weightBold,
                            color: colors.text,
                        }}
                    >
                        Tu resumen
                    </Text>
                </View>

                {/* Selector de mes compacto — derecha */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.xs,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        paddingVertical: spacing.xs,
                        paddingHorizontal: spacing.sm,
                    }}
                >
                    {/* Flecha izquierda */}
                    <TouchableOpacity
                        onPress={() => void handlePrevious()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={16}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>

                    {/* Mes y año */}
                    <Text
                        style={{
                            fontSize: typography.bodySm,
                            fontWeight: typography.weightSemibold,
                            color: colors.text,
                        }}
                    >
                        {getMonthName(month, year)}
                    </Text>

                    {/* Flecha derecha */}
                    <TouchableOpacity
                        onPress={() => void handleNext()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Chip "Ir al mes actual" ───────────────────────────────────────
                Solo visible cuando el usuario no está en el mes actual.
                Se alinea a la derecha para estar cerca del selector de mes
                al que hace referencia — Ley de Proximidad. */}
            {showCurrentMonthChip && (
                <TouchableOpacity
                    onPress={() => void handleGoToCurrent()}
                    activeOpacity={0.85}
                    style={{
                        alignSelf: "flex-end",
                        marginTop: spacing.xs,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 4,
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