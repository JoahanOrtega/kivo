import { PropsWithChildren } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";

type AppCardProps = PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
}>;

/**
 * Tarjeta visual reutilizable de Kivo.
 * Se usa para agrupar contenido importante con mejor jerarquía visual.
 */
export function AppCard({ children, style }: AppCardProps) {
    return (
        <View
            style={[
                {
                    backgroundColor: colors.surface,
                    borderRadius: radius.xl,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 18,
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.05,
                    shadowRadius: 12,
                    elevation: 2,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}