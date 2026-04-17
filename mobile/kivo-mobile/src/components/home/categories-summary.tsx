import { Text, View } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Tipos ───────────────────────────────────────────────────────────────────
// Definimos la forma de cada item del resumen por categoría.
// Esto viene del tipo DashboardSummary que devuelve dashboard.service.ts.
interface CategorySummaryItem {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface CategoriesSummaryProps {
    /** Lista de categorías con su total gastado en el mes. */
    items: CategorySummaryItem[];
}

// ─── Subcomponente: fila individual ──────────────────────────────────────────
// Extraemos la fila en su propio componente para que el map principal
// quede limpio y legible. Cada fila muestra nombre y monto.
function CategoryRow({ item }: { item: CategorySummaryItem }) {
    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            {/* Etiqueta — secundaria, más apagada */}
            <Text
                style={{
                    color: colors.textMuted,
                    fontSize: typography.bodyMd,
                }}
            >
                {item.categoryName}
            </Text>

            {/* Monto — primario, más prominente que la etiqueta */}
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

// ─── Subcomponente: estado vacío ─────────────────────────────────────────────
// Separamos el estado vacío en su propio componente para que la lógica
// principal del componente sea más fácil de leer.
function EmptyCategories() {
    return (
        <Text
            style={{
                color: colors.textMuted,
                fontSize: typography.bodyMd,
                lineHeight: 22,
            }}
        >
            Aún no hay datos para agrupar por categoría este mes.
        </Text>
    );
}

// ─── Componente principal ────────────────────────────────────────────────────
// Decide qué renderizar dependiendo de si hay items o no.
// La lógica condicional queda clara y en un solo lugar.
export function CategoriesSummary({ items }: CategoriesSummaryProps) {
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
                Resumen por categoría
            </Text>

            {/* Si no hay items mostramos el estado vacío, si hay items
          los iteramos con map usando categoryId como key única */}
            {items.length === 0 ? (
                <EmptyCategories />
            ) : (
                <View style={{ gap: spacing.md }}>
                    {items.map((item) => (
                        <CategoryRow key={item.categoryId} item={item} />
                    ))}
                </View>
            )}
        </AppCard>
    );
}