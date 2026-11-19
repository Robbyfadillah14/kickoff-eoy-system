/** Brand Ekasurya Group — RUN • GROW • TRANSFORM (dari Branding.jsx) */
export const BRAND = {
  name: "Ekasurya Group",
  tagline: "RUN • GROW • TRANSFORM",
  cyan: "#06b6d4",
  emerald: "#10b981",
  bg: "#090d16",
  panel: "rgba(255,255,255,0.045)",
  line: "rgba(255,255,255,0.09)",
  text: "#e8edf5",
  muted: "#8b97ab",
  warn: "#f59e0b",
  bad: "#f43f5e",
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