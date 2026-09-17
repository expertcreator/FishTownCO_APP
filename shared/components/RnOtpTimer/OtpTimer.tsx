import { fontSizes } from "@/shared/constants";
import colors from "@/shared/constants/colors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./OtpTimer.style";
import type { OtpTimerProps } from "./OtpTimer.type";

const OtpTimer: React.FC<OtpTimerProps> = ({
  minutes,
  seconds,
  onResend,
  autoStart = false,
  fontSize,
  fontFamily,
  textColor,
  labelFontSize,
  labelFontFamily,
  labelColor,
  labelText = "Resend OTP",
  disabled = false,
}) => {
  const [isTimerActive, setIsTimerActive] = useState(autoStart);
  const [remainingMinutes, setRemainingMinutes] = useState(minutes);
  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoStarted = useRef(false);

  const formattedTime = `${remainingMinutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;

  // Start countdown timer
  const startTimer = useCallback(() => {
    let min = minutes;
    let sec = seconds;

    setRemainingMinutes(min);
    setRemainingSeconds(sec);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      sec -= 1;

      if (min !== 0 && sec === -1) {
        sec = 59;
        min -= 1;
        setRemainingMinutes(min);
      }

      setRemainingSeconds(sec);

      if (min === 0 && sec <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsTimerActive(false);
        setRemainingMinutes(minutes);
        setRemainingSeconds(seconds);
      }
    }, 1000);
  }, [minutes, seconds]);

  // Cleanup timer on unmount
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
    []
  );

  // Auto-start timer on mount if autoStart is true
  useEffect(() => {
    if (autoStart && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startTimer();
    }
  }, [autoStart, startTimer]);

  const handleResendOtp = useCallback(async () => {
    if (isTimerActive || disabled) {
      return;
    }

    setIsTimerActive(true);
    startTimer();

    if (onResend) {
      try {
        await onResend();
      } catch {
        // parent handles error
      }
    }
  }, [isTimerActive, disabled, startTimer, onResend]);

  const isDisabled = disabled || isTimerActive;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        hitSlop={{ top: 5, bottom: 5, left: 50, right: 50 }}
        onPress={handleResendOtp}
        disabled={isDisabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          isTimerActive ? `Wait ${formattedTime} to resend` : labelText
        }
        accessibilityState={{ disabled: isDisabled }}
      >
        {isTimerActive ? (
          <Text
            style={[
              styles.timerText,
              {
                color: textColor ?? colors.primary,
                fontFamily,
                fontSize: fontSize ?? fontSizes.h6,
                fontWeight: "500",
              },
            ]}
          >
            {formattedTime}
          </Text>
        ) : (
          <Text
            style={[
              styles.labelText,
              {
                color: labelColor ?? colors.primary,
                fontFamily: labelFontFamily,
                fontSize: labelFontSize ?? fontSizes.h6,
                fontWeight: "500",
              },
            ]}
          >
            {labelText}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default OtpTimer;
