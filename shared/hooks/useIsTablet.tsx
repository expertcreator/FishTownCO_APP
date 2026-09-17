import * as Device from "expo-device";
import { useEffect, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";

export function useIsTablet(): boolean {
  const [isDeviceTablet, setIsDeviceTablet] = useState<boolean>(
    Device.deviceType === Device.DeviceType.TABLET
  );

  const { width, height } = useWindowDimensions();

  useEffect(() => {
    let isMounted = true;
    const ensureDeviceType = async () => {
      try {
        const type = await Device.getDeviceTypeAsync();
        if (!isMounted) {
          return;
        }
        setIsDeviceTablet(type === Device.DeviceType.TABLET);
      } catch {
        // ignore
      }
    };

    if (Device.deviceType == null) {
      ensureDeviceType();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const isPortrait = height >= width;

  return useMemo(
    () => isDeviceTablet && !isPortrait,
    [isDeviceTablet, isPortrait]
  );
}
