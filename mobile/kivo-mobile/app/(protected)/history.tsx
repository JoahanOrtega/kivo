import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

/**
 * Pantalla placeholder del historial de movimientos.
 */
export default function HistoryScreen() {
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
                    Historial
                </Text>

                <Text
                    style={{
                        marginTop: 8,
                        fontSize: 16,
                        color: colors.textMuted,
                    }}
                >
                    Aquí aparecerán los movimientos de Kivo.
                </Text>
            </View>
        </SafeAreaView>
    );
}