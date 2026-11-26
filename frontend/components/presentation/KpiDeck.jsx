"use client";
import React, { useMemo } from "react";
import DeckShell from "./DeckShell.jsx";
import { DashboardSlide, PanelsSlide } from "./KpiDashboard.jsx";
import { CoverSlide, SlideHead, Glass, Eyebrow, ArcGauge, YearBars, Pill, Empty, JourneySlide, FutureSlide, ClosingSlide, TrendSlide, StatTile, ptText, deltaColor, pctText } from "./slides.jsx";
import { buildClusterData, collectByDept, resolveDepartment, feedersOf, ownersOf, phaseOf, toNum, formatRupiah, BRAND, phaseColor, statusOf, isEmptyValue } from "../../lib/presentation/index.js";
import { buildHrSlides } from "./HrSlides.jsx";
import { buildLogSlides, withLogBackfill, logPanels } from "./LogSlides.jsx";
import { buildArSlides, withArBackfill, arPanels } from "./ArSlides.jsx";
import { buildNotesSlides } from "./NotesSlide.jsx";
import { DEPT_KPIS, OUTLOOK_KEYS, kpiMatrix, scoreOf, excelItems, clip } from "../../lib/presentation/kpi.js";

const ACTUAL_YEARS = [2024, 2025, 2026];
const ALL_YEARS = [2024, 2025, 2026, 2027];
const OWN_RGT = { 2024: "rgtRun", 2025: "rgtGrow", 2026: "rgtTransform" };
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => (typeof x === "string" ? x : x?.title || x?.text || "")).filter(Boolean);
const txt = (v) => (isEmptyValue(v) ? null : String(v).trim());

export const KPI_DECKS = {
  FINANCIAL: { title: "Financial & Tax", eyebrow: "Financial & Tax", accent: BRAND.cyan, tagline: "Disiplin keuangan, kepatuhan pajak, dan arus kas yang sehat." },
  OPERATIONAL_HOSPITALITY: { title: "Operational & Logistics", eyebrow: "Operational & Logistics", accent: BRAND.emerald, tagline: "Pengadaan, pengiriman, dokumen, dan SDM yang menopang pertumbuhan." },
};

const MET = { true: { color: BRAND.emerald, mark: "✓" }, false: { color: BRAND.bad, mark: "✕" }, null: { color: BRAND.muted, mark: "•" } };

function Cell({ c, future }) {
  if (!c) return <div style={{ color: BRAND.line, fontSize: 18 }}>—</div>;
  const s = MET[String(c.met)];
  const col = future ? phaseColor("Future") : s.color;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ color: col, fontWeight: 800, fontSize: 15, lineHeight: "20px" }}>{future ? "◆" : s.mark}</span>
      <span title={c.raw} style={{ fontSize: c.display.length > 14 ? 17 : 24, fontWeight: c.display.length > 14 ? 500 : 800, lineHeight: 1.3, color: future ? BRAND.text : c.met == null ? BRAND.text : s.color, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.display}</span>
    </div>
  );
}

/** satu departemen x empat tahun */
export function DeptMatrixSlide({ dept, matrix, accent, support }) {
  const rows = matrix.rows.filter((r) => ALL_YEARS.some((y) => r.cells[y])).slice(0, 8);
  const grid = "290px 96px repeat(4, 1fr)";
  return (
    <div>
      <SlideHead color={accent} eyebrow={support ? `${dept.name} · data pendukung` : dept.name} title="Target & capaian 2024–2027"
        right={<span style={{ fontSize: 12, color: BRAND.muted }}>✓ tercapai · ✕ belum · • informasi · ◆ rencana 2027</span>} />
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: "0 14px", padding: "0 18px 10px", fontSize: 12, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>
        <span style={{ color: BRAND.muted }}>Indikator</span><span style={{ color: BRAND.muted }}>Target</span>
        {ALL_YEARS.map((y) => <span key={y} style={{ color: phaseColor(phaseOf(y)?.phase) }}>{y} · {phaseOf(y)?.label}</span>)}
      </div>
      <div style={{ display: "grid", gap: rows.length > 6 ? 6 : 9 }}>
        {rows.map((r) => (
          <Glass key={r.key} style={{ padding: "11px 18px", display: "grid", gridTemplateColumns: grid, gap: "0 14px", alignItems: "center", minHeight: rows.length > 6 ? 48 : 56, boxSizing: "border-box" }}>
            <div style={{ fontSize: 20, lineHeight: 1.25 }}>{r.label}</div>
            <div style={{ fontSize: 14, color: BRAND.muted }}>{r.targetLabel || "—"}</div>
            {ALL_YEARS.map((y) => <Cell key={y} c={r.cells[y]} future={y === 2027} />)}
          </Glass>
        ))}
      </div>
    </div>
  );
}

