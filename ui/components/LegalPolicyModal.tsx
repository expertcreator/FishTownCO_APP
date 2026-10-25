import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import {
  legalDocumentUrl,
  type LegalDocument,
} from "@/features/common/legal/policyLinks";
import { useColors, type ThemeColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";
import AppText from "./Text";

type LegalPolicyModalProps = {
  /** Which page to show. `null` keeps the modal closed. */
  document: LegalDocument | null;
  onClose: () => void;
  /** When set, the footer marks the sign-up agreement as accepted. */
  onAccept?: () => void;
};

/**
 * Full-screen modal that loads a Privacy Policy or Terms page.
 * @param props - Modal props
 * @param props.document - Page to open, or null when closed
 * @param props.onClose - Close handler
 * @param props.onAccept - Optional accept handler for sign-up
 * @returns Policy modal
 */
export function LegalPolicyModal({
  document,
  onClose,
  onAccept,
}: LegalPolicyModalProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [document, reloadKey]);

  useEffect(() => {
    if (!document) {
      setMounted(false);
      return;
    }
    const id = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(id);
  }, [document]);

  const title =
    document === "terms"
      ? t("auth.terms-modal-title")
      : t("auth.privacy-modal-title");
  const url = document ? legalDocumentUrl(document) : null;

  return (
    <Modal
      visible={document != null}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <AppText style={styles.title} numberOfLines={1}>
            {title}
          </AppText>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="close" size={22} color={colors.navy} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {url && !mounted && !failed ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.teal} />
            </View>
          ) : null}
          {url && mounted && !failed ? (
            <WebView
              key={`${url}-${reloadKey}`}
              source={{ uri: url }}
              style={styles.web}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.teal} />
                </View>
              )}
              onError={() => setFailed(true)}
              onHttpError={(event) => {
                if (event.nativeEvent.statusCode >= 400) setFailed(true);
              }}
              setSupportMultipleWindows={false}
            />
          ) : null}
          {failed ? (
            <View style={styles.failed}>
              <AppText style={styles.failedText}>
                {t("common.legal-load-failed")}
              </AppText>
              <Pressable
                onPress={() => setReloadKey((key) => key + 1)}
                style={({ pressed }) => [
                  styles.retry,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <AppText style={styles.retryText}>{t("common.try-again")}</AppText>
              </Pressable>
            </View>
          ) : null}
        </View>

        {onAccept ? (
          <Pressable
            onPress={onAccept}
            style={({ pressed }) => [
              styles.accept,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <AppText style={styles.acceptText}>{t("auth.accept-close")}</AppText>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

/**
 * Builds policy-modal styles for the active palette.
 * @param colors - Active theme colors
 * @returns Style sheet
 */
function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 20,
      paddingRight: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    title: {
      flex: 1,
      color: colors.navy,
      fontSize: 17,
      fontWeight: "800",
    },
    close: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      flex: 1,
    },
    web: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loading: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    failed: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 16,
    },
    failedText: {
      color: colors.navy,
      fontSize: 15,
      textAlign: "center",
    },
    retry: {
      minHeight: 44,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    retryText: {
      color: colors.white,
      fontWeight: "700",
    },
    accept: {
      margin: 16,
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    acceptText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: "700",
    },
    pressed: { opacity: 0.75 },
  });
}
