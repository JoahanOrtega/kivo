import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BRAND } from "@/constants/brand";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";

/**
 * Pantalla privada inicial.
 * Funcionará como placeholder del dashboard mientras construimos el resumen real.
 */
export default function DashboardScreen() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
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
            fontSize: 30,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 8,
          }}
        >
          Bienvenido a {BRAND.appName}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: colors.textMuted,
            marginBottom: 32,
          }}
        >
          Base del dashboard lista.
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/(protected)/history")}
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
            Ir a historial
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(protected)/settings")}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: colors.text,
              textAlign: "center",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Ir a configuración
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: colors.text,
              textAlign: "center",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}