/** tabel target–aktual dari upload Excel (per departemen, tahun terbaru yang punya baris) */
function ExcelSlide({ dept, year, items, accent }) {
  const rows = items.map((p) => ({ ...p, t: toNum(p.target), a: toNum(p.actual) })).filter((p) => p.t !== 0 || p.a !== 0 || txt(p.note)).map((p) => ({ ...p, pct: p.t > 0 ? (p.a / p.t) * 100 : null }));
  const unit = (v) => v.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  return (
    <div>
      <SlideHead color={accent} eyebrow={`${dept.name} · ${year}`} title="Detail dari file Excel" />
      <div style={{ display: "grid", gap: rows.length > 5 ? 16 : 26, alignContent: "center" }}>
        {rows.slice(0, 8).map((p, k) => { const s = statusOf(p.pct); return (
          <div key={k} style={{ display: "grid", gridTemplateColumns: "320px 1fr 210px", alignItems: "center", gap: 20, fontSize: 20 }}>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}{p.note ? <div style={{ fontSize: 12, color: BRAND.muted, overflow: "hidden", textOverflow: "ellipsis" }}>{clip(p.note, 60)}</div> : null}</div>
            <div style={{ height: 18, background: BRAND.line, borderRadius: 99, overflow: "hidden" }}>{p.pct != null && <div style={{ width: `${Math.min(100, p.pct)}%`, height: "100%", background: s.color, borderRadius: 99 }} />}</div>
            <div style={{ textAlign: "right", fontWeight: 700, color: p.pct == null ? BRAND.text : s.color }}>{p.pct == null ? unit(p.a) : `${p.pct.toFixed(1)}%`}<div style={{ fontSize: 12, color: BRAND.muted, fontWeight: 400 }}>{unit(p.a)} / {unit(p.t)}</div></div>
          </div>); })}
        {rows.length > 8 && <div style={{ color: BRAND.muted, fontSize: 13 }}>+{rows.length - 8} baris lain ada di file</div>}
      </div>
    </div>
  );
}

function BadDebtSlide({ year, list, accent }) {
  const total = list.reduce((s, b) => s + toNum(b.amount), 0);
  return (
    <div>
      <SlideHead color={accent} eyebrow={`Finance AR · ${year}`} title="Piutang bermasalah (bad debt)"
        right={<div style={{ textAlign: "right" }}><div style={{ fontSize: 12, letterSpacing: 2, color: BRAND.muted }}>TOTAL</div><div style={{ fontSize: 34, fontWeight: 800, color: BRAND.bad }}>{formatRupiah(total)}</div></div>} />
      <div style={{ display: "grid", gap: 10 }}>
        {list.slice(0, 7).map((b, k) => (
          <Glass key={b.id ?? k} style={{ padding: "12px 20px", display: "grid", gridTemplateColumns: "1fr 190px 170px 1fr", gap: 16, alignItems: "center", fontSize: 24 }}>
            <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.customerName}</div>
            <div style={{ color: BRAND.muted, fontSize: 18 }}>{b.salesPic || "—"}</div>
            <div style={{ fontWeight: 800, color: BRAND.warn }}>{formatRupiah(b.amount)}</div>
            <div style={{ fontSize: 18, color: BRAND.text }}>{clip(b.remarks || "—", 50)}</div>
          </Glass>))}
        {list.length > 7 && <div style={{ color: BRAND.muted, fontSize: 13 }}>+{list.length - 7} customer lain</div>}
      </div>
    </div>
  );
}

