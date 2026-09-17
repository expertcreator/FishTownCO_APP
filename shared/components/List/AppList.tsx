import { FlashList } from "@shopify/flash-list";
import { Dimensions, StyleSheet, Text, type ViewStyle } from "react-native";
import styles from "./AppList.style";
import type { AppListProps } from "./AppList.type";

type ListContentStyle = Pick<
  ViewStyle,
  | "backgroundColor"
  | "padding"
  | "paddingBottom"
  | "paddingEnd"
  | "paddingHorizontal"
  | "paddingLeft"
  | "paddingRight"
  | "paddingStart"
  | "paddingTop"
  | "paddingVertical"
>;

function AppList<T>({
  data = [],
  renderItem,
  keyExtractor,
  contentContainerStyle,
  ListEmptyComponent,
  ListFooterComponent,
  estimatedItemSize,
  horizontal,
  showsHorizontalScrollIndicator,
  bounces = false,
  overScrollMode = "never",
  scrollEnabled,
  ItemSeparatorComponent,
  extraData,
  refreshControl,
  listRef,
  onScroll,
  scrollEventThrottle,
  onContentSizeChange,
}: AppListProps<T>) {
  // FlashList only honours padding/background here, so narrow to that subset.
  // Keeping it local (rather than the v1-only `ContentStyle`) keeps this file
  // valid under both flash-list v1 and v2.
  const containerStyle = StyleSheet.flatten(
    horizontal
      ? contentContainerStyle
      : [styles.container, contentContainerStyle],
  ) as ListContentStyle | undefined;
  const screenWidth = Dimensions.get("window").width;
  let autoScrollEnabled: boolean | undefined;
  if (scrollEnabled !== undefined) {
    autoScrollEnabled = scrollEnabled;
  } else if (horizontal && estimatedItemSize) {
    autoScrollEnabled = data.length * estimatedItemSize > screenWidth;
  } else {
    autoScrollEnabled = undefined;
  }

  const safeOnScroll = typeof onScroll === "function" ? onScroll : undefined;
  const safeOnContentSizeChange =
    typeof onContentSizeChange === "function" ? onContentSizeChange : undefined;

  return (
    <FlashList
      // AppListRef is a structural subset of flash-list's own ref (see
      // AppList.type.ts); the cast bridges the two across v1/v2 naming.
      ref={listRef as never}
      contentContainerStyle={containerStyle ?? undefined}
      data={data}
      keyExtractor={keyExtractor ?? ((_, index) => index.toString())}
      {...(estimatedItemSize && { estimatedItemSize })}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      bounces={bounces}
      overScrollMode={overScrollMode}
      scrollEnabled={autoScrollEnabled}
      refreshControl={refreshControl ?? undefined}
      onScroll={safeOnScroll}
      scrollEventThrottle={scrollEventThrottle}
      onContentSizeChange={safeOnContentSizeChange}
      ListEmptyComponent={
        ListEmptyComponent ?? (
          <Text style={styles.emptyText}>No items available</Text>
        )
      }
      ListFooterComponent={ListFooterComponent ?? undefined}
      ItemSeparatorComponent={ItemSeparatorComponent ?? undefined}
      renderItem={renderItem}
      extraData={extraData}
    />
  );
}

export default AppList;
