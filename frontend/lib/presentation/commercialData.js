import { toNum, toPct, isEmptyValue } from "./numbers.js";

const txt = (v) => (isEmptyValue(v) ? null : String(v).trim());
const numOnly = (v) => (/^-?[\d.,\s]+$/.test(String(v ?? "").trim()) && /\d/.test(String(v)) ? v : "");

/** produk dari semua baris sales, digabung per nama. lalu = laluVal|totalQty ; berjalan = jalanVal|actualVal|category (hanya bila angka) */
export function productsOf(metrics = {}) {
  const perf = Array.isArray(metrics.salesPerformances) ? metrics.salesPerformances : [];
  const map = new Map();
  for (const sp of perf) for (const p of Array.isArray(sp?.topProducts) ? sp.topProducts : []) {
    const name = txt(p?.productName); if (!name) continue;
    const lalu = toNum(p.laluVal ?? p.totalQty);
    const jalan = toNum(!isEmptyValue(p.jalanVal) ? p.jalanVal : !isEmptyValue(p.actualVal) ? p.actualVal : numOnly(p.category));
    if (!lalu && !jalan) continue;
    const k = name.toLowerCase(); const cur = map.get(k) || { name, lalu: 0, jalan: 0 };
    cur.lalu += lalu; cur.jalan += jalan; map.set(k, cur);
  }
  return [...map.values()].map((r) => ({ ...r, growth: r.lalu > 0 ? ((r.jalan - r.lalu) / r.lalu) * 100 : null })).sort((a, b) => b.jalan - a.jalan);
}

/** capaian tahun itu: dari salesPerformances (sum aktual / sum target) bila ada, kalau tidak dari targetAchievedPct */
export function achievementOf(metrics = {}) {
  const perf = Array.isArray(metrics.salesPerformances) ? metrics.salesPerformances : [];
  let t = 0, a = 0;
  for (const p of perf) { t += toNum(p.targetVal); a += toNum(p.actualVal); }
  if (t > 0) return (a / t) * 100;
  const raw = metrics.targetAchievedPct;
  if (raw === undefined || raw === null || raw === "") return null;
  return toPct(raw);
}