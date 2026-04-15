import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";

import { colors } from "@/theme/colors";

/**
 * Contenedor base para pantallas.
 * Centraliza estilos de fondo, padding y safe area.
 */
export function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingVertical: 20,
        }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}