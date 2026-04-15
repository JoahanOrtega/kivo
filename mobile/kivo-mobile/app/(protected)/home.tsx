import { useFocusEffect, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppCard } from "@/components/ui/app-card";
import { MonthSelector } from "@/components/ui/month-selector";
import { PeriodChips } from "@/components/ui/period-chips";
import { BRAND } from "@/constants/brand";
import {
    getDashboardSummary,
    type DashboardSummary,
} from "@/features/dashboard/dashboard.service";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

export default function HomeScreen() {
    const session = useAuthStore((state) => state.session);
    const logout = useAuthStore((state) => state.logout);

    const now = new Date();

    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    const [summary, setSummary] = useState<DashboardSummary>({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
        pendingSyncCount: 0,
        categoriesSummary: [],
        accountsSummary: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    const activePeriodKey = useMemo(() => {
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const previousDate = new Date(currentYear, currentMonth - 2, 1);
        const previousMonth = previousDate.getMonth() + 1;
        const previousYear = previousDate.getFullYear();

        if (selectedMonth === currentMonth && selectedYear === currentYear) {
            return "current" as const;
        }

        if (selectedMonth === previousMonth && selectedYear === previousYear) {
            return "previous" as const;
        }

        return "custom" as const;
    }, [selectedMonth, selectedYear, now]);

    const loadDashboard = useCallback(async () => {
        if (!session?.user.id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const result = await getDashboardSummary({
                userId: session.user.id,
                year: selectedYear,
                month: selectedMonth,
            });

            setSummary(result);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user.id, selectedMonth, selectedYear]);

    useFocusEffect(
        useCallback(() => {
            void loadDashboard();
        }, [loadDashboard])
    );

    const handlePreviousMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear((prev) => prev - 1);
            return;
        }

        setSelectedMonth((prev) => prev - 1);
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear((prev) => prev + 1);
            return;
        }

        setSelectedMonth((prev) => prev + 1);
    };

    const handleSelectCurrentMonth = () => {
        setSelectedMonth(now.getMonth() + 1);
        setSelectedYear(now.getFullYear());
    };

    const handleSelectPreviousMonth = () => {
        const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        setSelectedMonth(previousDate.getMonth() + 1);
        setSelectedYear(previousDate.getFullYear());
    };

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

                <PeriodChips
                    activeKey={activePeriodKey}
                    onSelectCurrent={handleSelectCurrentMonth}
                    onSelectPrevious={handleSelectPreviousMonth}
                />

                <MonthSelector
                    month={selectedMonth}
                    year={selectedYear}
                    onPrevious={handlePreviousMonth}
                    onNext={handleNextMonth}
                />

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

                        {summary.pendingSyncCount > 0 ? (
                            <AppCard
                                style={{
                                    marginBottom: spacing.lg,
                                    backgroundColor: colors.warningSoft,
                                    borderColor: colors.warningSoft,
                                }}
                            >
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

                                <Text
                                    style={{
                                        color: colors.text,
                                        fontSize: typography.bodyMd,
                                        lineHeight: 22,
                                    }}
                                >
                                    Tienes {summary.pendingSyncCount} movimiento(s) pendiente(s)
                                    por sincronizar.
                                </Text>
                            </AppCard>
                        ) : null}

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

                            {summary.categoriesSummary.length === 0 ? (
                                <Text
                                    style={{
                                        color: colors.textMuted,
                                        fontSize: typography.bodyMd,
                                        lineHeight: 22,
                                    }}
                                >
                                    Aún no hay datos para agrupar por categoría este mes.
                                </Text>
                            ) : (
                                <View style={{ gap: spacing.md }}>
                                    {summary.categoriesSummary.map((item) => (
                                        <View
                                            key={item.categoryId}
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
                                                {item.categoryName}
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
                                    ))}
                                </View>
                            )}
                        </AppCard>

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

                            {summary.accountsSummary.length === 0 ? (
                                <Text
                                    style={{
                                        color: colors.textMuted,
                                        fontSize: typography.bodyMd,
                                        lineHeight: 22,
                                    }}
                                >
                                    Aún no hay datos para agrupar por cuenta este mes.
                                </Text>
                            ) : (
                                <View style={{ gap: spacing.md }}>
                                    {summary.accountsSummary.map((item) => (
                                        <View
                                            key={item.accountId}
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
                                    ))}
                                </View>
                            )}
                        </AppCard>

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

                        {summary.transactionCount === 0 ? (
                            <AppCard style={{ marginBottom: spacing.lg }}>
                                <Text
                                    style={{
                                        color: colors.text,
                                        fontSize: typography.bodyLg,
                                        fontWeight: typography.weightSemibold,
                                        marginBottom: spacing.xs,
                                    }}
                                >
                                    Mes sin movimientos
                                </Text>

                                <Text
                                    style={{
                                        color: colors.textMuted,
                                        fontSize: typography.bodyMd,
                                        lineHeight: 22,
                                    }}
                                >
                                    Aún no hay registros para este mes. Agrega uno para empezar a
                                    ver tu resumen.
                                </Text>
                            </AppCard>
                        ) : null}

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