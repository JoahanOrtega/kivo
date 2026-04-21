import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { BRAND } from "@/constants/brand";
import { LoginFormValues, loginSchema } from "@/features/auth/auth.schemas";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

/**
 * Pantalla de inicio de sesión.
 * Prioriza claridad, buena jerarquía y una experiencia móvil más pulida.
 */

export default function LoginScreen() {
    const login = useAuthStore((state) => state.login);
    const passwordInputRef = useRef<TextInput | null>(null);

    const {
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
            Keyboard.dismiss();
            await login(values);
            router.replace("/home");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "No se pudo iniciar sesión";

            setError("password", {
                type: "manual",
                message,
            });
        }
    };

    return (
        <FormScreenContainer>
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    paddingVertical: spacing.lg,
                }}
            >
                <View style={{ marginBottom: spacing["3xl"] }}>
                    <View
                        style={{
                            alignSelf: "flex-start",
                            backgroundColor: colors.primarySoft,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 999,
                            marginBottom: spacing.lg,
                        }}
                    >
                        <Text
                            style={{
                                color: colors.primary,
                                fontSize: typography.bodySm,
                                fontWeight: typography.weightSemibold,
                            }}
                        >
                            Finanzas personales
                        </Text>
                    </View>

                    <Text
                        style={{
                            fontSize: typography.titleHero,
                            fontWeight: typography.weightBold,
                            color: colors.text,
                            marginBottom: spacing.sm,
                        }}
                    >
                        {BRAND.appName}
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.bodyLg,
                            lineHeight: 24,
                            color: colors.textMuted,
                            maxWidth: 320,
                        }}
                    >
                        {BRAND.tagline}
                    </Text>
                </View>

                <AppCard>
                    <Text
                        style={{
                            fontSize: typography.titleSection,
                            fontWeight: typography.weightBold,
                            color: colors.text,
                            marginBottom: spacing.xs,
                        }}
                    >
                        Iniciar sesión
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.bodyMd,
                            color: colors.textMuted,
                            marginBottom: spacing.xl,
                        }}
                    >
                        Continúa para revisar tus movimientos y tu resumen mensual.
                    </Text>

                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                            <AppInput
                                label="Correo"
                                value={value}
                                onChangeText={onChange}
                                placeholder="ejemplo@correo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                                error={errors.email?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => (
                            <AppInput
                                ref={passwordInputRef}
                                label="Contraseña"
                                value={value}
                                onChangeText={onChange}
                                placeholder="Tu contraseña"
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={handleSubmit(onSubmit)}
                                error={errors.password?.message}
                            />
                        )}
                    />

                    <AppButton
                        label={isSubmitting ? "Entrando..." : "Entrar"}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        style={{ marginTop: spacing.sm }}
                    />
                </AppCard>

                <TouchableOpacity
                    onPress={() => router.push("/register")}
                    style={{ marginTop: spacing.xl }}
                    activeOpacity={0.8}
                >
                    <Text
                        style={{
                            color: colors.textMuted,
                            textAlign: "center",
                            fontSize: typography.bodyMd,
                        }}
                    >
                        ¿Aún no tienes cuenta?{" "}
                        <Text
                            style={{
                                color: colors.primary,
                                fontWeight: typography.weightSemibold,
                            }}
                        >
                            Crear cuenta
                        </Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </FormScreenContainer>
    );
}