import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import * as Haptics from "expo-haptics";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
    ActivityIndicator,
    Keyboard,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { DateField } from "@/components/ui/date-field";
import {
    getAccountsByTransactionType,
    getCategoriesByType,
} from "@/features/transactions/transaction-catalogs.service";
import {
    transactionSchema,
    type TransactionFormValues,
} from "@/features/transactions/transaction.schemas";
import { createTransaction } from "@/features/transactions/transactions.service";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";
import type { Account, Category } from "@/types/catalogs";

export default function AddTransactionScreen() {
    const session = useAuthStore((state) => state.session);

    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);

    const { showToast } = useToast();

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: "expense",
            amount: "",
            transactionDate: new Date().toISOString(),
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
        const loadCatalogs = async () => {
            try {
                setIsLoadingCatalogs(true);

                const [loadedCategories, loadedAccounts] = await Promise.all([
                    getCategoriesByType(selectedType),
                    getAccountsByTransactionType(selectedType),
                ]);

                setCategories(loadedCategories);
                setAccounts(loadedAccounts);

                setValue("categoryId", loadedCategories[0]?.id ?? "");
                setValue("accountId", loadedAccounts[0]?.id ?? "");
            } finally {
                setIsLoadingCatalogs(false);
            }
        };

        void loadCatalogs();
    }, [selectedType, setValue]);

    const onSubmit = async (values: TransactionFormValues) => {
        if (!session?.user.id) {
            return;
        }

        try {
            Keyboard.dismiss();

            await createTransaction({
                userId: session.user.id,
                type: values.type,
                amount: Number(values.amount),
                categoryId: values.categoryId,
                accountId: values.accountId,
                concept: values.concept?.trim() || null,
                note: values.note?.trim() || null,
                transactionDate: values.transactionDate,
            });

            // Feedback háptico de éxito — le confirma al usuario que
            // la acción se completó sin que tenga que leer el toast.
            // Success usa un patrón de vibración positivo del sistema operativo.
            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );

            showToast("Movimiento guardado", "success");
            router.back();
        } catch (error) {
            console.error(error);

            // Feedback háptico de error — vibración más intensa que indica
            // que algo salió mal. El usuario lo siente antes de leer el mensaje.
            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
            );

            showToast("No se pudo guardar el movimiento", "error");
        }
    };

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
                        Nuevo movimiento
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.bodyLg,
                            lineHeight: 24,
                            color: colors.textMuted,
                        }}
                    >
                        Registra un ingreso o egreso de forma rápida y clara.
                    </Text>
                </View>

                {isLoadingCatalogs ? (
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
                                                    value === "expense"
                                                        ? colors.dangerSoft
                                                        : colors.white,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: "center",
                                                    color:
                                                        value === "expense" ? colors.danger : colors.text,
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
                                                    value === "income"
                                                        ? colors.successSoft
                                                        : colors.white,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: "center",
                                                    color:
                                                        value === "income" ? colors.success : colors.text,
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
                                    <DateField
                                        label="Fecha"
                                        value={value}
                                        onChange={onChange}
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

                            {errors.categoryId?.message ? (
                                <Text
                                    style={{
                                        marginTop: spacing.sm,
                                        fontSize: typography.caption,
                                        color: colors.danger,
                                    }}
                                >
                                    {errors.categoryId.message}
                                </Text>
                            ) : null}
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

                            {errors.accountId?.message ? (
                                <Text
                                    style={{
                                        marginTop: spacing.sm,
                                        fontSize: typography.caption,
                                        color: colors.danger,
                                    }}
                                >
                                    {errors.accountId.message}
                                </Text>
                            ) : null}
                        </AppCard>

                        <AppButton
                            label={isSubmitting ? "Guardando..." : "Guardar movimiento"}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                        />
                    </>
                )}
            </View>
        </FormScreenContainer>
    );
}