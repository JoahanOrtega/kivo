import { useEffect } from "react";
import { router } from "expo-router";

// ─── Pantalla placeholder para el tab central del FAB ────────────────────────
// Este archivo nunca se renderiza visualmente — existe solo para que
// Expo Router reconozca la ruta "add" como parte del grupo (protected).
// El tab que apunta aquí tiene su botón completamente reemplazado
// por el FAB en _layout.tsx, así que esta pantalla nunca se ve.
export default function AddPlaceholder() {
    useEffect(() => {
        // Si por alguna razón se navega aquí directamente,
        // redirigimos al home inmediatamente.
        router.replace("/home");
    }, []);

    return null;
}