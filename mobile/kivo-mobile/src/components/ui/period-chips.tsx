import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

type PeriodChipsProps = {
    activeKey: "current" | "previous" | "custom";
    onSelectCurrent: () => void;
    onSelectPrevious: () => void;
};

export function PeriodChips({
    activeKey,
    onSelectCurrent,
    onSelectPrevious,
}: PeriodChipsProps) {
    const getChipStyle = (isActive: boolean) => ({
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: isActive ? colors.primary : colors.border,
        backgroundColor: isActive ? colors.primarySoft : colors.white,
    });

    const getTextStyle = (isActive: boolean) => ({
        color: isActive ? colors.primary : colors.text,
        fontWeight: typography.weightSemibold as "400" | "500" | "600" | "700",
        fontSize: typography.bodySm,
    });

    return (
        <View
            style={{
                flexDirection: "row",
                gap: spacing.sm,
                marginBottom: spacing.lg,
            }}
        >
            <TouchableOpacity
                onPress={onSelectCurrent}
                activeOpacity={0.85}
                style={getChipStyle(activeKey === "current")}
            >
                <Text style={getTextStyle(activeKey === "current")}>Este mes</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onSelectPrevious}
                activeOpacity={0.85}
                style={getChipStyle(activeKey === "previous")}
            >
                <Text style={getTextStyle(activeKey === "previous")}>Mes pasado</Text>
            </TouchableOpacity>
        </View>
    );
}