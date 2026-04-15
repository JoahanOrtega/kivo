import { Text, TouchableOpacity, ViewStyle } from "react-native";

import { colors } from "@/theme/colors";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * Botón reutilizable base del proyecto.
 * Permite mantener consistencia visual y evitar estilos duplicados.
 */
export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: AppButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: isPrimary ? colors.primary : colors.surface,
        borderWidth: isPrimary ? 0 : 1,
        borderColor: colors.border,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      <Text
        style={{
          color: isPrimary ? "#FFFFFF" : colors.text,
          textAlign: "center",
          fontSize: 16,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}