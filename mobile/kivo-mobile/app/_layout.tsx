import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isBiometricAvailable } from "@/services/biometrics.service";
import { useBiometricStore } from "@/store/biometric-store";

import { ToastProvider } from "@/components/ui/toast-provider";
import { initializeDatabase } from "@/database/migrations";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/theme/colors";

/**
 * Layout raíz de la aplicación.
 * Antes de renderizar rutas, inicializa:
 * - base local SQLite
 * - sesión persistida en Secure Store
 */
export default function RootLayout() {
    const hydrateSession = useAuthStore((state) => state.hydrateSession);
    const loadBiometricPreference = useBiometricStore((s) => s.loadBiometricPreference);
    const isBiometricEnabled = useBiometricStore((s) => s.isEnabled);
    const [isAppReady, setIsAppReady] = useState(false);
    const [bootError, setBootError] = useState<string | null>(null);

    useEffect(() => {
        const bootstrapApp = async () => {
            try {
                await initializeDatabase();
                await hydrateSession();
                await loadBiometricPreference();
            } catch (error) {
                console.error("Bootstrap error:", error);
                setBootError("Ocurrió un error al iniciar la app.");
            } finally {
                setIsAppReady(true);
            }
        };

        void bootstrapApp();
    }, [hydrateSession]);

    return (
        <SafeAreaProvider>
            <ToastProvider>
                {!isAppReady ? (
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: colors.background,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : bootError ? (
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: colors.background,
                            justifyContent: "center",
                            alignItems: "center",
                            padding: 24,
                        }}
                    >
                        <Text style={{ color: colors.text, fontSize: 16, textAlign: "center" }}>
                            {bootError}
                        </Text>
                    </View>
                ) : (
                    <>
                        <StatusBar style="dark" />
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="(auth)" />
                            <Stack.Screen name="(protected)" />
                            <Stack.Screen
                                name="biometric-lock"
                                options={{
                                    animation: "fade",
                                    gestureEnabled: false,
                                }}
                            />
                            <Stack.Screen
                                name="add-transaction"
                                options={{
                                    presentation: "modal",
                                    animation: "slide_from_bottom",
                                }}
                            />
                            <Stack.Screen
                                name="sync-inspector"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="edit-transaction/[localId]"
                                options={{ animation: "slide_from_right" }}
                            />
                        </Stack>
                    </>
                )}
            </ToastProvider>
        </SafeAreaProvider>
    );
}