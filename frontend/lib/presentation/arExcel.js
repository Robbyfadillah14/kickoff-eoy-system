// lib/presentation/arExcel.js — baca file Excel Finance AR (rekap pencapaian piutang per bulan IDR/USD + daftar bad debt per tahun).
// Murni fungsi (tanpa React/xlsx): terima matriks teks hasil matrixFrom() di excelImport.js.
//
// Prinsip (sama dengan logisticsExcel.js):
//  - lembar dikenali dari NAMA / JUDUL ("2025", "Rekap pencapaian piutang thn. 2025", "BADDEBT2025", "Bad Debt tahun 2025"), bukan urutan lembar
//  - kolom dikenali dari HEADER (MONTH/IDR/USD, CODE/CUSTOMER/INVOICE/AMOUNT/PIC SALES), bukan posisi
//  - rata-rata dan total dihitung ulang dari angka di tabel; angka rata-rata/TOTAL di Excel hanya dipakai untuk pengecekan
//  - bulan yang masih kosong = belum diisi / masih berjalan, BUKAN nol
//  - tiap angka membawa nomor baris Excel untuk popup

import { num as numLoose, fmtInt, fmtDec, MONTH_LABEL } from "./logisticsExcel.js";
export { fmtInt, fmtDec, MONTH_LABEL };

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const txt = (v) => String(v ?? "").trim();
const cell = (m, r, c) => txt((m[r] || [])[c]);
/** angka dari sel Excel: bentuk "95.045" / "9106084.98" dari sel ANGKA selalu titik-desimal (bukan titik ribuan); selain itu pakai pembaca longgar */
const num = (v) => { const s = txt(v); return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : numLoose(v); };
const sumOf = (a) => a.reduce((s, x) => s + (x ?? 0), 0);

const MONTHS = { januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, agu: 8, agt: 8, aug: 8, sep: 9, sept: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };
const monthOf = (s) => MONTHS[norm(s)] || 0;

const yearIn = (s) => { const m = String(s ?? "").match(/\b(20[2-3]\d)\b/); return m ? Number(m[1]) : null; };
const FULL = (n) => `Rp ${fmtInt(n)}`;

/** "Rp 784,2 jt" / "Rp 21,8 M" untuk tampilan ringkas */
export function rpShort(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e12) return `Rp ${fmtDec(n / 1e12, 2)} T`;
  if (a >= 1e9) return `Rp ${fmtDec(n / 1e9, 2)} M`;
  if (a >= 1e6) return `Rp ${fmtDec(n / 1e6, 1)} jt`;
  if (a >= 1e3) return `Rp ${fmtDec(n / 1e3, 0)} rb`;
  return `Rp ${fmtInt(n)}`;
}
export const pct1 = (v) => (v == null || !Number.isFinite(v) ? "—" : `${fmtDec(v, 1)}%`);

/* ------------------------------------------------------------ lembar pencapaian piutang per bulan */

