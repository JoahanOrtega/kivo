import { Text, TouchableOpacity, ViewStyle } from "react-native";

import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { typography } from "@/theme/typography";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * Botón base reutilizable del sistema.
 * Permite mantener consistencia visual entre acciones primarias y secundarias.
 */
export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: AppButtonProps) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";

  const backgroundColor = isPrimary
    ? colors.primary
    : isSecondary
      ? colors.surface
      : "transparent";

  const borderColor = isPrimary ? colors.primary : colors.border;
  const textColor = isPrimary ? colors.white : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={{
        backgroundColor,
        borderWidth: variant === "ghost" ? 0 : 1,
        borderColor,
        paddingVertical: 15,
        paddingHorizontal: 16,
        borderRadius: radius.lg,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      <Text
        style={{
          color: textColor,
          textAlign: "center",
          fontSize: typography.bodyLg,
          fontWeight: typography.weightSemibold,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}