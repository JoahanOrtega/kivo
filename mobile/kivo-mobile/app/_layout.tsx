import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

/**
 * Layout raíz de la aplicación.
 * Aquí se define la configuración base de navegación global.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}