function parseCollectSheet(name, m, warnings) {
  // kolom: cari baris header yang memuat MONTH dan IDR
  let hr = -1, cMonth = 0, cIdr = -1, cUsd = -1;
  for (let r = 0; r < Math.min(m.length, 15); r++) {
    const row = (m[r] || []).map((x) => norm(x));
    if (row.includes("month") || row.includes("bulan")) {
      hr = r; cMonth = row.findIndex((x) => x === "month" || x === "bulan");
      cIdr = row.findIndex((x) => x === "idr"); cUsd = row.findIndex((x) => x === "usd");
      break;
    }
  }
  if (hr < 0 || cIdr < 0) return null;
  const title = m.slice(0, 3).flat().map(txt).find((t) => /piutang|rekap/i.test(t)) || "";
  const year = yearIn(title) || yearIn(name);
  if (!year) return null;
  const months = [];
  let tail = hr + 1, avgRow = null;
  for (let r = hr + 1; r < m.length; r++) {
    const mo = monthOf(cell(m, r, cMonth));
    if (!mo) { if (months.length && r > tail) break; continue; }
    tail = r;
    const idr = num(cell(m, r, cIdr)), usd = cUsd >= 0 ? num(cell(m, r, cUsd)) : null;
    if (idr == null && usd == null) continue; // bulan belum diisi
    months.push({ m: mo, label: MONTH_LABEL[mo], idr, usd, idrRemark: cell(m, r, cIdr + 1), usdRemark: cUsd >= 0 ? cell(m, r, cUsd + 1) : "", row: r + 1 });
  }
  // baris rata-rata (tanpa label bulan) tepat di bawah Desember
  for (let r = tail + 1; r < Math.min(m.length, tail + 4); r++) {
    const a = num(cell(m, r, cIdr)), b = cUsd >= 0 ? num(cell(m, r, cUsd)) : null;
    if ((a != null || b != null) && !monthOf(cell(m, r, cMonth))) { avgRow = { idr: a, usd: b, row: r + 1 }; break; }
  }
  if (!months.length) return null;
  let target = null, conclusion = "", extraTarget = "";
  for (let r = tail + 1; r < m.length; r++) {
    const line = (m[r] || []).map(txt).filter(Boolean).join(" ");
    if (!line) continue;
    const t = line.match(/tertagih\s*(\d+(?:[.,]\d+)?)\s*%/i) || line.match(/target[^%\d]*(\d+(?:[.,]\d+)?)\s*%/i);
    if (t && /target/i.test(line) && !/baddebt|bad debt/i.test(line)) target = num(t[1]);
    if (/^kesimpulan/i.test(line)) conclusion = line;
    if (/baddebt|bad debt/i.test(line) && /\d+\s*%/.test(line)) extraTarget = line;
  }
  months.sort((a, b) => a.m - b.m);
  const last = months[months.length - 1].m;
  const avg = (k) => { const v = months.map((x) => x[k]).filter((x) => x != null); return v.length ? sumOf(v) / v.length : null; };
  const idrAvg = avg("idr"), usdAvg = avg("usd");
  if (avgRow?.idr != null && idrAvg != null && Math.abs(avgRow.idr - idrAvg) > 0.05) warnings.push(`${year}: rata-rata IDR di Excel (${fmtDec(avgRow.idr, 2)}%) berbeda dari hitungan ulang (${fmtDec(idrAvg, 2)}%). Yang ditampilkan: hitungan ulang.`);
  if (avgRow?.usd != null && usdAvg != null && Math.abs(avgRow.usd - usdAvg) > 0.05) warnings.push(`${year}: rata-rata USD di Excel (${fmtDec(avgRow.usd, 2)}%) berbeda dari hitungan ulang (${fmtDec(usdAvg, 2)}%). Yang ditampilkan: hitungan ulang.`);
  if (months.length < 12) warnings.push(`${year}: baru terisi sampai ${MONTH_LABEL[last]} (${months.length} bulan). Bulan kosong dianggap belum diisi, bukan nol.`);
  return { year, sheet: name, months, last, lastLabel: MONTH_LABEL[last], partial: last < 12 || months.length < 12, idrAvg, usdAvg, xlAvg: avgRow, target, conclusion, extraTarget, titleRow: 1 };
}

/* ------------------------------------------------------------ lembar bad debt */

const invYearOf = (inv) => { const s = String(inv ?? "").replace(/\D/g, ""); if (s.length >= 8) { const y = 2000 + Number(s.slice(0, 2)); if (y >= 2018 && y <= 2030) return y; } return null; };

