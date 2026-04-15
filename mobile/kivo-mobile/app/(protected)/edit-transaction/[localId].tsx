import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import {
    getAccountsByTransactionType,
    getCategoriesByType,
} from "@/features/transactions/transaction-catalogs.service";
import {
    transactionSchema,
    type TransactionFormValues,
} from "@/features/transactions/transaction.schemas";
import {
    deleteTransaction,
    getTransactionByLocalId,
    updateTransaction,
} from "@/features/transactions/transactions.service";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";
import type { Account, Category } from "@/types/catalogs";
import {
    dateInputToIso,
    formatDateInput,
    isoToDateInput,
} from "@/utils/date-format";

export default function EditTransactionScreen() {
    const { localId } = useLocalSearchParams<{ localId: string }>();

    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: "expense",
            amount: "",
            transactionDate: "",
            categoryId: "",
            accountId: "",
            concept: "",
            note: "",
        },
    });

    const selectedType = useWatch({
        control,
        name: "type",
    });

    useEffect(() => {
        const loadTransaction = async () => {
            if (!localId) {
                return;
            }

            try {
                setIsLoading(true);

                const transaction = await getTransactionByLocalId(localId);

                if (!transaction) {
                    Alert.alert("Movimiento no encontrado");
                    router.back();
                    return;
                }

                reset({
                    type: transaction.type,
                    amount: String(transaction.amount),
                    transactionDate: isoToDateInput(transaction.transactionDate),
                    categoryId: transaction.categoryId,
                    accountId: transaction.accountId,
                    concept: transaction.concept ?? "",
                    note: transaction.note ?? "",
                });
            } finally {
                setIsLoading(false);
            }
        };

        void loadTransaction();
    }, [localId, reset]);

    useEffect(() => {
        const loadCatalogs = async () => {
            const [loadedCategories, loadedAccounts] = await Promise.all([
                getCategoriesByType(selectedType),
                getAccountsByTransactionType(selectedType),
            ]);

            setCategories(loadedCategories);
            setAccounts(loadedAccounts);
        };

        void loadCatalogs();
    }, [selectedType]);

    const onSubmit = async (values: TransactionFormValues) => {
        if (!localId) {
            return;
        }

        Keyboard.dismiss();

        await updateTransaction({
            localId,
            type: values.type,
            amount: Number(values.amount),
            categoryId: values.categoryId,
            accountId: values.accountId,
            concept: values.concept?.trim() || null,
            note: values.note?.trim() || null,
            transactionDate: dateInputToIso(values.transactionDate),
        } as any);

        router.back();
    };

    const handleDelete = () => {
        if (!localId) {
            return;
        }

        Alert.alert(
            "Eliminar movimiento",
            "Esta acción quitará el movimiento de tu historial y de tus resúmenes.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        await deleteTransaction(localId);
                        router.back();
                    },
                },
            ]
        );
    };

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
                        Editar movimiento
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.bodyLg,
                            lineHeight: 24,
                            color: colors.textMuted,
                        }}
                    >
                        Ajusta la información del movimiento o elimínalo si fue un error.
                    </Text>
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
                        Tipo de movimiento
                    </Text>

                    <Controller
                        control={control}
                        name="type"
                        render={({ field: { value, onChange } }) => (
                            <View style={{ flexDirection: "row", gap: spacing.md }}>
                                <TouchableOpacity
                                    onPress={() => onChange("expense")}
                                    activeOpacity={0.85}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 16,
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor:
                                            value === "expense" ? colors.danger : colors.border,
                                        backgroundColor:
                                            value === "expense" ? colors.dangerSoft : colors.white,
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            color: value === "expense" ? colors.danger : colors.text,
                                            fontWeight: typography.weightSemibold,
                                            fontSize: typography.bodyLg,
                                        }}
                                    >
                                        Egreso
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => onChange("income")}
                                    activeOpacity={0.85}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 16,
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor:
                                            value === "income" ? colors.success : colors.border,
                                        backgroundColor:
                                            value === "income" ? colors.successSoft : colors.white,
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            color: value === "income" ? colors.success : colors.text,
                                            fontWeight: typography.weightSemibold,
                                            fontSize: typography.bodyLg,
                                        }}
                                    >
                                        Ingreso
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                </AppCard>

                <AppCard style={{ marginBottom: spacing.lg }}>
                    <Controller
                        control={control}
                        name="amount"
                        render={({ field: { value, onChange } }) => (
                            <AppInput
                                label="Monto"
                                value={value}
                                onChangeText={onChange}
                                placeholder="0.00"
                                keyboardType="numeric"
                                error={errors.amount?.message}
                                inputStyle={{
                                    fontSize: 28,
                                    fontWeight: typography.weightBold,
                                    paddingVertical: 18,
                                }}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="transactionDate"
                        render={({ field: { value, onChange } }) => (
                            <AppInput
                                label="Fecha"
                                value={value}
                                onChangeText={(text) => onChange(formatDateInput(text))}
                                placeholder="DD/MM/YYYY"
                                keyboardType="numeric"
                                error={errors.transactionDate?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="concept"
                        render={({ field: { value, onChange } }) => (
                            <AppInput
                                label="Concepto"
                                value={value ?? ""}
                                onChangeText={onChange}
                                placeholder="Ej. DiDi, Nómina, Apple bill"
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="note"
                        render={({ field: { value, onChange } }) => (
                            <AppInput
                                label="Nota"
                                value={value ?? ""}
                                onChangeText={onChange}
                                placeholder="Opcional"
                            />
                        )}
                    />
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
                        Categoría
                    </Text>

                    <Controller
                        control={control}
                        name="categoryId"
                        render={({ field: { value, onChange } }) => (
                            <View style={{ gap: spacing.sm }}>
                                {categories.map((category) => {
                                    const isSelected = value === category.id;

                                    return (
                                        <TouchableOpacity
                                            key={category.id}
                                            onPress={() => onChange(category.id)}
                                            activeOpacity={0.85}
                                            style={{
                                                paddingVertical: 15,
                                                paddingHorizontal: 14,
                                                borderRadius: 16,
                                                borderWidth: 1,
                                                borderColor: isSelected
                                                    ? colors.primary
                                                    : colors.border,
                                                backgroundColor: isSelected
                                                    ? colors.primarySoft
                                                    : colors.white,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: isSelected ? colors.primary : colors.text,
                                                    fontWeight: typography.weightSemibold,
                                                    fontSize: typography.bodyLg,
                                                }}
                                            >
                                                {category.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    />
                </AppCard>

                <AppCard style={{ marginBottom: spacing.lg }}>
                    <Text
                        style={{
                            fontSize: typography.titleSection,
                            fontWeight: typography.weightBold,
                            color: colors.text,
                            marginBottom: spacing.xs,
                        }}
                    >
                        Cuenta
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.bodySm,
                            color: colors.textMuted,
                            marginBottom: spacing.md,
                        }}
                    >
                        {selectedType === "expense"
                            ? "Selecciona desde dónde salió el dinero."
                            : "Selecciona a dónde entró el dinero."}
                    </Text>

                    <Controller
                        control={control}
                        name="accountId"
                        render={({ field: { value, onChange } }) => (
                            <View style={{ gap: spacing.sm }}>
                                {accounts.map((account) => {
                                    const isSelected = value === account.id;

                                    return (
                                        <TouchableOpacity
                                            key={account.id}
                                            onPress={() => onChange(account.id)}
                                            activeOpacity={0.85}
                                            style={{
                                                paddingVertical: 15,
                                                paddingHorizontal: 14,
                                                borderRadius: 16,
                                                borderWidth: 1,
                                                borderColor: isSelected
                                                    ? colors.primary
                                                    : colors.border,
                                                backgroundColor: isSelected
                                                    ? colors.primarySoft
                                                    : colors.white,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: isSelected ? colors.primary : colors.text,
                                                    fontWeight: typography.weightSemibold,
                                                    fontSize: typography.bodyLg,
                                                }}
                                            >
                                                {account.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    />
                </AppCard>

                <AppButton
                    label={isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    style={{ marginBottom: spacing.md }}
                />

                <AppButton
                    label="Eliminar movimiento"
                    onPress={handleDelete}
                    variant="secondary"
                />
            </View>
        </FormScreenContainer>
    );
}