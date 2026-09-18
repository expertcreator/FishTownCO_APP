import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useColors, type ThemeColors } from "@/ui/theme";
import { DEMO_CREW } from "@/features/common/data/demo";
import { AppText, Card, Screen, StatusPill } from "@/ui/components";
import { useTranslation } from "@/ui/translations";

/**
 * Crew List screen matching prototype screen 19.
 * @returns Crew list UI
 */
export default function CrewListScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
        <View style={styles.headerText}>
          <AppText style={styles.title}>{t("crew.title")}</AppText>
          <AppText style={styles.sub}>{t("crew.subtitle")}</AppText>
        </View>
        <Pressable style={styles.add} onPress={() => router.push("/crew/add")}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {DEMO_CREW.map((member) => (
        <Pressable
          key={member.id}
          onPress={() => router.push(`/crew/${member.id}`)}
        >
          <Card style={styles.row}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>
                {member.name
                  .replace("Capt. ", "")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </AppText>
            </View>
            <View style={styles.body}>
              <AppText style={styles.name}>{member.name}</AppText>
              <AppText style={styles.meta}>{member.role}</AppText>
              <StatusPill label={member.expires} tone={member.tone} />
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
  },
  headerText: { flex: 1 },
  title: { color: colors.navy, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted, marginTop: 4 },
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
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.softTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.teal, fontWeight: "800" },
  body: { flex: 1, gap: 4 },
  name: { color: colors.navy, fontWeight: "700", fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12 },
});
}
