// =============================================================================
// biometrics.service.ts — Servicio de autenticación biométrica
//
// Abstrae expo-local-authentication para que el resto de la app
// no dependa directamente de la librería.
// =============================================================================

import * as LocalAuthentication from "expo-local-authentication";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type BiometricType = "face" | "fingerprint" | "none";

export interface BiometricAuthResult {
    success: boolean;
    error?: string;
}

// ─── Verificar disponibilidad ─────────────────────────────────────────────────
// Retorna true si el dispositivo tiene biometría configurada y disponible.
export async function isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
}

// ─── Obtener tipo de biometría ────────────────────────────────────────────────
// Detecta qué tipo de biometría tiene el dispositivo para mostrar
// el mensaje correcto al usuario (Face ID vs huella).
export async function getBiometricType(): Promise<BiometricType> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return "face";
    }

    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return "fingerprint";
    }

    return "none";
}

// ─── Autenticar ───────────────────────────────────────────────────────────────
// Lanza el prompt de autenticación biométrica del sistema operativo.
// El mensaje se adapta según el tipo de biometría disponible.
export async function authenticateWithBiometrics(): Promise<BiometricAuthResult> {
    try {
        const available = await isBiometricAvailable();
        if (!available) {
            return { success: false, error: "Biometría no disponible" };
        }

        const type = await getBiometricType();
        const promptMessage = type === "face"
            ? "Confirma tu identidad con Face ID"
            : "Confirma tu identidad con tu huella dactilar";

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            cancelLabel: "Cancelar",
            // fallbackLabel permite usar PIN/contraseña si la biometría falla
            fallbackLabel: "Usar contraseña",
            // disableDeviceFallback: false permite al usuario usar PIN
            // como alternativa si Face ID falla varias veces
            disableDeviceFallback: false,
        });

        if (result.success) {
            return { success: true };
        }

        // Mapeamos los errores de expo a mensajes en español
        const errorMessages: Record<string, string> = {
            "UserCancel": "Autenticación cancelada",
            "UserFallback": "Usa tu contraseña para continuar",
            "SystemCancel": "Autenticación cancelada por el sistema",
            "PasscodeNotSet": "No hay contraseña configurada",
            "BiometryNotAvailable": "Biometría no disponible",
            "BiometryNotEnrolled": "No hay biometría registrada",
            "BiometryLockout": "Biometría bloqueada — usa tu contraseña",
        };

        return {
            success: false,
            error: errorMessages[result.error ?? ""] ?? "Autenticación fallida",
        };
    } catch {
        return { success: false, error: "Error al autenticar" };
    }
}