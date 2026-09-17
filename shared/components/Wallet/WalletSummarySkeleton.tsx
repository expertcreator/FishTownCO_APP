import { View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { SkeletonRect, SkeletonSpacer } from "@/shared/components/Skeleton";
import { useColors } from "@/shared/theme";
import { getStyles } from "./Wallet.styles";

export const WalletSummarySkeleton = () => {
  const themeColors = useColors();
  const styles = getStyles(themeColors);

  return (
    <View style={styles.summaryCardsRow}>
      {[1, 2, 3].map((index) => (
        <View key={`summary-skeleton-${index}`} style={styles.summaryCard}>
          <SkeletonRect
            width="70%"
            height={moderateScale(14)}
            borderRadius={moderateScale(4)}
          />
          <SkeletonSpacer height={moderateScale(6)} />
          <SkeletonRect
            width="60%"
            height={moderateScale(20)}
            borderRadius={moderateScale(4)}
          />
        </View>
      ))}
    </View>
  );
};
