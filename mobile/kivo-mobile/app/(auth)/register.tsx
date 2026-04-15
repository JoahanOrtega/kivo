import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import {
    RegisterFormValues,
    registerSchema,
} from "@/features/auth/auth.schemas";
import { colors } from "@/theme/colors";

/**
 * Pantalla de registro del MVP.
 * Mejora la experiencia móvil con:
 * - navegación secuencial entre campos
 * - submit desde teclado en el último input
 * - cierre del teclado al enviar
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
        router.replace("/(auth)/login");
    };

    return (
        <FormScreenContainer>
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    paddingVertical: 12,
                }}
            >
                <View style={{ marginBottom: 28 }}>
                    <Text
                        style={{
                            fontSize: 28,
                            fontWeight: "700",
                            color: colors.text,
                            marginBottom: 8,
                        }}
                    >
                        Crear cuenta
                    </Text>

                    <Text
                        style={{
                            fontSize: 16,
                            lineHeight: 24,
                            color: colors.textMuted,
                        }}
                    >
                        Comienza a usar Kivo para registrar tu dinero en movimiento.
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 20,
                        padding: 18,
                    }}
                >
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
                                blurOnSubmit={false}
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
                                blurOnSubmit={false}
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
                                blurOnSubmit={false}
                                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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
                        style={{ marginTop: 8 }}
                    />
                </View>

                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ marginTop: 18 }}
                    activeOpacity={0.8}
                >
                    <Text
                        style={{
                            color: colors.textMuted,
                            textAlign: "center",
                            fontSize: 15,
                        }}
                    >
                        Volver al inicio de sesión
                    </Text>
                </TouchableOpacity>
            </View>
        </FormScreenContainer>
    );
}