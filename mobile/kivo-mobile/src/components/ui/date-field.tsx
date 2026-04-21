import { useMemo, useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

type DateFieldProps = {
    label: string;
    value: string;
    onChange: (dateStr: string) => void;
    error?: string;
};

function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDisplay(dateStr: string): string {
    const date = parseLocalDate(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// ─── Accesos rápidos ──────────────────────────────────────────────────────────
function getQuickDates(): { label: string; dateStr: string }[] {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    return [
        { label: "Hoy", dateStr: toDateString(today) },
        { label: "Ayer", dateStr: toDateString(yesterday) },
        { label: "Hace 2 días", dateStr: toDateString(twoDaysAgo) },
    ];
}

export function DateField({ label, value, onChange, error }: DateFieldProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [tempDate, setTempDate] = useState<Date | null>(null);

    const selectedDate = useMemo(() => {
        try {
            return parseLocalDate(value);
        } catch {
            return new Date();
        }
    }, [value]);

    const quickDates = getQuickDates();

    const handleOpen = () => {
        setTempDate(selectedDate);
        setShowPicker(true);
    };

    const handleChangeIOS = (_event: DateTimePickerEvent, selected?: Date) => {
        if (selected) setTempDate(selected);
    };

    const handleConfirmIOS = () => {
        if (tempDate) onChange(toDateString(tempDate));
        setShowPicker(false);
    };

    const handleChangeAndroid = (_event: DateTimePickerEvent, selected?: Date) => {
        setShowPicker(false);
        if (selected) onChange(toDateString(selected));
    };

    return (
        <View style={{ marginBottom: spacing.md }}>
            <Text style={{
                fontSize: typography.bodySm,
                fontWeight: typography.weightSemibold,
                color: colors.text,
                marginBottom: 8,
            }}>
                {label}
            </Text>

            {/* ── Accesos rápidos ───────────────────────────────────────────────
                Resuelve el 90% de los casos de uso en un solo toque.
                La mayoría de gastos se registran el mismo día o al día siguiente.
                Ley de Fitts — acción principal accesible inmediatamente. */}
            <View style={{
                flexDirection: "row",
                gap: spacing.sm,
                marginBottom: spacing.sm,
            }}>
                {quickDates.map((quick) => {
                    const isSelected = value === quick.dateStr;
                    return (
                        <TouchableOpacity
                            key={quick.label}
                            onPress={() => onChange(quick.dateStr)}
                            activeOpacity={0.85}
                            style={{
                                paddingHorizontal: spacing.md,
                                paddingVertical: spacing.xs,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: isSelected ? colors.primary : colors.border,
                                backgroundColor: isSelected ? colors.primarySoft : colors.white,
                            }}
                        >
                            <Text style={{
                                fontSize: typography.bodySm,
                                fontWeight: isSelected ? typography.weightSemibold : "400",
                                color: isSelected ? colors.primary : colors.textMuted,
                            }}>
                                {quick.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ── Campo de fecha con botón para abrir picker ── */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleOpen}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: error ? colors.danger : colors.border,
                    borderRadius: radius.lg,
                    paddingHorizontal: 14,
                    paddingVertical: 15,
                    backgroundColor: colors.white,
                }}
            >
                <Text style={{ fontSize: typography.bodyLg, color: colors.text }}>
                    {formatDisplay(value)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {error && (
                <Text style={{ marginTop: 6, fontSize: typography.caption, color: colors.danger }}>
                    {error}
                </Text>
            )}

            {/* ── iOS: modal con spinner nativo ── */}
            {Platform.OS === "ios" && (
                <Modal
                    visible={showPicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowPicker(false)}
                >
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
                        activeOpacity={1}
                        onPress={() => setShowPicker(false)}
                    />

                    <View style={{
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingBottom: 40,
                    }}>
                        <View style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingHorizontal: spacing.lg,
                            paddingVertical: spacing.md,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                        }}>
                            <TouchableOpacity
                                onPress={() => setShowPicker(false)}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Text style={{ color: colors.textMuted, fontSize: typography.bodyMd }}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <Text style={{
                                fontSize: typography.bodyLg,
                                fontWeight: typography.weightBold,
                                color: colors.text,
                            }}>
                                Otra fecha
                            </Text>

                            <TouchableOpacity
                                onPress={handleConfirmIOS}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Text style={{
                                    color: colors.primary,
                                    fontSize: typography.bodyMd,
                                    fontWeight: typography.weightSemibold,
                                }}>
                                    Listo
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <DateTimePicker
                            value={tempDate ?? selectedDate}
                            mode="date"
                            display="spinner"
                            onChange={handleChangeIOS}
                            maximumDate={new Date()}
                            locale="es-MX"
                            style={{ height: 200 }}
                            textColor={colors.text}
                        />
                    </View>
                </Modal>
            )}

            {/* ── Android: picker nativo del sistema ── */}
            {Platform.OS === "android" && showPicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleChangeAndroid}
                    maximumDate={new Date()}
                />
            )}
        </View>
    );
}