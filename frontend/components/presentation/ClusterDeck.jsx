"use client";
import React, { useMemo } from "react";
import DeckShell from "./DeckShell.jsx";
import { CoverSlide, SlideHead, Glass, Eyebrow, ArcGauge, YearBars, Pill, Empty, JourneySlide, FutureSlide, StatTile, Sparkline, ClosingSlide, TrendSlide, ptText, deltaColor, pctText } from "./slides.jsx";
import { achievementOf } from "./CommercialDeck.jsx";
import { buildClusterData, collectByDept, resolveDepartment, toNum, phaseOf, BRAND, statusOf, isEmptyValue } from "../../lib/presentation/index.js";
import { kpiMatrix, clip } from "../../lib/presentation/kpi.js";
import { DeptMatrixSlide } from "./KpiDeck.jsx";

const ACTUAL_YEARS = [2024, 2025, 2026];
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => (typeof x === "string" ? x : x?.title || x?.text || "")).filter(Boolean);
const txt = (v) => (isEmptyValue(v) ? null : String(v).trim());

/**
 * Konfigurasi per klaster. `fields` = isian teks dari form departemen (key persis seperti di form).
 * Form DM/PD tidak punya kolom "outlook 2027" sendiri, jadi laporan tahun 2027 dibaca dari
 * evaluationKey + generalNotes (itu yang diisi staf pada laporan 2027).
 */
export const CLUSTER_DECKS = {
  DIGITAL_MARKETING: {
    deptCode: "DIG_MKT", title: "Digital Marketing", eyebrow: "Digital Marketing", accent: BRAND.emerald, itemHeading: "Capaian per campaign / metrik",
    fields: [{ key: "leadGenAch", label: "Lead generation & conversion" }, { key: "socialMediaGrowth", label: "Social media growth" }],
    evaluationKey: "marketingEvaluation",
  },
  PRODUCT_DEVELOPMENT: {
    deptCode: "PROD_DEV", title: "Product Development", eyebrow: "Product Development", accent: BRAND.cyan, itemHeading: "Capaian per item / produk",
    fields: [{ key: "newProductLaunch", label: "Riset & launching produk baru" }, { key: "sampleTesting", label: "Pengujian sampel & kepatuhan" }],
    evaluationKey: "productDevEvaluation",
  },
};

