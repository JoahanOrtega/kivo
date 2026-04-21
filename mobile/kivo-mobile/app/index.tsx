import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { useBiometricStore } from "@/store/biometric-store";

// ─── Punto de entrada ─────────────────────────────────────────────────────────
// Decide a dónde redirigir al usuario según su estado:
// 1. No autenticado → login
// 2. Autenticado + biometría activa + no verificado → biometric-lock
// 3. Autenticado + biometría inactiva o ya verificado → home
export default function Index() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const { isEnabled: isBiometricEnabled, isAuthenticated: isBiometricAuthenticated } = useBiometricStore();

  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (isBiometricEnabled && !isBiometricAuthenticated) {
    return <Redirect href="/biometric-lock" />;
  }

  return <Redirect href="/(protected)/home" />;
}