import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

import { FormScreenContainer } from "@/components/layout/form-screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { BRAND } from "@/constants/brand";
import { LoginFormValues, loginSchema } from "@/features/auth/auth.schemas";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";

/**
 * Pantalla de inicio de sesión del MVP.
 * Mejora la experiencia móvil con:
 * - navegación entre campos desde el teclado
 * - cierre del teclado al enviar
 * - submit desde la tecla "done"
 */
export default function LoginScreen() {
    const login = useAuthStore((state) => state.login);

    const passwordInputRef = useRef<TextInput | null>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        Keyboard.dismiss();
        await login(values);
        router.replace("/(protected)");
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
                            fontSize: 34,
                            fontWeight: "700",
                            color: colors.text,
                            marginBottom: 8,
                        }}
                    >
                        {BRAND.appName}
                    </Text>

                    <Text
                        style={{
                            fontSize: 16,
                            lineHeight: 24,
                            color: colors.textMuted,
                        }}
                    >
                        {BRAND.tagline}
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
                        style={{ marginTop: 8 }}
                    />
                </View>

                <TouchableOpacity
                    onPress={() => router.push("/(auth)/register")}
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
                        Crear cuenta
                    </Text>
                </TouchableOpacity>
            </View>
        </FormScreenContainer>
    );
}