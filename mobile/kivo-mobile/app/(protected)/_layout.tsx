import { Redirect, Tabs } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";

// ─── FAB flotante ─────────────────────────────────────────────────────────────
// Flota sobre el tab bar centrado entre los dos tabs.
// No forma parte del tab bar — es un elemento absolutamente posicionado
// sobre el View contenedor del layout.
function FloatingFAB() {
    const insets = useSafeAreaInsets();

    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/add-transaction");
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            // pointerEvents="box-only" permite que los toques pasen a través
            // del área transparente alrededor del botón — solo el círculo
            // azul captura toques, no el espacio invisible alrededor.
            style={{
                position: "absolute",
                alignSelf: "center",
                // Centramos el FAB verticalmente sobre el tab bar.
                // tab bar height (60) / 2 - radio del FAB (26) = 4
                // + insets.bottom para respetar el home indicator del iPhone
                bottom: insets.bottom + 4,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 6,
            }}
        >
            <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
    );
}

export default function ProtectedLayout() {
    const { isAuthenticated, isHydrated } = useAuthStore();

    if (!isHydrated) return null;
    if (!isAuthenticated) return <Redirect href="/login" />;

    return (
        // View contenedor relativo — necesario para que el FAB
        // con position: "absolute" se posicione relativo a este View
        // y no a toda la pantalla.
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarStyle: {
                        backgroundColor: colors.surface,
                        borderTopColor: colors.border,
                        borderTopWidth: 1,
                        height: 60,
                        paddingBottom: 8,
                        paddingTop: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: "500",
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: "Inicio",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home-outline" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="settings"
                    options={{
                        title: "Configuración",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="settings-outline" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="edit-transaction/[localId]"
                    options={{ href: null }}
                />

                {/* ── Ocultar add.tsx si existe ── */}
                <Tabs.Screen
                    name="add"
                    options={{ href: null }}
                />
            </Tabs>

            <FloatingFAB />
        </View>
    );
}