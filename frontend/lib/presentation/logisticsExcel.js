// lib/presentation/logisticsExcel.js — baca file Excel Admin Logistic (DO/INV per bulan, rekap cancel invoice, alasan cancel, arsip PO, on-time delivery).
// Murni fungsi (tanpa React/xlsx): terima matriks teks hasil matrixFrom() di excelImport.js.
//
// Prinsip (sama dengan hrExcel.js):
//  - blok tabel dikenali dari JUDUL/HEADER ("BULAN", tahun 2024.., INTERNAL/EKSTERNAL), bukan dari posisi sel
//  - total dihitung ulang dari angka per bulan; angka TOTAL di Excel hanya dipakai untuk pengecekan
//  - bulan yang masih kosong = "belum diisi / masih berjalan", BUKAN nol
//  - tiap angka membawa nomor baris Excel + penjelasan cara hitung untuk popup

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const txt = (v) => String(v ?? "").trim();

const MONTHS = {
  jan: 1, januari: 1, feb: 2, februari: 2, mar: 3, maret: 3, apr: 4, april: 4, mei: 5, may: 5,
  jun: 6, juni: 6, jul: 7, juli: 7, agu: 8, agt: 8, agus: 8, agust: 8, agustus: 8, aug: 8,
  sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, oct: 10, nov: 11, november: 11, des: 12, desember: 12, dec: 12,
};
export const MONTH_LABEL = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const monthOf = (s) => MONTHS[norm(s)] || 0;

/** "754" -> 754 ; "1.250" -> 1250 (titik ribuan) ; kosong/bukan angka -> null */
export function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = txt(v).replace(/[%\s]/g, "");
  if (!s) return null;
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  else s = s.replace(",", ".");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
/** "100%" -> 100 ; 1 -> 100 ; 0.95 -> 95 ; 98 -> 98 */
export function pctVal(v) {
  const s = txt(v);
  const n = num(s);
  if (n == null) return null;
  if (/%/.test(s)) return n;
  return Math.abs(n) <= 1 ? n * 100 : n;
}
export const fmtInt = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const fmtDec = (n, d = 1) => (n == null || !Number.isFinite(n) ? "-" : n.toFixed(d).replace(".", ","));

const cell = (m, r, c) => txt((m[r] || [])[c]);
const rowLen = (m) => Math.max(0, ...m.map((r) => (r || []).length));
const sumOf = (a) => a.reduce((s, x) => s + (x ?? 0), 0);

/* ------------------------------------------------------------ target dari judul */

/** "TARGET 150 CANCEL INTERNAL & EKSTERNAL" -> {total:150} ; "TARGET INTERNAL = 100 & EKSTERNAL = 200" -> {internal:100, external:200} */
export function parseTarget(title) {
  const t = String(title || "");
  const m = t.match(/target(.*)/i);
  if (!m) return null;
  const body = m[1];
  const i = body.match(/internal[^\d]{0,8}(\d+)/i), e = body.match(/eksternal[^\d]{0,8}(\d+)/i);
  if (i || e) return { internal: i ? Number(i[1]) : null, external: e ? Number(e[1]) : null, total: null, text: txt(body.replace(/[()]/g, "")) };
  const n = body.match(/(\d+)/);
  return n ? { internal: null, external: null, total: Number(n[1]), text: txt(body.replace(/[()]/g, "")) } : null;
}

/* ------------------------------------------------------------ blok bulanan */

function titleAbove(m, r, c, maxUp = 4) {
  for (let i = r - 1; i >= Math.max(0, r - maxUp); i--) {
    const t = cell(m, i, c);
    if (t) return { text: t, row: i + 1 };
  }
  return { text: "", row: null };
}

