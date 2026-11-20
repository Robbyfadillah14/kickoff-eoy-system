// lib/presentation/hrExcel.js — baca file Excel HRD & MR (keterlambatan, ketidakhadiran, pelatihan, review multi-tahun).
// Murni fungsi (tanpa React/xlsx): terima matriks teks hasil matrixFrom() di excelImport.js. Dipakai form (preview) dan deck.
//
// Prinsip:
//  - jenis file dikenali dari JUDUL KOLOM, bukan nama file / urutan kolom
//  - angka tahunan DIHITUNG ULANG dari angka mentah per bulan (total ÷ total), bukan memakai kolom "Rata-Rata" Excel
//  - setiap hasil membawa jejak sumber (lembar, nomor baris) + penjelasan cara hitung, untuk popup rincian

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const txt = (v) => String(v ?? "").trim();
const isFilled = (r) => (r || []).some((c) => txt(c) !== "");

const MONTHS = {
  jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, mar: 3, maret: 3, march: 3,
  apr: 4, april: 4, mei: 5, may: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, agus: 8, agust: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, oct: 10, october: 10,
  nov: 11, november: 11, des: 12, desember: 12, dec: 12, december: 12,
};
export const MONTH_LABEL = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const monthOf = (s) => MONTHS[norm(s)] || 0;

/** target KPI HR (selaras dengan kpi.js) */
export const HR_TARGETS = {
  late: { value: 2, dir: "max", label: "≤ 2%" },
  absence: { value: 1, dir: "max", label: "≤ 1%" },
  training: { value: 100, dir: "min", label: "100%" },
};
const meets = (t, v) => (v == null ? null : t.dir === "max" ? v <= t.value : v >= t.value);

/* ------------------------------------------------------------------ angka */

/** "966" -> 966, "0,02%" -> 0.02, "1.250.000,5" -> 1250000.5 ; bukan angka -> null. Titik tunggal = desimal. */
export function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = txt(v);
  if (!s) return null;
  s = s.replace(/[%\s]/g, "");
  if (/^-?[1-9]\d{0,2}(\.\d{3}){2,}(,\d+)?$/.test(s) || /^-?[1-9]\d{0,2}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** nilai persen dalam satuan persen: "2%" -> 2 ; "0,02%" -> 0.02 ; pecahan 0.02 -> 2 ; 1 -> 100 ; 45 -> 45 */
export function pctVal(v) {
  const s = txt(v);
  if (!s) return null;
  const n = num(s);
  if (n == null) return null;
  if (/%/.test(s)) return n;
  return Math.abs(n) <= 1 ? n * 100 : n;
}

const money = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = txt(v);
  if (!s || !/\d/.test(s)) return null;
  const d = s.replace(/[^\d-]/g, "");
  return d ? Number(d) : null;
};

export const fmtInt = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const fmtPct = (n, d = 2) => (n == null || !Number.isFinite(n) ? "-" : n.toFixed(d).replace(".", ","));

/* ----------------------------------------------------------- tahun & tabel */

function detectYear(fileName, matrix, upTo, fallback) {
  const f = [...String(fileName || "").matchAll(/(?:19|20)\d{2}/g)].map((x) => Number(x[0]));
  if (f.length) return { year: f[f.length - 1], source: "nama file" };
  for (let i = 0; i < Math.min(upTo, matrix.length); i++) {
    for (const c of matrix[i] || []) {
      const t = txt(c);
      if (t && !/^\d+$/.test(t)) { const m = t.match(/\b(20\d{2})\b/); if (m) return { year: Number(m[1]), source: "judul lembar" }; }
    }
  }
  return { year: fallback || null, source: "tahun laporan" };
}

/** tabel bulanan: baris pertama berlabel bulan + >= 2 sel angka; header = maks. 2 baris tak-kosong tepat di atasnya */
function monthTable(m) {
  let first = -1, labCol = 0;
  for (let i = 0; i < m.length; i++) {
    const r = m[i] || [];
    const c = r.findIndex((x) => txt(x) !== "");
    if (c < 0) continue;
    if (monthOf(r[c]) && r.slice(c + 1).filter((x) => num(x) !== null).length >= 2) { first = i; labCol = c; break; }
  }
  if (first < 0) return null;
  const head = [];
  let up = first - 1, blanks = 0;
  while (up >= 0 && !isFilled(m[up]) && blanks < 2) { up--; blanks++; } // boleh ada 1–2 baris kosong antara header dan data
  for (let i = up; i >= 0 && head.length < 2; i--) { if (!isFilled(m[i])) break; head.unshift(i); }
  const width = Math.max(...m.slice(Math.max(0, first - 2)).map((r) => (r || []).length), 1);
  const names = Array.from({ length: width }, (_, c) => head.map((i) => txt((m[i] || [])[c])).filter(Boolean).join(" "));
  const rows = [], seen = new Set(), dup = [];
  for (let i = first; i < m.length; i++) {
    const mo = monthOf((m[i] || [])[labCol]);
    if (!mo) continue;
    if (seen.has(mo)) { dup.push(MONTH_LABEL[mo]); continue; }
    seen.add(mo);
    rows.push({ i, mo });
  }
  return { names, nn: names.map(norm), rows, labCol, headRow: head.length ? head[0] : first, dup };
}

