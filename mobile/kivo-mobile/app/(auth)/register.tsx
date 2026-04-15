import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/layout/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import {
  RegisterFormValues,
  registerSchema,
} from "@/features/auth/auth.schemas";
import { colors } from "@/theme/colors";

/**
 * Pantalla real de registro del MVP.
 * Por ahora solo valida localmente y regresa al login.
 */
export default function RegisterScreen() {
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
    router.replace("/(auth)/login");
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center" }}>
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
            color: colors.textMuted,
            marginBottom: 32,
          }}
        >
          Comienza a usar Kivo para registrar tu dinero en movimiento.
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Nombre"
              value={value}
              onChangeText={onChange}
              placeholder="Tu nombre"
              error={errors.name?.message}
            />
          )}
        />

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
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Contraseña"
              value={value}
              onChangeText={onChange}
              placeholder="Tu contraseña"
              secureTextEntry
              autoCapitalize="none"
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Confirmar contraseña"
              value={value}
              onChangeText={onChange}
              placeholder="Confirma tu contraseña"
              secureTextEntry
              autoCapitalize="none"
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

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
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
    </ScreenContainer>
  );
}