/** semua blok "BULAN | kolom..." : { r, c, cols:[{c, head}], title } */
function monthBlocks(m) {
  const out = [];
  const W = rowLen(m);
  for (let r = 0; r < m.length; r++) {
    const anchors = [];
    for (let c = 0; c < W; c++) if (norm(cell(m, r, c)) === "bulan") anchors.push(c);
    anchors.forEach((c, k) => {
      const end = k + 1 < anchors.length ? anchors[k + 1] : W;
      const cols = [];
      for (let x = c + 1; x < end; x++) { const h = cell(m, r, x); if (h) cols.push({ c: x, head: h }); }
      if (cols.length) out.push({ r, c, cols, title: titleAbove(m, r, c) });
    });
  }
  return out;
}

function readMonths(m, blk, col) {
  const months = [];
  let hard = null, hardRow = null;
  const seen = new Set();
  let blanks = 0;
  for (let r = blk.r + 1; r < m.length; r++) {
    const lab = cell(m, r, blk.c);
    if (!lab) { blanks++; if (blanks >= 3) break; continue; }
    blanks = 0;
    if (norm(lab) === "total") { hard = num(cell(m, r, col)); hardRow = r + 1; break; }
    const mo = monthOf(lab);
    if (!mo) { if (months.length) break; continue; }
    if (seen.has(mo)) continue;
    seen.add(mo);
    const v = num(cell(m, r, col));
    if (v != null) months.push({ m: mo, label: MONTH_LABEL[mo], v, row: r + 1 });
  }
  return { months, hard, hardRow };
}

const lastMonthOf = (months) => (months.length ? Math.max(...months.map((x) => x.m)) : 0);
const gaps = (months) => { const last = lastMonthOf(months); const have = new Set(months.map((x) => x.m)); const g = []; for (let i = 1; i < last; i++) if (!have.has(i)) g.push(MONTH_LABEL[i]); return g; };

/* ------------------------------------------------------------ alasan cancel */

function reasonBlocks(m) {
  const W = rowLen(m);
  const out = [];
  for (let r = 0; r < m.length; r++) {
    const hasBulan = Array.from({ length: W }, (_, c) => norm(cell(m, r, c))).includes("bulan");
    if (hasBulan) continue;
    for (let c = 0; c < W; c++) {
      const n = norm(cell(m, r, c));
      if (n !== "internal" && n !== "eksternal") continue;
      // judul "Analisis & Rincian Cancel Invoice 2024": baris di atas, kolom terdekat di kiri (atau sama)
      let title = null;
      for (let i = r - 1; i >= Math.max(0, r - 4) && !title; i--) {
        for (let x = c; x >= 0; x--) { const t = cell(m, i, x); if (t && /(analisis|rincian|alasan)/i.test(t)) { title = { text: t, row: i + 1 }; break; } }
      }
      const yr = title ? Number((title.text.match(/\b(20\d{2})\b/) || [])[1]) || null : null;
      const items = []; let hard = null, hardRow = null, blanks = 0;
      for (let i = r + 1; i < Math.min(m.length, r + 40); i++) {
        const lab = cell(m, i, c);
        if (!lab) { blanks++; if (blanks >= 4 && items.length) break; continue; }
        blanks = 0;
        let v = null;
        for (let x = c + 1; x <= Math.min(W - 1, c + 3) && v == null; x++) v = num(cell(m, i, x));
        if (norm(lab) === "total") { hard = v; hardRow = i + 1; break; }
        if (v != null) items.push({ label: lab.replace(/\s+/g, " "), n: v, row: i + 1 });
      }
      if (items.length) out.push({ year: yr, side: n === "internal" ? "internal" : "external", items, hard, hardRow, headerRow: r + 1, titleRow: title?.row || null });
    }
  }
  return out;
}

/* ------------------------------------------------------------ KPI arsip PO & on time */