function parseBadDebtSheet(name, m, warnings) {
  let hr = -1; const col = {};
  for (let r = 0; r < Math.min(m.length, 12); r++) {
    const row = (m[r] || []).map((x) => norm(x));
    if (row.includes("customer") && row.includes("amount")) {
      hr = r;
      row.forEach((x, c) => {
        if (x === "code") col.code = c; else if (x === "customer") col.customer = c; else if (x === "invoice") col.invoice = c;
        else if (x === "invoicedate") col.date = c; else if (x === "po") col.po = c; else if (x === "curr") col.curr = c;
        else if (x === "amount") col.amount = c; else if (x === "picsales" || x === "pic") col.pic = c; else if (x === "remars" || x === "remarks" || x === "keterangan") col.remark = c;
      });
      break;
    }
  }
  if (hr < 0) return null;
  const title = m.slice(0, 3).flat().map(txt).find((t) => /bad\s*debt/i.test(t)) || "";
  const year = yearIn(title) || yearIn(name);
  if (!year) return null;
  const rows = []; let code = "", customer = "", pic = "", totalXl = null, totalRowIdx = -1;
  for (let r = hr + 1; r < m.length; r++) {
    const label = (m[r] || []).map(norm);
    if (label.includes("total") && num(cell(m, r, col.amount)) != null) { totalXl = num(cell(m, r, col.amount)); totalRowIdx = r; break; }
    const amount = num(cell(m, r, col.amount));
    if (amount == null) { if (rows.length && !(m[r] || []).some((x) => txt(x))) continue; else continue; }
    const c = cell(m, r, col.customer), cd = cell(m, r, col.code);
    if (c) { customer = c; code = cd; }
    const p = cell(m, r, col.pic); if (p) pic = p.trim();
    const inv = cell(m, r, col.invoice);
    rows.push({ code, customer, invoice: inv, date: cell(m, r, col.date), po: cell(m, r, col.po), curr: cell(m, r, col.curr) || "IDR", amount, pic: pic || p, remark: cell(m, r, col.remark), invYear: invYearOf(inv), row: r + 1 });
  }
  if (!rows.length) return null;
  const total = sumOf(rows.map((x) => x.amount));
  if (totalXl != null && Math.abs(totalXl - total) > 1) warnings.push(`${year} bad debt: TOTAL di Excel (${FULL(totalXl)}) berbeda dari jumlah baris (${FULL(total)}). Yang ditampilkan: jumlah baris.`);
  if (rows.some((x) => x.curr && !/idr/i.test(x.curr))) warnings.push(`${year} bad debt: ada baris bukan IDR; total digabung apa adanya.`);
  // bagian bawah: target, total piutang, writeoff, persentase, kesimpulan
  const info = { targetPct: null, outstanding: null, outstandingLabel: "", bdXl: null, wo: null, woNote: "", bdPctXl: null, woPctXl: null, conclusion: "", targetText: "" };
  for (let r = (totalRowIdx >= 0 ? totalRowIdx : m.length) + 1; r < m.length; r++) {
    const cells = (m[r] || []).map(txt);
    const line = cells.filter(Boolean).join(" ");
    if (!line) continue;
    const nums = cells.map(num).filter((x) => x != null);
    const lab = norm(cells.find((x) => x && num(x) == null) || "");
    const lastNum = nums.length ? nums[nums.length - 1] : null;
    const note = cells.filter((x) => x && num(x) == null).slice(1).join(" ");
    if (/(minimalisir|meminimalisir|maks|target).*(baddebt|bad debt)|(baddebt|bad debt).*(\d+\s*%)/i.test(line) && /\d+\s*%/.test(line)) { info.targetPct = num(line.match(/(\d+(?:[.,]\d+)?)\s*%/)[1]); info.targetText = line; }
    else if (/^total\s*piutang/i.test(line) && lastNum != null) { info.outstanding = lastNum; info.outstandingLabel = cells.find((x) => /^total\s*piutang/i.test(x)) || "Total piutang"; }
    else if (/^total\s*bad\s*debt|^total\s*baddebt/i.test(line) && lastNum != null) info.bdXl = lastNum;
    else if (/^total\s*write\s*off|^total\s*writeoff/i.test(line) && lastNum != null) { info.wo = lastNum; info.woNote = note.replace(/[()]/g, "").trim(); }
    else if (/persentase\s*bd/i.test(line) && lastNum != null) info.bdPctXl = lastNum;
    else if (/persentase\s*wo/i.test(line) && lastNum != null) info.woPctXl = lastNum;
    else if (/^kesimpulan/i.test(line)) info.conclusion = line;
  }
  const bdPct = info.outstanding > 0 ? (total / info.outstanding) * 100 : null;
  if (bdPct != null && info.bdPctXl != null && Math.abs(bdPct - info.bdPctXl) > 0.05) warnings.push(`${year}: persentase bad debt di Excel (${fmtDec(info.bdPctXl, 2)}%) berbeda dari hitungan ulang (${fmtDec(bdPct, 2)}%).`);
  const woPct = info.outstanding > 0 && info.wo != null ? (info.wo / info.outstanding) * 100 : null;
  if (info.woPctXl != null && woPct != null && info.woPctXl < 0.01 && woPct > info.woPctXl * 10) warnings.push(`${year}: persentase write-off di Excel (${info.woPctXl}) tampaknya berupa pecahan, bukan persen. Yang ditampilkan: ${fmtDec(woPct, 3)}%.`);
  if (info.targetPct != null && bdPct == null) warnings.push(`${year}: target bad debt ${info.targetPct}% ada, tetapi total piutang tahun itu tidak ada di file, jadi persentase tidak bisa dinilai.`);
  // ringkasan per customer / PIC / tahun invoice
  const group = (keyFn) => { const mp = new Map(); for (const x of rows) { const k = keyFn(x) || "—"; const e = mp.get(k) || { name: k, amount: 0, n: 0 }; e.amount += x.amount; e.n += 1; mp.set(k, e); } return [...mp.values()].sort((a, b) => b.amount - a.amount); };
  const customers = (() => {
    const mp = new Map();
    for (const x of rows) {
      const k = norm(x.customer); const e = mp.get(k) || { code: x.code, name: x.customer, amount: 0, n: 0, pic: x.pic, remarks: [], rowsAt: [] };
      e.amount += x.amount; e.n += 1; if (x.remark && !e.remarks.includes(x.remark)) e.remarks.push(x.remark); e.rowsAt.push(x.row); mp.set(k, e);
    }
    return [...mp.values()].sort((a, b) => b.amount - a.amount);
  })();
  return { year, sheet: name, rows, total, totalXl, customers, byPic: group((x) => x.pic.replace(/\s+/g, " ").trim()), byInvYear: group((x) => (x.invYear ? String(x.invYear) : "")), ...info, bdPct, woPct };
}

