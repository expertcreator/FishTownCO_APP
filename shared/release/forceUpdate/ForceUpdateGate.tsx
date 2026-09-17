import type { ReactNode } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import type { AppConfigResponse } from "./forceUpdateCore";
import {
  resolveIosForceUpdateBlock,
  useForceUpdate,
} from "./forceUpdateCore";
import { ForceUpdateModal } from "./ForceUpdateModal";

export type ForceUpdateGateProps = {
  appId: string;
  children?: ReactNode;
  fetchAppConfig: () => Promise<AppConfigResponse>;
  loadingComponent?: ReactNode;

  iosAppStoreId?: string;
};


export function ForceUpdateGate({
  appId,
  children,
  fetchAppConfig,
  loadingComponent,
  iosAppStoreId,
}: ForceUpdateGateProps) {
  const { isPending, isUpdateRequired: versionRequiresUpdate } = useForceUpdate(
    {
      appId,
      fetchAppConfig,
    }
  );
  const isUpdateRequired =
    Platform.OS === "ios"
      ? resolveIosForceUpdateBlock({
          versionRequiresUpdate,
          iosAppStoreId,
        })
      : versionRequiresUpdate;

  let content: ReactNode = children;
  if (isUpdateRequired) {
    content = null;
  } else if (isPending) {
    content = loadingComponent ?? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <ForceUpdateModal
        appId={appId}
        iosAppStoreId={iosAppStoreId}
        visible={isUpdateRequired}
      />
      {content}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
