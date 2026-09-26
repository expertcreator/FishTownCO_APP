import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import AppText from "./Text";

export type PickerOption = {
  id: string;
  label: string;
};

type OptionsPickerModalProps = {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedId?: string;
  loading?: boolean;
  onClose: () => void;
  onSelect: (option: PickerOption) => void;
};

/**
 * Bottom sheet-style modal for picking one option (Foori sheet pattern).
 * @param props - Modal props
 * @param props.visible - Whether the modal is shown
 * @param props.title - Sheet title
 * @param props.options - Options to choose from
 * @param props.selectedId - Currently selected option id
 * @param props.loading - Shows a loader instead of the list
 * @param props.onClose - Dismiss handler
 * @param props.onSelect - Option selected handler
 * @returns Options picker modal
 */
export function OptionsPickerModal({
  visible,
  title,
  options,
  selectedId,
  loading = false,
  onClose,
  onSelect,
}: OptionsPickerModalProps) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText style={styles.title}>{title}</AppText>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Ionicons name="close" size={22} color={colors.navy} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.teal} />
            </View>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const selected = item.id === selectedId;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    android_ripple={{ color: "rgba(13,44,65,0.08)" }}
                    style={({ pressed }) => [
                      styles.row,
                      selected && styles.rowSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText
                      style={[styles.rowText, selected && styles.rowTextSelected]}
                    >
                      {item.label}
                    </AppText>
                    {selected ? (
                      <Ionicons name="checkmark" size={20} color={colors.teal} />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <AppText style={styles.empty}>No options available</AppText>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Builds options-picker styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "70%",
      paddingBottom: 24,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 10,
      marginBottom: 6,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    title: {
      color: colors.navy,
      fontSize: 17,
      fontWeight: "800",
    },
    list: {
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    row: {
      minHeight: 52,
      borderRadius: 12,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 6,
      backgroundColor: colors.cardSoft,
      overflow: "hidden",
    },
    rowSelected: {
      borderWidth: 1,
      borderColor: colors.teal,
      backgroundColor: colors.softTeal,
    },
    rowText: {
      flex: 1,
      color: colors.navy,
      fontSize: 15,
      fontWeight: "600",
    },
    rowTextSelected: {
      color: colors.teal,
    },
    pressed: { opacity: 0.85 },
    loadingWrap: {
      paddingVertical: 40,
      alignItems: "center",
    },
    empty: {
      textAlign: "center",
      color: colors.muted,
      paddingVertical: 28,
    },
  });
}
