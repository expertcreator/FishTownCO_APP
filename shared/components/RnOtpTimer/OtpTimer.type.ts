export type OtpTimerProps = {
  minutes: number;
  seconds: number;
  onResend?: () => void | Promise<void>;
  autoStart?: boolean; // Start timer automatically on mount
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  labelFontSize?: number;
  labelFontFamily?: string;
  labelColor?: string;
  labelText?: string;
  disabled?: boolean;
};