function kpiRows(m) {
  const W = rowLen(m);
  const out = [];
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < W; c++) {
      const n = norm(cell(m, r, c));
      const key = n.includes("arsippo") ? "arsipPo" : n.includes("ontimedelivery") || n.includes("supportontime") ? "onTime" : null;
      if (!key || out.some((o) => o.key === key)) continue;
      let raw = null;
      for (let x = c + 1; x <= Math.min(W - 1, c + 5) && raw == null; x++) if (num(cell(m, r, x)) != null) raw = cell(m, r, x);
      let note = "";
      for (let i = r + 1; i <= r + 2; i++) { const t = cell(m, i, c); if (/^note/i.test(t)) { note = t.replace(/^note\s*[;:]?\s*/i, ""); break; } }
      out.push({ key, label: cell(m, r, c).replace(/\s+/g, " "), pct: raw == null ? null : pctVal(raw), note, row: r + 1 });
    }
  }
  return out;
}

/* ------------------------------------------------------------ utama */

/**
 * sheets: [{ name, matrix }]. Hasil: dataset | null (bila tidak ada blok DO/INV/cancel).
 * dataset: { type:"LOGISTICS", file, sheet, years, flow:{do,inv}, cancel, reasons, kpis, warnings }
 */
export function parseLogisticsSheets(sheets, { fileName = "" } = {}) {
  let best = null;
  for (const sh of sheets || []) {
    const m = (sh.matrix || []).map((r) => (Array.isArray(r) ? r : []));
    const blocks = monthBlocks(m);
    const flowBlocks = [], cancelBlocks = [];
    for (const b of blocks) {
      const yearCols = b.cols.filter((x) => /^(20\d{2})$/.test(x.head));
      const heads = b.cols.map((x) => norm(x.head));
      const t = norm(b.title.text);
      if (yearCols.length >= 1) {
        const kind = /invoice|inv/.test(t) && !/deliveryorder|do\b/.test(t) ? "inv" : /delivery|do/.test(t) ? "do" : /inv/.test(t) ? "inv" : null;
        if (kind) flowBlocks.push({ ...b, kind, yearCols });
      } else if (heads.includes("internal") && heads.includes("eksternal")) cancelBlocks.push(b);
    }
    const score = flowBlocks.length * 2 + cancelBlocks.length;
    if (score && (!best || score > best.score)) best = { sh, m, flowBlocks, cancelBlocks, score };
  }
  if (!best) return null;

  const { sh, m, flowBlocks, cancelBlocks } = best;
  const warnings = [];
  const years = new Set();

  // --- DO / INV
  const flow = {};
  for (const b of flowBlocks) {
    const f = flow[b.kind] || (flow[b.kind] = { label: b.kind === "do" ? "Delivery Order (DO) terbit" : "Invoice (INV) terbit", titleRow: b.title.row, headerRow: b.r + 1, byYear: {} });
    for (const yc of b.yearCols) {
      const y = Number(yc.head);
      const { months, hard, hardRow } = readMonths(m, b, yc.c);
      if (!months.length) continue;
      years.add(y);
      const total = sumOf(months.map((x) => x.v));
      const last = lastMonthOf(months);
      const g = gaps(months);
      f.byYear[y] = { year: y, months, total, hard, hardRow, last, partial: last < 12, lastLabel: MONTH_LABEL[last], gaps: g };
      if (hard != null && hard !== total) warnings.push(`${f.label} ${y}: angka TOTAL di Excel (${fmtInt(hard)}, baris ${hardRow}) berbeda dengan jumlah per bulan (${fmtInt(total)}). Sistem memakai jumlah per bulan.`);
      if (g.length) warnings.push(`${f.label} ${y}: bulan ${g.join(", ")} kosong di tengah data. Dianggap belum diisi, bukan nol.`);
    }
  }

  // --- rekap cancel per tahun
  const cancel = { byYear: {}, headerRow: null };
  for (const b of cancelBlocks) {
    const yr = Number((b.title.text.match(/\b(20\d{2})\b/) || [])[1]) || null;
    if (!yr) { warnings.push(`Tabel cancel di baris ${b.r + 1}: tahun tidak terbaca dari judul (“${b.title.text}”). Tabel dilewati.`); continue; }
    const ic = b.cols.find((x) => norm(x.head) === "internal"), ec = b.cols.find((x) => norm(x.head) === "eksternal"), tc = b.cols.find((x) => norm(x.head) === "total");
    const I = readMonths(m, b, ic.c), E = readMonths(m, b, ec.c), T = tc ? readMonths(m, b, tc.c) : { months: [] };
    const byM = {};
    for (const x of I.months) (byM[x.m] ||= { m: x.m, label: x.label, row: x.row }).int = x.v;
    for (const x of E.months) (byM[x.m] ||= { m: x.m, label: x.label, row: x.row }).ext = x.v;
    for (const x of T.months) (byM[x.m] ||= { m: x.m, label: x.label, row: x.row }).hardTot = x.v;
    const months = Object.values(byM).filter((x) => x.int != null || x.ext != null).sort((a, b2) => a.m - b2.m)
      .map((x) => ({ ...x, int: x.int ?? 0, ext: x.ext ?? 0, tot: (x.int ?? 0) + (x.ext ?? 0) }));
    if (!months.length) continue;
    years.add(yr);
    for (const x of months) if (x.hardTot != null && x.hardTot !== x.tot) warnings.push(`Cancel ${yr} bulan ${x.label} (baris ${x.row}): kolom TOTAL di Excel ${x.hardTot} ≠ internal + eksternal ${x.tot}. Sistem memakai internal + eksternal.`);
    const int = sumOf(months.map((x) => x.int)), ext = sumOf(months.map((x) => x.ext));
    const last = lastMonthOf(months);
    const target = parseTarget(b.title.text);
    if (I.hard != null && I.hard !== int) warnings.push(`Cancel internal ${yr}: TOTAL di Excel ${I.hard} ≠ jumlah per bulan ${int}. Sistem memakai jumlah per bulan.`);
    if (E.hard != null && E.hard !== ext) warnings.push(`Cancel eksternal ${yr}: TOTAL di Excel ${E.hard} ≠ jumlah per bulan ${ext}. Sistem memakai jumlah per bulan.`);
    cancel.byYear[yr] = { year: yr, months, int, ext, total: int + ext, last, partial: last < 12, lastLabel: MONTH_LABEL[last], target, titleText: b.title.text, titleRow: b.title.row, headerRow: b.r + 1, hardInt: I.hard, hardExt: E.hard, hardRow: I.hardRow };
    cancel.headerRow ||= b.r + 1;
  }
  const cYears = Object.keys(cancel.byYear).map(Number).sort();

  // --- alasan cancel
  const reasons = { byYear: {} };
  for (const rb of reasonBlocks(m)) {
    if (!rb.year) { warnings.push(`Rincian alasan cancel di baris ${rb.headerRow}: tahun tidak terbaca dari judul. Dilewati.`); continue; }
    const slot = reasons.byYear[rb.year] || (reasons.byYear[rb.year] = {});
    const total = sumOf(rb.items.map((x) => x.n));
    slot[rb.side] = { items: rb.items, total, hard: rb.hard, hardRow: rb.hardRow, headerRow: rb.headerRow };
    years.add(rb.year);
    if (rb.hard != null && rb.hard !== total) warnings.push(`Alasan cancel ${rb.side === "internal" ? "internal" : "eksternal"} ${rb.year}: TOTAL di Excel ${rb.hard} ≠ jumlah rincian ${total}.`);
  }
  for (const y of Object.keys(reasons.byYear).map(Number)) {
    const c = cancel.byYear[y], r = reasons.byYear[y];
    if (c && r.internal && r.internal.total !== c.int) warnings.push(`Rincian alasan internal ${y} berjumlah ${r.internal.total}, rekap cancel internal ${y} berjumlah ${c.int}.`);
    if (c && r.external && r.external.total !== c.ext) warnings.push(`Rincian alasan eksternal ${y} berjumlah ${r.external.total}, rekap cancel eksternal ${y} berjumlah ${c.ext}.`);
  }
  const rYears = Object.keys(reasons.byYear).map(Number).sort();
  for (const y of cYears) if (!reasons.byYear[y]) warnings.push(`Rincian alasan cancel ${y} belum ada di file ini.`);
  for (let i = 1; i < rYears.length; i++) {
    const a = reasons.byYear[rYears[i - 1]], b = reasons.byYear[rYears[i]];
    for (const side of ["internal", "external"]) {
      if (!a[side] || !b[side]) continue;
      const la = new Set(a[side].items.map((x) => norm(x.label))), lb = new Set(b[side].items.map((x) => norm(x.label)));
      const only = [...a[side].items.filter((x) => !lb.has(norm(x.label))).map((x) => `“${x.label}” (hanya ${rYears[i - 1]})`), ...b[side].items.filter((x) => !la.has(norm(x.label))).map((x) => `“${x.label}” (hanya ${rYears[i]})`)];
      if (only.length) warnings.push(`Daftar alasan ${side === "internal" ? "internal" : "eksternal"} ${rYears[i - 1]} dan ${rYears[i]} tidak sama: ${only.join("; ")}.`);
    }
  }

  // --- target berubah antar tahun
  const tl = cYears.map((y) => ({ y, t: cancel.byYear[y].target })).filter((x) => x.t);
  const sig = (t) => `${t.total ?? ""}|${t.internal ?? ""}|${t.external ?? ""}`;
  if (tl.length > 1 && new Set(tl.map((x) => sig(x.t))).size > 1) warnings.push(`Target cancel invoice berubah antar tahun: ${tl.map((x) => `${x.y} = ${targetText(x.t)}`).join("; ")}. Tiap tahun dinilai dengan targetnya sendiri.`);
  for (const x of tl) if (x.t.total != null && cancel.byYear[x.y].int != null) { /* target satu angka dianggap batas total internal + eksternal */ }
  if (tl.some((x) => x.t.total != null)) warnings.push(`Target “${tl.find((x) => x.t.total != null).t.text}” dibaca sebagai batas TOTAL (internal + eksternal) ${tl.find((x) => x.t.total != null).t.total}. Kalau maksudnya per jenis, mohon konfirmasi ke pembuat file.`);

  // --- masih berjalan
  const partial = [];
  for (const k of ["do", "inv"]) for (const y of Object.keys(flow[k]?.byYear || {})) { const d = flow[k].byYear[y]; if (d.partial) partial.push(`${k.toUpperCase()} ${y} sampai ${d.lastLabel}`); }
  for (const y of cYears) { const d = cancel.byYear[y]; if (d.partial) partial.push(`Cancel ${y} sampai ${d.lastLabel}`); }
  if (partial.length) warnings.push(`Tahun berjalan, belum 12 bulan: ${partial.join("; ")}. Bulan yang kosong tidak dihitung sebagai nol; perbandingan antar tahun memakai periode yang sama.`);

  const kpis = kpiRows(m);

  return {
    type: "LOGISTICS", file: fileName, sheet: sh.name, importedAt: new Date().toISOString(),
    years: [...years].sort(), flow, cancel, reasons, kpis, warnings,
  };
}

