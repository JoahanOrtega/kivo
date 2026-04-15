import { forwardRef } from "react";
import {
    StyleProp,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";

type AppInputProps = {
    label: string;
    error?: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
} & TextInputProps;

/**
 * Input base reutilizable de la app.
 * Soporta refs y props nativas del TextInput para mejorar la experiencia
 * de formularios en móvil.
 */
export const AppInput = forwardRef<TextInput, AppInputProps>(
    ({ label, error, style, containerStyle, inputStyle, ...inputProps }, ref) => {
        return (
            <View style={[{ marginBottom: 16 }, containerStyle]}>
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
                    ref={ref}
                    {...inputProps}
                    style={[
                        {
                            borderWidth: 1,
                            borderColor: error ? colors.danger : colors.border,
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 14,
                            fontSize: 16,
                            color: colors.text,
                            backgroundColor: "#FFFFFF",
                        },
                        inputStyle,
                        style,
                    ]}
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
);

AppInput.displayName = "AppInput";