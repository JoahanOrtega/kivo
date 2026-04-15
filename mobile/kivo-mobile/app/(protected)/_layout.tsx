import { Stack } from "expo-router";

/**
 * Layout del grupo de rutas privadas.
 * Más adelante aquí validaremos la sesión real del usuario.
 */
export default function ProtectedLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}