import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

/**
 * Pantalla placeholder de configuración.
 */
export default function SettingsScreen() {
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
                        fontSize: 28,
                        fontWeight: "700",
                        color: colors.text,
                    }}
                >
                    Configuración
                </Text>

                <Text
                    style={{
                        marginTop: 8,
                        fontSize: 16,
                        color: colors.textMuted,
                    }}
                >
                    Ajustes básicos de la aplicación.
                </Text>
            </View>
        </SafeAreaView>
    );
}