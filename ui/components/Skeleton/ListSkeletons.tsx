import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useColors } from "@/ui/theme";
import {
  SkeletonCircle,
  SkeletonRect,
  SkeletonSpacer,
} from "./SkeletonPrimitives";

const ROW_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6"] as const;
const CHIP_KEYS = ["c1", "c2", "c3", "c4"] as const;
const STAT_KEYS = ["s1", "s2", "s3"] as const;

/**
 * Shared padded column used by screen skeletons.
 * @param props - Children
 * @param props.children - Skeleton content
 * @returns Padded wrapper
 */
function SkeletonScreen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

/**
 * Title + subtitle placeholder used on most tabs.
 * @returns Header skeleton
 */
function TitleBlockSkeleton() {
  return (
    <View>
      <SkeletonRect width="55%" height={28} borderRadius={8} />
      <SkeletonSpacer height={10} />
      <SkeletonRect width="75%" height={14} borderRadius={6} />
      <SkeletonSpacer height={18} />
    </View>
  );
}

/**
 * One inventory / crew / wallet row shimmer.
 * @returns Row skeleton
 */
function ListRowSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonCircle size={40} />
      <View style={styles.rowBody}>
        <SkeletonRect width="70%" height={14} borderRadius={6} />
        <SkeletonSpacer height={8} />
        <SkeletonRect width="45%" height={12} borderRadius={6} />
      </View>
      <SkeletonRect width={56} height={22} borderRadius={999} />
    </View>
  );
}

/**
 * Home dashboard skeleton (hero, stats, filters, rows).
 * @returns Home loading UI
 */
export function HomeDashboardSkeleton() {
  const colors = useColors();
  return (
    <SkeletonScreen>
      <View style={styles.topBar}>
        <SkeletonRect width={88} height={28} borderRadius={6} />
        <SkeletonRect width={90} height={18} borderRadius={6} />
        <View style={styles.topSpacer} />
      </View>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonRect width="100%" height={168} borderRadius={18} />
      </View>
      <SkeletonSpacer height={14} />
      <View style={[styles.attention, { backgroundColor: colors.cardSoft }]}>
        <SkeletonRect width="50%" height={14} borderRadius={6} />
        <SkeletonSpacer height={8} />
        <SkeletonRect width="80%" height={12} borderRadius={6} />
      </View>
      <SkeletonSpacer height={14} />
      <View style={styles.stats}>
        {STAT_KEYS.map((key) => (
          <View key={key} style={[styles.stat, { backgroundColor: colors.cardSoft }]}>
            <SkeletonCircle size={18} />
            <SkeletonSpacer height={8} />
            <SkeletonRect width={28} height={20} borderRadius={6} />
            <SkeletonSpacer height={6} />
            <SkeletonRect width={40} height={10} borderRadius={4} />
          </View>
        ))}
      </View>
      <View style={styles.chips}>
        {CHIP_KEYS.map((key) => (
          <SkeletonRect key={key} width={72} height={32} borderRadius={999} />
        ))}
      </View>
      <SkeletonSpacer height={8} />
      {ROW_KEYS.slice(0, 4).map((key) => (
        <View key={key}>
          <ListRowSkeleton />
          <SkeletonSpacer height={10} />
        </View>
      ))}
    </SkeletonScreen>
  );
}

/**
 * Safety inventory list skeleton.
 * @returns Safety loading UI
 */
export function SafetyListSkeleton() {
  return (
    <SkeletonScreen>
      <TitleBlockSkeleton />
      <View style={styles.chips}>
        {CHIP_KEYS.map((key) => (
          <SkeletonRect key={key} width={72} height={32} borderRadius={999} />
        ))}
      </View>
      <SkeletonSpacer height={8} />
      {ROW_KEYS.map((key) => (
        <View key={key}>
          <ListRowSkeleton />
          <SkeletonSpacer height={10} />
        </View>
      ))}
    </SkeletonScreen>
  );
}

/**
 * My Vessel tab skeleton.
 * @returns Vessel loading UI
 */
export function VesselScreenSkeleton() {
  const colors = useColors();
  return (
    <SkeletonScreen>
      <TitleBlockSkeleton />
      <View style={[styles.vesselHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonCircle size={48} />
        <SkeletonSpacer height={12} />
        <SkeletonRect width="60%" height={20} borderRadius={6} />
        <SkeletonSpacer height={8} />
        <SkeletonRect width="40%" height={14} borderRadius={6} />
        <SkeletonSpacer height={16} />
        <View style={styles.metaGrid}>
          {ROW_KEYS.slice(0, 6).map((key) => (
            <View key={key} style={styles.metaCell}>
              <SkeletonRect width="70%" height={10} borderRadius={4} />
              <SkeletonSpacer height={6} />
              <SkeletonRect width="90%" height={14} borderRadius={6} />
            </View>
          ))}
        </View>
      </View>
      <SkeletonSpacer height={12} />
      {ROW_KEYS.slice(0, 3).map((key) => (
        <View key={key}>
          <View style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SkeletonCircle size={28} />
            <SkeletonSpacer width={10} />
            <SkeletonRect width="55%" height={14} borderRadius={6} />
          </View>
          <SkeletonSpacer height={10} />
        </View>
      ))}
    </SkeletonScreen>
  );
}

/**
 * Wallet / documents list skeleton.
 * @returns Wallet loading UI
 */
export function WalletListSkeleton() {
  return (
    <SkeletonScreen>
      <TitleBlockSkeleton />
      {ROW_KEYS.map((key) => (
        <View key={key}>
          <ListRowSkeleton />
          <SkeletonSpacer height={10} />
        </View>
      ))}
    </SkeletonScreen>
  );
}

/**
 * Crew list skeleton.
 * @returns Crew loading UI
 */
export function CrewListSkeleton() {
  return (
    <SkeletonScreen>
      <TitleBlockSkeleton />
      {ROW_KEYS.map((key) => (
        <View key={key}>
          <ListRowSkeleton />
          <SkeletonSpacer height={10} />
        </View>
      ))}
    </SkeletonScreen>
  );
}

/**
 * Billing history list skeleton.
 * @returns Billing loading UI
 */
export function BillingListSkeleton() {
  return (
    <SkeletonScreen>
      <TitleBlockSkeleton />
      {ROW_KEYS.map((key) => (
        <View key={key}>
          <ListRowSkeleton />
          <SkeletonSpacer height={10} />
        </View>
      ))}
    </SkeletonScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  topSpacer: { flex: 1 },
  hero: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  attention: {
    borderRadius: 14,
    padding: 14,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  stat: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  rowBody: { flex: 1 },
  vesselHero: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaCell: {
    width: "47%",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
});
