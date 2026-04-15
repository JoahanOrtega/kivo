import { Stack } from "expo-router";

/**
 * Layout del grupo de rutas públicas.
 * Aquí viven las pantallas de autenticación.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}