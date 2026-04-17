import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { useToast } from "@/components/ui/toast-provider";

// ─── Componentes del historial ────────────────────────────────────────────────
import {
    HistoryFilters,
    type FilterType,
} from "@/components/history/history-filters";
import { TransactionList } from "@/components/history/transaction-list";

import {
    getAccountsByTransactionType,
    getCategoriesByType,
} from "@/features/transactions/transaction-catalogs.service";
import {
    getTransactionHistory,
    type TransactionHistoryFilters,
} from "@/features/transactions/transactions.service";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";
import type { Account, Category } from "@/types/catalogs";
import type { TransactionItemData } from "@/components/history/transaction-item";
import { PeriodSelector } from "@/components/ui/period-selector";

// ─── Helper: deduplicar por id ────────────────────────────────────────────────
// Resuelve el problema #6 del análisis — la deduplicación original
// usaba findIndex dentro de filter, que es O(n²).
// Map es O(n) — más eficiente y más fácil de leer.
function deduplicateById<T extends { id: string }>(items: T[]): T[] {
    return Array.from(
        new Map(items.map((item) => [item.id, item])).values()
    );
}

export default function HistoryScreen() {
    const session = useAuthStore((state) => state.session);
    const { showToast } = useToast();

    const now = new Date();

    // ─── Estado: período seleccionado ─────────────────────────────────────────
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    // ─── Estado: filtros ──────────────────────────────────────────────────────
    const [typeFilter, setTypeFilter] = useState<FilterType>("all");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [accountFilter, setAccountFilter] = useState("");
    const [searchText, setSearchText] = useState("");

    // ─── Ir al mes actual ─────────────────────────────────────────────────────────
    const handleGoToCurrentMonth = () => {
        setSelectedMonth(now.getMonth() + 1);
        setSelectedYear(now.getFullYear());
    };

    // ─── Estado: catálogos de filtros ─────────────────────────────────────────
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // ─── Estado: lista de transacciones ──────────────────────────────────────
    const [items, setItems] = useState<TransactionItemData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // ─── Debounce manual para búsqueda ────────────────────────────────────────
    // Esperamos 350ms después de que el usuario deja de escribir
    // antes de ejecutar la búsqueda — evita queries en cada tecla.
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 350);

        // Limpiamos el timer si el usuario sigue escribiendo
        return () => clearTimeout(timer);
    }, [searchText]);

    // ─── Carga de catálogos ───────────────────────────────────────────────────
    // Se ejecuta una sola vez al montar la pantalla.
    // Los catálogos no cambian durante la sesión.
    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [expenseCategories, incomeCategories] = await Promise.all([
                    getCategoriesByType("expense"),
                    getCategoriesByType("income"),
                ]);

                // Usamos el helper O(n) en lugar del findIndex O(n²)
                setCategories(
                    deduplicateById([...expenseCategories, ...incomeCategories])
                );

                const [expenseAccounts, incomeAccounts] = await Promise.all([
                    getAccountsByTransactionType("expense"),
                    getAccountsByTransactionType("income"),
                ]);

                setAccounts(
                    deduplicateById([...expenseAccounts, ...incomeAccounts])
                );
            } catch {
                // Si los catálogos fallan, la pantalla sigue funcionando
                // — el usuario puede filtrar sin chips de categoría/cuenta
                showToast("No se pudieron cargar los filtros", "error");
            }
        };

        void loadCatalogs();
    }, []);

    // ─── Carga del historial ──────────────────────────────────────────────────
    const loadHistory = useCallback(async () => {
        if (!session?.user.id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setHasError(false);

            const filters: TransactionHistoryFilters = {
                year: selectedYear,
                month: selectedMonth,
                type: typeFilter,
                categoryId: categoryFilter || undefined,
                accountId: accountFilter || undefined,
                searchText: debouncedSearch || undefined,
            };

            const history = await getTransactionHistory(
                session.user.id,
                filters
            );

            setItems(history);
        } catch {
            // Activamos el estado de error para mostrar feedback
            // al usuario en lugar de dejar la pantalla vacía
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, [
        session?.user.id,
        selectedYear,
        selectedMonth,
        typeFilter,
        categoryFilter,
        accountFilter,
        debouncedSearch,
    ]);

    // Recarga al volver a la pantalla y cuando cambian los filtros
    useFocusEffect(
        useCallback(() => {
            void loadHistory();
        }, [loadHistory])
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

    // ─── Limpiar filtros ──────────────────────────────────────────────────────
    const handleClearFilters = () => {
        setTypeFilter("all");
        setCategoryFilter("");
        setAccountFilter("");
        setSearchText("");
        showToast("Filtros limpiados", "info");
    };

    return (
        <FormScreenContainer>
            <View style={{ flex: 1, paddingVertical: spacing.lg }}>

                {/* ── Header ── */}
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
                        Revisa tus movimientos y filtra lo que quieres analizar.
                    </Text>
                </View>

                {/* ── Selector de mes ── */}
                <PeriodSelector
                    month={selectedMonth}
                    year={selectedYear}
                    onPrevious={handlePreviousMonth}
                    onNext={handleNextMonth}
                    onGoToCurrentMonth={handleGoToCurrentMonth}
                />

                {/* ── Filtros ── */}
                <HistoryFilters
                    searchText={searchText}
                    typeFilter={typeFilter}
                    categoryFilter={categoryFilter}
                    accountFilter={accountFilter}
                    categories={categories}
                    accounts={accounts}
                    onSearchChange={setSearchText}
                    onTypeChange={setTypeFilter}
                    onCategoryChange={setCategoryFilter}
                    onAccountChange={setAccountFilter}
                    onClearFilters={handleClearFilters}
                />

                {/* ── Lista de transacciones ── */}
                <TransactionList
                    items={items}
                    isLoading={isLoading}
                    hasError={hasError}
                    onRetry={() => void loadHistory()}
                />
            </View>
        </FormScreenContainer>
    );
}