const periodeOf = (months) => {
  if (!months.length) return "";
  const a = months[0].m, b = months[months.length - 1].m;
  return a === b ? MONTH_LABEL[a] : `${MONTH_LABEL[a]}–${MONTH_LABEL[b]}`;
};

function colFinders(nn) {
  const find = (fn) => nn.findIndex(fn);
  const hk = (n) => n.includes("harikerja");
  return {
    late: find((n) => n.includes("telat") || n.includes("terlambat")),
    emp: find((n) => n.includes("karyawan") && !n.includes("harikerjax")),
    days: find((n) => hk(n) && !/x/.test(n.replace("harikerja", ""))),
    den: find((n) => hk(n) && /x/.test(n.replace("harikerja", ""))),
    rate: find((n) => n.includes("ratarata") || n.includes("persen") || n === "%"),
    alpa: find((n) => n === "alpa" || n === "alfa" || n.includes("alpa")),
    cuti: find((n) => n.includes("cuti")),
    sakit: find((n) => n.includes("sakit")),
    izin: find((n) => n === "izin" || n.includes("izin")),
  };
}

/** nilai kolom Rata-Rata sebagai pecahan + toleransi pembulatan (teks "0.73%" hanya akurat sampai 2 desimal) */
function givenFraction(v) {
  const s = txt(v); const n = num(s);
  if (n == null) return null;
  if (!/%/.test(s)) return { v: n, tol: 1e-6 };
  const dec = ((s.match(/[.,](\d+)/) || [])[1] || "").length;
  return { v: n / 100, tol: (0.5 * 10 ** -dec) / 100 + 1e-9 };
}

