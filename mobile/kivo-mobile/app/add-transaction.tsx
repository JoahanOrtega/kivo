import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as Haptics from "expo-haptics";
import {
    ActivityIndicator,
    Keyboard,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppButton } from "@/components/ui/app-button";
import { useToast } from "@/components/ui/toast-provider";

// ─── Componentes del formulario ───────────────────────────────────────────────
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
import { createTransaction } from "@/features/transactions/transactions.service";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";
import type { Account, Category } from "@/types/catalogs";

// ─── Helper: fecha local a string YYYY-MM-DD ──────────────────────────────────
// Resuelve el problema #4 — el valor por defecto del formulario
// debe ser la fecha de hoy en formato "YYYY-MM-DD", no ISO string.
// toISOString() usa UTC y puede mostrar el día anterior en México.
function getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    // getMonth() es 0-based, padStart garantiza 2 dígitos
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function AddTransactionScreen() {
    const session = useAuthStore((state) => state.session);
    const { showToast } = useToast();

    // ─── Estado: catálogos ────────────────────────────────────────────────────
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);

    // ─── Estado: error de catálogos ───────────────────────────────────────────
    // Resuelve el problema #3 — si los catálogos fallan, avisamos
    // al usuario en lugar de mostrar un formulario vacío sin explicación.
    const [hasCatalogError, setHasCatalogError] = useState(false);

    // ─── Formulario ───────────────────────────────────────────────────────────
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
            // Usamos getTodayDateString() en lugar de toISOString()
            // para evitar el bug de timezone — resuelve problema #4
            transactionDate: getTodayDateString(),
            categoryId: "",
            accountId: "",
            concept: "",
            note: "",
        },
    });

    // Observamos el tipo seleccionado para recargar catálogos
    const selectedType = useWatch({ control, name: "type" });

    // ─── Carga de catálogos ───────────────────────────────────────────────────
    // Se recarga cada vez que el usuario cambia el tipo —
    // los catálogos de egreso son diferentes a los de ingreso.
    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                setIsLoadingCatalogs(true);
                setHasCatalogError(false);

                const [loadedCategories, loadedAccounts] = await Promise.all([
                    getCategoriesByType(selectedType),
                    getAccountsByTransactionType(selectedType),
                ]);

                setCategories(loadedCategories);
                setAccounts(loadedAccounts);

                // Preseleccionamos el primer item de cada catálogo
                // para que el formulario siempre tenga un valor válido
                setValue("categoryId", loadedCategories[0]?.id ?? "");
                setValue("accountId", loadedAccounts[0]?.id ?? "");
            } catch {
                // Activamos el estado de error para mostrar feedback
                setHasCatalogError(true);
                showToast("No se pudieron cargar las opciones", "error");
            } finally {
                setIsLoadingCatalogs(false);
            }
        };

        void loadCatalogs();
    }, [selectedType, setValue]);

    // ─── Submit ───────────────────────────────────────────────────────────────
    const onSubmit = async (values: TransactionFormValues) => {
        if (!session?.user.id) return;

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

            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );

            showToast("Movimiento guardado", "success");
            router.back();
        } catch (error) {
            console.error(error);

            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
            );

            showToast("No se pudo guardar el movimiento", "error");
        }
    };

    // ─── Render: estado de carga ──────────────────────────────────────────────
    if (isLoadingCatalogs) {
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

    // ─── Render: error de catálogos ───────────────────────────────────────────
    if (hasCatalogError) {
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
                        No se pudieron cargar las opciones
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
                        onPress={() => setHasCatalogError(false)}
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

                {/* ── Botón guardar ── */}
                <AppButton
                    label={isSubmitting ? "Guardando..." : "Guardar movimiento"}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                />
            </View>
        </FormScreenContainer>
    );
}