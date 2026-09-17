import React from "react";
import { ViewStyle } from "react-native";

/**
 * AppBottomSheet - Fully Controlled Component
 *
 * This component follows a controlled pattern where visibility and behavior
 * are entirely driven by props. No imperative API is provided.
 *
 * Usage:
 * ```tsx
 * const [isVisible, setIsVisible] = useState(false);
 *
 * <AppBottomSheet
 *   isVisible={isVisible}
 *   onClose={() => setIsVisible(false)}
 * >
 *   <YourContent />
 * </AppBottomSheet>
 * ```
 *
 * Bottom safe-area inset is applied automatically by `AppBottomSheet`.
 * Do not wrap children in an additional `SafeAreaView` for the bottom edge.
 */
export type AppBottomSheetProps = {
  /**
   * Controls the visibility of the bottom sheet
   * When true: animates in
   * When false: animates out
   */
  isVisible: boolean;

  /**
   * Called when the sheet should be closed
   * Triggered by: overlay tap, drag dismiss, Android back button
   */
  onClose?: () => void;

  /**
   * Called when the sheet has fully opened (animation complete)
   */
  onOpen?: () => void;

  /**
   * Horizontal margin from screen edges
   * @default 20
   */
  horizontalMargin?: number;

  /**
   * Background color of the sheet
   * @default "#fff"
   */
  backgroundColor?: string;

  /**
   * Show the drag handle at the top of the sheet.
   * @default true
   */
  showDragIndicator?: boolean;

  /**
   * Custom style for the drag indicator
   */
  dragIndicatorStyle?: ViewStyle;

  /**
   * Optional container style for the sheet content
   */
  containerStyle?: ViewStyle;

  /**
   * Array of snap points (heights) for the bottom sheet
   * If provided, enables multi-position snapping
   */
  snapPoints?: number[];

  /**
   * Initial snap point index
   * @default 0 (first snap point)
   */
  initialIndex?: number;

  /** Enable swipe down to close behavior (like Gorhom's enablePanDownToClose). Default: true */
  enablePanDownToClose?: boolean;
  /** Pixel threshold of downward drag to trigger close. Default: 100 */
  closeThreshold?: number;
  /** Velocity threshold (dy per second) to trigger close even if distance is small. Default: 1.2 */
  velocityThreshold?: number;
  /** Backdrop maximum opacity. Default: 0.5 */
  backdropOpacity?: number;
  /** When true, tapping on the dimmed backdrop will NOT close the sheet. Default: false */
  disableBackdropClose?: boolean;

  /**
   * When true, caps sheet height below the top safe area and enables internal
   * flex children to shrink/scroll. Default: false (legacy behavior).
   */
  fitInSafeArea?: boolean;

  /**
   * Keyboard offset to move the sheet up when keyboard is visible
   * @default 0
   */
  keyboardOffset?: number;

  /**
   * Content to render inside the bottom sheet
   */
  children: React.ReactNode;
};
