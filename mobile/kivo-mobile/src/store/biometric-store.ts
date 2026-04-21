import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Store de biometría ───────────────────────────────────────────────────────
// Controla si el usuario está actualmente autenticado con biometría.
// Se resetea cuando la app va a background — fuerza re-autenticación al volver.
type BiometricState = {
    isAuthenticated: boolean;
    isEnabled: boolean;
    setAuthenticated: (value: boolean) => void;
    loadBiometricPreference: () => Promise<void>;
    setBiometricEnabled: (value: boolean) => Promise<void>;
};

const BIOMETRIC_KEY = "kivo.biometric.enabled";

export const useBiometricStore = create<BiometricState>((set) => ({
    isAuthenticated: false,
    isEnabled: false,

    setAuthenticated: (value) => set({ isAuthenticated: value }),

    // ── Cargar preferencia del usuario ────────────────────────────────────────
    // Lee si el usuario activó la biometría desde Ajustes.
    loadBiometricPreference: async () => {
        try {
            const value = await AsyncStorage.getItem(BIOMETRIC_KEY);
            set({ isEnabled: value === "true" });
        } catch {
            set({ isEnabled: false });
        }
    },

    // ── Guardar preferencia ───────────────────────────────────────────────────
    setBiometricEnabled: async (value) => {
        try {
            await AsyncStorage.setItem(BIOMETRIC_KEY, String(value));
            set({ isEnabled: value });
        } catch {
            console.warn("No se pudo guardar la preferencia de biometría");
        }
    },
}));