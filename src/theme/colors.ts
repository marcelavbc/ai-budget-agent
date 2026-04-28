/**
 * Canonical brand palette. Keep CSS custom properties in `src/app/globals.css` in sync.
 */
export const theme = {
  colors: {
    background: "#F4F1EC",
    beigeLight: "#E6D6C3",
    beigeMedium: "#D8C4AC",
    greenLight: "#A6A892",
    greenDark: "#5E6654",
    terracotta: "#C97A5A",
    goldLight: "#E6C27A",
    goldMedium: "#D4A85C",
    goldDark: "#A67C2E",
    black: "#111111",
    blackSoft: "#3A3A3A",

    statusDraft: "#6B6B6B",
    statusDraftBg: "#F2F2F0",
    statusSent: "#3D6B52",
    statusSentBg: "#EBF3EE",
    statusApproved: "#8A6A1A",
    statusApprovedBg: "#FBF4E4",
  },
} as const;

export type ThemeColors = typeof theme.colors;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "");
  const expanded =
    raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (expanded.length !== 6) {
    return { r: 17, g: 17, b: 17 };
  }
  const n = Number.parseInt(expanded, 16);
  if (!Number.isFinite(n)) {
    return { r: 17, g: 17, b: 17 };
  }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
