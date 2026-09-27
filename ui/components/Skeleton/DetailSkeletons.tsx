import { StyleSheet, View } from "react-native";
import { useColors } from "@/ui/theme";
import {
  SkeletonCircle,
  SkeletonRect,
  SkeletonSpacer,
} from "./SkeletonPrimitives";

const ROW_KEYS = ["d1", "d2", "d3", "d4", "d5", "d6"] as const;

/**
 * Detail-screen skeleton (safety item, wallet doc, home item detail).
 * Matches the hero + status + cards layout used on prototype detail screens.
 * @returns Detail loading UI
 */
export function ItemDetailSkeleton() {
  const colors = useColors();
  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.hero,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <SkeletonRect width="100%" height={180} borderRadius={16} />
        <SkeletonSpacer height={14} />
        <SkeletonRect width="70%" height={22} borderRadius={8} />
        <SkeletonSpacer height={8} />
        <SkeletonRect width="45%" height={14} borderRadius={6} />
      </View>
      <SkeletonSpacer height={12} />
      <SkeletonRect width="100%" height={52} borderRadius={14} />
      <SkeletonSpacer height={12} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <SkeletonRect width="40%" height={12} borderRadius={6} />
        <SkeletonSpacer height={12} />
        {ROW_KEYS.slice(0, 4).map((key) => (
          <View key={key} style={styles.specRow}>
            <SkeletonRect width="35%" height={12} borderRadius={4} />
            <SkeletonRect width="50%" height={14} borderRadius={6} />
          </View>
        ))}
      </View>
      <SkeletonSpacer height={12} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <SkeletonRect width="55%" height={12} borderRadius={6} />
        <SkeletonSpacer height={14} />
        <SkeletonRect width="100%" height={10} borderRadius={999} />
        <SkeletonSpacer height={10} />
        <SkeletonRect width="40%" height={12} borderRadius={6} />
      </View>
      <SkeletonSpacer height={16} />
      <SkeletonRect width="100%" height={52} borderRadius={14} />
    </View>
  );
}

/**
 * Crew detail skeleton (avatar, contact rows, certificate list).
 * @returns Crew detail loading UI
 */
