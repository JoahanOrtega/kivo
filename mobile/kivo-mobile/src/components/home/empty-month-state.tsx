import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { AppCard } from "@/components/ui/app-card";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Componente ──────────────────────────────────────────────────────────────
// No necesita props porque su contenido es siempre el mismo —
// simplemente le dice al usuario que el mes está vacío y lo
// invita a registrar su primer movimiento con una acción directa.
//
// Este patrón se llama "empty state" y es fundamental en UX:
// nunca dejes al usuario frente a una pantalla vacía sin decirle
// qué puede hacer a continuación.
export function EmptyMonthState() {
    return (
        <AppCard style={{ marginBottom: spacing.lg }}>
            {/* Título claro — describe la situación sin ser negativo */}
            <Text
                style={{
                    color: colors.text,
                    fontSize: typography.bodyLg,
                    fontWeight: typography.weightSemibold,
                    marginBottom: spacing.xs,
                }}
            >
                Sin movimientos este mes
            </Text>

            {/* Descripción — explica qué significa y qué puede hacer */}
            <Text
                style={{
                    color: colors.textMuted,
                    fontSize: typography.bodyMd,
                    lineHeight: 22,
                    marginBottom: spacing.lg,
                }}
            >
                Aún no hay registros para este período. Agrega tu primer movimiento
                para comenzar a ver tu resumen financiero.
            </Text>

            {/* CTA (Call To Action) — botón que lleva directo a agregar.
          En UX, un empty state sin acción es una oportunidad perdida.
          El usuario no debería tener que buscar cómo empezar. */}
            <TouchableOpacity
                onPress={() => router.push("/add-transaction")}
                activeOpacity={0.85}
                style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: spacing.lg,
                    borderRadius: 12,
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        color: colors.white,
                        fontSize: typography.bodyMd,
                        fontWeight: typography.weightSemibold,
                    }}
                >
                    Agregar movimiento
                </Text>
            </TouchableOpacity>
        </AppCard>
    );
}