// Wallet color palette — distinguishable, terminal-friendly.
export const WALLET_PALETTE = [
  "#3FE0A0", // mint
  "#6B9EFF", // blue
  "#F5A623", // amber
  "#FF5A5F", // coral
  "#B57BFF", // violet
  "#42D4E8", // cyan
  "#FFD166", // yellow
  "#F277C6", // pink
  "#7ED321", // green
  "#FF8A3D", // orange
  "#9FA8DA", // indigo
  "#C5E1A5", // pale green
  "#80DEEA", // pale cyan
  "#E57373", // red
  "#CE93D8", // lilac
  "#FFAB91", // peach
  "#A1887F", // mocha
  "#90A4AE", // slate
  "#FFF176", // pastel yellow
  "#81D4FA", // sky
] as const;

export function pickColor(usedColors: string[]): string {
  const used = new Set(usedColors);
  for (const c of WALLET_PALETTE) if (!used.has(c)) return c;
  return WALLET_PALETTE[usedColors.length % WALLET_PALETTE.length];
}
