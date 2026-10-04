import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/ui/theme";
import { useTranslation } from "@/ui/translations";

/**
 * Main app bottom tabs from the Fishtownco prototype.
 * @returns Tab navigator
 */
export default function TabsLayout() {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabPaddingBottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64 + tabPaddingBottom,
          paddingTop: 8,
          paddingBottom: tabPaddingBottom,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: t("tabs.safety"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vessel"
        options={{
          title: t("tabs.vessel"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="boat-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t("tabs.wallet"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
