import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import {
    RegisterFormValues,
    registerSchema,
} from "@/features/auth/auth.schemas";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

/**
 * Pantalla de registro.
 * Mantiene el mismo lenguaje visual del login para consistencia de UX.
 */
export default function RegisterScreen() {
    const emailInputRef = useRef<TextInput | null>(null);
    const passwordInputRef = useRef<TextInput | null>(null);
    const confirmPasswordInputRef = useRef<TextInput | null>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (_values: RegisterFormValues) => {
        Keyboard.dismiss();
        router.replace("/login");
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
                            backgroundColor: colors.accentSoft,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 999,
                            marginBottom: spacing.lg,
                        }}
                    >
                        <Text
                            style={{
                                color: colors.accent,
                                fontSize: typography.bodySm,
                                fontWeight: typography.weightSemibold,
                            }}
                        >
                            Comienza hoy
                        </Text>
                    </View>

                    <Text
                        style={{
                            fontSize: typography.titlePage,
                            fontWeight: typography.weightBold,
                            color: colors.text,
                            marginBottom: spacing.sm,
                        }}
                    >
                        Crear cuenta
                    </Text>

                    <Text
                        style={{
                            fontSize: typography.bodyLg,
                            lineHeight: 24,
                            color: colors.textMuted,
                            maxWidth: 320,
                        }}
                    >
                        Empieza a registrar tu dinero de forma simple, clara y bonita.
                    </Text>
                </View>

                <AppCard>
                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, value } }) => (
                            <AppInput
                                label="Nombre"
                                value={value}
                                onChangeText={onChange}
                                placeholder="Tu nombre"
                                autoCapitalize="words"
                                autoCorrect={false}
                                returnKeyType="next"
                                onSubmitEditing={() => emailInputRef.current?.focus()}
                                error={errors.name?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                            <AppInput
                                ref={emailInputRef}
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
                                returnKeyType="next"
                                onSubmitEditing={() =>
                                    confirmPasswordInputRef.current?.focus()
                                }
                                error={errors.password?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="confirmPassword"
                        render={({ field: { onChange, value } }) => (
                            <AppInput
                                ref={confirmPasswordInputRef}
                                label="Confirmar contraseña"
                                value={value}
                                onChangeText={onChange}
                                placeholder="Confirma tu contraseña"
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={handleSubmit(onSubmit)}
                                error={errors.confirmPassword?.message}
                            />
                        )}
                    />

                    <AppButton
                        label={isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        style={{ marginTop: spacing.sm }}
                    />
                </AppCard>

                <TouchableOpacity
                    onPress={() => router.replace("/login")}
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
                        ¿Ya tienes cuenta?{" "}
                        <Text
                            style={{
                                color: colors.primary,
                                fontWeight: typography.weightSemibold,
                            }}
                        >
                            Inicia sesión
                        </Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </FormScreenContainer>
    );
}