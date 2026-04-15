import { Text, TextInput, View } from "react-native";

import { colors } from "@/theme/colors";

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
};

/**
 * Input base reutilizable de la app.
 * Permite mostrar etiqueta, campo y error bajo un patrón consistente.
 */
export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  error,
}: AppInputProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 16,
          color: colors.text,
          backgroundColor: "#FFFFFF",
        }}
        placeholderTextColor={colors.textMuted}
      />

      {error ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 13,
            color: colors.danger,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}