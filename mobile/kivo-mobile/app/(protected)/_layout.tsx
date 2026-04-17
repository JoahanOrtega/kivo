import { Redirect, Tabs } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";

// ─── FAB flotante ─────────────────────────────────────────────────────────────
function FloatingFAB() {
    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/add-transaction");
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            style={{
                position: "absolute",
                alignSelf: "center",
                bottom: 30,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
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

                {/* ── Tab: Configuración ── */}
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: "Configuración",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="settings-outline" size={size} color={color} />
                        ),
                    }}
                />

                {/* ── Rutas que NO son tabs ─────────────────────────────────────
                    href: null le dice a Expo Router que estas rutas existen
                    dentro del grupo (protected) pero no deben aparecer
                    en el tab bar bajo ninguna circunstancia. */}
                <Tabs.Screen
                    name="edit-transaction/[localId]"
                    options={{ href: null }}
                />
            </Tabs>

            {/* ── FAB flotante sobre el tab bar ── */}
            <FloatingFAB />
        </View>
    );
}