function monthlyDataset(m, { fileName, defaultYear }) {
  const t = monthTable(m);
  if (!t) return null;
  const c = colFinders(t.nn);
  const isAbs = c.alpa >= 0 || c.sakit >= 0;
  const isLate = c.late >= 0 && !isAbs;
  if (!isAbs && !isLate) return null;

  const { year, source } = detectYear(fileName, m, t.headRow, defaultYear);
  const warnings = [];
  if (t.dup.length) warnings.push(`Bulan ganda dilewati (dipakai yang pertama): ${t.dup.join(", ")}.`);

  const months = [];
  for (const { i, mo } of t.rows) {
    const r = m[i] || [];
    const emp = c.emp >= 0 ? num(r[c.emp]) : null;
    const days = c.days >= 0 ? num(r[c.days]) : null;
    let den = c.den >= 0 ? num(r[c.den]) : null;
    if ((den == null || den === 0) && emp != null && days != null) den = emp * days;
    if (!den) continue; // bulan belum terisi
    const given = c.rate >= 0 ? givenFraction(r[c.rate]) : null;
    if (isLate) {
      const late = num(r[c.late]);
      if (late == null) continue;
      months.push({ m: mo, label: MONTH_LABEL[mo], late, emp, days, den, pct: (late / den) * 100, givenPct: given ? given.v * 100 : null, givenTolPct: given ? given.tol * 100 : 0, row: i + 1 });
    } else {
      const alpa = c.alpa >= 0 ? num(r[c.alpa]) || 0 : 0;
      const cuti = c.cuti >= 0 ? num(r[c.cuti]) || 0 : 0;
      const sakit = c.sakit >= 0 ? num(r[c.sakit]) || 0 : 0;
      const izin = c.izin >= 0 ? num(r[c.izin]) || 0 : 0;
      months.push({ m: mo, label: MONTH_LABEL[mo], alpa, cuti, sakit, izin, emp, days, den, given: given ? given.v : null, givenTol: given ? given.tol : 0, row: i + 1 });
    }
  }
  if (!months.length) return null;
  const base = { file: fileName, headerRow: t.headRow + 1, year, yearSource: source, months, periode: periodeOf(months), warnings };

  if (isLate) {
    const late = months.reduce((s, x) => s + x.late, 0);
    const den = months.reduce((s, x) => s + x.den, 0);
    const pct = (late / den) * 100;
    const bad = months.filter((x) => x.givenPct != null && Math.abs(x.givenPct - x.pct) > Math.max(0.05, x.givenTolPct + 0.001));
    if (bad.length) warnings.push(`Kolom Rata-Rata di Excel berbeda dari hitungan ulang pada: ${bad.map((x) => x.label).join(", ")}. Sistem memakai hitungan ulang.`);
    const status = meets(HR_TARGETS.late, pct);
    return {
      ...base, type: "LATE", late, den, pct, avgMonthly: months.reduce((s, x) => s + x.pct, 0) / months.length,
      best: [...months].sort((a, b) => a.pct - b.pct)[0], worst: [...months].sort((a, b) => b.pct - a.pct)[0],
      target: HR_TARGETS.late, met: status,
      explain: [
        "Keterlambatan = jumlah kejadian datang telat ÷ (jumlah karyawan × hari kerja).",
        `Total ${base.periode}: ${fmtInt(late)} ÷ ${fmtInt(den)} = ${fmtPct(pct)}%.`,
        `Target ${HR_TARGETS.late.label} → ${status ? "tercapai" : "belum tercapai"}.`,
      ],
    };
  }

  // ketidakhadiran: cari rumus yang dipakai Excel dari kolom Rata-Rata, supaya tidak menebak
  const FORMS = [
    { id: "alpa+sakit", label: "alpa + sakit", f: (x) => x.alpa + x.sakit, cuti: false },
    { id: "alpa+sakit+cuti", label: "alpa + sakit + cuti", f: (x) => x.alpa + x.sakit + x.cuti, cuti: true },
    { id: "alpa+sakit+izin", label: "alpa + sakit + izin", f: (x) => x.alpa + x.sakit + x.izin, cuti: false },
    { id: "alpa", label: "alpa saja", f: (x) => x.alpa, cuti: false },
    { id: "sakit", label: "sakit saja", f: (x) => x.sakit, cuti: false },
  ];
  const withGiven = months.filter((x) => x.given != null);
  let pick = null;
  if (withGiven.length >= 3) pick = FORMS.find((F) => withGiven.every((x) => Math.abs(F.f(x) / x.den - x.given) <= x.givenTol));
  const inferred = !!pick;
  if (!pick) {
    pick = FORMS[0];
    warnings.push(withGiven.length >= 3
      ? "Kolom Rata-Rata di Excel tidak cocok dengan rumus alpa + sakit maupun variasi lain. Sistem memakai alpa + sakit (cuti tidak dihitung) — mohon cocokkan dengan HRD."
      : "Kolom Rata-Rata tidak ditemukan, rumus tidak bisa dicocokkan. Sistem memakai alpa + sakit (cuti tidak dihitung).");
  }
  for (const x of months) { x.count = pick.f(x); x.pct = (x.count / x.den) * 100; }
  const count = months.reduce((s, x) => s + x.count, 0);
  const den = months.reduce((s, x) => s + x.den, 0);
  const pct = (count / den) * 100;
  const sum = (k) => months.reduce((s, x) => s + (x[k] || 0), 0);
  const pctInclCuti = ((sum("alpa") + sum("sakit") + sum("cuti")) / den) * 100;
  const status = meets(HR_TARGETS.absence, pct);
  return {
    ...base, type: "ABSENCE", count, den, pct, alpa: sum("alpa"), cuti: sum("cuti"), sakit: sum("sakit"), pctInclCuti,
    formula: { id: pick.id, label: pick.label, inferred, countsCuti: pick.cuti },
    best: [...months].sort((a, b) => a.pct - b.pct)[0], worst: [...months].sort((a, b) => b.pct - a.pct)[0],
    target: HR_TARGETS.absence, met: status,
    explain: [
      `Ketidakhadiran = (${pick.label}) ÷ (jumlah karyawan × hari kerja).${inferred ? " Rumus ini dibaca dari kolom Rata-Rata di Excel Anda." : ""}`,
      `Total ${base.periode}: ${fmtInt(count)} ÷ ${fmtInt(den)} = ${fmtPct(pct)}%.`,
      pick.cuti ? "Cuti ikut dihitung." : `Cuti (${fmtInt(sum("cuti"))} hari) tidak dihitung. Jika cuti ikut dihitung: ${fmtPct(pctInclCuti)}%.`,
      `Target ${HR_TARGETS.absence.label} → ${status ? "tercapai" : "belum tercapai"}.`,
    ],
  };
}

/* --------------------------------------------------------------- pelatihan */

