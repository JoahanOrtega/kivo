import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import NetInfo from "@react-native-community/netinfo";

import { useAuthStore } from "@/store/auth-store";
import { ActionSheet } from "@/components/ui/action-sheet";
import { processSyncQueue } from "@/features/sync/sync.service";
import { colors } from "@/theme/colors";

// ─── FAB central ─────────────────────────────────────────────────────────────
function FABTabButton({ onPress }: { onPress: () => void }) {
    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={() => void handlePress()}
            activeOpacity={0.85}
            style={{
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
    const [sheetVisible, setSheetVisible] = useState(false);

    // ─── Sync automático al reconectar ────────────────────────────────────────
    // NetInfo escucha cambios de conectividad. Cuando el dispositivo
    // pasa de sin conexión a con conexión, dispara el sync automáticamente.
    // El usuario nunca ve este proceso — ocurre en background.
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            if (state.isConnected && state.isInternetReachable) {
                // Ejecutamos el sync sin await para no bloquear la UI.
                // Si falla, los items quedan en la cola para el próximo intento.
                void processSyncQueue().then((result) => {
                    if (result.completed > 0) {
                        console.log(`Sync automático: ${result.completed} item(s) sincronizados`);
                    }
                });
            }
        });

        // Limpiamos el listener cuando el componente se desmonta
        return () => unsubscribe();
    }, []);

    // ─── Sync al iniciar la app ───────────────────────────────────────────────────
    // Si hay items pendientes cuando el usuario abre la app con internet,
    // los sincronizamos inmediatamente sin esperar un cambio de red.
    useEffect(() => {
        void processSyncQueue().then((result) => {
            if (result.completed > 0) {
                console.log(`Sync inicial: ${result.completed} item(s) sincronizados`);
            }
        });
    }, []); // Array vacío = solo se ejecuta una vez al montar

    if (!isHydrated) return null;
    if (!isAuthenticated) return <Redirect href="/login" />;

    const handleSelectExpense = () => {
        setSheetVisible(false);
        router.push("/add-transaction?type=expense");
    };

    const handleSelectIncome = () => {
        setSheetVisible(false);
        router.push("/add-transaction?type=income");
    };

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarStyle: {
                        backgroundColor: colors.surface,
                        borderTopColor: colors.border,
                        borderTopWidth: 1,
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
                    name="history"
                    options={{
                        title: "Historial",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="time-outline" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="add"
                    options={{
                        title: "",
                        tabBarButton: () => (
                            <FABTabButton onPress={() => setSheetVisible(true)} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="settings"
                    options={{
                        title: "Ajustes",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="settings-outline" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="edit-transaction/[localId]"
                    options={{ href: null }}
                />
            </Tabs>

            <ActionSheet
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                onSelectExpense={handleSelectExpense}
                onSelectIncome={handleSelectIncome}
            />
        </>
    );
}