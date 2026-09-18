import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";
import { DEMO_WALLET } from "@/features/common/data/demo";
import { AppText, Card, Screen, StatusPill } from "@/ui/components";
import { useTranslation } from "@/ui/translations";

/**
 * Wallet tab matching prototype screen 14.
 * @returns Wallet tab UI
 */
export default function WalletScreen() {
  const { t } = useTranslation();

  return (
    <Screen edges={["top", "left", "right"]} contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText style={styles.title}>{t("wallet.title")}</AppText>
          <AppText style={styles.sub}>{t("wallet.subtitle")}</AppText>
        </View>
        <Pressable style={styles.add} onPress={() => router.push("/wallet/add")}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {DEMO_WALLET.map((doc) => (
        <Card key={doc.id} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={20} color={colors.teal} />
          </View>
          <View style={styles.body}>
            <AppText style={styles.name}>{doc.title}</AppText>
            <AppText style={styles.meta}>{doc.subtitle}</AppText>
            <StatusPill label={doc.expires} tone={doc.tone} />
            {doc.code ? (
              <AppText style={styles.code}>
                {t("wallet.code-label")}: {doc.code}
              </AppText>
            ) : null}
          </View>
        </Card>
      ))}

      <Pressable onPress={() => router.push("/billing")}>
        <Card style={styles.billing}>
          <Ionicons name="card-outline" size={20} color={colors.navy} />
          <AppText style={styles.billingText}>{t("vessel.billing")}</AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Card>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  headerText: { flex: 1 },
  title: { color: colors.navy, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted, marginTop: 6 },
  add: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.softTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 6 },
  name: { color: colors.navy, fontWeight: "700", fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12 },
  code: { color: colors.teal, fontSize: 12, fontWeight: "700" },
  billing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  billingText: { flex: 1, color: colors.navy, fontWeight: "700" },
});