function trainingDataset(m, { fileName, defaultYear }) {
  let h = -1, plan = -1, act = -1;
  for (let i = 0; i < Math.min(m.length, 40); i++) {
    const cells = (m[i] || []).map(norm);
    const p = cells.findIndex((x) => x.includes("rencana"));
    const a = cells.findIndex((x, k) => k !== p && (x.includes("actual") || x.includes("aktual") || x.includes("realisasi")));
    if (p >= 0 && a >= 0) { h = i; plan = p; act = a; break; }
  }
  if (h < 0) return null;
  const hdr = (m[h] || []).map(norm);
  let nameCol = hdr.findIndex((x, k) => k !== plan && k !== act && (x.includes("jenis") || x.includes("pelatihan") || x.includes("training")));
  if (nameCol < 0) nameCol = Math.max(0, plan - 1);
  const items = []; let totalRow = null;
  for (let i = h + 1; i < m.length; i++) {
    const r = m[i] || [];
    const name = txt(r[nameCol]);
    if (!name) continue;
    const p = num(r[plan]), a = num(r[act]);
    if (norm(name).startsWith("total")) { totalRow = { plan: p, actual: a }; continue; }
    if (p == null && a == null) continue;
    items.push({ name, plan: p ?? 0, actual: a ?? 0, pct: p > 0 ? ((a ?? 0) / p) * 100 : null, row: i + 1 });
  }
  if (!items.length) return null;
  const sumPlan = items.reduce((s, x) => s + x.plan, 0), sumAct = items.reduce((s, x) => s + x.actual, 0);
  const warnings = [];
  if (totalRow && ((totalRow.plan != null && totalRow.plan !== sumPlan) || (totalRow.actual != null && totalRow.actual !== sumAct))) {
    warnings.push(`Baris Total di Excel (${totalRow.actual ?? "?"}/${totalRow.plan ?? "?"}) tidak sama dengan jumlah barisnya (${sumAct}/${sumPlan}). Sistem memakai jumlah baris.`);
  }
  const { year, source } = detectYear(fileName, m, h, defaultYear);
  const pct = sumPlan > 0 ? (sumAct / sumPlan) * 100 : null;
  const status = meets(HR_TARGETS.training, pct);
  return {
    type: "TRAINING", file: fileName, headerRow: h + 1, year, yearSource: source, items, plan: sumPlan, actual: sumAct, pct,
    target: HR_TARGETS.training, met: status, warnings,
    explain: [
      "Pelatihan = pelatihan terlaksana (actual) ÷ pelatihan yang direncanakan, semua jenis digabung.",
      `${year || ""}: ${fmtInt(sumAct)} ÷ ${fmtInt(sumPlan)} = ${fmtPct(pct, 1)}%.`,
      `Target ${HR_TARGETS.training.label} → ${status ? "tercapai" : "belum tercapai"}.`,
    ],
  };
}

/* ------------------------------------------------- review multi-tahun (Riview) */

function historyDataset(m, { fileName }) {
  let h = -1, yearCols = [];
  for (let i = 0; i < Math.min(m.length, 40); i++) {
    const yc = (m[i] || []).map((x, c) => ({ c, y: /^(19|20)\d{2}$/.test(txt(x)) ? Number(txt(x)) : 0 })).filter((o) => o.y);
    if (yc.length >= 3) { h = i; yearCols = yc; break; }
  }
  if (h < 0) return null;
  const hdr = (m[h] || []).map(norm);
  const targetCol = hdr.findIndex((x) => x === "target");
  let labCol = hdr.findIndex((x) => x.includes("keterangan"));
  if (labCol < 0) labCol = 0;
  const kindOf = (n) => (n.includes("denda") ? "denda" : n.includes("pelatihan") || n.includes("training") ? "training" : n.includes("telat") || n.includes("terlambat") ? "late" : n.includes("hadir") || n.includes("absen") ? "absence" : "");
  const warnings = [], metrics = [];
  for (let i = h + 1; i < m.length; i++) {
    const r = m[i] || [];
    const label = txt(r[labCol]);
    if (!label) continue;
    const key = kindOf(norm(label)) || `x:${norm(label)}`;
    const conv = key === "denda" ? money : key.startsWith("x:") ? num : pctVal;
    const values = {};
    for (const { c, y } of yearCols) { const v = conv(r[c]); values[y] = v == null ? null : v; }
    if (Object.values(values).every((v) => v == null)) continue;
    const target = targetCol >= 0 && key !== "denda" ? (key.startsWith("x:") ? num(r[targetCol]) : pctVal(r[targetCol])) : null;
    metrics.push({ key, label, target, values, row: i + 1 });
  }
  if (!metrics.length) return null;
  const years = yearCols.map((o) => o.y);
  for (const mt of metrics) {
    if (mt.key !== "late" && mt.key !== "absence") continue;
    const ys = years.filter((y) => mt.values[y] != null);
    const jumps = [];
    for (let k = 1; k < ys.length; k++) { const a = mt.values[ys[k - 1]], b = mt.values[ys[k]]; if (a > 0 && b > 0 && (b / a >= 10 || a / b >= 10)) jumps.push(`${ys[k - 1]}→${ys[k]}`); }
    if (jumps.length) warnings.push(`${mt.label}: nilainya melompat ≥10× antar tahun (${jumps.join(", ")}). Kemungkinan cara hitung berubah — bandingkan antar tahun dengan hati-hati.`);
    if (mt.target != null) {
      const same = ys.filter((y) => Math.abs(mt.values[y] - mt.target) < 1e-9);
      if (same.length >= 3) warnings.push(`${mt.label}: nilai ${same.join(", ")} sama persis dengan target (${fmtPct(mt.target, 0)}%). Kemungkinan itu angka target yang tertulis, bukan realisasi — cek dengan data bulanan.`);
    }
  }
  return { type: "HISTORY", file: fileName, headerRow: h + 1, years, metrics, warnings, explain: ["Rekap beberapa tahun dibaca apa adanya dari file. Persen disamakan satuannya (0,02 → 2%; '0,02%' → 0,02%)."] };
}

