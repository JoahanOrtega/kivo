import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { PeriodSelector } from "@/components/ui/period-selector";

// ─── Componentes del home ─────────────────────────────────────────────────────
// Cada uno vive en su propio archivo y tiene una responsabilidad clara.
import { AccountsSummary } from "@/components/home/accounts-summary";
import { BalanceCard } from "@/components/home/balance-card";
import { CategoriesSummary } from "@/components/home/categories-summary";
import { EmptyMonthState } from "@/components/home/empty-month-state";
import { IncomeExpenseRow } from "@/components/home/income-expense-row";
import { PendingSyncBanner } from "@/components/home/pending-sync-banner";
import { QuickActions } from "@/components/home/quick-actions";

import {
    getDashboardSummary,
    type DashboardSummary,
} from "@/features/dashboard/dashboard.service";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";
import { BRAND } from "@/constants/brand";

// ─── Estado inicial del dashboard ────────────────────────────────────────────
// Definimos los valores por defecto fuera del componente para que no se
// recree en cada render. Si están dentro, React crea un objeto nuevo
// en cada ciclo aunque los valores sean iguales.
const INITIAL_SUMMARY: DashboardSummary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
    pendingSyncCount: 0,
    categoriesSummary: [],
    accountsSummary: [],
};

export default function HomeScreen() {
    const session = useAuthStore((state) => state.session);
    const now = new Date();

    // ─── Estado del período seleccionado ─────────────────────────────────────
    // El usuario puede navegar entre meses — estos dos estados controlan
    // qué período se está visualizando en el dashboard.
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    // ─── Estado del dashboard ─────────────────────────────────────────────────
    const [summary, setSummary] = useState<DashboardSummary>(INITIAL_SUMMARY);
    const [isLoading, setIsLoading] = useState(true);

    // ─── Estado de error ──────────────────────────────────────────────────────
    // Nuevo vs el original — si la carga falla, guardamos el error
    // para mostrárselo al usuario en lugar de dejar la pantalla vacía.
    const [hasError, setHasError] = useState(false);

    // ─── Carga del dashboard ──────────────────────────────────────────────────
    // useCallback memoriza la función para que useFocusEffect no la recree
    // en cada render. Solo se recrea cuando cambian sus dependencias.
    const loadDashboard = useCallback(async () => {
        if (!session?.user.id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setHasError(false);

            const result = await getDashboardSummary({
                userId: session.user.id,
                year: selectedYear,
                month: selectedMonth,
            });

            setSummary(result);
        } catch {
            // Si la carga falla activamos el estado de error para
            // mostrar feedback al usuario en lugar de pantalla vacía.
            setHasError(true);
        } finally {
            // finally siempre se ejecuta — con éxito o con error.
            // Garantiza que el spinner siempre desaparezca.
            setIsLoading(false);
        }
    }, [session?.user.id, selectedMonth, selectedYear]);

    // ─── Recargar al enfocar la pantalla ─────────────────────────────────────
    // useFocusEffect recarga el dashboard cada vez que el usuario
    // regresa a esta pantalla — por ejemplo, después de agregar un gasto.
    useFocusEffect(
        useCallback(() => {
            void loadDashboard();
        }, [loadDashboard])
    );

    // ─── Navegación entre meses ───────────────────────────────────────────────
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

    // ─── Render: estado de carga ──────────────────────────────────────────────
    // Mientras carga mostramos el spinner centrado en pantalla.
    if (isLoading) {
        return (
            <FormScreenContainer>
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </FormScreenContainer>
        );
    }

    // ─── Render: estado de error ──────────────────────────────────────────────
    // Si la carga falló mostramos un mensaje claro con botón de reintento.
    if (hasError) {
        return (
            <FormScreenContainer>
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: spacing["2xl"],
                    }}
                >
                    <Text
                        style={{
                            fontSize: typography.bodyLg,
                            fontWeight: typography.weightSemibold,
                            color: colors.text,
                            textAlign: "center",
                            marginBottom: spacing.sm,
                        }}
                    >
                        No se pudo cargar el resumen
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.bodyMd,
                            color: colors.textMuted,
                            textAlign: "center",
                            marginBottom: spacing.xl,
                            lineHeight: 22,
                        }}
                    >
                        Revisa tu conexión e intenta de nuevo.
                    </Text>

                    <TouchableOpacity
                        onPress={() => void loadDashboard()}
                        activeOpacity={0.85}
                        style={{
                            backgroundColor: colors.primary,
                            paddingVertical: 12,
                            paddingHorizontal: spacing["2xl"],
                            borderRadius: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: colors.white,
                                fontSize: typography.bodyMd,
                                fontWeight: typography.weightSemibold,
                            }}
                        >
                            Reintentar
                        </Text>
                    </TouchableOpacity>
                </View>
            </FormScreenContainer>
        );
    }

    // ─── Render: contenido principal ──────────────────────────────────────────
    // Con los estados de carga y error resueltos arriba, aquí solo
    // llega el flujo feliz — el dashboard con datos reales.
    // Nota cómo cada sección es ahora un componente de una línea.
    return (
        <FormScreenContainer>
            <View style={{ flex: 1, paddingVertical: spacing.lg }}>

                {/* ── Header ── */}
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

                {/* ── Selector de período ── */}
                <PeriodSelector
                    month={selectedMonth}
                    year={selectedYear}
                    onPrevious={handlePreviousMonth}
                    onNext={handleNextMonth}
                    onGoToCurrentMonth={handleSelectCurrentMonth}
                />

                {/* ── Saldo del mes ── */}
                <BalanceCard
                    balance={summary.balance}
                    transactionCount={summary.transactionCount}
                />

                {/* ── Ingresos y egresos ── */}
                <IncomeExpenseRow
                    totalIncome={summary.totalIncome}
                    totalExpense={summary.totalExpense}
                />

                {/* ── Banner de sync pendiente — solo si hay pendientes ── */}
                {summary.pendingSyncCount > 0 && (
                    <PendingSyncBanner
                        pendingCount={summary.pendingSyncCount}
                    />
                )}

                {/* ── Resumen por categoría ── */}
                <CategoriesSummary items={summary.categoriesSummary} />

                {/* ── Resumen por cuenta ── */}
                <AccountsSummary items={summary.accountsSummary} />

                {/* ── Acciones rápidas ── */}
                <QuickActions />

                {/* ── Estado vacío — solo si no hay movimientos ── */}
                {summary.transactionCount === 0 && <EmptyMonthState />}

            </View>
        </FormScreenContainer>
    );
}