export function buildClusterSlides(data, cfg, { plantName = "" } = {}) {
  if (data.needsPlant) return [{ id: "plant", label: "Pilih plant", node: <div style={{ height: "100%", display: "grid", placeItems: "center" }}><Empty hint="Data berisi lebih dari satu plant — pilih plant dulu agar angka tidak tercampur.">Plant belum dipilih</Empty></div> }];
  const y = data.years;
  const rows = ACTUAL_YEARS.map((yr) => ({ year: yr, phase: phaseOf(yr)?.phase, value: y[yr].hasData ? achievementOf(y[yr].metrics) : null }));
  const latest = [...ACTUAL_YEARS].reverse().find((yr) => rows.find((r) => r.year === yr)?.value != null) ?? null;
  const latestVal = latest ? rows.find((r) => r.year === latest).value : null;
  const prev = latest ? rows.find((r) => r.year === latest - 1)?.value : null;
  const delta = latestVal != null && prev != null ? latestVal - prev : null;
  const perfYear = latest ?? [...ACTUAL_YEARS].reverse().find((yr) => (y[yr].metrics.salesPerformances || []).length) ?? null;
  const perf = perfYear ? y[perfYear].metrics.salesPerformances || [] : [];
  const items = perf.map((p) => ({ name: p.salesName || "—", t: toNum(p.targetVal), a: toNum(p.actualVal), note: p.note })).map((p) => ({ ...p, pct: p.t > 0 ? (p.a / p.t) * 100 : null }));
  const own = { 2024: "rgtRun", 2025: "rgtGrow", 2026: "rgtTransform" };
  const firstText = (yr, k) => { for (const r of y[yr].reports) if (txt(r?.[k])) return txt(r[k]); return null; };
  const journey = ACTUAL_YEARS.map((yr) => {
    const m = y[yr].metrics;
    // isian indikator per tahun ada di slide "Indikator"; kolom ini = RGT fase itu + evaluasi + catatan bebas (dipotong agar muat)
    const list = [clip(firstText(yr, own[yr]) || "", 120), txt(m[cfg.evaluationKey]) && `Evaluasi: ${clip(txt(m[cfg.evaluationKey]), 120)}`, txt(m.generalNotes) && `Catatan: ${clip(txt(m.generalNotes), 120)}`].filter(Boolean);
    return { year: yr, phase: phaseOf(yr)?.phase, items: list };
  });
  const f = y[2027];
  const outlooks = collectByDept(f, [cfg.evaluationKey, "strategicOutlook2027", "generalNotes"]);
  const wins = f.reports.flatMap((r) => asList(r.opportunities));
  const risks = f.reports.flatMap((r) => asList(r.challenges));
  const ey = latest ?? 2026;
  const dept = resolveDepartment(cfg.deptCode);
  const matrix = cfg.deptCode ? kpiMatrix(data, cfg.deptCode) : { rows: [], hasData: false };
  const hasNumbers = latest != null || items.length > 0;
  const scored = items.filter((i) => i.pct != null).sort((a, b) => b.pct - a.pct);
  const hlYear = [...ACTUAL_YEARS].reverse().find((yr) => matrix.rows.some((r) => r.cells[yr]));
  const highlights = hlYear ? matrix.rows.filter((r) => r.cells[hlYear]).slice(0, 3).map((r) => `${r.label} ${hlYear}: ${r.cells[hlYear].display}`) : [];
  const unit = (v) => (v == null ? "—" : v.toLocaleString("id-ID", { maximumFractionDigits: 2 }));

  const slides = [
    { id: "cover", label: "Cover", node: <CoverSlide accent={cfg.accent} eyebrow={cfg.eyebrow} title={`${cfg.title} 2024–2027`} subtitle="Dari fondasi (Run), pertumbuhan (Grow), transformasi (Transform) hingga arah 2027." meta={[plantName || "Plant terpilih", "Run 2024", "Grow 2025", "Transform 2026", "Future 2027"]} /> },
    { id: "exec", label: "Ringkasan", node: (
      <div>
        <SlideHead color={cfg.accent} eyebrow={latest ? `Ringkasan ${latest}` : "Ringkasan"} title={`Capaian ${cfg.title}`} right={<Pill pct={latestVal} />}
          sub={latest == null ? undefined : `${cfg.title} ${latest} mencapai ${pctText(latestVal)} dari target${delta == null ? "" : `, ${delta >= 0 ? "naik" : "turun"} ${Math.abs(delta).toFixed(1)} poin dibanding ${latest - 1}`}.`} />
        {latest == null ? <Empty hint="Belum ada tabel target–aktual yang terisi untuk 2024–2026. Isi lewat upload Excel atau form." /> : (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 18 }}>
            <Glass style={{ gridRow: "1 / span 2", display: "grid", placeItems: "center", alignContent: "center", gap: 8 }}>
              <ArcGauge pct={latestVal} size={270} color={cfg.accent} />
              <div style={{ fontSize: 15, color: BRAND.muted, letterSpacing: 2 }}>{latest} · {phaseOf(latest)?.label?.toUpperCase()}</div>
            </Glass>
            <StatTile icon={delta == null || delta >= 0 ? "trendUp" : "trendDown"} color={deltaColor(delta)} label={`Vs ${latest - 1}`} value={ptText(delta)} sub={delta == null ? "Tahun pembanding belum terisi" : `dibanding ${latest - 1}`} spark={<Sparkline values={rows.map((r) => r.value)} color={deltaColor(delta)} target={100} />} />
            <StatTile icon="check" color={BRAND.emerald} label="Item di atas target" value={scored.length ? `${scored.filter((i) => i.pct >= 100).length}/${scored.length}` : "—"} sub={scored.length ? "item mencapai ≥100% target" : "belum ada item bertarget"} />
            <StatTile icon="star" color={cfg.accent} label="Capaian tertinggi" value={scored.length ? pctText(scored[0].pct, 0) : "—"} sub={scored.length ? scored[0].name : "—"} />
            <StatTile icon="alert" color={scored.length && scored[scored.length - 1].pct < 100 ? BRAND.warn : BRAND.emerald} label="Perlu perhatian" value={scored.length ? pctText(scored[scored.length - 1].pct, 0) : "—"} sub={scored.length ? scored[scored.length - 1].name : "—"} />
          </div>)}
      </div>) },
    { id: "trend", label: "Tren", node: <TrendSlide accent={cfg.accent} title={`Capaian ${cfg.title} per tahun`} rows={rows} noun={`Capaian ${cfg.title}`} /> },
    { id: "items", label: "Item", node: (
      <div>
        <SlideHead color={cfg.accent} eyebrow={perfYear ? `Detail ${perfYear}` : "Detail"} title={cfg.itemHeading} />
        {items.length === 0 ? <Empty hint="Upload Excel (kolom: nama, target, aktual, keterangan) atau isi manual." /> : (
          <div style={{ display: "grid", gap: 30, alignContent: "center" }}>
            {items.slice(0, 7).map((p, k) => { const s = statusOf(p.pct); return (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "300px 1fr 150px", alignItems: "center", gap: 24, fontSize: 26, fontWeight: 600 }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}{p.note ? <div style={{ fontSize: 12, color: BRAND.muted }}>{p.note}</div> : null}</div>
                <div style={{ height: 26, background: BRAND.line, borderRadius: 99, overflow: "hidden" }}>{p.pct != null && <div style={{ width: `${Math.min(100, p.pct)}%`, height: "100%", background: s.color, borderRadius: 99 }} />}</div>
                <div style={{ textAlign: "right", fontWeight: 700, color: s.color }}>{p.pct == null ? `${unit(p.a)}` : `${p.pct.toFixed(1)}%`}</div>
              </div>); })}
          </div>)}
      </div>) },
    ...(matrix.hasData && dept ? [{ id: "matrix", label: "Indikator", node: <DeptMatrixSlide dept={dept} matrix={matrix} accent={cfg.accent} /> }] : []),
    { id: "journey", label: "Perjalanan", node: <JourneySlide columns={journey} /> },
    { id: "future", label: "2027", node: <FutureSlide outlooks={outlooks} wins={wins} risks={risks} hint={data.completeness[2027]?.missing?.length ? `Belum mengisi 2027: ${data.completeness[2027].missing.join(", ")}` : undefined} /> },
    ...(scored.length || outlooks.length ? [{ id: "closing", label: "Penutup", node: <ClosingSlide accent={cfg.accent} title="Ringkasan & langkah berikutnya"
      subtitle={latest ? `${cfg.title} ${latest}: ${pctText(latestVal)} dari target — berikut yang patut dirayakan, dijaga, dan dikejar di 2027.` : undefined}
      winsLabel={scored.length ? "Capaian terbaik" : "Sorotan tahun ini"} watchEmpty={scored.length ? undefined : "Isian berupa catatan — belum ada target angka yang dinilai."}
      wins={scored.length ? scored.filter((i) => i.pct >= 100).slice(0, 3).map((i) => `${i.name} — ${pctText(i.pct, 0)} dari target`) : highlights}
      watch={[...scored].reverse().filter((i) => i.pct < 100).slice(0, 3).map((i) => `${i.name} — baru ${pctText(i.pct, 0)} dari target`)}
      next={outlooks.slice(0, 3).map((o) => clip(String(o.value), 110))} /> }] : []),
  ];
  // tanpa tabel angka (isian teks saja): sembunyikan slide angka yang kosong, indikator tetap tampil di slide "Indikator"
  return hasNumbers || !matrix.hasData ? slides : slides.filter((s) => !["exec", "trend", "items"].includes(s.id));
}

export default function ClusterDeck({ cluster, reports, plantId = null, plantName = "", active = true, onClose }) {
  const cfg = CLUSTER_DECKS[cluster];
  const data = useMemo(() => buildClusterData(reports, { cluster, plantId }), [reports, cluster, plantId]);
  const slides = useMemo(() => (cfg ? buildClusterSlides(data, cfg, { plantName }) : []), [data, cfg, plantName]);
  if (!cfg) return null;
  return <DeckShell title={cfg.title} subtitle={plantName} slides={slides} accent={cfg.accent} active={active} onClose={onClose} />;
}
export const DigitalMarketingDeck = (p) => <ClusterDeck cluster="DIGITAL_MARKETING" {...p} />;
export const ProductDevelopmentDeck = (p) => <ClusterDeck cluster="PRODUCT_DEVELOPMENT" {...p} />;