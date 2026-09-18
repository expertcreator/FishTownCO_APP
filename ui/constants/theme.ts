/**
 * Fishtownco color tokens. Light values match https://fishtownco.itoasis.co/.
 * `navy` is primary text. `inverse` is the filled chip/badge color.
 */
export type ThemeColors = {
  background: string;
  navy: string;
  teal: string;
  orange: string;
  white: string;
  muted: string;
  card: string;
  cardSoft: string;
  dotInactive: string;
  border: string;
  inputBorder: string;
  softTeal: string;
  softOrange: string;
  inverse: string;
  onInverse: string;
  tabInactive: string;
  chipIdle: string;
  attentionBorder: string;
  statusOkBg: string;
  statusOkText: string;
  statusDueBg: string;
  statusDueText: string;
  statusOverdueBg: string;
  statusOverdueText: string;
  statusInfoBg: string;
  statusInfoText: string;
};

export const lightColors: ThemeColors = {
  background: "#F3EBDD",
  navy: "#0D2C41",
  teal: "#217F81",
  orange: "#F36424",
  white: "#FFFFFF",
  muted: "#5B7083",
  card: "#FFFFFF",
  cardSoft: "#E8EEF2",
  dotInactive: "#D5D8DE",
  border: "#D8DEE6",
  inputBorder: "#D5DCE5",
  softTeal: "#E2F1F8",
  softOrange: "#FFE8DC",
  inverse: "#0D2C41",
  onInverse: "#FFFFFF",
  tabInactive: "#8A93A3",
  chipIdle: "#EFE8DC",
  attentionBorder: "#F7C7AE",
  statusOkBg: "#E4F5EC",
  statusOkText: "#1F7A4D",
  statusDueBg: "#FFF4E0",
  statusDueText: "#B45309",
  statusOverdueBg: "#FDECEC",
  statusOverdueText: "#B91C1C",
  statusInfoBg: "#E2F1F8",
  statusInfoText: "#0F5F73",
};

export const darkColors: ThemeColors = {
  background: "#071820",
  navy: "#F3EBDD",
  teal: "#3AABB0",
  orange: "#F36424",
  white: "#FFFFFF",
  muted: "#A8B7C4",
  card: "#122C3D",
  cardSoft: "#1A3848",
  dotInactive: "#3D5160",
  border: "#2C4656",
  inputBorder: "#3A5566",
  softTeal: "#163848",
  softOrange: "#3A2A22",
  inverse: "#F3EBDD",
  onInverse: "#0D2C41",
  tabInactive: "#8AA0B0",
  chipIdle: "#1A3848",
  attentionBorder: "#6B3A28",
  statusOkBg: "#143528",
  statusOkText: "#7DCEA0",
  statusDueBg: "#3A2E14",
  statusDueText: "#F5C16C",
  statusOverdueBg: "#3A1818",
  statusOverdueText: "#F0A0A0",
  statusInfoBg: "#163848",
  statusInfoText: "#8ECAE0",
};

/**
 * Returns the palette for the active scheme.
 * @param isDark - Whether dark mode is active
 * @returns Light or dark color tokens
 */
export function getThemeColors(isDark: boolean): ThemeColors {
  return isDark ? darkColors : lightColors;
}
