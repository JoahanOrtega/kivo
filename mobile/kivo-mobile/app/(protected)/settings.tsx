import { router } from "expo-router";
import { Alert, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";

import { BRAND } from "@/constants/brand";
import { useAuthStore } from "@/store/auth-store";
import { useBiometricStore } from "@/store/biometric-store";
import { isBiometricAvailable } from "@/services/biometrics.service";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface SettingsOption {
    label: string;
    description: string;
    isDestructive?: boolean;
    onPress: () => void;
    rightElement?: React.ReactNode;
}

// ─── Subcomponente: fila de opción ────────────────────────────────────────────
function SettingsRow({ option }: { option: SettingsOption }) {
    const handlePress = async () => {
        await Haptics.selectionAsync();
        option.onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={option.rightElement ? 1 : 0.7}
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
            }}
        >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text
                    style={{
                        fontSize: typography.bodyLg,
                        fontWeight: typography.weightSemibold,
                        color: option.isDestructive ? colors.danger : colors.text,
                        marginBottom: spacing.xs,
                    }}
                >
                    {option.label}
                </Text>
                <Text
                    style={{
                        fontSize: typography.bodySm,
                        color: colors.textMuted,
                        lineHeight: 18,
                    }}
                >
                    {option.description}
                </Text>
            </View>

            {/* Elemento derecho opcional — Switch, ícono, etc. */}
            {option.rightElement}
        </TouchableOpacity>
    );
}

// ─── Subcomponente: sección ───────────────────────────────────────────────────
function SettingsSection({ title, options }: { title: string; options: SettingsOption[] }) {
    return (
        <View style={{ marginBottom: spacing["2xl"] }}>
            <Text
                style={{
                    fontSize: typography.bodySm,
                    fontWeight: typography.weightSemibold,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: spacing.sm,
                }}
            >
                {title}
            </Text>

            <View
                style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: spacing.lg,
                    overflow: "hidden",
                }}
            >
                {options.map((option) => (
                    <SettingsRow key={option.label} option={option} />
                ))}
            </View>
        </View>
    );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function SettingsScreen() {
    const logout = useAuthStore((state) => state.logout);
    const { isEnabled: isBiometricEnabled, setBiometricEnabled } = useBiometricStore();
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    // ── Verificar si el dispositivo tiene biometría disponible ────────────────
    useEffect(() => {
        isBiometricAvailable().then(setBiometricAvailable);
    }, []);

    // ── Toggle de biometría ───────────────────────────────────────────────────
    const handleBiometricToggle = async (value: boolean) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await setBiometricEnabled(value);
    };

    // ── Cerrar sesión ─────────────────────────────────────────────────────────
    const handleLogout = () => {
        Alert.alert(
            "Cerrar sesión",
            "¿Estás seguro que deseas cerrar sesión?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Cerrar sesión",
                    style: "destructive",
                    onPress: async () => {
                        await Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Warning
                        );
                        await logout();
                        router.replace("/login");
                    },
                },
            ]
        );
    };

    // ── Opciones de seguridad ─────────────────────────────────────────────────
    const securityOptions: SettingsOption[] = [
        ...(biometricAvailable ? [{
            label: "Face ID / Biometría",
            description: isBiometricEnabled
                ? "Activo — se pide al abrir la app"
                : "Inactivo — actívalo para mayor seguridad",
            onPress: () => void handleBiometricToggle(!isBiometricEnabled),
            rightElement: (
                <Switch
                    value={isBiometricEnabled}
                    onValueChange={(value) => void handleBiometricToggle(value)}
                    trackColor={{
                        false: colors.border,
                        true: colors.primary,
                    }}
                    thumbColor={colors.white}
                />
            ),
        }] : []),
    ];

    const accountOptions: SettingsOption[] = [
        {
            label: "Cerrar sesión",
            description: "Salir de tu cuenta en este dispositivo",
            isDestructive: true,
            onPress: handleLogout,
        },
    ];

    const aboutOptions: SettingsOption[] = [
        {
            label: BRAND.appName,
            description: `${BRAND.tagline} — Versión 1.0.0`,
            onPress: () => { },
        },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, padding: spacing.lg }}>

                {/* ── Header ── */}
                <View style={{ marginBottom: spacing["2xl"] }}>
                    <Text style={{
                        fontSize: typography.titlePage,
                        fontWeight: typography.weightBold,
                        color: colors.text,
                        marginBottom: spacing.xs,
                    }}>
                        Configuración
                    </Text>
                    <Text style={{ fontSize: typography.bodyMd, color: colors.textMuted }}>
                        Ajustes y preferencias de {BRAND.appName}
                    </Text>
                </View>

                {/* ── Sección: seguridad ── */}
                {securityOptions.length > 0 && (
                    <SettingsSection title="Seguridad" options={securityOptions} />
                )}

                {/* ── Sección: cuenta ── */}
                <SettingsSection title="Cuenta" options={accountOptions} />

                {/* ── Sección: acerca de ── */}
                <SettingsSection title="Acerca de" options={aboutOptions} />
            </View>
        </SafeAreaView>
    );
}