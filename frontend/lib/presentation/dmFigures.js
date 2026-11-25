/**
 * Angka utama Digital Marketing (isian per tahun, disimpan datar di metricsJson laporan DIG_MKT).
 * Dipakai bersama oleh form (app/report/DmFigures.jsx) dan slide (components/presentation/DmSlides.jsx).
 */

export const DM_YEARS = [2024, 2025, 2026];

/** kind: count (bilangan bulat, "12.345" = dua belas ribu), rp (rupiah penuh), dec (desimal, koma/titik), pct (persen) */
export const DM_GROUPS = [
  {
    id: "gsc", title: "Google Search Console (website)", short: "Website", color: "#06b6d4", icon: "chart", periodKey: "dmGscPeriod", headline: "dmGscClicks",
    where: "Google Search Console → Performa → Hasil penelusuran, pilih rentang tanggal setahun penuh, lalu salin 4 kartu di bagian atas.",
    fields: [
      { key: "dmGscClicks", label: "Total klik", kind: "count", hint: "12345" },
      { key: "dmGscImpr", label: "Total tayangan iklan", kind: "count", hint: "456789" },
      { key: "dmGscCtr", label: "CTR rata-rata (%)", kind: "pct", hint: "2,7" },
      { key: "dmGscPos", label: "Posisi rata-rata", kind: "dec", hint: "14,2", lowerBetter: true },
    ],
  },
  {
    id: "leads", title: "Leads WhatsApp (dari web / sosial media)", short: "Leads WA", color: "#10b981", icon: "users", periodKey: "dmLeadsPeriod", headline: "dmLeadsTotal",
    where: "Rekap leads WhatsApp yang masuk dari website dan sosial media (jumlah customer baru unik per tahun).",
    fields: [
      { key: "dmLeadsTotal", label: "Total customer", kind: "count", hint: "540" },
      { key: "dmLeadsAvg", label: "Rata-rata customer baru per bulan", kind: "dec", hint: "45" },
    ],
  },
  {
    id: "social", title: "Insight Instagram PT. Ekasurya Inout Indonesia", short: "Instagram", color: "#f472b6", icon: "bolt", periodKey: "dmSmPeriod", headline: "dmSmReach",
    where: "Instagram → Insights (atau Meta Business Suite) akun resmi perusahaan, rentang tanggal setahun penuh.",
    fields: [
      { key: "dmSmReach", label: "Reach", kind: "count", hint: "250000" },
      { key: "dmSmImprFol", label: "Impression followers", kind: "count", hint: "80000" },
      { key: "dmSmImprNon", label: "Impression non-followers", kind: "count", hint: "320000" },
      { key: "dmSmFolActive", label: "Followers aktif", kind: "count", hint: "3200" },
      { key: "dmSmFolInactive", label: "Followers tidak aktif", kind: "count", hint: "1800" },
    ],
  },
  {
    id: "tiktok", title: "Insight TikTok PT. Ekasurya Inout Indonesia", short: "TikTok", color: "#a78bfa", icon: "star", periodKey: "dmTtPeriod", headline: "dmTtViews",
    where: "TikTok Studio / TikTok Analytics akun bisnis → Overview, rentang tanggal setahun penuh.",
    fields: [
      { key: "dmTtViews", label: "Video views", kind: "count", hint: "500000" },
      { key: "dmTtReach", label: "Penonton unik (reach)", kind: "count", hint: "120000" },
      { key: "dmTtProfile", label: "Profile views", kind: "count", hint: "8000" },
      { key: "dmTtLikes", label: "Likes", kind: "count", hint: "30000" },
      { key: "dmTtFollowers", label: "Total followers", kind: "count", hint: "2500" },
    ],
  },
  {
    id: "ecom", title: "Selling out e-commerce", short: "E-commerce", color: "#f59e0b", icon: "box", periodKey: "dmEcomPeriod", headline: "dmEcomOmset",
    where: "Rekap penjualan marketplace / toko online perusahaan (dashboard seller center), jumlah penjualan tiap kuartal (Q1–Q4) serta omset dan profit setahun.",
    quarters: ["dmEcomQ1", "dmEcomQ2", "dmEcomQ3", "dmEcomQ4"],
    fields: [
      { key: "dmEcomQ1", label: "Total penjualan Q1", kind: "count", hint: "1200" },
      { key: "dmEcomQ2", label: "Total penjualan Q2", kind: "count", hint: "1400" },
      { key: "dmEcomQ3", label: "Total penjualan Q3", kind: "count", hint: "1600" },
      { key: "dmEcomQ4", label: "Total penjualan Q4", kind: "count", hint: "1900" },
      { key: "dmEcomOmset", label: "Omset (Rp)", kind: "rp", hint: "850000000" },
      { key: "dmEcomProfit", label: "Profit (Rp)", kind: "rp", hint: "120000000" },
    ],
  },
];

export const DM_ALL_FIELDS = DM_GROUPS.flatMap((g) => g.fields);

/** angka dari ketikan staf; null bila kosong / bukan angka */
export function dmNum(v, kind = "dec") {
  if (v === undefined || v === null) return null;
  let s = String(v).trim().replace(/^rp\.?\s*/i, "").replace(/%/g, "").replace(/\s+/g, "");
  if (!s) return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); // 1.234.567 / 1.234,5
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");              // 1,234,567
  else if ((kind === "count" || kind === "rp") && /^-?\d{1,3}\.\d{3}$/.test(s)) s = s.replace(".", "");       // 12.345 pada bilangan bulat
  else s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export const dmFmt = (v, d = 0) => (v == null ? "—" : v.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }));
