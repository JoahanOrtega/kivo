import { PropsWithChildren } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

// ─── Constante: altura del tab bar ───────────────────────────────────────────
const TAB_BAR_HEIGHT = 60;

export function FormScreenContainer({ children }: PropsWithChildren) {
    return (
        // edges: ["top", "left", "right"] — excluimos "bottom" intencionalmente.
        // El tab bar de Expo Router ya maneja el safe area inferior.
        // Si incluimos "bottom" aquí, se suma dos veces y genera
        // el espacio vacío que estábamos viendo.
        <SafeAreaView
            edges={["top", "left", "right"]}
            style={{ flex: 1, backgroundColor: colors.background }}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            paddingHorizontal: 24,
                            paddingVertical: 20,
                            // Padding para que el último elemento no quede
                            // tapado por el tab bar al hacer scroll hasta el final
                            paddingBottom: TAB_BAR_HEIGHT + 80,
                        }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={{ flex: 1 }}>{children}</View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}