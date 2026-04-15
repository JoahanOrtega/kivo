import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BRAND } from "@/constants/brand";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";

/**
 * Pantalla inicial de inicio de sesión.
 * En esta etapa todavía no consume backend;
 * solo valida la navegación y la estructura del proyecto.
 */
export default function LoginScreen() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const handleMockLogin = () => {
    setAuthenticated(true);
    router.replace("/(protected)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
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
            color: colors.textMuted,
            marginBottom: 32,
          }}
        >
          {BRAND.tagline}
        </Text>

        <TouchableOpacity
          onPress={handleMockLogin}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              textAlign: "center",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Entrar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
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
    </SafeAreaView>
  );
}