export const dmRp = (v, full) => {
  if (v == null) return "—";
  const a = Math.abs(v), sg = v < 0 ? "−" : "";
  if (full || a < 1e6) return `${sg}Rp ${dmFmt(a, 0)}`;
  return a >= 1e9 ? `${sg}Rp ${dmFmt(a / 1e9, 2)} M` : `${sg}Rp ${dmFmt(a / 1e6, 1)} Jt`;
};
export const dmFmtField = (f, v, full) => (v == null ? "—" : f.kind === "rp" ? dmRp(v, full) : f.kind === "count" ? dmFmt(v, 0) : f.kind === "pct" ? `${dmFmt(v, 2)}%` : dmFmt(v, Number.isInteger(v) ? 0 : 1));

/** { [tahun]: { [key]: angka|null, periods:{gsc,leads,social,tiktok,ecom}, any } } dari data buildClusterData */
export function dmSnapshot(data) {
  const out = {};
  for (const y of DM_YEARS) {
    const yy = data?.years?.[y];
    const m = yy?.byDept?.DIG_MKT?.metrics || yy?.metrics || {};
    const row = { periods: {}, any: false };
    for (const f of DM_ALL_FIELDS) { const n = dmNum(m[f.key], f.kind); row[f.key] = n; if (n != null) row.any = true; }
    for (const g of DM_GROUPS) { const p = m[g.periodKey]; row.periods[g.id] = p && String(p).trim() ? String(p).trim() : ""; }
    out[y] = row;
  }
  return out;
}

/** peringatan kewajaran data satu tahun & satu kelompok */
export function dmWarnings(group, r) {
  const w = [];
  if (group.id === "gsc") {
    const { dmGscClicks: c, dmGscImpr: i, dmGscCtr: ctr, dmGscPos: pos } = r;
    if (c != null && i != null && i > 0) {
      if (c > i) w.push("Total klik lebih besar dari total tayangan — mungkin tertukar.");
      else if (ctr != null && Math.abs((c / i) * 100 - ctr) > 0.3) w.push(`CTR yang diisi ${dmFmt(ctr, 2)}% tidak sama dengan klik ÷ tayangan (${dmFmt((c / i) * 100, 2)}%). Pastikan keduanya dari periode yang sama.`);
    }
    if (pos != null && (pos < 1 || pos > 100)) w.push("Posisi rata-rata biasanya antara 1 dan 100 — cek lagi angkanya.");
    if (ctr != null && (ctr < 0 || ctr > 100)) w.push("CTR harus antara 0 dan 100%.");
  }
  if (group.id === "leads") {
    const { dmLeadsTotal: t, dmLeadsAvg: a } = r;
    if (t != null && a != null && t > 0 && Math.abs(t / 12 - a) / (t / 12) > 0.15) w.push(`Total ${dmFmt(t)} ÷ 12 bulan = ${dmFmt(t / 12, 1)}, berbeda dari rata-rata yang diisi (${dmFmt(a, 1)}). Wajar bila tahun berjalan belum 12 bulan.`);
  }
  if (group.id === "social") {
    const { dmSmReach: re, dmSmImprFol: f, dmSmImprNon: n } = r;
    const { dmSmFolActive: fa, dmSmFolInactive: fi } = r;
    if (fa != null && fi != null && fa + fi === 0) w.push("Followers aktif dan tidak aktif sama-sama 0 — cek lagi angkanya.");
    if (re != null && f != null && n != null && re > f + n) w.push("Reach lebih besar dari total impression — impression seharusnya selalu ≥ reach. Cek angkanya.");
  }
  if (group.id === "tiktok") {
    const { dmTtViews: v, dmTtReach: re, dmTtLikes: l } = r;
    if (v != null && re != null && re > v) w.push("Penonton unik (reach) lebih besar dari video views — biasanya sebaliknya. Cek angkanya.");
    if (v != null && l != null && l > v) w.push("Likes lebih besar dari video views — cek lagi angkanya.");
  }
  if (group.id === "ecom") {
    const { dmEcomOmset: o, dmEcomProfit: p, dmEcomQ1: q1, dmEcomQ4: q4 } = r;
    const qs = [r.dmEcomQ1, r.dmEcomQ2, r.dmEcomQ3, r.dmEcomQ4].filter((x) => x != null);
    if (qs.some((x) => x < 0)) w.push("Penjualan per kuartal tidak boleh negatif.");
    if (qs.length >= 2 && Math.max(...qs) / Math.max(Math.min(...qs), 1) > 10) w.push("Ada kuartal yang lebih dari 10× kuartal lain — pastikan satuannya sama (unit/order) di semua kuartal.");
    if (o != null && p != null && p > o) w.push("Profit lebih besar dari omset — kemungkinan tertukar atau salah nol.");
    if (o != null && o < 0) w.push("Omset tidak boleh negatif.");
    if (q1 != null && q4 != null && q1 > 0 && q4 / q1 > 10) w.push("Penjualan Q4 lebih dari 10× Q1 — pastikan satuannya sama (unit/order) di kedua kuartal.");
  }
  return w;
}

/** kuartal terisi untuk satu tahun: [{q:1..4, v}] */
export const dmQuarters = (r) => [1, 2, 3, 4].map((q) => ({ q, v: r[`dmEcomQ${q}`] })).filter((x) => x.v != null);