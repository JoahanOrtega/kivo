// =============================================================================
// biometric-lock.tsx — Pantalla de bloqueo biométrico
//
// Se muestra cuando el usuario tiene biometría activada y necesita
// autenticarse para acceder a la app.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { bootstrapCatalogs } from "@/features/sync/bootstrap.service";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";

import { BRAND } from "@/constants/brand";
import {
    authenticateWithBiometrics,
    getBiometricType,
} from "@/services/biometrics.service";
import { useBiometricStore } from "@/store/biometric-store";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

export default function BiometricLockScreen() {
    const session = useAuthStore((s) => s.session);
    const notifySyncCompleted = useSyncStore((s) => s.notifySyncCompleted);
    const setAuthenticated = useBiometricStore((s) => s.setAuthenticated);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | "none">("face");

    // ── Detectar tipo de biometría al montar ──────────────────────────────────
    useEffect(() => {
        getBiometricType().then(setBiometricType);
        // Lanzar autenticación automáticamente al entrar
        void handleAuthenticate();
    }, []);

    // ── Autenticar ────────────────────────────────────────────────────────────
    const handleAuthenticate = async () => {
        try {
            setIsAuthenticating(true);
            setError(null);

            const result = await authenticateWithBiometrics();

            if (result.success) {
                await Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
                setAuthenticated(true);

                // ── Bootstrap después de autenticación biométrica ─────────────
                // El login ya no corre cuando hay sesión activa — el bootstrap
                // debe correr aquí para poblar SQLite con los datos del servidor.
                if (session?.user.id) {
                    await bootstrapCatalogs(session.user.id);
                    notifySyncCompleted();
                }

                router.replace("/(protected)/home");
            } else {
                await Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Error
                );
                setError(result.error ?? "Autenticación fallida");
            }
        } finally {
            setIsAuthenticating(false);
        }
    };

    const iconName = biometricType === "face" ? "scan-outline" : "finger-print-outline";
    const biometricLabel = biometricType === "face" ? "Face ID" : "Huella dactilar";

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: colors.background,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: spacing["2xl"],
            }}
        >
            {/* ── Logo ── */}
            <View style={{ alignItems: "center", marginBottom: spacing["3xl"] }}>
                <Text
                    style={{
                        fontSize: 40,
                        fontWeight: typography.weightBold,
                        color: colors.primary,
                        marginBottom: spacing.sm,
                    }}
                >
                    {BRAND.appName}
                </Text>
                <Text
                    style={{
                        fontSize: typography.bodyMd,
                        color: colors.textMuted,
                    }}
                >
                    {BRAND.tagline}
                </Text>
            </View>

            {/* ── Botón de biometría ── */}
            <TouchableOpacity
                onPress={() => void handleAuthenticate()}
                disabled={isAuthenticating}
                activeOpacity={0.7}
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.primarySoft,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: spacing.xl,
                    borderWidth: 2,
                    borderColor: colors.primary,
                }}
            >
                {isAuthenticating ? (
                    <ActivityIndicator color={colors.primary} />
                ) : (
                    <Ionicons name={iconName} size={36} color={colors.primary} />
                )}
            </TouchableOpacity>

            <Text
                style={{
                    fontSize: typography.bodyLg,
                    fontWeight: typography.weightSemibold,
                    color: colors.text,
                    marginBottom: spacing.sm,
                    textAlign: "center",
                }}
            >
                Verificar identidad
            </Text>

            <Text
                style={{
                    fontSize: typography.bodyMd,
                    color: colors.textMuted,
                    textAlign: "center",
                    marginBottom: spacing.xl,
                }}
            >
                Usa {biometricLabel} para acceder a Kivo
            </Text>

            {/* ── Error ── */}
            {error && (
                <View
                    style={{
                        backgroundColor: colors.dangerSoft,
                        borderRadius: 12,
                        padding: spacing.md,
                        marginBottom: spacing.lg,
                        width: "100%",
                    }}
                >
                    <Text
                        style={{
                            color: colors.danger,
                            fontSize: typography.bodyMd,
                            textAlign: "center",
                        }}
                    >
                        {error}
                    </Text>
                </View>
            )}

            {/* ── Reintentar ── */}
            {error && (
                <TouchableOpacity
                    onPress={() => void handleAuthenticate()}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: colors.primary,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing["2xl"],
                        borderRadius: 12,
                    }}
                >
                    <Text
                        style={{
                            color: colors.white,
                            fontSize: typography.bodyMd,
                            fontWeight: typography.weightSemibold,
                        }}
                    >
                        Intentar de nuevo
                    </Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}