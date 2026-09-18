import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { DEMO_WALLET } from "@/features/common/data/demo";
import { Card, Screen, StatusPill } from "@/features/common/ui";
import { useTranslation } from "@/shared/translations";

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
          <Text style={styles.title}>{t("wallet.title")}</Text>
          <Text style={styles.sub}>{t("wallet.subtitle")}</Text>
        </View>
        <Pressable style={styles.add} onPress={() => router.push("/add-document")}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {DEMO_WALLET.map((doc) => (
        <Card key={doc.id} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={20} color={colors.teal} />
          </View>
          <View style={styles.body}>
            <Text style={styles.name}>{doc.title}</Text>
            <Text style={styles.meta}>{doc.subtitle}</Text>
            <StatusPill label={doc.expires} tone={doc.tone} />
            {doc.code ? (
              <Text style={styles.code}>
                {t("wallet.code-label")}: {doc.code}
              </Text>
            ) : null}
          </View>
        </Card>
      ))}

      <Pressable onPress={() => router.push("/billing")}>
        <Card style={styles.billing}>
          <Ionicons name="card-outline" size={20} color={colors.navy} />
          <Text style={styles.billingText}>{t("vessel.billing")}</Text>
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
