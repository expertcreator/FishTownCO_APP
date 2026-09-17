import { useColors } from "@/shared/theme";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { styles } from "./AppBottomSheet.style";
import type { AppBottomSheetProps } from "./AppBottomSheet.type";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const AppBottomSheet = ({
  isVisible,
  onClose,
  onOpen,
  horizontalMargin = 20,
  backgroundColor,
  showDragIndicator = true,
  dragIndicatorStyle,
  containerStyle,
  children,
  enablePanDownToClose = true,
  closeThreshold = 100,
  velocityThreshold = 1.2,
  backdropOpacity = 0.5,
  keyboardOffset = 0,
  disableBackdropClose = false,
  fitInSafeArea = false,
}: AppBottomSheetProps) => {
  const themeColors = useColors();
  const { bottom: safeAreaBottomInset, top: safeAreaTopInset } =
    useSafeAreaInsets();
  const sheetBottomInset = useMemo(() => {
    const mergedInset = Math.max(
      safeAreaBottomInset,
      initialWindowMetrics?.insets.bottom ?? 0
    );
    if (Platform.OS === "android") {
      return mergedInset > 0 ? mergedInset : 48;
    }
    return mergedInset;
  }, [safeAreaBottomInset]);
  const sheetTopInset = useMemo(
    () =>
      Math.max(safeAreaTopInset, initialWindowMetrics?.insets.top ?? 0),
    [safeAreaTopInset]
  );
  const sheetMaxHeight = fitInSafeArea
    ? SCREEN_HEIGHT - sheetTopInset - keyboardOffset
    : SCREEN_HEIGHT;

  const sheetBackgroundColor = backgroundColor || themeColors.card;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const prevKeyboardOffsetRef = useRef<number>(keyboardOffset);
  const isOpeningRef = useRef<boolean>(false);

  const animateOpen = useCallback(() => {
    // Read keyboardOffset from ref to avoid dependency
    const currentOffset = prevKeyboardOffsetRef.current;
    const targetY = -currentOffset;
    isOpeningRef.current = true;
    Animated.timing(translateY, {
      toValue: targetY,
      duration: 0,
      useNativeDriver: true,
    }).start(() => {
      isOpeningRef.current = false;
      onOpen?.();
    });
    Animated.timing(backdrop, {
      toValue: 1,
      duration: 0,
      useNativeDriver: true,
    }).start();
  }, [translateY, onOpen, backdrop]);

  // Animate in/out when isVisible changes
  const animateClose = useCallback(
    (notify = false) => {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 0,
        useNativeDriver: true,
      }).start(() => {
        if (notify) {
          onClose?.();
        }
      });
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start();
    },
    [translateY, onClose, backdrop]
  );

  useEffect(() => {
    if (isVisible) {
      // Update ref before opening to ensure correct initial position
      prevKeyboardOffsetRef.current = keyboardOffset;
      animateOpen();
    } else {
      // Prop-driven hide: animate without invoking onClose again
      animateClose(false);
    }
  }, [isVisible, animateOpen, animateClose, keyboardOffset]);

  // Update position when keyboard offset changes (only if actually changed and not during initial open)
  useEffect(() => {
    if (isVisible && !isOpeningRef.current) {
      const prevOffset = prevKeyboardOffsetRef.current;
      if (prevOffset !== keyboardOffset) {
        prevKeyboardOffsetRef.current = keyboardOffset;
        const targetY = -keyboardOffset;
        Animated.timing(translateY, {
          toValue: targetY,
          duration: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [keyboardOffset, isVisible, translateY]);

  const closeSheet = useCallback(() => {
    animateClose(true);
  }, [animateClose]);

  const handleMove = useCallback(
    (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (!enablePanDownToClose) {
        return;
      }
      const dy = Math.max(0, gestureState.dy);
      translateY.setValue(dy);
      // fade backdrop proportionally while dragging
      const progress = Math.min(1, dy / SCREEN_HEIGHT);
      backdrop.setValue(1 - progress);
    },
    [translateY, backdrop, enablePanDownToClose]
  );

  const handleRelease = useCallback(
    (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (!enablePanDownToClose) {
        Animated.spring(translateY, {
          toValue: -keyboardOffset,
          useNativeDriver: true,
        }).start();
        return;
      }
      const shouldCloseByDistance = gestureState.dy > closeThreshold;
      const velocity = gestureState.vy;
      const shouldCloseByVelocity = velocity > velocityThreshold;
      if (shouldCloseByDistance || shouldCloseByVelocity) {
        closeSheet();
      } else {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: -keyboardOffset,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }),
          Animated.timing(backdrop, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [
      translateY,
      closeSheet,
      enablePanDownToClose,
      closeThreshold,
      velocityThreshold,
      backdrop,
      keyboardOffset,
    ]
  );
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_e, g) => {
          if (!enablePanDownToClose) {
            return false;
          }
          // Only capture clear drag gestures, not taps
          // Increased threshold to prevent capturing button taps on iOS
          const isDownwardSwipe = g.dy > 10; // Increased from 3 to 10
          const isMoreVertical = Math.abs(g.dy) > Math.abs(g.dx) * 1.5; // More strict vertical requirement
          const hasSignificantMovement = Math.abs(g.dy) > 5; // Require at least 5px movement
          return isDownwardSwipe && isMoreVertical && hasSignificantMovement;
        },
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          backdrop.stopAnimation();
        },
        onPanResponderMove: handleMove,
        onPanResponderRelease: handleRelease,
        onPanResponderTerminate: handleRelease,
        onPanResponderTerminationRequest: () => false,
      }),
    [handleMove, handleRelease, enablePanDownToClose, translateY, backdrop]
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={closeSheet}
    >
      <TouchableWithoutFeedback
        onPress={disableBackdropClose ? undefined : closeSheet}
      >
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: backdrop.interpolate({
                inputRange: [0, 1],
                outputRange: [0, backdropOpacity],
              }),
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.sheet,
            fitInSafeArea && styles.sheetConstrained,
            showDragIndicator
              ? styles.sheetWithDragIndicator
              : styles.sheetWithoutDragIndicator,
            {
              backgroundColor: sheetBackgroundColor,
              maxHeight: sheetMaxHeight,
              marginHorizontal: horizontalMargin,
              paddingBottom:
                keyboardOffset > 0 ? 0 : sheetBottomInset,
            },
            containerStyle,
          ]}
        >
          {showDragIndicator ? (
            <View style={[styles.dragIndicator, dragIndicatorStyle]} />
          ) : null}
          {fitInSafeArea ? (
            <View style={styles.content}>{children}</View>
          ) : (
            children
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

export default AppBottomSheet;
