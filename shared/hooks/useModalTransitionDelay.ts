import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

export const MODAL_TRANSITION_DELAY_MS = 300;

export const useModalTransitionDelay = (
  delayMs = MODAL_TRANSITION_DELAY_MS
) => {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current) {
        clearTimeout(timer);
      }
      timersRef.current = [];
    },
    []
  );

  return useCallback(
    (callback: () => void) => {
      if (Platform.OS !== "ios") {
        callback();
        return;
      }

      const timer = setTimeout(() => {
        callback();
        timersRef.current = timersRef.current.filter((item) => item !== timer);
      }, delayMs);

      timersRef.current.push(timer);
    },
    [delayMs]
  );
};
