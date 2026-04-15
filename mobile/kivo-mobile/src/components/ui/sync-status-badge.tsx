import { Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";

type SyncStatus =
    | "pending_create"
    | "pending_update"
    | "pending_delete"
    | "synced"
    | "failed";

type SyncStatusBadgeProps = {
    status: string;
};

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
    const normalizedStatus = status as SyncStatus;

    const config = (() => {
        switch (normalizedStatus) {
            case "synced":
                return {
                    label: "Sincronizado",
                    textColor: colors.success,
                    backgroundColor: colors.successSoft,
                };
            case "failed":
                return {
                    label: "Error",
                    textColor: colors.danger,
                    backgroundColor: colors.dangerSoft,
                };
            case "pending_delete":
                return {
                    label: "Pend. eliminar",
                    textColor: colors.warning,
                    backgroundColor: colors.warningSoft,
                };
            case "pending_update":
                return {
                    label: "Pend. actualizar",
                    textColor: colors.warning,
                    backgroundColor: colors.warningSoft,
                };
            case "pending_create":
            default:
                return {
                    label: "Pendiente",
                    textColor: colors.primary,
                    backgroundColor: colors.primarySoft,
                };
        }
    })();

    return (
        <View
            style={{
                backgroundColor: config.backgroundColor,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
            }}
        >
            <Text
                style={{
                    color: config.textColor,
                    fontWeight: typography.weightSemibold,
                    fontSize: typography.bodySm,
                }}
            >
                {config.label}
            </Text>
        </View>
    );
}