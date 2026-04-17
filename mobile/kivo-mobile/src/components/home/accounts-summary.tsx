import { Text, View } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Tipos ───────────────────────────────────────────────────────────────────
// Misma estructura que CategorySummaryItem pero para cuentas.
// Aunque son similares, los mantenemos separados porque en el futuro
// pueden divergir — por ejemplo, agregar el tipo de cuenta o su color.
interface AccountSummaryItem {
    accountId: string;
    accountName: string;
    totalAmount: number;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface AccountsSummaryProps {
    /** Lista de cuentas con su total de movimientos en el mes. */
    items: AccountSummaryItem[];
}

// ─── Subcomponente: fila individual ──────────────────────────────────────────
// Renderiza una sola fila con el nombre de la cuenta y su monto total.
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
                    color: colors.text,
                    fontSize: typography.bodyMd,
                    fontWeight: typography.weightSemibold,
                }}
            >
                {item.accountName}
            </Text>

            <Text
                style={{
                    color: colors.textMuted,
                    fontSize: typography.bodyMd,
                }}
            >
                ${item.totalAmount.toFixed(2)}
            </Text>
        </View>
    );
}

// ─── Subcomponente: estado vacío ─────────────────────────────────────────────
// Mensaje que se muestra cuando no hay movimientos registrados en el mes.
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

// ─── Componente principal ────────────────────────────────────────────────────
// Idéntico en estructura a CategoriesSummary pero para cuentas.
// Mantenerlos separados respeta el principio de responsabilidad única —
// si el diseño de uno cambia, no afecta al otro.
export function AccountsSummary({ items }: AccountsSummaryProps) {
    return (
        <AppCard style={{ marginBottom: spacing.lg }}>
            <Text
                style={{
                    fontSize: typography.titleSection,
                    fontWeight: typography.weightBold,
                    color: colors.text,
                    marginBottom: spacing.md,
                }}
            >
                Resumen por cuenta
            </Text>

            {/* Condicional limpio: estado vacío o lista de filas */}
            {items.length === 0 ? (
                <EmptyAccounts />
            ) : (
                <View style={{ gap: spacing.md }}>
                    {items.map((item) => (
                        <AccountRow key={item.accountId} item={item} />
                    ))}
                </View>
            )}
        </AppCard>
    );
}