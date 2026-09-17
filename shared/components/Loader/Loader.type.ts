export type LoaderProps = {
  visible: boolean;
  mode?: "fullscreen" | "inline"; // Fullscreen overlay or inline in component
  size?: "small" | "large"; // Spinner size
  color?: string;
  backgroundColor?: string; // Overlay background color (fullscreen only)
  blur?: boolean; // Whether to blur background (fullscreen only)
  blurIntensity?: number; // Blur intensity (0-100)
};
