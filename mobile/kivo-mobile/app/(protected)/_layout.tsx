import { Redirect, Tabs } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";

// ─── FAB como tab central ─────────────────────────────────────────────────────
// tabBarButton reemplaza completamente el botón del tab central.
// top: -12 hace que sobresalga ligeramente del tab bar — patrón estándar
// en apps como Instagram y Airbnb.
function FABTabButton() {
    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/add-transaction");
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            style={{
                // Ancho fijo igual al diámetro del FAB + padding lateral
                // para que no dependa del texto de los tabs adyacentes
                width: 80,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <View
                style={{
                    top: -12,
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: colors.primary,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
                }}
            >
                <Ionicons name="add" size={26} color={colors.white} />
            </View>
        </TouchableOpacity>
    );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function ProtectedLayout() {
    const { isAuthenticated, isHydrated } = useAuthStore();

    if (!isHydrated) return null;
    if (!isAuthenticated) return <Redirect href="/login" />;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    // Altura generosa para que el FAB sobresalga cómodamente
                    // y los tabs tengan espacio para el ícono + label
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "500",
                },
            }}
        >
            {/* ── Tab: Inicio ── */}
            <Tabs.Screen
                name="home"
                options={{
                    title: "Inicio",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* ── Tab: Historial ── */}
            <Tabs.Screen
                name="history"
                options={{
                    title: "Historial",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="time-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* ── Tab central: FAB ── */}
            <Tabs.Screen
                name="add"
                options={{
                    title: "",
                    tabBarButton: (props) => <FABTabButton />,
                }}
            />

            {/* ── Tab: Ajustes ── */}
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Ajustes",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* ── Rutas que NO son tabs ── */}
            <Tabs.Screen
                name="edit-transaction/[localId]"
                options={{ href: null }}
            />
        </Tabs>
    );
}