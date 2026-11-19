// frontend/lib/reportExcel.js — pembaca Excel bersama untuk SEMUA form laporan (client).
import { matrixFrom, chooseSheet } from "./presentation/excelImport.js";

const num = (v) => { const n = Number(String(v ?? "").replace(/[^0-9.-]+/g, "")); return Number.isFinite(n) ? n : 0; };

/** bentuk baris sesuai kebutuhan form. Sales memakai targetProfit & topProducts seperti sebelumnya. */
function shape(r, sales) {
  if (!sales) return r;
  return {
    ...r,
    targetProfit: r.targetVal,
    topProducts: [{ id: `${r.id}-p`, productName: r.salesName, totalQty: "", category: r.note || "" }],
  };
}

/**
 * Baca file .xlsx/.xls/.csv -> baris untuk tahun laporan aktif + baris tahun lain (bila file punya kolom Tahun).
 * Kolom dikenali dari HEADER (Target / Aktual / Nama / Keterangan / Tahun), bukan urutan; judul di atas tabel dan sheet
 * pertama yang bukan tabel tidak jadi masalah.
 */
export async function parseExcelFile(file, { year, sales = false } = {}) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
    const fmt = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    return { name, matrix: matrixFrom(raw, fmt) };
  });
  const best = chooseSheet(sheets, { defaultYear: Number(year) });
  if (!best) throw new Error("Tidak ada tabel berisi data yang ditemukan di file ini.");

  const { parsed } = best;
  const cur = (parsed.byYear[Number(year)] || []).map((r) => shape(r, sales));
  const otherYears = {};
  for (const y of parsed.years) if (y !== Number(year)) otherYears[y] = parsed.byYear[y].map((r) => shape(r, sales));
  const warnings = [...parsed.warnings];
  if (!cur.length) warnings.push(`Tidak ada baris untuk tahun ${year} di file ini — isian ${year} di form tidak diubah.`);
  if (best.name && sheets.length > 1) warnings.push(`Sheet "${best.name}" dipakai (file punya ${sheets.length} sheet).`);

  return {
    fileName: file.name, sheetName: best.name, headerRow: best.headerRow,
    mapping: parsed.mapping, usedFallback: parsed.usedFallback, warnings,
    rows: cur, otherYears,
  };
}

/** isi tabel Excel form + simpan ringkasan impor di form.__import (ditampilkan page.jsx, tidak ikut tersimpan) */
export function applyExcelImport(form, res) {
  const { rows, otherYears, ...info } = res;
  return {
    ...form,
    ...(rows.length ? { salesPerformances: rows } : {}),
    __import: { ...info, count: rows.length, otherYears },
  };
}

export { num as _num };