/* ------------------------------------------------------------ pintu masuk */

/** sheets = [{name, matrix}] -> dataset atau null bila tidak ada lembar Finance AR yang dikenali */
export function parseArSheets(sheets, { fileName = "" } = {}) {
  const warnings = [];
  const collect = {}, bad = {};
  for (const sh of sheets || []) {
    const m = sh.matrix || [];
    const title = m.slice(0, 3).flat().map(txt).join(" ");
    const isBad = /bad\s*debt|baddebt/i.test(sh.name) || /^\s*bad\s*debt/i.test(title);
    if (isBad) { const b = parseBadDebtSheet(sh.name, m, warnings); if (b) bad[b.year] = b; continue; }
    const c = parseCollectSheet(sh.name, m, warnings);
    if (c) collect[c.year] = c;
  }
  const years = [...new Set([...Object.keys(collect), ...Object.keys(bad)].map(Number))].sort();
  if (!years.length) return null;
  const tg = Object.values(collect).map((c) => c.target).filter((x) => x != null);
  if (new Set(tg).size > 1) warnings.push(`Target penagihan berbeda antar tahun (${[...new Set(tg)].join("% / ")}%). Tiap tahun dinilai dengan targetnya sendiri.`);
  for (const y of years) if (collect[y] && collect[y].target == null) { warnings.push(`${y}: target penagihan tidak ditemukan di lembar, dipakai 98%.`); collect[y].target = 98; collect[y].targetAssumed = true; }
  // keterangan "tercapai / tidak tercapai" di Excel dicocokkan dengan hitungan target
  for (const y of Object.keys(collect).map(Number)) {
    const c = collect[y]; let bad = 0, total = 0;
    for (const x of c.months) for (const k of ["idr", "usd"]) {
      const v = x[k], rm = x[`${k}Remark`]; if (v == null || !rm) continue;
      total++; const claimsOk = !/tidak|belum/i.test(rm); if ((v >= c.target) !== claimsOk) bad++;
    }
    if (bad) warnings.push(`${y}: ${bad} bulan keterangan “tercapai/tidak” di Excel tidak cocok dengan angkanya terhadap target ${c.target}%. Penilaian memakai angka, bukan keterangan.`);
  }
  return { kind: "ar", file: fileName, importedAt: new Date().toISOString(), years, collect: { byYear: collect }, badDebt: { byYear: bad }, warnings };
}

