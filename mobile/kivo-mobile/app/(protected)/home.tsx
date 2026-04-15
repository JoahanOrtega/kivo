import { useFocusEffect, router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppCard } from "@/components/ui/app-card";
import { BRAND } from "@/constants/brand";
import {
    getDashboardSummary,
    type DashboardSummary,
} from "@/features/dashboard/dashboard.service";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

/**
 * Home/dashboard inicial de Kivo.
 * Busca verse más amigable, con mejor jerarquía y bloques más visuales.
 */
export default function HomeScreen() {
    const session = useAuthStore((state) => state.session);
    const logout = useAuthStore((state) => state.logout);

    const [summary, setSummary] = useState<DashboardSummary>({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadDashboard = useCallback(async () => {
        if (!session?.user.id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const now = new Date();

            const result = await getDashboardSummary({
                userId: session.user.id,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
            });

            setSummary(result);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user.id]);

    useFocusEffect(
        useCallback(() => {
            void loadDashboard();
        }, [loadDashboard])
    );

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    return (
        <FormScreenContainer>
            <View style={{ flex: 1, paddingVertical: spacing.lg }}>
                <View style={{ marginBottom: spacing["2xl"] }}>
                    <Text
                        style={{
                            fontSize: typography.bodyMd,
                            color: colors.textMuted,
                            marginBottom: spacing.xs,
                        }}
                    >
                        Hola, {session?.user.name ?? "Usuario"}
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.titlePage,
                            fontWeight: typography.weightBold,
                            color: colors.text,
                            marginBottom: spacing.sm,
                        }}
                    >
                        Bienvenido a {BRAND.appName}
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.bodyLg,
                            lineHeight: 24,
                            color: colors.textMuted,
                        }}
                    >
                        Tu resumen financiero del mes, en un solo lugar.
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
                ) : (
                    <>
                        <AppCard
                            style={{
                                marginBottom: spacing.lg,
                                backgroundColor: colors.primary,
                                borderColor: colors.primary,
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.white,
                                    fontSize: typography.bodyMd,
                                    marginBottom: spacing.sm,
                                }}
                            >
                                Saldo del mes
                            </Text>

                            <Text
                                style={{
                                    color: colors.white,
                                    fontSize: 32,
                                    fontWeight: typography.weightBold,
                                    marginBottom: spacing.sm,
                                }}
                            >
                                ${summary.balance.toFixed(2)}
                            </Text>

                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.85)",
                                    fontSize: typography.bodySm,
                                }}
                            >
                                Movimientos registrados: {summary.transactionCount}
                            </Text>
                        </AppCard>

                        <View
                            style={{
                                flexDirection: "row",
                                gap: spacing.md,
                                marginBottom: spacing.lg,
                            }}
                        >
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

                                <Text
                                    style={{
                                        color: colors.success,
                                        fontSize: typography.titleSection,
                                        fontWeight: typography.weightBold,
                                    }}
                                >
                                    ${summary.totalIncome.toFixed(2)}
                                </Text>
                            </AppCard>

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

                                <Text
                                    style={{
                                        color: colors.danger,
                                        fontSize: typography.titleSection,
                                        fontWeight: typography.weightBold,
                                    }}
                                >
                                    ${summary.totalExpense.toFixed(2)}
                                </Text>
                            </AppCard>
                        </View>

                        <AppCard style={{ marginBottom: spacing.lg }}>
                            <Text
                                style={{
                                    fontSize: typography.titleSection,
                                    fontWeight: typography.weightBold,
                                    color: colors.text,
                                    marginBottom: spacing.md,
                                }}
                            >
                                Acciones rápidas
                            </Text>

                            <TouchableOpacity
                                onPress={() => router.push("/add-transaction")}
                                activeOpacity={0.85}
                                style={{
                                    backgroundColor: colors.primary,
                                    paddingVertical: 15,
                                    paddingHorizontal: 16,
                                    borderRadius: 16,
                                    marginBottom: spacing.md,
                                }}
                            >
                                <Text
                                    style={{
                                        color: colors.white,
                                        textAlign: "center",
                                        fontSize: typography.bodyLg,
                                        fontWeight: typography.weightSemibold,
                                    }}
                                >
                                    Agregar movimiento
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/history")}
                                activeOpacity={0.85}
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    backgroundColor: colors.white,
                                    paddingVertical: 15,
                                    paddingHorizontal: 16,
                                    borderRadius: 16,
                                    marginBottom: spacing.md,
                                }}
                            >
                                <Text
                                    style={{
                                        color: colors.text,
                                        textAlign: "center",
                                        fontSize: typography.bodyLg,
                                        fontWeight: typography.weightSemibold,
                                    }}
                                >
                                    Ver historial
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/settings")}
                                activeOpacity={0.85}
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    backgroundColor: colors.white,
                                    paddingVertical: 15,
                                    paddingHorizontal: 16,
                                    borderRadius: 16,
                                }}
                            >
                                <Text
                                    style={{
                                        color: colors.text,
                                        textAlign: "center",
                                        fontSize: typography.bodyLg,
                                        fontWeight: typography.weightSemibold,
                                    }}
                                >
                                    Configuración
                                </Text>
                            </TouchableOpacity>
                        </AppCard>

                        <TouchableOpacity
                            onPress={handleLogout}
                            activeOpacity={0.8}
                            style={{ marginTop: spacing.sm }}
                        >
                            <Text
                                style={{
                                    color: colors.textMuted,
                                    textAlign: "center",
                                    fontSize: typography.bodyMd,
                                }}
                            >
                                Cerrar sesión
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </FormScreenContainer>
    );
}