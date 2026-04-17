import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { useForm, useWatch } from "react-hook-form";
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
import { useToast } from "@/components/ui/toast-provider";

// ─── Componentes reutilizados de add-transaction ──────────────────────────────
// No creamos carpeta nueva — estos componentes ya existen y
// son exactamente lo que necesitamos aquí también.
import { CatalogSelector } from "@/components/add-transaction/catalog-selector";
import { TransactionFields } from "@/components/add-transaction/transaction-fields";
import { TypeSelector } from "@/components/add-transaction/type-selector";

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

export default function EditTransactionScreen() {
    const { localId } = useLocalSearchParams<{ localId: string }>();
    const { showToast } = useToast();

    // ─── Estado: catálogos ────────────────────────────────────────────────────
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // ─── Estado: carga y errores ──────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);
    const [hasCatalogError, setHasCatalogError] = useState(false);

    // ─── Formulario ───────────────────────────────────────────────────────────
    const {
        control,
        handleSubmit,
        reset,
        setValue,
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

    const selectedType = useWatch({ control, name: "type" });

    // ─── Carga de la transacción ──────────────────────────────────────────────
    // Se ejecuta una sola vez al montar la pantalla.
    // Precarga el formulario con los valores existentes de la transacción.
    useEffect(() => {
        const loadTransaction = async () => {
            if (!localId) return;

            try {
                setIsLoading(true);
                setHasLoadError(false);

                const transaction = await getTransactionByLocalId(localId);

                // Si no existe la transacción navegamos atrás inmediatamente
                if (!transaction) {
                    showToast("Movimiento no encontrado", "error");
                    router.back();
                    return;
                }

                // Precargamos el formulario con los valores de la transacción.
                // reset() reemplaza todos los valores del formulario de una vez,
                // lo que es más limpio que múltiples llamadas a setValue().
                reset({
                    type: transaction.type,
                    amount: String(transaction.amount),
                    transactionDate: transaction.transactionDate,
                    categoryId: transaction.categoryId,
                    accountId: transaction.accountId,
                    concept: transaction.concept ?? "",
                    note: transaction.note ?? "",
                });
            } catch {
                // Si la carga falla mostramos el estado de error
                // en lugar de dejar el formulario vacío sin explicación.
                setHasLoadError(true);
            } finally {
                setIsLoading(false);
            }
        };

        void loadTransaction();
    }, [localId, reset]);

    // ─── Carga de catálogos ───────────────────────────────────────────────────
    // Se recarga cada vez que cambia el tipo seleccionado.
    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                setHasCatalogError(false);

                const [loadedCategories, loadedAccounts] = await Promise.all([
                    getCategoriesByType(selectedType),
                    getAccountsByTransactionType(selectedType),
                ]);

                setCategories(loadedCategories);
                setAccounts(loadedAccounts);
            } catch {
                setHasCatalogError(true);
                showToast("No se pudieron cargar las opciones", "error");
            }
        };

        void loadCatalogs();
    }, [selectedType]);

    // ─── Submit: actualizar ───────────────────────────────────────────────────
    const onSubmit = async (values: TransactionFormValues) => {
        if (!localId) return;

        try {
            Keyboard.dismiss();

            await updateTransaction({
                localId,
                type: values.type,
                amount: Number(values.amount),
                categoryId: values.categoryId,
                accountId: values.accountId,
                concept: values.concept?.trim() || null,
                note: values.note?.trim() || null,
                transactionDate: values.transactionDate,
            });

            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );

            showToast("Movimiento actualizado", "success");
            router.back();
        } catch (error) {
            console.error(error);

            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
            );

            showToast("No se pudo actualizar", "error");
        }
    };

    // ─── Eliminar ─────────────────────────────────────────────────────────────
    // Confirmación antes de eliminar — acción irreversible.
    const handleDelete = () => {
        if (!localId) return;

        Alert.alert(
            "Eliminar movimiento",
            "Esta acción quitará el movimiento de tu historial y de tus resúmenes.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteTransaction(localId);

                            await Haptics.notificationAsync(
                                Haptics.NotificationFeedbackType.Warning
                            );

                            showToast("Movimiento eliminado", "success");
                            router.back();
                        } catch (error) {
                            console.error(error);

                            await Haptics.notificationAsync(
                                Haptics.NotificationFeedbackType.Error
                            );

                            showToast("No se pudo eliminar", "error");
                        }
                    },
                },
            ]
        );
    };

    // ─── Render: estado de carga ──────────────────────────────────────────────
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

    // ─── Render: error de carga ───────────────────────────────────────────────
    if (hasLoadError) {
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
                        No se pudo cargar el movimiento
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
                        Regresa e intenta de nuevo.
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.back()}
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
                            Regresar
                        </Text>
                    </TouchableOpacity>
                </View>
            </FormScreenContainer>
        );
    }

    // ─── Render: formulario ───────────────────────────────────────────────────
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

                {/* ── Selector de tipo ── */}
                <TypeSelector
                    value={selectedType}
                    onChange={(type) => setValue("type", type)}
                />

                {/* ── Campos del formulario ── */}
                <TransactionFields
                    control={control}
                    errors={errors}
                />

                {/* ── Selector de categoría ── */}
                <CatalogSelector
                    title="Categoría"
                    options={categories}
                    selectedId={control._formValues.categoryId}
                    onChange={(id) => setValue("categoryId", id)}
                    error={errors.categoryId?.message}
                />

                {/* ── Selector de cuenta ── */}
                <CatalogSelector
                    title="Cuenta"
                    description={
                        selectedType === "expense"
                            ? "Selecciona desde dónde salió el dinero."
                            : "Selecciona a dónde entró el dinero."
                    }
                    options={accounts}
                    selectedId={control._formValues.accountId}
                    onChange={(id) => setValue("accountId", id)}
                    error={errors.accountId?.message}
                />

                {/* ── Botón guardar cambios ── */}
                <AppButton
                    label={isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    style={{ marginBottom: spacing.md }}
                />

                {/* ── Botón eliminar ── */}
                {/* Solo visible si los catálogos cargaron correctamente.
                    No tiene sentido eliminar si el formulario está roto. */}
                {!hasCatalogError && (
                    <AppButton
                        label="Eliminar movimiento"
                        onPress={handleDelete}
                        variant="secondary"
                    />
                )}
            </View>
        </FormScreenContainer>
    );
}