/* ------------------------------------------------------------ penilaian */

/** status pencapaian satu mata uang di tahun y: rata-rata, bulan tercapai, ok terhadap target */
export function collectStatus(c, cur) {
  if (!c) return null;
  const k = cur === "usd" ? "usd" : "idr";
  const vals = c.months.filter((x) => x[k] != null);
  if (!vals.length) return null;
  const avg = cur === "usd" ? c.usdAvg : c.idrAvg;
  const okMonths = vals.filter((x) => x[k] >= c.target).length;
  const worst = vals.reduce((a, x) => (x[k] < a[k] ? x : a), vals[0]), best = vals.reduce((a, x) => (x[k] > a[k] ? x : a), vals[0]);
  return { avg, target: c.target, ok: avg != null ? avg >= c.target : null, okMonths, n: vals.length, worst, best, partial: c.partial, lastLabel: c.lastLabel, gap: avg != null ? avg - c.target : null };
}

/** status bad debt tahun y: persen terhadap total piutang vs target maksimum */
export function badDebtStatus(b) {
  if (!b) return null;
  if (b.targetPct == null || b.bdPct == null) return { ok: null, pct: b.bdPct, target: b.targetPct, reason: b.targetPct == null ? "target belum ada" : "total piutang belum ada" };
  return { ok: b.bdPct <= b.targetPct, pct: b.bdPct, target: b.targetPct };
}

/** teks ringkas untuk kolom form (tahun y). Memakai titik desimal agar terbaca sebagai persen oleh matriks KPI. */
export function arFieldsFrom(ds, y) {
  const out = {};
  const c = ds?.collect?.byYear?.[y];
  const line = (cur) => {
    const s = collectStatus(c, cur); if (!s) return null;
    return `Rata-rata ${s.avg.toFixed(1)}% (target ≥${s.target}%) · ${s.okMonths}/${s.n} bulan tercapai${s.partial ? ` s/d ${s.lastLabel}` : ""}`;
  };
  const idr = line("idr"), usd = line("usd");
  if (idr) out.arIdrAch = idr;
  if (usd) out.arUsdAch = usd;
  const b = ds?.badDebt?.byYear?.[y];
  if (b) {
    const st = badDebtStatus(b);
    out.badDebtControl = `Bad debt ${y}: ${rpShort(b.total)} (${b.customers.length} customer)${b.bdPct != null ? `, ${b.bdPct.toFixed(1)}% dari piutang` : ""}${b.targetPct != null ? ` · target maks ${b.targetPct}%` : ""}${st?.ok != null ? (st.ok ? " — tercapai" : " — tidak tercapai") : ""}.`;
    if (b.outstanding != null) out.arOutstanding = String(Math.round(b.outstanding));
    out.badDebtList = b.customers.map((x, i) => ({ id: Date.now() + i, customerName: x.name, amount: String(Math.round(x.amount)), salesPic: x.pic, remarks: x.remarks.join("; ") }));
  }
  return out;
}