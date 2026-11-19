"use client";
import React, { useMemo } from "react";
import DeckShell from "./DeckShell.jsx";
import { CoverSlide, SlideHead, Glass, Eyebrow, ArcGauge, YearBars, Pill, Empty, JourneySlide, FutureSlide } from "./slides.jsx";
import { buildClusterData, collectByDept, resolveDepartment, feedersOf, ownersOf, phaseOf, toNum, formatRupiah, BRAND, phaseColor, statusOf, isEmptyValue } from "../../lib/presentation/index.js";
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
      <span title={c.raw} style={{ fontSize: c.display.length > 14 ? 14 : 20, fontWeight: c.display.length > 14 ? 500 : 800, lineHeight: 1.3, color: future ? BRAND.text : c.met == null ? BRAND.text : s.color, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.display}</span>
    </div>
  );
}

/** satu departemen x empat tahun */
function DeptMatrixSlide({ dept, matrix, accent, support }) {
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
            <div style={{ fontSize: 17, lineHeight: 1.25 }}>{r.label}</div>
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
  const rows = items.map((p) => ({ ...p, t: toNum(p.target), a: toNum(p.actual) })).map((p) => ({ ...p, pct: p.t > 0 ? (p.a / p.t) * 100 : null }));
  const unit = (v) => v.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  return (
    <div>
      <SlideHead color={accent} eyebrow={`${dept.name} · ${year}`} title="Detail dari file Excel" />
      <div style={{ display: "grid", gap: 16 }}>
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
          <Glass key={b.id ?? k} style={{ padding: "12px 20px", display: "grid", gridTemplateColumns: "1fr 190px 170px 1fr", gap: 16, alignItems: "center", fontSize: 18 }}>
            <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.customerName}</div>
            <div style={{ color: BRAND.muted, fontSize: 15 }}>{b.salesPic || "—"}</div>
            <div style={{ fontWeight: 800, color: BRAND.warn }}>{formatRupiah(b.amount)}</div>
            <div style={{ fontSize: 15, color: BRAND.text }}>{clip(b.remarks || "—", 50)}</div>
          </Glass>))}
        {list.length > 7 && <div style={{ color: BRAND.muted, fontSize: 13 }}>+{list.length - 7} customer lain</div>}
      </div>
    </div>
  );
}

