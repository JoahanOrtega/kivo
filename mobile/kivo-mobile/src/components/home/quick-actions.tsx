import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

// ─── Tipos ───────────────────────────────────────────────────────────────────
// Definimos la forma de cada botón de acción.
// Esto nos permite construir la lista de botones como datos
// en lugar de repetir JSX para cada uno.
interface QuickAction {
    /** Texto visible en el botón */
    label: string;
    /** Ruta a la que navega al presionar */
    route: string;
    /** Si es true, se renderiza como botón primario (fondo azul) */
    isPrimary?: boolean;
    /** Si es true, solo se muestra en modo desarrollo */
    devOnly?: boolean;
}

// ─── Datos: lista de acciones ─────────────────────────────────────────────
// Definimos las acciones como un array de datos en lugar de repetir
// JSX para cada botón. Si en el futuro se agrega o quita una acción,
// solo se modifica este array — no el JSX.
//
// El botón de sync-inspector tiene devOnly: true para que no aparezca
// en producción (resuelve el problema #12 del análisis).
const QUICK_ACTIONS: QuickAction[] = [
    {
        label: "Agregar movimiento",
        route: "/add-transaction",
        isPrimary: true,
    },
    {
        label: "Ver historial",
        route: "/history",
    },
    {
        label: "Ver sync queue",
        route: "/sync-inspector",
        devOnly: true,
    },
    {
        label: "Configuración",
        route: "/settings",
    },
];

// ─── Subcomponente: botón individual ─────────────────────────────────────────
// Renderiza un solo botón con su estilo correspondiente.
// Recibe la acción completa y decide el estilo según isPrimary.
function ActionButton({ action }: { action: QuickAction }) {
    const isPrimary = action.isPrimary ?? false;

    return (
        <TouchableOpacity
            onPress={() => router.push(action.route as never)}
            activeOpacity={0.85}
            style={{
                // El botón primario tiene fondo azul, los secundarios tienen borde
                backgroundColor: isPrimary ? colors.primary : colors.white,
                borderWidth: isPrimary ? 0 : 1,
                borderColor: colors.border,
                paddingVertical: 15,
                paddingHorizontal: spacing.lg,
                borderRadius: 16,
                marginBottom: spacing.md,
            }}
        >
            <Text
                style={{
                    // El texto del primario es blanco, el de los secundarios es oscuro
                    color: isPrimary ? colors.white : colors.text,
                    textAlign: "center",
                    fontSize: typography.bodyLg,
                    fontWeight: typography.weightSemibold,
                }}
            >
                {action.label}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Componente principal ────────────────────────────────────────────────────
// Itera sobre QUICK_ACTIONS y renderiza cada botón.
// Filtra los devOnly según el entorno actual con la variable global __DEV__
// que Expo/React Native provee automáticamente — true en desarrollo,
// false en producción. Esto resuelve el problema #12 del análisis.
export function QuickActions() {
    // Filtramos las acciones según el entorno
    const visibleActions = QUICK_ACTIONS.filter(
        (action) => !action.devOnly || __DEV__
    );

    return (
        <AppCard style={{ marginBottom: spacing.lg }}>
            <Text
                style={{
                    fontSize: typography.titleSection,
                    fontWeight: typography.weightBold,
                    color: colors.text,
                    marginBottom: spacing.md,
                }}
            >
                Acciones rápidas
            </Text>

            {/* Mapeamos las acciones visibles — cada una con su route como key
          ya que las rutas son únicas y no cambian de orden */}
            {visibleActions.map((action) => (
                <ActionButton key={action.route} action={action} />
            ))}
        </AppCard>
    );
}