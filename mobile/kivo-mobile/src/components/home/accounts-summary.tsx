import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppCard } from "@/components/ui/app-card";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AccountSummaryItem {
    accountId: string;
    accountName: string;
    totalAmount: number;
}

interface AccountsSummaryProps {
    items: AccountSummaryItem[];
}

// ─── Subcomponente: fila individual ──────────────────────────────────────────
function AccountRow({ item }: { item: AccountSummaryItem }) {
    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <Text
                style={{
                    color: colors.textMuted,
                    fontSize: typography.bodyMd,
                }}
            >
                {item.accountName}
            </Text>

            <Text
                style={{
                    color: colors.text,
                    fontSize: typography.bodyMd,
                    fontWeight: typography.weightSemibold,
                }}
            >
                ${item.totalAmount.toFixed(2)}
            </Text>
        </View>
    );
}

// ─── Subcomponente: estado vacío ──────────────────────────────────────────────
function EmptyAccounts() {
    return (
        <Text
            style={{
                color: colors.textMuted,
                fontSize: typography.bodyMd,
                lineHeight: 22,
            }}
        >
            Aún no hay datos para agrupar por cuenta este mes.
        </Text>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
// Colapsable — reduce la carga visual del home mostrando solo el título
// por defecto. El usuario expande si quiere ver el detalle por cuenta.
//
// Resuelve la Ley de Miller — menos información simultánea en pantalla.
// El detalle por cuenta es secundario al detalle por categoría.
export function AccountsSummary({ items }: AccountsSummaryProps) {
    // ─── Estado: expandido/colapsado ──────────────────────────────────────────
    // Por defecto colapsado — el usuario decide si necesita este detalle.
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <AppCard style={{ marginBottom: spacing.lg }}>

            {/* ── Header tappable — toca para expandir/colapsar ── */}
            <TouchableOpacity
                onPress={() => setIsExpanded((prev) => !prev)}
                activeOpacity={0.7}
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        fontSize: typography.titleSection,
                        fontWeight: typography.weightBold,
                        color: colors.text,
                    }}
                >
                    Resumen por cuenta
                </Text>

                {/* Ícono que comunica el estado expandido/colapsado */}
                <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textMuted}
                />
            </TouchableOpacity>

            {/* ── Contenido — solo visible cuando está expandido ── */}
            {isExpanded && (
                <View style={{ marginTop: spacing.md, gap: spacing.md }}>
                    {items.length === 0 ? (
                        <EmptyAccounts />
                    ) : (
                        items.map((item) => (
                            <AccountRow key={item.accountId} item={item} />
                        ))
                    )}
                </View>
            )}
        </AppCard>
    );
}