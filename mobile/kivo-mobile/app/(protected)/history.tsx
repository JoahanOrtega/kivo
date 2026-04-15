import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppCard } from "@/components/ui/app-card";
import { getTransactionHistory } from "@/features/transactions/transactions.service";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

/**
 * Pantalla placeholder del historial de movimientos.
 */
export default function HistoryScreen() {
    const session = useAuthStore((state) => state.session);

    const [items, setItems] = useState<
        Array<{
            localId: string;
            type: "income" | "expense";
            amount: number;
            concept: string | null;
            transactionDate: string;
            categoryName: string;
            accountName: string;
        }>
    >([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        if (!session?.user.id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const history = await getTransactionHistory(session.user.id);
            setItems(history);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user.id]);

    useFocusEffect(
        useCallback(() => {
            void loadHistory();
        }, [loadHistory])
    );

    return (
        <FormScreenContainer>
            <View style={{ flex: 1, paddingVertical: spacing.lg }}>
                <View style={{ marginBottom: spacing["2xl"] }}>
                    <Text
                        style={{
                            fontSize: typography.titlePage,
                            fontWeight: typography.weightBold,
                            color: colors.text,
                            marginBottom: spacing.sm,
                        }}
                    >
                        Historial
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.bodyLg,
                            lineHeight: 24,
                            color: colors.textMuted,
                        }}
                    >
                        Revisa todos tus movimientos guardados localmente.
                    </Text>
                </View>

                {isLoading ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : items.length === 0 ? (
                    <AppCard>
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: typography.bodyLg,
                                fontWeight: typography.weightSemibold,
                                marginBottom: spacing.xs,
                            }}
                        >
                            Aún no hay movimientos
                        </Text>

                        <Text
                            style={{
                                color: colors.textMuted,
                                fontSize: typography.bodyMd,
                                lineHeight: 22,
                            }}
                        >
                            Cuando agregues tu primer ingreso o egreso, aparecerá aquí.
                        </Text>
                    </AppCard>
                ) : (
                    <View style={{ gap: spacing.md }}>
                        {items.map((item) => {
                            const isIncome = item.type === "income";

                            return (
                                <AppCard key={item.localId}>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: spacing.sm,
                                        }}
                                    >
                                        <View style={{ flex: 1, paddingRight: spacing.md }}>
                                            <Text
                                                style={{
                                                    fontSize: typography.bodyLg,
                                                    fontWeight: typography.weightBold,
                                                    color: colors.text,
                                                    marginBottom: spacing.xs,
                                                }}
                                            >
                                                {item.concept || "Sin concepto"}
                                            </Text>

                                            <Text
                                                style={{
                                                    fontSize: typography.bodySm,
                                                    color: colors.textMuted,
                                                }}
                                            >
                                                {item.categoryName} · {item.accountName}
                                            </Text>
                                        </View>

                                        <View
                                            style={{
                                                backgroundColor: isIncome
                                                    ? colors.successSoft
                                                    : colors.dangerSoft,
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                borderRadius: 999,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: isIncome ? colors.success : colors.danger,
                                                    fontWeight: typography.weightSemibold,
                                                    fontSize: typography.bodySm,
                                                }}
                                            >
                                                {isIncome ? "Ingreso" : "Egreso"}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text
                                        style={{
                                            fontSize: typography.titleSection,
                                            fontWeight: typography.weightBold,
                                            color: isIncome ? colors.success : colors.danger,
                                            marginBottom: spacing.sm,
                                        }}
                                    >
                                        ${item.amount.toFixed(2)}
                                    </Text>

                                    <Text
                                        style={{
                                            fontSize: typography.bodySm,
                                            color: colors.textMuted,
                                        }}
                                    >
                                        {new Date(item.transactionDate).toLocaleString()}
                                    </Text>
                                </AppCard>
                            );
                        })}
                    </View>
                )}
            </View>
        </FormScreenContainer>
    );
}