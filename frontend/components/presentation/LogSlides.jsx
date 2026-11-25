"use client";
import React, { useState } from "react";
import { SlideHead, Glass, IconBubble, Sparkline, Insight, fitSize } from "./slides.jsx";
import { PrintCss, InfoBtn, Block, Tbl, DetailPopup, BarChart } from "./HrSlides.jsx";
import { BRAND, feedersOf, isEmptyValue } from "../../lib/presentation/index.js";
import { fmtInt, fmtDec, MONTH_LABEL, flowCompare, cancelStatus, targetText, logFieldsFrom } from "../../lib/presentation/logisticsExcel.js";

/**
 * Slide Admin Logistic dari file Excel (form.logData): poin penting, tren DO/INV, cancel invoice & alasannya.
 * Sengaja sederhana (permintaan Pak Gum). Tiap angka punya ⓘ -> popup: sumber file & baris Excel, cara hitung, tabel, peringatan.
 */

const GOOD = BRAND.emerald;
const BAD = BRAND.bad;
const WARN = BRAND.warn;
const MONTHS = MONTH_LABEL.slice(1);
const when = (iso) => { try { return iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""; } catch { return ""; } };
const sgn = (n, d = 1) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${fmtDec(Math.abs(n), d)}%`;
const R = "right";

/* ------------------------------------------------------------------ data */

export function logOf(data) {
  // Excel bisa diunggah per tahun (tiap laporan tahun punya logData sendiri) ATAU satu file 3 tahun.
  // Semua digabung: untuk tiap tahun dipakai data dari laporan tahun itu sendiri; kalau tidak ada, dari laporan lain yang memuat tahun tsb.
  const found = [];
  for (const yr of [2027, 2026, 2025, 2024]) {
    const l = data?.years?.[yr]?.byDept?.ADM_LOG?.metrics?.logData;
    if (l && typeof l === "object" && (l.flow || l.cancel)) found.push({ yr, l });
  }
  if (!found.length) return null;
  const base = found[0].l; // laporan terbaru jadi dasar (file, KPI, peringatan)
  if (found.length === 1) return base;
  const pick = (year, get) => {
    const own = found.find((f) => f.yr === year && get(f.l)?.[year]);
    if (own) return get(own.l)[year];
    const any = found.find((f) => get(f.l)?.[year]);
    return any ? get(any.l)[year] : undefined;
  };
  const merge = (get, init) => {
    const ys = new Set();
    for (const f of found) Object.keys(get(f.l) || {}).forEach((y) => ys.add(Number(y)));
    const out = { ...init };
    for (const y of [...ys].sort()) { const v = pick(y, get); if (v !== undefined) out[y] = v; }
    return out;
  };
  const flow = {};
  for (const k of ["do", "inv"]) {
    const src = found.find((f) => f.l.flow?.[k]);
    if (src) flow[k] = { ...src.l.flow[k], byYear: merge((l) => l.flow?.[k]?.byYear, {}) };
  }
  const cancel = { ...(base.cancel || found.find((f) => f.l.cancel)?.l.cancel || {}), byYear: merge((l) => l.cancel?.byYear, {}) };
  const reasons = { ...(base.reasons || {}), byYear: merge((l) => l.reasons?.byYear, {}) };
  const years = [...new Set(found.flatMap((f) => (Array.isArray(f.l.years) ? f.l.years : [])).concat(Object.keys(cancel.byYear).map(Number), Object.keys(flow.do?.byYear || {}).map(Number)))].sort();
  const warnings = [...new Set(found.flatMap((f) => (Array.isArray(f.l.warnings) ? f.l.warnings : [])))];
  return { ...base, flow, cancel, reasons, years, warnings };
}

/**
 * Isi kolom KPI Admin Logistic (matriks / panel) untuk tahun yang laporannya belum menyimpan angkanya,
 * diambil dari data Excel gabungan. Nilai yang sudah diisi manual di laporan tahun itu TIDAK ditimpa.
 */
export function withLogBackfill(data) {
  const ds = logOf(data);
  if (!ds || !data?.years) return data;
  const dept = Object.values(data.years).map((b) => b?.byDept?.ADM_LOG?.dept).find(Boolean) || feedersOf(data.cluster).find((d) => d.code === "ADM_LOG");
  if (!dept) return data;
  // hanya isian yang memang punya data PER TAHUN di Excel (arsip PO / on-time tidak per tahun -> tidak diisi otomatis)
  const YEARLY = ["totalDoInvCreated", "cancelInvTarget", "cancelInvAnalysis"];
  const years = { ...data.years };
  let changed = false;
  for (const yr of [2024, 2025, 2026]) {
    const b = years[yr];
    if (!b) continue;
    const fields = logFieldsFrom(ds, yr);
    const cur = b.byDept?.ADM_LOG;
    const metrics = { ...(cur?.metrics || {}) };
    const add = YEARLY.filter((k) => fields[k] != null && isEmptyValue(metrics[k]));
    for (const k of add) metrics[k] = fields[k];
    // vonis cancel invoice memakai target TIAP TAHUN dari Excel (bukan angka tetap 150)
    const c = ds.cancel?.byYear?.[yr], st = c ? cancelStatus(c) : null;
    if (c && st?.ok != null) { metrics.logJudge = { ...(metrics.logJudge || {}), cancelInvTarget: { met: st.ok, targetLabel: targetText(c.target) } }; }
    if (!add.length && !metrics.logJudge) continue;
    years[yr] = { ...b, hasData: true, byDept: { ...b.byDept, ADM_LOG: { ...(cur || {}), dept, report: cur?.report, metrics, filledKeys: [...(cur?.filledKeys || []), ...add] } } };
    changed = true;
  }
  return changed ? { ...data, years } : data;
}

const LOG_YEARS = [2024, 2025, 2026];
/** panel "Per indikator" Admin Logistic: DO, Invoice, Cancel tampil 3 tahun (bukan teks 2026 saja) */
export function logPanels(data) {
  const ds = logOf(data);
  if (!ds) return null;
  const mk = (key, title, icon, color, pick, tag) => {
    const values = LOG_YEARS.map((yy) => { const v = pick(yy); return v ? v.total : null; });
    if (!values.some((v) => v != null)) return null;
    const li = LOG_YEARS[values.map((v) => v != null).lastIndexOf(true)];
    const last = pick(li);
    return { key, title, icon, color, tag, numeric: true, values, max: Math.max(1, ...values.map((v) => v ?? 0)) * 1.15, fmt: (v) => fmtInt(v),
      label: `${li}${last?.partial ? ` · s/d ${last.lastLabel}` : ""}`, value: fmtInt(last.total) };
  };
  return {
    totalDoInvCreated: [
      mk("logDo", "DO terbit per tahun", "box", BRAND.cyan, (yy) => ds.flow?.do?.byYear?.[yy], "total dokumen DO"),
      mk("logInv", "Invoice terbit per tahun", "file", "#a78bfa", (yy) => ds.flow?.inv?.byYear?.[yy], "total dokumen invoice"),
    ].filter(Boolean),
    cancelInvTarget: [mk("logCancel", "Cancel invoice per tahun", "alert", BRAND.warn, (yy) => ds.cancel?.byYear?.[yy], "target tiap tahun berbeda")].filter(Boolean),
  };
}

/** capaian Arsip PO / On-time per tahun, dibaca dari laporan tiap tahun (angka persen di teks isian) */
const pctOf = (t) => { const m = String(t ?? "").match(/(\d+(?:[.,]\d+)?)\s*%/); return m ? Math.round(parseFloat(m[1].replace(",", "."))) : null; };
function kpiByYear(data) {
  const out = [];
  for (const yy of LOG_YEARS) {
    const m = data?.years?.[yy]?.byDept?.ADM_LOG?.metrics;
    if (!m) continue;
    const ap = pctOf(m.poSoftcopyArch), ot = pctOf(m.csSupportStatus);
    if (ap == null && ot == null) continue;
    out.push({ y: yy, v: [ap, ot].filter((x) => x != null).map((x) => `${x}%`).join(" · ") });
  }
  return out;
}

const YC = ["#94a3b8", "#F5B83D"];
const yearChips = (items, latestColor) => items.map((x, i) => ({ ...x, c: i === items.length - 1 ? latestColor : YC[Math.max(0, YC.length - (items.length - 1 - i))] || YC[0] }));

const cancelYears = (ds) => Object.keys(ds?.cancel?.byYear || {}).map(Number).sort();
const cancelUpTo = (c, upTo) => c.months.filter((x) => x.m <= upTo).reduce((s, x) => s + x.tot, 0);

/* ------------------------------------------------------------------ popup */

function Source({ ds }) {
  const at = when(ds.importedAt);
  return (
    <Block title="Dari mana angka ini?">
      <div style={{ fontSize: 16, lineHeight: 1.55 }}>
        File <b>{ds.file || "—"}</b>{ds.sheet ? <> · lembar <b>“{ds.sheet}”</b></> : null}
        {at ? <span style={{ color: BRAND.muted }}> · diunggah {at}</span> : null}
        <div style={{ color: BRAND.muted, fontSize: 14, marginTop: 2 }}>Kolom “Baris Excel” menunjuk baris asal angka di file tersebut. Total dihitung ulang dari angka per bulan, bukan dari sel TOTAL di Excel.</div>
      </div>
    </Block>
  );
}
const How = ({ lines }) => <Block title="Cara hitung"><div style={{ display: "grid", gap: 4, fontSize: 17, lineHeight: 1.45 }}>{lines.map((l, i) => <div key={i}>{l}</div>)}</div></Block>;
const Warnings = ({ list }) => (list?.length ? (
  <Block title="Perlu dicek">
    <div style={{ display: "grid", gap: 6 }}>{list.map((w, i) => <div key={i} style={{ fontSize: 15, lineHeight: 1.4, padding: "8px 12px", borderRadius: 10, background: `${WARN}1f`, border: `1px solid ${WARN}66` }}>⚠ {w}</div>)}</div>
  </Block>
) : null);
const dim = (x) => <span style={{ color: BRAND.muted }}>{x}</span>;

/** isi popup per jenis (diekspor agar bisa diuji): kind = do | inv | cancel | reasons | kpi */
export function LogDetailContent({ kind, ds }) {
  if (kind === "do" || kind === "inv") {
    const f = ds.flow[kind], ys = Object.keys(f.byYear).map(Number).sort();
    const cmp = flowCompare(ds, kind);
    const latest = f.byYear[ys[ys.length - 1]];
    const rowsRef = latest.months;
    const warn = ds.warnings.filter((w) => w.includes(f.label) || w.includes("belum 12 bulan"));
    const lines = [
      `Total tiap tahun = jumlah angka per bulan (Jan sampai bulan terakhir yang terisi).`,
      ...ys.filter((y) => f.byYear[y].partial).map((y) => `${y}: baru terisi sampai ${f.byYear[y].lastLabel}. Bulan kosong = belum diisi / masih berjalan, bukan nol.`),
      cmp?.prev ? `Perbandingan adil: ${cmp.y} (${fmtInt(cmp.curSum)}) vs ${cmp.py} periode yang sama Jan–${cmp.upToLabel} (${fmtInt(cmp.prevSum)}) = ${cmp.diff >= 0 ? "+" : "−"}${fmtInt(Math.abs(cmp.diff))} (${sgn(cmp.pct)}).` : null,
      cmp ? `Rata-rata ${cmp.y}: ${fmtDec(cmp.avg, 0)} per bulan (${fmtInt(cmp.cur.total)} ÷ ${cmp.cur.months.length} bulan).` : null,
    ].filter(Boolean);
    return (<>
      <Source ds={ds} /><How lines={lines} />
      <Block title="Rincian per bulan">
        <Tbl align={["left", ...ys.map(() => R), R]} head={["Bulan", ...ys, "Baris Excel"]}
          rows={rowsRef.map((x) => [x.label, ...ys.map((y) => { const v = f.byYear[y].months.find((z) => z.m === x.m)?.v; return v == null ? dim("—") : fmtInt(v); }), dim(x.row)])}
          foot={["Total", ...ys.map((y) => `${fmtInt(f.byYear[y].total)}${f.byYear[y].partial ? ` (s/d ${f.byYear[y].lastLabel})` : ""}`), ""]} />
      </Block>
      <Warnings list={warn} />
    </>);
  }
  if (kind === "cancel") {
    const ys = cancelYears(ds), by = ds.cancel.byYear;
    const warn = ds.warnings.filter((w) => /cancel|target/i.test(w) && !/alasan/i.test(w));
    return (<>
      <Source ds={ds} />
      <How lines={[
        "Cancel per bulan = cancel internal + cancel eksternal. Total tahun = jumlah per bulan.",
        "Tiap tahun dinilai dengan target pada judul tabelnya sendiri (target 2026 berbeda dengan 2024/2025).",
        "Tahun berjalan dinilai berdasarkan realisasi sampai bulan terakhir yang terisi, jadi masih bisa berubah.",
      ]} />
      <Block title="Rekap per tahun">
        <Tbl align={["left", R, R, R, "left", "left", R]} head={["Tahun", "Internal", "Eksternal", "Total", "Target", "Status", "Baris Excel"]}
          rows={ys.map((y) => { const c = by[y], s = cancelStatus(c); return [y + (c.partial ? ` (s/d ${c.lastLabel})` : ""), c.int, c.ext, <b key="t">{c.total}</b>, targetText(c.target) + (s?.parts?.length ? ` → ${s.parts.map((p) => `${p.val}/${p.max}`).join(", ")}` : ""),
            s?.ok == null ? "—" : <b key="s" style={{ color: s.ok ? GOOD : BAD }}>{s.ok ? (c.partial ? "Dalam target" : "Tercapai") : "Melewati target"}</b>, dim(`${c.months[0].row}–${c.months[c.months.length - 1].row}`)]; })} />
      </Block>
      <Block title="Per bulan (internal / eksternal)">
        <Tbl align={["left", ...ys.map(() => R)]} head={["Bulan", ...ys]}
          rows={MONTHS.map((lab, i) => [lab, ...ys.map((y) => { const x = by[y].months.find((z) => z.m === i + 1); return x ? `${x.int} / ${x.ext}` : dim("—"); })])}
          foot={["Total", ...ys.map((y) => `${by[y].int} / ${by[y].ext}`)]} />
      </Block>
      <Warnings list={warn} />
    </>);
  }
  if (kind === "reasons") {
    const ys = Object.keys(ds.reasons.byYear).map(Number).sort();
    const warn = ds.warnings.filter((w) => /alasan|rincian/i.test(w));
    return (<>
      <Source ds={ds} />
      <How lines={["Jumlah per alasan dibaca dari tabel “Analisis & Rincian Cancel Invoice” tiap tahun. Persen = jumlah alasan ÷ total sisi itu (internal atau eksternal).", "Daftar alasan bisa berbeda antar tahun; alasan yang tidak ada di tahun lain tidak diberi angka."]} />
      {ys.map((y) => ["internal", "external"].map((side) => { const s = ds.reasons.byYear[y][side]; if (!s) return null; return (
        <Block key={`${y}${side}`} title={`${side === "internal" ? "Internal" : "Eksternal"} ${y}`}>
          <Tbl align={["left", R, R, R]} head={["Alasan", "Jumlah", "Porsi", "Baris Excel"]}
            rows={[...s.items].sort((a, b) => b.n - a.n).map((x) => [x.label, x.n, `${fmtDec((x.n / s.total) * 100, 0)}%`, dim(x.row)])}
            foot={["Total", s.total, "100%", ""]} />
        </Block>); }))}
      <Warnings list={warn} />
    </>);
  }
  // kpi
  return (<>
    <Source ds={ds} />
    <How lines={["Nilai dibaca dari sel di samping judul. Format persen di Excel (1 = 100%) dibaca sebagai persen.", "Catatan = baris “note” tepat di bawah judul."]} />
    <Block title="Rincian">
      <Tbl align={["left", R, "left", R]} head={["Indikator", "Hasil", "Catatan", "Baris Excel"]}
        rows={ds.kpis.map((k) => [k.label, k.pct == null ? "—" : `${Math.round(k.pct)}%`, k.note || "—", dim(k.row)])} />
    </Block>
  </>);
}

/* ------------------------------------------------------------------ elemen */

function KeyCard({ icon, color, label, value, status, statusText, sub, chip, chipColor, spark, years, onInfo }) {
  return (
    <Glass accent={color} style={{ padding: years?.length > 1 ? "8px 20px" : "12px 22px", gap: years?.length > 1 ? 3 : 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <IconBubble name={icon} color={color} size={years?.length > 1 ? 32 : 42} />
        <div style={{ flex: 1, fontSize: 14, letterSpacing: 2.5, fontWeight: 800, color: BRAND.muted, textTransform: "uppercase", lineHeight: 1.25 }}>{label}</div>
        {status != null && <span style={{ fontSize: 13, fontWeight: 800, color, background: `${color}1f`, border: `1px solid ${color}66`, borderRadius: 99, padding: "4px 12px", whiteSpace: "nowrap" }}>{statusText}</span>}
        <InfoBtn onClick={onInfo} color={color} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: fitSize(value, years?.length > 1 ? 40 : 54, 30), fontWeight: 850, letterSpacing: -2, lineHeight: 1, whiteSpace: "nowrap" }}>{value}</div>
        {spark}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {chip && <span style={{ fontSize: 14, fontWeight: 800, color: chipColor || color, background: `${chipColor || color}1f`, borderRadius: 99, padding: "3px 12px", whiteSpace: "nowrap" }}>{chip}</span>}
        <span style={{ fontSize: 15, color: BRAND.muted, lineHeight: 1.35 }}>{sub}</span>
      </div>
      {years?.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", borderTop: `1px solid ${BRAND.line || "#ffffff1a"}`, paddingTop: 4 }}>
          {years.map((x) => (
            <div key={x.y} style={{ flex: 1, minWidth: 0, background: `${x.c}14`, border: `1px solid ${x.c}55`, borderRadius: 10, padding: "2px 10px" }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 800, color: x.c }}>{x.y}{x.note ? <span style={{ color: BRAND.muted, fontWeight: 600, letterSpacing: 0 }}> {x.note}</span> : null}</div>
              <div style={{ fontSize: 17, fontWeight: 850, lineHeight: 1.1, whiteSpace: "nowrap" }}>{x.v}</div>
            </div>
          ))}
        </div>
      )}
    </Glass>
  );
}

const Legend = ({ items }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 13, color: BRAND.muted }}>
    {items.map((it) => <span key={it.t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><i style={{ width: 11, height: 11, borderRadius: 3, background: it.c, opacity: it.o ?? 1 }} />{it.t}</span>)}
  </div>
);

/* ------------------------------------------------------------------ slide 1: poin penting */

function LogKeySlide({ ds, accent, data }) {
  const [open, setOpen] = useState(null);
  const cards = [], facts = [];

  for (const k of ["do", "inv"]) {
    const c = flowCompare(ds, k);
    if (!c) continue;
    const name = k === "do" ? "DO" : "Invoice";
    const per = c.cur.partial ? `Jan–${c.upToLabel} ${c.y}` : `Tahun ${c.y}`;
    cards.push({ cid: k, kind: k, icon: k === "do" ? "box" : "file", color: k === "do" ? BRAND.cyan : "#a78bfa", label: `${name} terbit · ${per}`, value: fmtInt(c.curSum),
      sub: c.prev ? `${c.py} periode sama: ${fmtInt(c.prevSum)} · rata-rata ${fmtDec(c.avg, 0)}/bln` : `rata-rata ${fmtDec(c.avg, 0)}/bln`,
      chip: c.pct == null ? null : `${sgn(c.pct)} vs ${c.py}`, chipColor: c.pct >= 0 ? GOOD : WARN,
      years: yearChips(Object.keys(ds.flow[k].byYear).map(Number).sort().map((yy) => { const b = ds.flow[k].byYear[yy]; return { y: yy, v: fmtInt(b.total), note: b.partial ? `s/d ${b.lastLabel}` : "" }; }), k === "do" ? BRAND.cyan : "#a78bfa"),
      spark: <Sparkline values={c.cur.months.map((x) => x.v)} color={k === "do" ? BRAND.cyan : "#a78bfa"} w={180} h={40} /> });
    facts.push(`${name} ${per}: ${fmtInt(c.curSum)}${c.pct == null ? "" : `, ${c.pct >= 0 ? "naik" : "turun"} ${fmtDec(Math.abs(c.pct))}% dari periode sama ${c.py}`}.`);
  }

  const cy = cancelYears(ds), y = cy[cy.length - 1];
  if (y) {
    const c = ds.cancel.byYear[y], s = cancelStatus(c), py = cy.length > 1 ? cy[cy.length - 2] : null, pc = py ? ds.cancel.byYear[py] : null;
    const prevSame = pc ? cancelUpTo(pc, c.last) : null, g = prevSame ? ((c.total - prevSame) / prevSame) * 100 : null;
    const color = s?.ok === false ? BAD : s?.ok ? GOOD : BRAND.cyan;
    cards.push({ cid: "cancel", kind: "cancel", icon: "alert", color, label: `Cancel invoice · ${c.partial ? `Jan–${c.lastLabel} ` : ""}${y}`, value: `${c.total}`,
      status: s?.ok, statusText: s?.ok ? (c.partial ? "✓ Dalam target" : "✓ Tercapai") : "✕ Melewati target",
      sub: `${c.int} internal · ${c.ext} eksternal · target maks. ${c.target?.total != null ? c.target.total : [c.target?.internal, c.target?.external].filter((x) => x != null).join(" / ")}`,
      chip: g == null ? null : `${sgn(g, 0)} vs ${py}`, chipColor: g != null && g <= 0 ? GOOD : WARN,
      years: yearChips(cy.map((yy) => { const b = ds.cancel.byYear[yy]; return { y: yy, v: String(b.total), note: b.partial ? `s/d ${b.lastLabel}` : "" }; }), color),
      spark: <Sparkline values={c.months.map((x) => x.tot)} color={color} w={180} h={40} /> });
    facts.push(`Cancel invoice ${y}: ${c.total} dokumen (${c.int} internal, ${c.ext} eksternal)${s?.ok ? ", masih dalam target" : s?.ok === false ? ", melewati target" : ""}${c.partial ? `; data sampai ${c.lastLabel}, masih berjalan` : ""}.`);
  }

  const ap = ds.kpis?.find((k) => k.key === "arsipPo"), ot = ds.kpis?.find((k) => k.key === "onTime");
  if (ap?.pct != null || ot?.pct != null) {
    const both = [ap, ot].filter((k) => k?.pct != null);
    const ok = both.every((k) => k.pct >= 100);
    cards.push({ cid: "kpi", kind: "kpi", icon: "star", color: ok ? GOOD : WARN, label: "Arsip PO · On-time delivery", value: both.map((k) => `${Math.round(k.pct)}%`).join(" · "),
      status: ok, statusText: "✓ Tercapai",
      sub: "Arsip PO customer · support on-time delivery",
      years: (() => { const ky = kpiByYear(data); return ky.length > 1 ? yearChips(ky.map((x) => ({ y: x.y, v: x.v, note: "" })), ok ? GOOD : WARN) : null; })() });
  }

  // ringkasan 3 tahun
  const arrow = (vals) => vals.join(" → ");
  const flowLine = (k, nm) => {
    const f = ds.flow?.[k]; if (!f) return null;
    const ys = Object.keys(f.byYear).map(Number).sort();
    const c = flowCompare(ds, k);
    const last = f.byYear[ys[ys.length - 1]];
    return `${nm}: ${arrow(ys.map((yy) => fmtInt(f.byYear[yy].total)))} (${ys.join("/")}${last.partial ? `, ${ys[ys.length - 1]} s/d ${last.lastLabel}` : ""})${c?.pct != null ? `, ${sgn(c.pct)} vs periode sama ${c.py}` : ""}.`;
  };
  const cyAll = cancelYears(ds);
  const cancelLine = cyAll.length ? (() => { const lc = ds.cancel.byYear[cyAll[cyAll.length - 1]], stt = cancelStatus(lc); return `Cancel invoice: ${arrow(cyAll.map((yy) => ds.cancel.byYear[yy].total))} (${cyAll.join("/")})${stt?.ok != null ? `; ${cyAll[cyAll.length - 1]} ${stt.ok ? "dalam target" : "melewati target"}` : ""}.`; })() : null;
  const summary3 = [flowLine("do", "DO"), flowLine("inv", "Invoice"), cancelLine].filter(Boolean).join(" ");

  const cur = cards.find((c) => c.cid === open);
  return (
    <div>
      <SlideHead color={accent} eyebrow="Admin Logistic" title="Poin penting Admin Logistic" sub="Dihitung otomatis dari Excel. Klik ⓘ untuk sumber dan cara hitung." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr auto", gap: 16, alignContent: "stretch", minHeight: 0 }}>
        <PrintCss />
        {cards.map((c, i) => <div key={c.cid} style={{ display: "flex", flexDirection: "column", minHeight: 0, gridColumn: cards.length % 2 === 1 && i === cards.length - 1 ? "1 / -1" : "auto" }}><KeyCard {...c} onInfo={() => setOpen(c.cid)} /></div>)}
        {facts.length > 0 && <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan 2024–2026">{summary3 || [facts[0], facts.find((f) => f.startsWith("Cancel"))].filter(Boolean).join(" ")}</Insight></div>}
        {cur && <DetailPopup title={cur.label} sub="Rincian sumber dan perhitungan" onClose={() => setOpen(null)}><LogDetailContent kind={cur.kind} ds={ds} /></DetailPopup>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ slide 2: tren DO / INV */

function LogTrendSlide({ ds, accent }) {
  const [open, setOpen] = useState(null);
  const panels = [];
  for (const k of ["do", "inv"]) {
    const f = ds.flow?.[k]; if (!f) continue;
    const ys = Object.keys(f.byYear).map(Number).sort();
    // warna beda jelas per tahun (bukan sekadar pudar): terlama = abu terang, tengah = kuning, terbaru = warna panel
    const YEAR_COLORS = ["#94a3b8", "#F5B83D"];
    const sty = (i) => { const back = ys.length - 1 - i; return back === 0 ? { color: k === "do" ? BRAND.cyan : "#a78bfa", opacity: 1 } : { color: YEAR_COLORS[Math.max(0, 1 - (back - 1))] || "#94a3b8", opacity: 1 }; };
    const series = ys.map((y, i) => ({ name: String(y), ...sty(i), values: MONTHS.map((_, mi) => f.byYear[y].months.find((x) => x.m === mi + 1)?.v ?? null) }));
    panels.push({ k, label: k === "do" ? "DO terbit per bulan" : "Invoice terbit per bulan", ys, series, legend: ys.map((y, i) => ({ t: `${y}${f.byYear[y].partial ? ` (s/d ${f.byYear[y].lastLabel})` : ""} · total ${fmtInt(f.byYear[y].total)}`, c: sty(i).color, o: sty(i).opacity })) });
  }
  const facts = ["do", "inv"].map((k) => {
    const f = ds.flow?.[k]; if (!f) return null;
    const ys = Object.keys(f.byYear).map(Number).sort();
    const per = ys.map((yy) => { const ms = f.byYear[yy].months; const hi = ms.reduce((a, x) => (x.v > a.v ? x : a), ms[0]), lo = ms.reduce((a, x) => (x.v < a.v ? x : a), ms[0]); return `${yy} ${hi.label} ${fmtInt(hi.v)} / ${lo.label} ${fmtInt(lo.v)}`; });
    return `${k === "do" ? "DO" : "Invoice"} tertinggi / terendah — ${per.join(" · ")}.`;
  }).filter(Boolean);
  const cur = panels.find((p) => p.k === open);
  return (
    <div>
      <SlideHead color={accent} eyebrow="Admin Logistic" title="DO & Invoice per bulan" sub="Dokumen terbit per bulan, dibanding antar tahun. Bulan kosong = belum diisi." />
      <div style={{ display: "grid", gridTemplateColumns: panels.length > 1 ? "1fr 1fr" : "1fr", gridTemplateRows: "1fr auto", gap: 16, minHeight: 0 }}>
        <PrintCss />
        {panels.map((p) => (
          <Glass key={p.k} style={{ padding: "16px 20px", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 19, fontWeight: 800 }}>{p.label}</div>
              <InfoBtn onClick={() => setOpen(p.k)} color={p.series[p.series.length - 1].color} />
            </div>
            <BarChart labels={MONTHS} series={p.series} fmtTick={(v) => fmtInt(v)} fmtVal={(v) => fmtInt(v)} />
            <Legend items={p.legend} />
          </Glass>
        ))}
        <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan 2024–2026">{facts.join(" ")}</Insight></div>
        {cur && <DetailPopup title={cur.label} sub="Rincian per bulan" onClose={() => setOpen(null)}><LogDetailContent kind={cur.k} ds={ds} /></DetailPopup>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ slide 3: cancel invoice */

function ReasonCol({ title, color, side }) {
  const top = side ? [...side.items].sort((x, y) => y.n - x.n).slice(0, 3) : [];
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 800, color, marginBottom: 2 }}>{title}{side ? ` · ${side.total}` : ""}</div>
      {top.length ? top.map((x) => (
        <div key={x.label} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, fontSize: 13, lineHeight: 1.45 }}>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={x.label}>{x.label}</span>
          <b>{x.n}</b>
        </div>
      )) : <div style={{ fontSize: 12, color: BRAND.muted }}>—</div>}
    </div>
  );
}

function LogCancelSlide({ ds, accent }) {
  const [open, setOpen] = useState(null);
  const ys = cancelYears(ds), by = ds.cancel.byYear;
  const labels = ys.map((y) => `${y}${by[y].partial ? ` (s/d ${by[y].lastLabel})` : ""}`);
  const series = [
    { name: "Internal", color: BRAND.cyan, showValues: true, values: ys.map((y) => by[y].int) },
    { name: "Eksternal", color: "#a78bfa", showValues: true, values: ys.map((y) => by[y].ext) },
  ];
  const ryears = Object.keys(ds.reasons?.byYear || {}).map(Number).sort();
  const ly = ys[ys.length - 1], lc = by[ly], st = cancelStatus(lc);
  const topOf = (yy, side) => { const it = ds.reasons?.byYear?.[yy]?.[side]?.items; return it?.length ? [...it].sort((x, y) => y.n - x.n)[0] : null; };
  const reasonLine = ryears.length ? `Alasan terbanyak (internal / eksternal): ${ryears.map((yy) => { const i = topOf(yy, "internal"), e = topOf(yy, "external"); return `${yy} ${i ? `“${i.label}” ${i.n}` : "—"} / ${e ? `“${e.label}” ${e.n}` : "—"}`; }).join(" · ")}.` : null;
  const facts = [
    `Cancel per tahun: ${ys.map((yy) => `${yy} ${by[yy].total}${by[yy].partial ? ` (s/d ${by[yy].lastLabel})` : ""}`).join(" → ")}. ${ly}: ${lc.int} internal + ${lc.ext} eksternal, target ${targetText(lc.target)}${st?.ok ? " — dalam target" : st?.ok === false ? " — melewati target" : ""}.`,
    reasonLine,
  ].filter(Boolean);
  return (
    <div>
      <SlideHead color={accent} eyebrow="Admin Logistic" title="Cancel invoice & penyebabnya" sub="Cancel per tahun (target tiap tahun berbeda) dan alasan terbanyak." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr auto", gap: 16, minHeight: 0 }}>
        <PrintCss />
        <Glass style={{ padding: "16px 20px", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 19, fontWeight: 800 }}>Cancel invoice per tahun</div>
            <InfoBtn onClick={() => setOpen("cancel")} color={BRAND.cyan} />
          </div>
          <BarChart labels={labels} series={series} fmtTick={(v) => String(Math.round(v))} fmtVal={(v) => String(v)} />
          <Legend items={[{ t: "Internal", c: BRAND.cyan }, { t: "Eksternal", c: "#a78bfa" }]} />
          <div style={{ fontSize: 13, color: BRAND.muted, lineHeight: 1.4 }}>Target: {ys.map((y) => `${y} ${targetText(by[y].target)}`).join(" · ")}</div>
        </Glass>
        <Glass style={{ padding: "12px 20px", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 19, fontWeight: 800 }}>Alasan cancel terbanyak per tahun</div>
            {ryears.length > 0 && <InfoBtn onClick={() => setOpen("reasons")} color="#a78bfa" />}
          </div>
          {ryears.length ? ryears.map((yy, i) => {
            const r = ds.reasons.byYear[yy], col = i === ryears.length - 1 ? "#34d399" : YC[Math.max(0, YC.length - (ryears.length - 1 - i))] || YC[0];
            return (
              <div key={yy} style={{ display: "grid", gridTemplateColumns: "52px 1fr 1fr", gap: 12, alignItems: "start", borderTop: i ? `1px solid ${BRAND.line || "#ffffff1a"}` : "none", paddingTop: i ? 6 : 0 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: col, lineHeight: 1.1 }}>{yy}</div>
                <ReasonCol title="INTERNAL" color={BRAND.cyan} side={r.internal} />
                <ReasonCol title="EKSTERNAL" color="#a78bfa" side={r.external} />
              </div>
            );
          }) : <div style={{ color: BRAND.muted, fontSize: 16 }}>Rincian alasan belum ada di file.</div>}
        </Glass>
        <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan 2024–2026">{facts.join(" ")}</Insight></div>
        {open && <DetailPopup title={open === "cancel" ? "Cancel invoice per tahun" : "Alasan cancel invoice"} sub="Rincian sumber dan perhitungan" onClose={() => setOpen(null)}><LogDetailContent kind={open} ds={ds} /></DetailPopup>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pintu masuk dari KpiDeck */

/** [] bila belum ada file Excel Admin Logistic yang diunggah. Dipanggil KpiDeck tepat setelah slide matriks Admin Logistic. */
export function buildLogSlides(data, cfg = {}) {
  const ds = logOf(data);
  if (!ds) return [];
  const out = [];
  if (ds.flow?.do || ds.flow?.inv || cancelYears(ds).length || ds.kpis?.length) out.push({ id: "log-key", label: "Logistik · Poin penting", node: <LogKeySlide ds={ds} accent={cfg.accent} data={data} /> });
  if (ds.flow?.do || ds.flow?.inv) out.push({ id: "log-trend", label: "Logistik · DO & INV", node: <LogTrendSlide ds={ds} accent={cfg.accent} /> });
  if (cancelYears(ds).length) out.push({ id: "log-cancel", label: "Logistik · Cancel", node: <LogCancelSlide ds={ds} accent={cfg.accent} /> });
  return out;
}