export function targetText(t) {
  if (!t) return "-";
  if (t.total != null) return `maks. ${t.total} (total)`;
  return [t.internal != null ? `internal maks. ${t.internal}` : null, t.external != null ? `eksternal maks. ${t.external}` : null].filter(Boolean).join(", ");
}

/* ------------------------------------------------------------ turunan (dipakai form, slide, test) */

/** total DO/INV untuk bulan 1..upTo pada tahun y */
export function flowUpTo(ds, kind, y, upTo) {
  const d = ds?.flow?.[kind]?.byYear?.[y];
  if (!d) return null;
  return sumOf(d.months.filter((x) => x.m <= upTo).map((x) => x.v));
}

/** status cancel tahun y terhadap targetnya: { ok, parts:[{label,val,max,ok}] } */
export function cancelStatus(c) {
  if (!c) return null;
  const t = c.target, parts = [];
  if (t?.total != null) parts.push({ label: "Total", val: c.total, max: t.total, ok: c.total <= t.total });
  if (t?.internal != null) parts.push({ label: "Internal", val: c.int, max: t.internal, ok: c.int <= t.internal });
  if (t?.external != null) parts.push({ label: "Eksternal", val: c.ext, max: t.external, ok: c.ext <= t.external });
  return { ok: parts.length ? parts.every((p) => p.ok) : null, parts };
}