export function buildKpiSlides(data, cfg, { plantName = "", deptCode = null } = {}) {
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
  for (const d of feeders) {
    const m = kpiMatrix(data, d.code);
    let excelYear = null, items = [];
    for (const yr of [...ACTUAL_YEARS].reverse()) {
      const it = excelItems(y[yr].byDept[d.code]?.metrics);
      if (it.length) { excelYear = yr; items = it; break; }
    }
    if (m.hasData) deptSlides.push({ id: `d-${d.code}`, label: d.short, node: <DeptMatrixSlide dept={d} matrix={m} accent={cfg.accent} support={!ownCluster(d)} /> });
    if (items.length) deptSlides.push({ id: `x-${d.code}`, label: `${d.short} (Excel)`, node: <ExcelSlide dept={d} year={excelYear} items={items} accent={cfg.accent} /> });
  }

  // bad debt (Finance AR)
  const bad = [];
  if (data.cluster === "FINANCIAL" && (!solo || solo.code === "FIN_AR")) {
    for (const yr of [...ACTUAL_YEARS].reverse()) {
      const l = y[yr].byDept.FIN_AR?.metrics?.badDebtList;
      const clean = (Array.isArray(l) ? l : []).filter((b) => txt(b?.customerName) || toNum(b?.amount));
      if (clean.length) { bad.push({ id: "baddebt", label: "Bad debt", node: <BadDebtSlide year={yr} list={clean} accent={cfg.accent} /> }); break; }
    }
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
    return { year: yr, phase: phaseOf(yr)?.phase, items: [rgt ? clip(rgt, 90) : null, ...evals].filter(Boolean).slice(0, 3) };
  });

  const f = y[2027];
  const outlooks = collectByDept(f, OUTLOOK_KEYS).map((o) => ({ ...o, value: clip(o.value, 170) }));
  const wins = f.reports.flatMap((r) => asList(r.opportunities));
  const risks = f.reports.flatMap((r) => asList(r.challenges));
  const ey = latest ?? 2026;
  const attention = latest
    ? feeders.flatMap((d) => kpiMatrix(data, d.code, [latest]).rows.filter((r) => r.cells[latest]?.met === false).map((r) => ({ dept: d.short, label: r.label, shown: r.cells[latest].display, target: r.targetLabel })))
    : [];

  const slides = [
    { id: "cover", label: "Cover", node: <CoverSlide accent={cfg.accent} eyebrow={cfg.eyebrow} title={`${solo ? solo.name : cfg.title} 2024–2027`} subtitle={cfg.tagline} meta={[plantName || "Plant terpilih", "Run 2024", "Grow 2025", "Transform 2026", "Future 2027"]} /> },
  ];

  if (!deptSlides.length) {
    slides.push({ id: "empty", label: "Data", node: <div><SlideHead color={cfg.accent} eyebrow="Data" title={cfg.title} /><Empty hint="Belum ada form departemen di klaster ini yang terisi. Isi lewat form (manual atau upload Excel) lalu muat ulang." /></div> });
  } else {
    slides.push(
      { id: "exec", label: "Ringkasan", node: (
        <div>
          <SlideHead color={cfg.accent} eyebrow={latest ? `Ringkasan ${latest}` : "Ringkasan"} title={`Scorecard ${solo ? solo.name : cfg.title}`} right={cur?.pct != null ? <Pill pct={cur.pct} /> : null} />
          {!cur || cur.total === 0 ? <Empty hint="Belum ada indikator bertarget yang terisi pada 2024–2026 (indikator berupa informasi tidak masuk skor)." /> : (
            <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 22 }}>
              <Glass style={{ display: "grid", placeItems: "center", alignContent: "center", gap: 6 }}>
                <ArcGauge pct={cur.pct} size={250} color={cfg.accent} />
                <div style={{ fontSize: 17, color: BRAND.text }}>{cur.ok} dari {cur.total} indikator tercapai</div>
                <div style={{ fontSize: 13, color: delta == null ? BRAND.muted : delta >= 0 ? BRAND.emerald : BRAND.bad }}>{delta == null ? "Tahun pembanding belum terisi" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pt vs ${latest - 1}`}</div>
              </Glass>
              <Glass>
                <Eyebrow color={cfg.accent}>{solo ? `Per indikator · ${latest}` : `Per departemen · ${latest}`}</Eyebrow>
                {solo ? (
                  <div style={{ display: "grid", gap: 9, marginTop: 14 }}>
                    {kpiMatrix(data, solo.code, [latest]).rows.filter((r) => r.cells[latest]).slice(0, 7).map((r) => { const c = r.cells[latest]; const m = MET[String(c.met)]; return (
                      <div key={r.key} style={{ display: "grid", gridTemplateColumns: "24px 1fr 90px 210px", gap: 12, alignItems: "center", fontSize: 17 }}>
                        <span style={{ color: m.color, fontWeight: 800 }}>{m.mark}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                        <span style={{ fontSize: 13, color: BRAND.muted }}>{r.targetLabel || ""}</span>
                        <span title={c.raw} style={{ textAlign: "right", fontWeight: 700, color: c.met == null ? BRAND.text : m.color, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.display}</span>
                      </div>); })}
                  </div>
                ) : (
                <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                  {feeders.map((d) => { const s = scoreOf(data, [d.code], latest); const st = statusOf(s.pct); const filled = !!y[latest].byDept[d.code]; return (
                    <div key={d.code} style={{ display: "grid", gridTemplateColumns: "190px 1fr 120px", gap: 16, alignItems: "center", fontSize: 18 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.short}{!ownCluster(d) && <span style={{ fontSize: 11, color: BRAND.muted }}> · pendukung</span>}</div>
                      <div style={{ height: 14, background: BRAND.line, borderRadius: 99, overflow: "hidden" }}>{s.pct != null && <div style={{ width: `${Math.min(100, s.pct)}%`, height: "100%", background: st.color, borderRadius: 99 }} />}</div>
                      <div style={{ textAlign: "right", fontWeight: 700, color: s.pct == null ? BRAND.muted : st.color, fontSize: 15 }}>{s.pct != null ? `${s.ok}/${s.total}` : filled ? "info" : "belum isi"}</div>
                    </div>); })}
                </div>
                )}
                <div style={{ marginTop: 18, fontSize: 12, color: BRAND.muted }}>{solo ? `Laporan ${ey} ${y[ey].byDept[solo.code] ? "sudah diisi" : "belum diisi"}` : `${data.completeness[ey]?.filled ?? 0}/${data.completeness[ey]?.total ?? 0} departemen klaster mengisi laporan ${ey}`}</div>
              </Glass>
              <Glass style={{ gridColumn: "1 / -1", padding: "16px 22px" }}>
                <Eyebrow color={attention.length ? BRAND.warn : BRAND.emerald}>{attention.length ? `Perlu perhatian · ${latest}` : `Semua indikator bertarget tercapai · ${latest}`}</Eyebrow>
                {attention.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                    {attention.slice(0, 6).map((a, k) => (
                      <span key={k} style={{ fontSize: 15, border: `1px solid ${BRAND.bad}55`, background: `${BRAND.bad}14`, borderRadius: 99, padding: "6px 14px" }}>
                        <b style={{ color: BRAND.bad }}>{a.dept}</b> · {a.label}: {a.shown}{a.target ? <span style={{ color: BRAND.muted }}> (target {a.target})</span> : null}
                      </span>))}
                    {attention.length > 6 && <span style={{ fontSize: 14, color: BRAND.muted, alignSelf: "center" }}>+{attention.length - 6} lainnya</span>}
                  </div>)}
              </Glass>
            </div>)}
        </div>) },
      { id: "trend", label: "Tren", node: (<div><SlideHead color={cfg.accent} eyebrow="Tren 2024–2026" title="Indikator tercapai per tahun" /><Glass style={{ display: "grid", placeItems: "center" }}><YearBars rows={ACTUAL_YEARS.map((yr) => ({ year: yr, phase: phaseOf(yr)?.phase, value: scores.find((s) => s.year === yr).pct }))} /></Glass></div>) },
      ...deptSlides, ...bad,
    );
  }

  slides.push(
    { id: "journey", label: "Perjalanan", node: <JourneySlide columns={journey} /> },
    { id: "future", label: "2027", node: <FutureSlide outlooks={outlooks} wins={wins} risks={risks} hint={!solo && data.completeness[2027]?.missing?.length ? `Belum mengisi 2027: ${data.completeness[2027].missing.join(", ")}` : undefined} /> },
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
  return <DeckShell title={dept ? dept.name : cfg.title} subtitle={plantName} slides={slides} accent={cfg.accent} active={active} onClose={onClose} fileName={`${dept ? dept.name : cfg.title}${plantName ? ` - ${plantName}` : ""} 2024-2027`} />;
}