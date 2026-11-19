import { toNum } from "./numbers.js";

/**
 * Parser tabel target–aktual berbasis HEADER (bukan urutan kolom) + deteksi tahun per baris.
 * Murni fungsi: terima baris hasil XLSX.utils.sheet_to_json(sheet, {defval:""}), tidak butuh pustaka xlsx.
 * Dipakai di frontend (preview sebelum disimpan) dan bisa dipakai ulang di backend.
 */
const SYN = {
  year:   ["tahun", "year", "thn", "periode", "period"],
  target: ["target", "plan", "rencana", "budget", "anggaran"],
  actual: ["aktual", "actual", "realisasi", "capaian", "pencapaian", "hasil", "achievement", "omzet", "profit"],
  name:   ["nama", "name", "item", "produk", "product", "campaign", "metrik", "metric", "sales", "person", "petugas", "uraian", "deskripsi", "description", "kpi", "bulan"],
  note:   ["keterangan", "catatan", "note", "notes", "remark", "remarks", "remaks", "status", "kendala"],
};
const ORDER = ["year", "target", "actual", "name", "note"];
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const cell = (v) => (v === null || v === undefined ? "" : String(v).trim());

function score(header, syns) {
  const h = norm(header); let best = 0;
  for (const s of syns) { if (h === s) best = Math.max(best, 3); else if (h.startsWith(s)) best = Math.max(best, 2); else if (h.includes(s)) best = Math.max(best, 1); }
  return best;
}

export function mapColumns(headers) {
  const taken = new Set(); const mapping = {};
  for (const f of ORDER) {
    let pick = null, top = 0;
    for (const h of headers) { if (taken.has(h)) continue; const sc = score(h, SYN[f]); if (sc > top) { top = sc; pick = h; } }
    mapping[f] = pick; if (pick) taken.add(pick);
  }
  return mapping;
}

export function parseSheetRows(rows, { defaultYear, minYear = 2024, maxYear = 2027 } = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const warnings = [];
  const headers = list.length ? Object.keys(list[0]) : [];
  const mapping = mapColumns(headers);
  let usedFallback = false;

  if (!mapping.target || !mapping.actual) {
    // fallback ke urutan kolom lama (nama, target, aktual, keterangan) — beri tahu pengguna
    usedFallback = true;
    const free = headers.filter((h) => h !== mapping.year);
    mapping.name = mapping.name || free[0] || null;
    mapping.target = mapping.target || free[1] || null;
    mapping.actual = mapping.actual || free[2] || null;
    mapping.note = mapping.note || free[3] || null;
    warnings.push("Header kolom Target/Aktual tidak dikenali — kolom dibaca berdasarkan urutan (nama, target, aktual, keterangan). Periksa preview.");
  }
  if (!mapping.name && headers.length) {
    // kolom nama = kolom pertama yang belum terpakai
    const used = new Set(Object.values(mapping).filter(Boolean));
    mapping.name = headers.find((h) => !used.has(h)) || null;
  }

  const byYear = {}; let skipped = 0, noYear = 0, badNum = 0, totals = 0, outOfRange = 0;
  list.forEach((row, idx) => {
    const name = cell(row[mapping.name]);
    const target = cell(row[mapping.target]);
    const actual = cell(row[mapping.actual]);
    const note = mapping.note ? cell(row[mapping.note]) : "";
    if (!name && !target && !actual) { skipped++; return; }
    if (/^(grand\s*)?(total|jumlah|subtotal)\b/i.test(name)) { totals++; return; }

    let year = defaultYear;
    if (mapping.year) {
      const y = Number(cell(row[mapping.year]).match(/\d{4}/)?.[0]);
      if (y >= minYear && y <= maxYear) year = y; else { if (cell(row[mapping.year])) outOfRange++; else noYear++; }
    }
    if (!year) { noYear++; return; }
    if ((target && !/\d/.test(target)) || (actual && !/\d/.test(actual))) badNum++;

    (byYear[year] ||= []).push({
      id: `${year}-${idx}`,
      salesName: name || `Item #${idx + 1}`,
      targetVal: target || "0",
      actualVal: actual || "0",
      note,
    });
  });

  if (skipped) warnings.push(`${skipped} baris kosong dilewati.`);
  if (totals) warnings.push(`${totals} baris total/jumlah dilewati agar tidak dihitung ganda.`);
  if (outOfRange) warnings.push(`${outOfRange} baris punya tahun di luar ${minYear}–${maxYear}, dipakai tahun laporan aktif.`);
  if (badNum) warnings.push(`${badNum} baris punya Target/Aktual bukan angka.`);
  const years = Object.keys(byYear).map(Number).sort();
  if (years.length > 1) warnings.push(`File berisi beberapa tahun (${years.join(", ")}) — data tiap tahun masuk ke laporan tahun tersebut.`);
  const rowCount = years.reduce((s, y) => s + byYear[y].length, 0);
  return { mapping, usedFallback, byYear, years, rowCount, warnings };
}