/** pembanding adil: DO/INV tahun terakhir vs tahun sebelumnya pada periode bulan yang sama */
export function flowCompare(ds, kind) {
  const f = ds?.flow?.[kind]; if (!f) return null;
  const ys = Object.keys(f.byYear).map(Number).sort();
  if (!ys.length) return null;
  const y = ys[ys.length - 1], cur = f.byYear[y];
  const py = ys.length > 1 ? ys[ys.length - 2] : null;
  const prev = py ? f.byYear[py] : null;
  const upTo = cur.last;
  const curSum = flowUpTo(ds, kind, y, upTo), prevSum = prev ? flowUpTo(ds, kind, py, upTo) : null;
  const diff = prevSum != null ? curSum - prevSum : null;
  const pct = prevSum ? (diff / prevSum) * 100 : null;
  const best = cur.months.reduce((a, x) => (x.v > a.v ? x : a), cur.months[0]);
  const low = cur.months.reduce((a, x) => (x.v < a.v ? x : a), cur.months[0]);
  const avg = cur.total / cur.months.length;
  return { y, py, cur, prev, upTo, upToLabel: MONTH_LABEL[upTo], curSum, prevSum, diff, pct, best, low, avg };
}

/** teks ringkas untuk kolom manual form (tahun y) */
export function logFieldsFrom(ds, y) {
  const out = {};
  const d = ds?.flow?.do?.byYear?.[y], i = ds?.flow?.inv?.byYear?.[y];
  if (d || i) {
    const per = (x) => (x.partial ? ` (Jan–${x.lastLabel})` : "");
    out.totalDoInvCreated = [d ? `${fmtInt(d.total)} DO${per(d)}` : null, i ? `${fmtInt(i.total)} INV${per(i)}` : null].filter(Boolean).join(" / ");
  }
  const c = ds?.cancel?.byYear?.[y];
  if (c) {
    out.cancelInvTarget = `Target ${targetText(c.target)} · Realisasi ${c.total} dokumen (${c.int} internal, ${c.ext} eksternal)${c.partial ? ` s/d ${c.lastLabel}` : ""}`;
    const r = ds.reasons?.byYear?.[y];
    if (r) {
      const top = (side, n) => [...(r[side]?.items || [])].sort((a, b) => b.n - a.n).slice(0, n).map((x) => `${x.label} ${x.n}`).join(", ");
      out.cancelInvAnalysis = [r.internal ? `Internal terbanyak: ${top("internal", 3)}.` : null, r.external ? `Eksternal terbanyak: ${top("external", 3)}.` : null].filter(Boolean).join(" ");
    }
  }
  const ap = ds?.kpis?.find((k) => k.key === "arsipPo"), ot = ds?.kpis?.find((k) => k.key === "onTime");
  if (ap?.pct != null) out.poSoftcopyArch = `Tercapai ${Math.round(ap.pct)}%${ap.note ? ` — ${ap.note}` : ""}`;
  if (ot?.pct != null) out.csSupportStatus = `On time delivery ${Math.round(ot.pct)}%${ot.note ? ` — ${ot.note}` : ""}`;
  return out;
}