/** Panel angka keuangan (Rp) dari isian opsional form Finance Dept / AR / AP. Hanya panel yang punya data. */
const MONEY_PANELS = [
  { dept: "FIN_DEPT", id: "cashEnd", title: "Saldo kas akhir tahun", icon: "layers", keys: ["cashEnd"] },
  { dept: "FIN_DEPT", id: "cashFlow", title: "Arus kas", icon: "trendUp", keys: ["cashIn", "cashOut"], second: "#F5B83D", net: true },
  { dept: "FIN_DEPT", id: "reserve", title: "Dana cadangan", icon: "target", keys: ["reserveFund"] },
  { dept: "FIN_AR", id: "ar", title: "Piutang vs overdue", icon: "file", keys: ["arOutstanding", "arOverdue"], second: "#F5B83D", ratio: "overdue" },
  { dept: "FIN_AP", id: "ap", title: "Hutang vs terbayar", icon: "file", keys: ["apOutstanding", "apPaid"], second: "#F5B83D" },
];
const moneyShort = (v) => formatRupiah(v).replace(/^Rp\s*/, "");
export function moneyPanels(y, solo) {
  const val = (yr, dept, k) => { const raw = y[yr].byDept[dept]?.metrics?.[k]; return isEmptyValue(raw) ? null : toNum(raw); };
  const out = [];
  for (const p of MONEY_PANELS) {
    if (solo && solo.code !== p.dept) continue;
    const series = p.keys.map((k, i) => ({ values: ACTUAL_YEARS.map((yr) => val(yr, p.dept, k)), color: i === 1 ? p.second : undefined }));
    if (!series.some((s) => s.values.some((v) => v != null))) continue;
    const li = [...ACTUAL_YEARS].reverse().find((yr) => series.some((s) => s.values[ACTUAL_YEARS.indexOf(yr)] != null));
    const ix = ACTUAL_YEARS.indexOf(li); const a = series[0].values[ix], b = series[1]?.values[ix];
    let value = moneyShort(a ?? b ?? 0), label = `${li}`;
    if (p.net && a != null && b != null) { value = moneyShort(a - b); label = `${li} · selisih bersih`; }
    else if (p.ratio && a > 0 && b != null) { value = `${((b / a) * 100).toFixed(1)}%`; label = `${li} · overdue dari total`; }
    const legend = series[1] ? (p.net ? "kas masuk / keluar" : p.ratio ? "total / overdue" : "total / terbayar") : undefined;
    out.push({ key: p.id, title: p.title, icon: p.icon, tag: legend, label, value, numeric: true, series, max: Math.max(1, ...series.flatMap((s) => s.values.map((v) => v ?? 0))) * 1.15, fmt: moneyShort });
  }
  return out;
}