/* ------------------------------------------------------------------- pintu */

/**
 * @param sheets [{ name, matrix }]  (matriks teks dari matrixFrom)
 * @returns daftar dataset yang dikenali (satu lembar bisa menghasilkan paling banyak satu)
 */
export function parseHrSheets(sheets, { fileName = "", defaultYear = null } = {}) {
  const out = [];
  for (const sh of sheets || []) {
    const m = (sh.matrix || []).map((r) => (Array.isArray(r) ? r : []));
    const opts = { fileName, defaultYear };
    const ds = historyDataset(m, opts) || trainingDataset(m, opts) || monthlyDataset(m, opts);
    if (ds) out.push({ ...ds, sheet: sh.name });
  }
  return out;
}

/** hasil per jenis disimpan di form.hrData: { late, absence, training, history } — jenis yang sama ditimpa */
const SLOT = { LATE: "late", ABSENCE: "absence", TRAINING: "training", HISTORY: "history" };
export function mergeHrData(prev, datasets) {
  const next = { ...(prev || {}) };
  for (const ds of datasets || []) if (SLOT[ds.type]) next[SLOT[ds.type]] = { ...ds, importedAt: new Date().toISOString() };
  return next;
}

/** kolom teks KPI yang sudah dikenal kpi.js — diisi dari data hasil hitung ("Realisasi 1,69% (...)") */
export function hrFieldsFrom(hr) {
  const f = {};
  if (hr?.late) f.lateRate = `Realisasi ${fmtPct(hr.late.pct)}% (${fmtInt(hr.late.late)} kejadian telat dari ${fmtInt(hr.late.den)} hari-orang, ${hr.late.periode}${hr.late.year ? " " + hr.late.year : ""})`;
  if (hr?.absence) f.absenteeismRate = `Realisasi ${fmtPct(hr.absence.pct)}% (${fmtInt(hr.absence.count)} hari ${hr.absence.formula.label} dari ${fmtInt(hr.absence.den)} hari-orang, ${hr.absence.periode}${hr.absence.year ? " " + hr.absence.year : ""}${hr.absence.formula.countsCuti ? "" : "; cuti tidak dihitung"})`;
  if (hr?.training) f.trainingAch = `Realisasi ${fmtPct(hr.training.pct, 0)}% (${fmtInt(hr.training.actual)} dari ${fmtInt(hr.training.plan)} pelatihan terprogram terlaksana)`;
  return f;
}

/** selisih jumlah karyawan / hari kerja antara file keterlambatan dan ketidakhadiran tahun yang sama */
export function crossCheck(hr) {
  const a = hr?.late, b = hr?.absence;
  if (!a || !b) return [];
  const bm = new Map(b.months.map((x) => [x.m, x]));
  const out = [];
  for (const x of a.months) {
    const y = bm.get(x.m);
    if (!y) continue;
    if (x.emp != null && y.emp != null && x.emp !== y.emp) out.push(`${x.label}: jumlah karyawan ${x.emp} (keterlambatan) vs ${y.emp} (ketidakhadiran)`);
    if (x.days != null && y.days != null && x.days !== y.days) out.push(`${x.label}: hari kerja ${x.days} (keterlambatan) vs ${y.days} (ketidakhadiran)`);
  }
  return out;
}