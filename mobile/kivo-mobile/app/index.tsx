import { Redirect } from "expo-router";

/**
 * Punto de entrada inicial de la app.
 * Mientras no exista validación real de sesión,
 * se redirige al flujo público de autenticación.
 */
export default function IndexScreen() {
  return <Redirect href="/(auth)/login" />;
}