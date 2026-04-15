import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppCard } from "@/components/ui/app-card";
import { MonthSelector } from "@/components/ui/month-selector";
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
import { AppInput } from "@/components/ui/app-input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type FilterType = "all" | "income" | "expense";

export default function HistoryScreen() {
    const session = useAuthStore((state) => state.session);

    const now = new Date();

    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    const [typeFilter, setTypeFilter] = useState<FilterType>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [accountFilter, setAccountFilter] = useState<string>("");

    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [searchText, setSearchText] = useState("");
    const debouncedSearchText = useDebouncedValue(searchText, 350);

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

    useEffect(() => {
        const loadFilterCatalogs = async () => {
            const [expenseCategories, incomeCategories] = await Promise.all([
                getCategoriesByType("expense"),
                getCategoriesByType("income"),
            ]);

            const mergedCategories = [...expenseCategories, ...incomeCategories].filter(
                (item, index, array) => array.findIndex((x) => x.id === item.id) === index
            );

            const [expenseAccounts, incomeAccounts] = await Promise.all([
                getAccountsByTransactionType("expense"),
                getAccountsByTransactionType("income"),
            ]);

            const mergedAccounts = [...expenseAccounts, ...incomeAccounts].filter(
                (item, index, array) => array.findIndex((x) => x.id === item.id) === index
            );

            setCategories(mergedCategories);
            setAccounts(mergedAccounts);
        };

        void loadFilterCatalogs();
    }, []);

    const loadHistory = useCallback(async () => {
        if (!session?.user.id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const filters: TransactionHistoryFilters = {
                year: selectedYear,
                month: selectedMonth,
                type: typeFilter,
                categoryId: categoryFilter || undefined,
                accountId: accountFilter || undefined,
                searchText: debouncedSearchText || undefined,
            };

            const history = await getTransactionHistory(session.user.id, filters);
            setItems(history);
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
        debouncedSearchText,
    ]);

    useFocusEffect(
        useCallback(() => {
            void loadHistory();
        }, [loadHistory])
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

    const filterChipStyle = (isSelected: boolean) => ({
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: isSelected ? colors.primary : colors.border,
        backgroundColor: isSelected ? colors.primarySoft : colors.white,
    });

    const filterChipTextStyle = (isSelected: boolean) => ({
        color: isSelected ? colors.primary : colors.text,
        fontWeight: typography.weightSemibold as "400" | "500" | "600" | "700",
        fontSize: typography.bodySm,
    });

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
                        Revisa tus movimientos y filtra lo que quieres analizar.
                    </Text>
                </View>

                <MonthSelector
                    month={selectedMonth}
                    year={selectedYear}
                    onPrevious={handlePreviousMonth}
                    onNext={handleNextMonth}
                />

                <AppCard style={{ marginBottom: spacing.lg }}>
                    <Text
                        style={{
                            fontSize: typography.titleSection,
                            fontWeight: typography.weightBold,
                            color: colors.text,
                            marginBottom: spacing.md,
                        }}
                    >
                        Filtros
                    </Text>

                    <AppInput
                        label="Buscar"
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholder="Ej. DiDi, Apple bill, BBVA"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    {searchText.trim().length > 0 ? (
                        <TouchableOpacity
                            onPress={() => setSearchText("")}
                            activeOpacity={0.85}
                            style={{
                                alignSelf: "flex-start",
                                marginTop: -4,
                                marginBottom: spacing.md,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 999,
                                backgroundColor: colors.surfaceMuted,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.textMuted,
                                    fontSize: typography.bodySm,
                                    fontWeight: typography.weightSemibold,
                                }}
                            >
                                Limpiar búsqueda
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    <Text
                        style={{
                            fontSize: typography.bodySm,
                            color: colors.textMuted,
                            marginBottom: spacing.sm,
                        }}
                    >
                        Tipo
                    </Text>

                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: spacing.sm,
                            marginBottom: spacing.lg,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setTypeFilter("all")}
                            style={filterChipStyle(typeFilter === "all")}
                        >
                            <Text style={filterChipTextStyle(typeFilter === "all")}>Todos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setTypeFilter("income")}
                            style={filterChipStyle(typeFilter === "income")}
                        >
                            <Text style={filterChipTextStyle(typeFilter === "income")}>
                                Ingresos
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setTypeFilter("expense")}
                            style={filterChipStyle(typeFilter === "expense")}
                        >
                            <Text style={filterChipTextStyle(typeFilter === "expense")}>
                                Egresos
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{
                            fontSize: typography.bodySm,
                            color: colors.textMuted,
                            marginBottom: spacing.sm,
                        }}
                    >
                        Categoría
                    </Text>

                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: spacing.sm,
                            marginBottom: spacing.lg,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setCategoryFilter("")}
                            style={filterChipStyle(categoryFilter === "")}
                        >
                            <Text style={filterChipTextStyle(categoryFilter === "")}>Todas</Text>
                        </TouchableOpacity>

                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                onPress={() => setCategoryFilter(category.id)}
                                style={filterChipStyle(categoryFilter === category.id)}
                            >
                                <Text style={filterChipTextStyle(categoryFilter === category.id)}>
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text
                        style={{
                            fontSize: typography.bodySm,
                            color: colors.textMuted,
                            marginBottom: spacing.sm,
                        }}
                    >
                        Cuenta
                    </Text>

                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: spacing.sm,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setAccountFilter("")}
                            style={filterChipStyle(accountFilter === "")}
                        >
                            <Text style={filterChipTextStyle(accountFilter === "")}>Todas</Text>
                        </TouchableOpacity>

                        {accounts.map((account) => (
                            <TouchableOpacity
                                key={account.id}
                                onPress={() => setAccountFilter(account.id)}
                                style={filterChipStyle(accountFilter === account.id)}
                            >
                                <Text style={filterChipTextStyle(accountFilter === account.id)}>
                                    {account.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </AppCard>

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
                            No encontramos movimientos
                        </Text>

                        <Text
                            style={{
                                color: colors.textMuted,
                                fontSize: typography.bodyMd,
                                lineHeight: 22,
                            }}
                        >
                            Prueba cambiando el mes o ajustando los filtros para ver más
                            resultados.
                        </Text>
                    </AppCard>
                ) : (
                    <View style={{ gap: spacing.md }}>
                        {items.map((item) => {
                            const isIncome = item.type === "income";

                            return (
                                <TouchableOpacity
                                    key={item.localId}
                                    activeOpacity={0.85}
                                    onPress={() => router.push(`/edit-transaction/${item.localId}`)}
                                >
                                    <AppCard>
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
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>
        </FormScreenContainer>
    );
}