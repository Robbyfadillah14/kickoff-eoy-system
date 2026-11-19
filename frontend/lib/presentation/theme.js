/** Brand Ekasurya Group — RUN • GROW • TRANSFORM (dari Branding.jsx) */
export const BRAND = {
  name: "Ekasurya Group",
  tagline: "RUN • GROW • TRANSFORM",
  cyan: "#06b6d4",
  emerald: "#10b981",
  // warna yang berubah menurut tema (terang/gelap) -> CSS variable dengan fallback tema gelap
  bg: "var(--dk-bg, #090d16)",
  panel: "var(--dk-panel, rgba(255,255,255,0.045))",
  line: "var(--dk-line, rgba(255,255,255,0.09))",
  track: "var(--dk-track, rgba(255,255,255,0.09))",
  text: "var(--dk-text, #e8edf5)",
  muted: "var(--dk-muted, #8b97ab)",
  warn: "#f59e0b",
  bad: "#f43f5e",
};

/** Tema deck. Dipasang sebagai CSS variable di cangkang presentasi (layar & cetak). */
export const THEMES = {
  dark: {
    label: "Gelap", bg: "#090d16", panel: "rgba(255,255,255,0.045)", line: "rgba(255,255,255,0.09)", track: "rgba(255,255,255,0.09)",
    text: "#e8edf5", muted: "#8b97ab",
    cardA: "rgba(255,255,255,0.075)", cardB: "rgba(255,255,255,0.025)", shadow: "0 18px 40px -22px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.06)",
    dot: "rgba(255,255,255,.05)", glow: 0.2, onAccent: "#04141a", ghost: "rgba(255,255,255,.07)",
  },
  light: {
    label: "Terang", bg: "#eef2f8", panel: "#ffffff", line: "rgba(15,23,42,0.10)", track: "rgba(15,23,42,0.08)",
    text: "#0f172a", muted: "#5b6b82",
    cardA: "#ffffff", cardB: "#ffffff", shadow: "0 14px 34px -18px rgba(15,23,42,.28), 0 1px 0 rgba(15,23,42,.04)",
    dot: "rgba(15,23,42,.05)", glow: 0.1, onAccent: "#ffffff", ghost: "rgba(15,23,42,.07)",
  },
};
export const themeVars = (name = "light") => {
  const t = THEMES[name] || THEMES.light;
  return { "--dk-bg": t.bg, "--dk-panel": t.panel, "--dk-line": t.line, "--dk-track": t.track, "--dk-text": t.text, "--dk-muted": t.muted,
    "--dk-card-a": t.cardA, "--dk-card-b": t.cardB, "--dk-shadow": t.shadow, "--dk-dot": t.dot, "--dk-on-accent": t.onAccent, "--dk-ghost": t.ghost };
};

/** satu warna per fase, dipakai konsisten di semua deck */
export const PHASE_COLOR = {
  Run: "#06b6d4",
  Grow: "#10b981",
  Transform: "#a78bfa",
  Future: "#f59e0b",
};
const norm = (p) => { const x = String(p ?? "").toLowerCase(); return x ? x[0].toUpperCase() + x.slice(1) : ""; };
export const phaseColor = (phase) => PHASE_COLOR[norm(phase)] || BRAND.cyan;

/** status capaian -> warna (pengganti pill "Optimal" yang hardcoded) */
export function statusOf(pct) {
  if (pct == null || Number.isNaN(pct)) return { key: "none", label: "Belum ada data", color: BRAND.muted };
  if (pct >= 100) return { key: "over", label: "Melampaui target", color: BRAND.emerald };
  if (pct >= 95) return { key: "ok", label: "On track", color: BRAND.cyan };
  if (pct >= 85) return { key: "watch", label: "Perlu perhatian", color: BRAND.warn };
  return { key: "risk", label: "Di bawah target", color: BRAND.bad };
}