/** nilai numerik untuk validasi/preview: "1.250.000" -> 1250000 */
export const numericOf = (v) => toNum(v);

/* ------------------------------------------------------------------------------------------------
 * Dari sheet mentah ke baris objek: tahan terhadap judul di atas tabel, sel angka/persen/tanggal, dan banyak sheet.
 * ---------------------------------------------------------------------------------------------- */

/**
 * Gabungkan hasil sheet_to_json(header:1, raw:true) dan (raw:false) menjadi satu matriks teks.
 * Angka asli dipakai apa adanya (1250000 -> "1250000", tanpa ambiguitas titik/koma), kecuali sel persen/tanggal
 * yang memakai teks tampilan Excel ("98%", "12/03/2026") supaya maknanya tidak hilang.
 */
export function matrixFrom(rawRows, fmtRows) {
  const raw = Array.isArray(rawRows) ? rawRows : [];
  const fmt = Array.isArray(fmtRows) ? fmtRows : [];
  return raw.map((row, r) => (Array.isArray(row) ? row : []).map((v, c) => {
    const shown = fmt[r]?.[c];
    if (typeof v === "number") {
      const f = shown === undefined || shown === null ? "" : String(shown).trim();
      if (f && (/%/.test(f) || /\d[\/.-]\d{1,2}[\/.-]\d|[A-Za-z]{3}/.test(f))) return f;
      return String(Number(v.toPrecision(12)));
    }
    return v === null || v === undefined ? "" : String(v).trim();
  }));
}

const isNumLike = (v) => /^-?[\d.,\s%]+$/.test(String(v).trim()) && /\d/.test(String(v));

/**
 * Cari baris header (mis. tabel mulai di baris 4 setelah judul laporan), lalu ubah sisanya jadi objek per baris.
 * Header = baris pertama (maks. 25 baris awal) yang punya kolom Target DAN Aktual; kalau tidak ada,
 * baris pertama dengan >= 2 sel teks non-angka; kalau tidak ada juga, baris pertama.
 */
export function rowsFromMatrix(matrix) {
  const m = (Array.isArray(matrix) ? matrix : []).map((r) => (Array.isArray(r) ? r : []));
  const filled = (r) => r.filter((c) => String(c ?? "").trim() !== "");
  let h = -1;
  for (let i = 0; i < Math.min(m.length, 25) && h < 0; i++) {
    const cells = m[i].map((c) => String(c ?? ""));
    const t = cells.some((c) => score(c, SYN.target) >= 2), a = cells.some((c) => score(c, SYN.actual) >= 2);
    if (t && a) h = i;
  }
  if (h < 0) h = m.findIndex((r) => { const f = filled(r); return f.length >= 2 && f.every((c) => !isNumLike(c)); });
  if (h < 0) h = 0;
  const head = m[h] || [];
  const seen = new Map();
  const names = head.map((c, i) => {
    let n = String(c ?? "").trim() || `Kolom ${i + 1}`;
    const k = seen.get(n) || 0; seen.set(n, k + 1);
    return k ? `${n} (${k + 1})` : n;
  });
  const rows = [];
  for (let i = h + 1; i < m.length; i++) {
    if (!filled(m[i]).length) continue;
    const o = {}; names.forEach((n, c) => { o[n] = m[i][c] ?? ""; });
    rows.push(o);
  }
  return { rows, headerRow: h + 1, headers: names };
}

/**
 * Pilih sheet terbaik dari banyak sheet: yang kolom Target & Aktual-nya dikenali dan paling banyak barisnya.
 * sheets: [{ name, matrix }]
 */
export function chooseSheet(sheets, opts = {}) {
  let best = null;
  for (const sh of sheets || []) {
    const { rows, headerRow } = rowsFromMatrix(sh.matrix);
    if (!rows.length) continue;
    const parsed = parseSheetRows(rows, opts);
    const rank = (parsed.usedFallback ? 0 : 1_000_000) + parsed.rowCount;
    if (!best || rank > best.rank) best = { name: sh.name, headerRow, parsed, rank };
  }
  return best;
}