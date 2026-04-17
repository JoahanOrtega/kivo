import { Text } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Props ───────────────────────────────────────────────────────────────────
// Solo necesita saber cuántos movimientos están pendientes.
// El componente padre decide si renderizarlo o no — aquí siempre se muestra.
interface PendingSyncBannerProps {
    /** Cantidad de movimientos pendientes de sincronizar con el servidor. */
    pendingCount: number;
}

// ─── Componente ──────────────────────────────────────────────────────────────
// Banner informativo — le dice al usuario que tiene datos sin sincronizar.
// Solo debe renderizarse cuando pendingCount > 0, pero esa lógica
// vive en home.tsx, no aquí. Este componente siempre muestra lo que recibe.
export function PendingSyncBanner({ pendingCount }: PendingSyncBannerProps) {
    return (
        <AppCard
            style={{
                marginBottom: spacing.lg,
                // Fondo y borde amarillo suave para indicar advertencia sin alarmar
                backgroundColor: colors.warningSoft,
                borderColor: colors.warningSoft,
            }}
        >
            {/* Título del banner — usa color warning para reforzar el contexto */}
            <Text
                style={{
                    color: colors.warning,
                    fontSize: typography.bodyLg,
                    fontWeight: typography.weightSemibold,
                    marginBottom: spacing.xs,
                }}
            >
                Pendientes de sincronización
            </Text>

            {/* Mensaje dinámico — usa pendingCount para ser específico con el usuario.
          El plural/singular se maneja con una ternaria simple. */}
            <Text
                style={{
                    color: colors.text,
                    fontSize: typography.bodyMd,
                    lineHeight: 22,
                }}
            >
                Tienes {pendingCount}{" "}
                {pendingCount === 1 ? "movimiento pendiente" : "movimientos pendientes"}{" "}
                por sincronizar.
            </Text>
        </AppCard>
    );
}