export function buildKpiSlides(rawData, cfg, { plantName = "", deptCode = null } = {}) {
  const data = withArBackfill(withLogBackfill(rawData)); // kolom KPI Admin Logistic 2024/2025 diisi dari Excel bila laporan tahun itu belum menyimpannya
  if (data.needsPlant) return [{ id: "plant", label: "Pilih plant", node: <div style={{ height: "100%", display: "grid", placeItems: "center" }}><Empty hint="Data berisi lebih dari satu plant — pilih plant dulu agar angka tidak tercampur.">Plant belum dipilih</Empty></div> }];

  const feeders = feedersOf(data.cluster).filter((d) => DEPT_KPIS[d.code] && (!deptCode || d.code === deptCode));
  const solo = deptCode ? feeders[0] : null; // mode satu divisi
  const codes = feeders.map((d) => d.code);
  const y = data.years;
  const ownCluster = (d) => d.cluster === data.cluster;

  const scores = ALL_YEARS.map((yr) => ({ year: yr, ...scoreOf(data, codes, yr) }));
  const latest = [...ACTUAL_YEARS].reverse().find((yr) => scores.find((s) => s.year === yr).total > 0) ?? null;
  const cur = latest ? scores.find((s) => s.year === latest) : null;
  const prev = latest ? scores.find((s) => s.year === latest - 1) : null;
  const delta = cur?.pct != null && prev?.pct != null ? cur.pct - prev.pct : null;

  // departemen yang punya isi (KPI form ATAU Excel) di tahun manapun
  const deptSlides = [];
  const logSlides = [];
  for (const d of feeders) {
    const m = kpiMatrix(data, d.code);
    let excelYear = null, items = [];
    for (const yr of [...ACTUAL_YEARS].reverse()) {
      const it = excelItems(y[yr].byDept[d.code]?.metrics);
      if (it.length) { excelYear = yr; items = it; break; }
    }
    if (m.hasData) deptSlides.push({ id: `d-${d.code}`, label: d.short, node: <DeptMatrixSlide dept={d} matrix={m} accent={cfg.accent} support={!ownCluster(d)} /> });
    if (items.length) deptSlides.push({ id: `x-${d.code}`, label: `${d.short} (Excel)`, node: <ExcelSlide dept={d} year={excelYear} items={items} accent={cfg.accent} /> });
    if (d.code === "HR_MR") deptSlides.push(...buildHrSlides(data, { accent: cfg.accent }));
    if (d.code === "ADM_LOG") logSlides.push(...buildLogSlides(data, { accent: cfg.accent }));
    if (d.code === "FIN_AR") logSlides.push(...buildArSlides(data, { accent: cfg.accent }));
  }

  // perjalanan: teks evaluasi per departemen + RGT dari laporan
  const firstText = (yr, k) => { for (const r of y[yr].reports) if (txt(r?.[k])) return txt(r[k]); return null; };
  const journey = ACTUAL_YEARS.map((yr) => {
    const evals = Object.values(y[yr].byDept).filter((e) => !solo || e.dept.code === solo.code).map((e) => {
      const key = DEPT_KPIS[e.dept.code]?.evaluationKey;
      const t = txt(e.metrics?.[key]) || txt(e.metrics?.generalNotes);
      return t ? `${e.dept.short}: ${clip(t, 84)}` : null;
    }).filter(Boolean);
    const rgt = firstText(yr, OWN_RGT[yr]);
    return { year: yr, phase: phaseOf(yr)?.phase, items: evals.slice(0, 3) };
  });

  const f = y[2027];
  const outlooks = collectByDept(f, OUTLOOK_KEYS).map((o) => ({ ...o, value: clip(o.value, 170) }));
  const wins = f.reports.flatMap((r) => asList(r.opportunities));
  const risks = f.reports.flatMap((r) => asList(r.challenges));
  const ey = latest ?? 2026;
  const attention = latest
    ? feeders.flatMap((d) => kpiMatrix(data, d.code, [latest]).rows.filter((r) => r.cells[latest]?.met === false).map((r) => ({ dept: d.short, label: r.label, shown: r.cells[latest].display, target: r.targetLabel })))
    : [];

  // bad debt (Finance AR): tahun terbaru yang punya daftar
  let badInfo = null;
  if (data.cluster === "FINANCIAL" && (!solo || solo.code === "FIN_AR")) {
    for (const yr of [...ACTUAL_YEARS].reverse()) {
      const l = y[yr].byDept.FIN_AR?.metrics?.badDebtList;
      const clean = (Array.isArray(l) ? l : []).filter((b) => txt(b?.customerName) || toNum(b?.amount));
      if (clean.length) { badInfo = { year: yr, list: clean }; break; }
    }
  }
  const notesSlides = buildNotesSlides(data, { solo, accent: cfg.accent });
  const bad = badInfo && !logSlides.some((x) => x.id === "ar-baddebt") ? [{ id: "baddebt", label: "Bad debt", node: <BadDebtSlide year={badInfo.year} list={badInfo.list} accent={cfg.accent} /> }] : [];
  // panel per departemen (klaster) / per indikator (satu divisi)
  const panelItems = solo
        ? kpiMatrix(data, solo.code).rows.filter((r) => ACTUAL_YEARS.some((yr) => r.cells[yr])).flatMap((r) => {
        const lp = solo.code === "ADM_LOG" ? logPanels(data) : solo.code === "FIN_AR" ? arPanels(data) : null;
        if (lp?.[r.key]?.length) return lp[r.key]; // DO / Invoice / Cancel: 3 tahun dari Excel
        const cs = ACTUAL_YEARS.map((yr) => r.cells[yr]);
        const lastC = [...cs].reverse().find(Boolean);
        const hasVal = cs.some((c) => c && c.value != null), hasMet = cs.some((c) => c && c.met != null);
        const base = { key: r.key, title: r.label, tag: r.targetLabel ? `target ${r.targetLabel}` : undefined, label: `${latest ?? ""}`, value: clip(lastC?.display ?? "—", 12), icon: "target" };
        if (hasVal) { const vals = cs.map((c) => (c && c.value != null ? c.value : null)); return { ...base, numeric: true, values: vals, max: r.kind === "pct" ? Math.max(100, ...vals.map((v) => v ?? 0)) : Math.max(1, ...vals.map((v) => v ?? 0)) * 1.15, fmt: (v) => (r.kind === "pct" ? `${Math.round(v)}%` : `${Math.round(v * 10) / 10}`) }; }
        if (hasMet) return { ...base, numeric: true, values: cs.map((c) => (c && c.met != null ? (c.met ? 100 : 35) : null)), max: 100, fmt: (v) => (v >= 100 ? "✓" : "✕") };
        return { ...base, text: clip(lastC?.raw ?? "", 150) };
      })
    : feeders.map((d) => {
        const vs = ACTUAL_YEARS.map((yr) => { const s = scoreOf(data, [d.code], yr); return s.total > 0 ? s.pct : null; });
        const sl = latest ? scoreOf(data, [d.code], latest) : null;
        const key = DEPT_KPIS[d.code]?.evaluationKey; const ev = ACTUAL_YEARS.map((yr) => txt(y[yr].byDept[d.code]?.metrics?.[key])).filter(Boolean).pop();
        const filled = ACTUAL_YEARS.some((yr) => y[yr].byDept[d.code]);
        if (!filled) return null;
        const base = { key: d.code, title: d.short, icon: "layers", tag: ownCluster(d) ? undefined : "pendukung", label: `${latest ?? ""} · ${sl?.ok ?? 0}/${sl?.total ?? 0}`, value: sl && sl.total > 0 ? `${sl.pct.toFixed(0)}%` : "info" };
        return vs.some((v) => v != null) ? { ...base, numeric: true, values: vs, max: 100, fmt: (v) => `${Math.round(v)}%` } : { ...base, text: clip(ev || "Isian informasi (tanpa target angka).", 150) };
      }).filter(Boolean);

  const money = data.cluster === "FINANCIAL" ? moneyPanels(y, solo) : [];
  const moneySlide = money.length ? [{ id: "money", label: "Angka keuangan", node: <PanelsSlide eyebrow={`${solo ? solo.name : cfg.title} · 2024–2026`} title="Angka keuangan (Rp)" items={money} /> }] : [];
  const slides = [
    { id: "cover", label: "Cover", node: <CoverSlide accent={cfg.accent} eyebrow={cfg.eyebrow} title={`${solo ? solo.name : cfg.title} 2024–2027`} subtitle={cfg.tagline} meta={[plantName || "Plant terpilih", "Run 2024", "Grow 2025", "Transform 2026", "Future 2027"]} /> },
  ];

  if (!deptSlides.length && !logSlides.length && !notesSlides.length) {
    slides.push({ id: "empty", label: "Data", node: <div><SlideHead color={cfg.accent} eyebrow="Data" title={cfg.title} /><Empty hint="Belum ada form departemen di klaster ini yang terisi. Isi lewat form (manual atau upload Excel) lalu muat ulang." /></div> });
  } else {
    slides.push(
      { id: "dashboard", label: "Dashboard", node: <DashboardSlide title={`${solo ? solo.name : cfg.title} · KPI Dashboard`} plantName={plantName} latest={latest} scores={scores} cur={cur} delta={delta}
          rows={latest ? feeders.flatMap((d) => kpiMatrix(data, d.code, [latest]).rows.filter((r) => r.cells[latest]).map((r) => ({ dept: d.short, label: r.label, targetLabel: r.targetLabel, cell: r.cells[latest] }))) : []}
          attention={attention} badDebt={badInfo} solo={!!solo}
          completeness={Object.fromEntries(ALL_YEARS.map((yr) => [yr, data.completeness[yr] || null]))}
          filledNote={solo ? `Laporan ${ey} ${y[ey].byDept[solo.code] ? "sudah diisi" : "belum diisi"}.` : `${data.completeness[ey]?.filled ?? 0}/${data.completeness[ey]?.total ?? 0} departemen klaster mengisi laporan ${ey}.`} /> },
      { id: "panels", label: solo ? "Per indikator" : "Per departemen", node: <PanelsSlide eyebrow={`${solo ? solo.name : cfg.title} · 2024–2026`} title={solo ? "Capaian per indikator" : "Capaian per departemen"} items={panelItems} /> },
      ...logSlides,
      ...moneySlide, ...deptSlides, ...bad, ...notesSlides,
    );
  }

  slides.push(
    ...(journey.some((c) => c.items.length) ? [{ id: "journey", label: "Perjalanan", node: <JourneySlide columns={journey} /> }] : []),
    { id: "future", label: "2027", node: <FutureSlide outlooks={outlooks} wins={wins} risks={risks} hint={!solo && data.completeness[2027]?.missing?.length ? `Belum mengisi 2027: ${data.completeness[2027].missing.map((c) => resolveDepartment(c)?.short || c).join(", ")}` : undefined} /> },
    ...(latest && cur?.total > 0 || outlooks.length ? [{ id: "closing", label: "Penutup", node: <ClosingSlide accent={cfg.accent} title="Ringkasan & langkah berikutnya"
      subtitle={cur && cur.total > 0 ? `${solo ? solo.name : cfg.title} ${latest}: ${cur.ok} dari ${cur.total} indikator bertarget tercapai — yang patut dirayakan, dijaga, dan dikejar di 2027.` : undefined}
      wins={latest ? feeders.flatMap((d) => kpiMatrix(data, d.code, [latest]).rows.filter((r) => r.cells[latest]?.met === true).map((r) => clip(`${solo ? "" : d.short + ": "}${r.label} — ${r.cells[latest].display}`, 62))) : []}
      watch={attention.map((a) => clip(`${solo ? "" : a.dept + ": "}${a.label} — ${a.shown}${a.target ? ` (target ${a.target})` : ""}`, 62))}
      next={outlooks.slice(0, 3).map((o) => clip(String(o.value), 110))} /> }] : []),
  );
  return slides;
}

/** deptCode (opsional): tampilkan HANYA satu divisi (deck pegangan divisi). Klaster diambil dari divisi itu sendiri. */
export default function KpiDeck({ cluster, deptCode = null, reports, plantId = null, plantName = "", active = true, onClose }) {
  const dept = deptCode ? resolveDepartment(deptCode) : null;
  const cl = dept ? dept.cluster : cluster;
  const cfg = KPI_DECKS[cl];
  const data = useMemo(() => buildClusterData(reports, { cluster: cl, plantId }), [reports, cl, plantId]);
  const slides = useMemo(() => (cfg ? buildKpiSlides(data, cfg, { plantName, deptCode: dept?.code ?? null }) : []), [data, cfg, plantName, dept]);
  if (!cfg) return null;
  return <DeckShell title={dept ? dept.name : cfg.title} subtitle={plantName} slides={slides} accent={cfg.accent} active={active} onClose={onClose} defaultTheme="dark" fileName={`${dept ? dept.name : cfg.title}${plantName ? ` - ${plantName}` : ""} 2024-2027`} />;
}