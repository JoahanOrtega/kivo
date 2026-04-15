import { useFocusEffect, router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { BRAND } from "@/constants/brand";
import { getDashboardSummary, type DashboardSummary } from "@/features/dashboard/dashboard.service";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";

/**
 * Dashboard inicial del MVP.
 * Lee datos reales desde SQLite aunque todavía no existan movimientos.
 */
export default function DashboardScreen() {
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
        router.replace("/(auth)/login");
    };

    return (
        <FormScreenContainer>
            <View style={{ flex: 1, justifyContent: "center" }}>
                <Text
                    style={{
                        fontSize: 30,
                        fontWeight: "700",
                        color: colors.text,
                        marginBottom: 8,
                    }}
                >
                    Bienvenido a {BRAND.appName}
                </Text>

                <Text
                    style={{
                        fontSize: 16,
                        color: colors.textMuted,
                        marginBottom: 32,
                    }}
                >
                    Dashboard local listo.
                </Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <View
                        style={{
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 24,
                            gap: 12,
                        }}
                    >
                        <Text style={{ fontSize: 16, color: colors.text }}>
                            Ingresos del mes: ${summary.totalIncome.toFixed(2)}
                        </Text>

                        <Text style={{ fontSize: 16, color: colors.text }}>
                            Egresos del mes: ${summary.totalExpense.toFixed(2)}
                        </Text>

                        <Text style={{ fontSize: 16, color: colors.text }}>
                            Saldo del mes: ${summary.balance.toFixed(2)}
                        </Text>

                        <Text style={{ fontSize: 16, color: colors.text }}>
                            Movimientos del mes: {summary.transactionCount}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => router.push("/(protected)/history")}
                    style={{
                        backgroundColor: colors.primary,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        marginBottom: 12,
                    }}
                >
                    <Text
                        style={{
                            color: "#FFFFFF",
                            textAlign: "center",
                            fontSize: 16,
                            fontWeight: "600",
                        }}
                    >
                        Ir a historial
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push("/(protected)/settings")}
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        marginBottom: 12,
                    }}
                >
                    <Text
                        style={{
                            color: colors.text,
                            textAlign: "center",
                            fontSize: 16,
                            fontWeight: "600",
                        }}
                    >
                        Ir a configuración
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                    }}
                >
                    <Text
                        style={{
                            color: colors.text,
                            textAlign: "center",
                            fontSize: 16,
                            fontWeight: "600",
                        }}
                    >
                        Cerrar sesión
                    </Text>
                </TouchableOpacity>
            </View>
        </FormScreenContainer>
    );
}