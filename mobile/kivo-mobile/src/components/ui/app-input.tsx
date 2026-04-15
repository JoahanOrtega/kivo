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
import { radius } from "@/theme/radius";
import { typography } from "@/theme/typography";

type AppInputProps = {
    label: string;
    error?: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
} & TextInputProps;

/**
 * Input base reutilizable de Kivo.
 * Mejora la experiencia visual y mantiene consistencia entre formularios.
 */
export const AppInput = forwardRef<TextInput, AppInputProps>(
    ({ label, error, style, containerStyle, inputStyle, ...inputProps }, ref) => {
        return (
            <View style={[{ marginBottom: 16 }, containerStyle]}>
                <Text
                    style={{
                        fontSize: typography.bodySm,
                        fontWeight: typography.weightSemibold,
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
                            borderRadius: radius.lg,
                            paddingHorizontal: 14,
                            paddingVertical: 15,
                            fontSize: typography.bodyLg,
                            color: colors.text,
                            backgroundColor: colors.white,
                        },
                        inputStyle,
                        style,
                    ]}
                    placeholderTextColor={colors.textSoft}
                    selectionColor={colors.primary}
                />

                {error ? (
                    <Text
                        style={{
                            marginTop: 6,
                            fontSize: typography.caption,
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