import { PropsWithChildren } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

/**
 * Contenedor especializado para pantallas con formularios.
 * Resuelve tres problemas comunes:
 * 1. Cerrar teclado al tocar fuera del input.
 * 2. Evitar que el teclado tape campos en iPhone.
 * 3. Permitir scroll cuando el contenido ya no cabe.
 */
export function FormScreenContainer({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "position" : undefined}
        keyboardVerticalOffset={0}
      >
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingVertical: 20,
            }}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flex: 1 }}>{children}</View>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}