export function CrewDetailSkeleton() {
  const colors = useColors();
  return (
    <View style={styles.screen}>
      <View style={styles.crewHeader}>
        <SkeletonCircle size={72} />
        <SkeletonSpacer height={12} />
        <SkeletonRect width="55%" height={20} borderRadius={8} />
        <SkeletonSpacer height={8} />
        <SkeletonRect width="35%" height={14} borderRadius={6} />
      </View>
      <SkeletonSpacer height={14} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {ROW_KEYS.slice(0, 3).map((key) => (
          <View key={key} style={styles.specRow}>
            <SkeletonRect width="30%" height={12} borderRadius={4} />
            <SkeletonRect width="55%" height={14} borderRadius={6} />
          </View>
        ))}
      </View>
      <SkeletonSpacer height={12} />
      {ROW_KEYS.slice(0, 3).map((key) => (
        <View key={key}>
          <View
            style={[
              styles.certRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <SkeletonCircle size={36} />
            <View style={styles.certBody}>
              <SkeletonRect width="70%" height={14} borderRadius={6} />
              <SkeletonSpacer height={8} />
              <SkeletonRect width="40%" height={12} borderRadius={6} />
            </View>
          </View>
          <SkeletonSpacer height={10} />
        </View>
      ))}
    </View>
  );
}

/**
 * Add / Edit form skeleton (field cards + sticky footer).
 * @returns Form loading UI
 */
export function FormScreenSkeleton() {
  const colors = useColors();
  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {ROW_KEYS.map((key) => (
          <View key={key} style={styles.fieldBlock}>
            <SkeletonRect width="40%" height={12} borderRadius={4} />
            <SkeletonSpacer height={8} />
            <SkeletonRect width="100%" height={52} borderRadius={12} />
          </View>
        ))}
      </View>
      <SkeletonSpacer height={14} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <SkeletonRect width="55%" height={14} borderRadius={6} />
        <SkeletonSpacer height={12} />
        <View style={styles.uploadRow}>
          <View style={styles.uploadTile}>
            <SkeletonRect width="100%" height={120} borderRadius={14} />
          </View>
          <View style={styles.uploadTile}>
            <SkeletonRect width="100%" height={120} borderRadius={14} />
          </View>
        </View>
      </View>
      <SkeletonSpacer height={20} />
      <SkeletonRect width="100%" height={52} borderRadius={14} />
    </View>
  );
}

/**
 * Auth / login-style form skeleton (banner + fields + CTA).
 * @returns Auth loading UI
 */
export function AuthFormSkeleton() {
  const colors = useColors();
  return (
    <View style={styles.screen}>
      <SkeletonRect width="100%" height={160} borderRadius={16} />
      <SkeletonSpacer height={18} />
      <SkeletonRect width="55%" height={28} borderRadius={8} />
      <SkeletonSpacer height={10} />
      <SkeletonRect width="80%" height={14} borderRadius={6} />
      <SkeletonSpacer height={20} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {ROW_KEYS.slice(0, 3).map((key) => (
          <View key={key} style={styles.fieldBlock}>
            <SkeletonRect width="35%" height={12} borderRadius={4} />
            <SkeletonSpacer height={8} />
            <SkeletonRect width="100%" height={52} borderRadius={12} />
          </View>
        ))}
      </View>
      <SkeletonSpacer height={16} />
      <SkeletonRect width="100%" height={54} borderRadius={14} />
      <SkeletonSpacer height={12} />
      <SkeletonRect width="100%" height={48} borderRadius={14} />
    </View>
  );
}

/**
 * Subscription plan picker skeleton.
 * @returns Subscription loading UI
 */
export function SubscriptionSkeleton() {
  const colors = useColors();
  return (
    <View style={styles.screen}>
      <SkeletonRect width="70%" height={28} borderRadius={8} />
      <SkeletonSpacer height={10} />
      <SkeletonRect width="90%" height={14} borderRadius={6} />
      <SkeletonSpacer height={18} />
      {ROW_KEYS.slice(0, 2).map((key) => (
        <View key={key}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <SkeletonRect width="40%" height={16} borderRadius={6} />
            <SkeletonSpacer height={10} />
            <SkeletonRect width="55%" height={28} borderRadius={8} />
            <SkeletonSpacer height={8} />
            <SkeletonRect width="75%" height={12} borderRadius={6} />
          </View>
          <SkeletonSpacer height={12} />
        </View>
      ))}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <SkeletonRect width="90%" height={12} borderRadius={6} />
        <SkeletonSpacer height={8} />
        <SkeletonRect width="85%" height={12} borderRadius={6} />
        <SkeletonSpacer height={8} />
        <SkeletonRect width="70%" height={12} borderRadius={6} />
      </View>
      <SkeletonSpacer height={18} />
      <SkeletonRect width="100%" height={54} borderRadius={14} />
    </View>
  );
}

/**
 * App launch boot skeleton (replaces spinner while auth/onboarding resolve).
 * @returns Boot loading UI
 */
export function AppBootSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.boot, { backgroundColor: colors.background }]}>
      <SkeletonCircle size={72} />
      <SkeletonSpacer height={20} />
      <SkeletonRect width="48%" height={28} borderRadius={8} />
      <SkeletonSpacer height={10} />
      <SkeletonRect width="64%" height={14} borderRadius={6} />
      <SkeletonSpacer height={28} />
      <SkeletonRect width="78%" height={54} borderRadius={14} />
      <SkeletonSpacer height={12} />
      <SkeletonRect width="56%" height={16} borderRadius={6} />
    </View>
  );
}

/**
 * Map picker skeleton while GPS / region bootstraps.
 * @returns Map loading UI
 */
export function MapPickerSkeleton() {
  const colors = useColors();
  return (
    <View style={styles.mapSkeleton}>
      <View
        style={[styles.mapBody, { backgroundColor: colors.cardSoft }]}
      >
        <SkeletonRect width="100%" height={280} borderRadius={0} />
        <View style={styles.mapPin}>
          <SkeletonCircle size={40} />
        </View>
      </View>
      <View style={[styles.mapFooter, { backgroundColor: colors.background }]}>
        <SkeletonRect width="80%" height={12} borderRadius={6} />
        <SkeletonSpacer height={10} />
        <SkeletonRect width="100%" height={56} borderRadius={12} />
        <SkeletonSpacer height={10} />
        <SkeletonRect width="100%" height={52} borderRadius={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  crewHeader: {
    alignItems: "center",
    paddingVertical: 12,
  },
  certRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  certBody: { flex: 1 },
  fieldBlock: { marginBottom: 12 },
  uploadRow: {
    flexDirection: "row",
    gap: 10,
  },
  uploadTile: { flex: 1 },
  mapSkeleton: { flex: 1 },
  mapBody: {
    flex: 1,
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  mapPin: {
    position: "absolute",
  },
  mapFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
});
