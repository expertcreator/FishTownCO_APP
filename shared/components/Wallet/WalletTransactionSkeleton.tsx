import { View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import {
  SkeletonCircle,
  SkeletonRect,
  SkeletonSpacer,
} from "@/shared/components/Skeleton";
import { useColors } from "@/shared/theme";
import { getStyles } from "./Wallet.styles";

export const WalletTransactionSkeleton = () => {
  const themeColors = useColors();
  const styles = getStyles(themeColors);

  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionTopRow}>
        <View style={styles.transRow}>
          <SkeletonCircle size={moderateScale(20)} />
          <SkeletonSpacer width={moderateScale(12)} />
          <View style={styles.transactionInfo}>
            <SkeletonRect
              width={moderateScale(120)}
              height={moderateScale(16)}
              borderRadius={moderateScale(4)}
            />
          </View>
          <View style={styles.transactionRightSection}>
            <View style={styles.transactionRightTop}>
              <SkeletonRect
                width={moderateScale(60)}
                height={moderateScale(18)}
                borderRadius={moderateScale(4)}
              />
              <SkeletonRect
                width={moderateScale(70)}
                height={moderateScale(24)}
                borderRadius={moderateScale(12)}
              />
            </View>
            <SkeletonSpacer height={moderateScale(6)} />
            <SkeletonRect
              width={moderateScale(18)}
              height={moderateScale(18)}
              borderRadius={moderateScale(4)}
            />
          </View>
        </View>
      </View>
      <View style={styles.transactionMetaSection}>
        <SkeletonRect
          width="100%"
          height={moderateScale(14)}
          borderRadius={moderateScale(4)}
        />
        <SkeletonSpacer height={moderateScale(6)} />
        <SkeletonRect
          width="80%"
          height={moderateScale(14)}
          borderRadius={moderateScale(4)}
        />
      </View>
    </View>
  );
};
