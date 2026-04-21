import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppCard } from "@/components/ui/app-card";
import { PeriodSelector } from "@/components/ui/period-selector";
import { getMonthlyReport, getReportsTrend, type MonthlyReportData } from "@/services/api";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Colores para las gráficas ────────────────────────────────────────────────
const CHART_COLORS = [
    "#2563EB", "#16A34A", "#DC2626", "#D97706",
    "#7C3AED", "#0891B2", "#DB2777", "#65A30D",
];

// ─── Helper: nombre corto del mes ─────────────────────────────────────────────
function getShortMonthName(month: number): string {
    const names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return names[month - 1];
}

export default function ReportsScreen() {
    const now = new Date();

    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [report, setReport] = useState<MonthlyReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [trendData, setTrendData] = useState<Array<{
        month: number;
        year: number;
        income: number;
        expense: number;
    }>>([]);
    const [isTrendLoading, setIsTrendLoading] = useState(true);

    // ─── Carga del reporte ────────────────────────────────────────────────────
    const loadReport = useCallback(async () => {
        try {
            setIsLoading(true);
            setHasError(false);
            const data = await getMonthlyReport(selectedYear, selectedMonth);
            setReport(data);
        } catch {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    // ─── Carga de tendencia 6 meses ───────────────────────────────────────────────
    // Usa el endpoint dedicado GET /reports/trend en lugar de 6 llamadas
    // a /reports/monthly — 1 request HTTP y 1 query SQL en lugar de 6.
    const loadTrend = useCallback(async () => {
        try {
            setIsTrendLoading(true);
            const data = await getReportsTrend(selectedYear, selectedMonth, 6);
            setTrendData(
                data.map((d) => ({
                    month: d.month,
                    year: d.year,
                    income: d.total_income,
                    expense: d.total_expense,
                }))
            );
        } catch {
            console.warn("No se pudo cargar la tendencia");
        } finally {
            setIsTrendLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    useFocusEffect(
        useCallback(() => {
            void loadReport();
            void loadTrend();
        }, [loadReport, loadTrend])
    );


    // ─── Navegación entre meses ───────────────────────────────────────────────
    const handlePreviousMonth = () => {
        if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); return; }
        setSelectedMonth((m) => m - 1);
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); return; }
        setSelectedMonth((m) => m + 1);
    };

    // ─── Datos para gráfica de dona ───────────────────────────────────────────
    const pieData = report?.by_category
        .filter((c) => c.total > 0)
        .map((c, i) => ({
            value: c.total,
            color: CHART_COLORS[i % CHART_COLORS.length],
            label: c.category_name,
            text: `$${c.total.toFixed(0)}`,
        })) ?? [];

    // ─── Datos para gráfica de barras ─────────────────────────────────────────
    const barData = [
        {
            value: report?.total_income ?? 0,
            label: "Ingresos",
            frontColor: colors.success,
            topLabelComponent: () => (
                <Text style={{ fontSize: 9, color: colors.success, marginBottom: 4 }}>
                    ${(report?.total_income ?? 0).toFixed(0)}
                </Text>
            ),
        },
        {
            value: report?.total_expense ?? 0,
            label: "Egresos",
            frontColor: colors.danger,
            topLabelComponent: () => (
                <Text style={{ fontSize: 9, color: colors.danger, marginBottom: 4 }}>
                    ${(report?.total_expense ?? 0).toFixed(0)}
                </Text>
            ),
        },
        {
            value: report?.total_savings ?? 0,
            label: "Ahorros",
            frontColor: colors.primary,
            topLabelComponent: () => (
                <Text style={{ fontSize: 9, color: colors.primary, marginBottom: 4 }}>
                    ${(report?.total_savings ?? 0).toFixed(0)}
                </Text>
            ),
        },
    ];

    return (
        <FormScreenContainer>
            <View style={{ flex: 1, paddingVertical: spacing.lg }}>

                {/* ── Header ── */}
                <View style={{ marginBottom: spacing.lg }}>
                    <Text style={{
                        fontSize: typography.titlePage,
                        fontWeight: typography.weightBold,
                        color: colors.text,
                        marginBottom: spacing.xs,
                    }}>
                        Reportes
                    </Text>
                    <Text style={{ fontSize: typography.bodyMd, color: colors.textMuted }}>
                        Análisis visual de tus finanzas.
                    </Text>
                </View>

                {/* ── Selector de período ── */}
                <PeriodSelector
                    month={selectedMonth}
                    year={selectedYear}
                    onPrevious={handlePreviousMonth}
                    onNext={handleNextMonth}
                    onGoToCurrentMonth={() => {
                        setSelectedMonth(now.getMonth() + 1);
                        setSelectedYear(now.getFullYear());
                    }}
                />

                {/* ── Estado de carga ── */}
                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : hasError ? (
                    <AppCard>
                        <Text style={{ color: colors.text, textAlign: "center", marginBottom: spacing.md }}>
                            No se pudo cargar el reporte
                        </Text>
                        <TouchableOpacity
                            onPress={() => void loadReport()}
                            style={{
                                backgroundColor: colors.primary,
                                padding: spacing.md,
                                borderRadius: 12,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ color: colors.white, fontWeight: typography.weightSemibold }}>
                                Reintentar
                            </Text>
                        </TouchableOpacity>
                    </AppCard>
                ) : (

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ gap: spacing.lg, paddingBottom: spacing["3xl"] }}>

                            {/* ── Resumen numérico ── */}
                            <AppCard>
                                <Text style={{
                                    fontSize: typography.titleSection,
                                    fontWeight: typography.weightBold,
                                    color: colors.text,
                                    marginBottom: spacing.md,
                                }}>
                                    Resumen del mes
                                </Text>

                                <View style={{ gap: spacing.sm }}>
                                    {[
                                        { label: "Ingresos", value: report?.total_income ?? 0, color: colors.success },
                                        { label: "Egresos", value: report?.total_expense ?? 0, color: colors.danger },
                                        { label: "Ahorros", value: report?.total_savings ?? 0, color: colors.primary },
                                        { label: "Balance", value: report?.balance ?? 0, color: colors.text },
                                    ].map((item) => (
                                        <View key={item.label} style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingVertical: spacing.xs,
                                            borderBottomWidth: 1,
                                            borderBottomColor: colors.border,
                                        }}>
                                            <Text style={{ color: colors.textMuted, fontSize: typography.bodyMd }}>
                                                {item.label}
                                            </Text>
                                            <Text style={{
                                                color: item.color,
                                                fontSize: typography.bodyMd,
                                                fontWeight: typography.weightSemibold,
                                            }}>
                                                ${item.value.toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </AppCard>

                            {/* ── Gráfica de barras ── */}
                            <AppCard>
                                <Text style={{
                                    fontSize: typography.titleSection,
                                    fontWeight: typography.weightBold,
                                    color: colors.text,
                                    marginBottom: spacing.lg,
                                }}>
                                    Ingresos vs Egresos
                                </Text>

                                <BarChart
                                    data={barData}
                                    width={260}
                                    height={180}
                                    barWidth={60}
                                    spacing={20}
                                    roundedTop
                                    hideRules
                                    xAxisThickness={1}
                                    yAxisThickness={0}
                                    yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                                    xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                                    noOfSections={4}
                                    maxValue={Math.max(report?.total_income ?? 0, report?.total_expense ?? 0) * 1.2}
                                />
                            </AppCard>

                            {/* ── Tendencia 6 meses ── */}
                            <AppCard>
                                <Text style={{
                                    fontSize: typography.titleSection,
                                    fontWeight: typography.weightBold,
                                    color: colors.text,
                                    marginBottom: spacing.lg,
                                }}>
                                    Tendencia — 6 meses
                                </Text>

                                {isTrendLoading ? (
                                    <ActivityIndicator color={colors.primary} />
                                ) : (
                                    <>
                                        {/* Gráfica de líneas con barras agrupadas */}
                                        <BarChart
                                            data={trendData.flatMap((d, i) => [
                                                {
                                                    value: d.income,
                                                    label: getShortMonthName(d.month),
                                                    frontColor: colors.success,
                                                    spacing: 2,
                                                    barWidth: 16,
                                                },
                                                {
                                                    value: d.expense,
                                                    frontColor: colors.danger,
                                                    barWidth: 16,
                                                    spacing: i < trendData.length - 1 ? 12 : 0,
                                                },
                                            ])}
                                            width={280}
                                            height={160}
                                            hideRules
                                            xAxisThickness={1}
                                            yAxisThickness={0}
                                            yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                                            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                                            noOfSections={3}
                                            roundedTop
                                        />

                                        {/* Leyenda */}
                                        <View style={{
                                            flexDirection: "row",
                                            gap: spacing.lg,
                                            marginTop: spacing.md,
                                            justifyContent: "center",
                                        }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                                                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.success }} />
                                                <Text style={{ color: colors.textMuted, fontSize: typography.bodySm }}>Ingresos</Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                                                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.danger }} />
                                                <Text style={{ color: colors.textMuted, fontSize: typography.bodySm }}>Egresos</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </AppCard>

                            {/* ── Gráfica de dona — por categoría ── */}
                            {pieData.length > 0 && (
                                <AppCard>
                                    <Text style={{
                                        fontSize: typography.titleSection,
                                        fontWeight: typography.weightBold,
                                        color: colors.text,
                                        marginBottom: spacing.lg,
                                    }}>
                                        Por categoría
                                    </Text>

                                    <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
                                        <PieChart
                                            data={pieData}
                                            donut
                                            radius={90}
                                            innerRadius={55}
                                            centerLabelComponent={() => (
                                                <View style={{ alignItems: "center" }}>
                                                    <Text style={{
                                                        fontSize: typography.bodySm,
                                                        color: colors.textMuted,
                                                    }}>
                                                        Total
                                                    </Text>
                                                    <Text style={{
                                                        fontSize: typography.bodyLg,
                                                        fontWeight: typography.weightBold,
                                                        color: colors.text,
                                                    }}>
                                                        ${(report?.total_income ?? 0 + (report?.total_expense ?? 0)).toFixed(0)}
                                                    </Text>
                                                </View>
                                            )}
                                        />
                                    </View>

                                    {/* ── Leyenda ── */}
                                    <View style={{ gap: spacing.sm }}>
                                        {pieData.map((item) => (
                                            <View key={item.label} style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                                                    <View style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: 5,
                                                        backgroundColor: item.color,
                                                    }} />
                                                    <Text style={{ color: colors.textMuted, fontSize: typography.bodySm }}>
                                                        {item.label}
                                                    </Text>
                                                </View>
                                                <Text style={{
                                                    color: colors.text,
                                                    fontSize: typography.bodySm,
                                                    fontWeight: typography.weightSemibold,
                                                }}>
                                                    ${item.value.toFixed(2)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </AppCard>
                            )}

                            {/* ── Por método de pago ── */}
                            {(report?.by_payment_method?.length ?? 0) > 0 && (
                                <AppCard>
                                    <Text style={{
                                        fontSize: typography.titleSection,
                                        fontWeight: typography.weightBold,
                                        color: colors.text,
                                        marginBottom: spacing.md,
                                    }}>
                                        Por método de pago
                                    </Text>

                                    <View style={{ gap: spacing.sm }}>
                                        {report?.by_payment_method.map((item) => (
                                            <View key={item.payment_method_name} style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                paddingVertical: spacing.xs,
                                                borderBottomWidth: 1,
                                                borderBottomColor: colors.border,
                                            }}>
                                                <Text style={{ color: colors.textMuted, fontSize: typography.bodyMd }}>
                                                    {item.payment_method_name}
                                                </Text>
                                                <View style={{ alignItems: "flex-end" }}>
                                                    <Text style={{
                                                        color: colors.text,
                                                        fontSize: typography.bodyMd,
                                                        fontWeight: typography.weightSemibold,
                                                    }}>
                                                        ${item.total.toFixed(2)}
                                                    </Text>
                                                    <Text style={{ color: colors.textMuted, fontSize: typography.bodySm }}>
                                                        {item.count} mov.
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </AppCard>
                            )}

                        </View>
                    </ScrollView>
                )}
            </View>
        </FormScreenContainer>
    );
}