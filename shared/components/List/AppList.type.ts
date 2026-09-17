import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControlProps,
  StyleProp,
  ViewStyle,
} from "react-native";

/**
 * Structural handle over the underlying list. flash-list renamed its ref type
 * between v1 (`FlashList<T>`) and v2 (`FlashListRef<T>`), so this file — shared
 * with apps on either major — describes the scroll surface instead of importing
 * a version-specific name.
 */
export type AppListRef = {
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
  scrollToEnd: (params?: { animated?: boolean }) => void;
  scrollToIndex: (params: { index: number; animated?: boolean }) => void;
};

export type AppListProps<T> = {
  data: T[];
  renderItem: ({
    item,
    index,
  }: {
    item: T;
    index: number;
  }) => React.ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  estimatedItemSize?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  ListEmptyComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  bounces?: boolean;
  overScrollMode?: "auto" | "always" | "never";
  scrollEnabled?: boolean;
  ItemSeparatorComponent?: React.ComponentType<Record<string, never>> | null;
  extraData?: unknown;
  refreshControl?: React.ReactElement<RefreshControlProps> | null;
  listRef?: React.Ref<AppListRef>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  onContentSizeChange?: (width: number, height: number) => void;
};
