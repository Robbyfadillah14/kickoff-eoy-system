"use client";
import React, { useMemo } from "react";
import DeckShell from "./DeckShell.jsx";
import { CoverSlide, SlideHead, Glass, Eyebrow, ArcGauge, YearBars, Pill, Empty, JourneySlide, FutureSlide } from "./slides.jsx";
import { achievementOf } from "./CommercialDeck.jsx";
import { buildClusterData, collectByDept, toNum, phaseOf, BRAND, statusOf, isEmptyValue } from "../../lib/presentation/index.js";

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
    title: "Digital Marketing", eyebrow: "Digital Marketing", accent: BRAND.emerald, itemHeading: "Capaian per campaign / metrik",
    fields: [{ key: "leadGenAch", label: "Lead generation & conversion" }, { key: "socialMediaGrowth", label: "Social media growth" }],
    evaluationKey: "marketingEvaluation",
  },
  PRODUCT_DEVELOPMENT: {
    title: "Product Development", eyebrow: "Product Development", accent: BRAND.cyan, itemHeading: "Capaian per item / produk",
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
    const list = [firstText(yr, own[yr]), ...cfg.fields.map((f) => (txt(m[f.key]) ? `${f.label}: ${txt(m[f.key])}` : null)), txt(m[cfg.evaluationKey])].filter(Boolean);
    return { year: yr, phase: phaseOf(yr)?.phase, items: list };
  });
  const f = y[2027];
  const outlooks = collectByDept(f, [cfg.evaluationKey, "strategicOutlook2027", "generalNotes"]);
  const wins = f.reports.flatMap((r) => asList(r.opportunities));
  const risks = f.reports.flatMap((r) => asList(r.challenges));
  const ey = latest ?? 2026;
  const unit = (v) => (v == null ? "—" : v.toLocaleString("id-ID", { maximumFractionDigits: 2 }));

  return [
    { id: "cover", label: "Cover", node: <CoverSlide accent={cfg.accent} eyebrow={cfg.eyebrow} title={`${cfg.title} 2024–2027`} subtitle="Dari fondasi (Run), pertumbuhan (Grow), transformasi (Transform) hingga arah 2027." meta={[plantName || "Plant terpilih", "Run 2024", "Grow 2025", "Transform 2026", "Future 2027"]} /> },
    { id: "exec", label: "Ringkasan", node: (
      <div>
        <SlideHead color={cfg.accent} eyebrow={latest ? `Ringkasan ${latest}` : "Ringkasan"} title={`Capaian ${cfg.title}`} right={<Pill pct={latestVal} />} />
        {latest == null ? <Empty hint="Belum ada tabel target–aktual yang terisi untuk 2024–2026. Isi lewat upload Excel atau form." /> : (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 1fr", gap: 22 }}>
            <Glass style={{ display: "grid", placeItems: "center" }}><ArcGauge pct={latestVal} size={260} color={cfg.accent} /></Glass>
            <Glass><Eyebrow color={cfg.accent}>Vs tahun lalu</Eyebrow><div style={{ fontSize: 72, fontWeight: 800, marginTop: 18, color: delta == null ? BRAND.muted : delta >= 0 ? BRAND.emerald : BRAND.bad }}>{delta == null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pt`}</div><div style={{ color: BRAND.muted, fontSize: 17, marginTop: 8 }}>{delta == null ? "Tahun pembanding belum terisi" : `dibanding ${latest - 1}`}</div></Glass>
            <Glass><Eyebrow color={cfg.accent}>Item terukur</Eyebrow><div style={{ fontSize: 72, fontWeight: 800, marginTop: 18 }}>{items.filter((i) => i.pct != null).length}</div><div style={{ color: BRAND.muted, fontSize: 17, marginTop: 8 }}>{items.filter((i) => i.pct != null && i.pct >= 100).length} di atas target · {data.completeness[ey]?.filled?.length ?? 0}/{data.completeness[ey]?.total ?? 0} dept mengisi</div></Glass>
          </div>)}
      </div>) },
    { id: "trend", label: "Tren", node: (<div><SlideHead color={cfg.accent} eyebrow="Tren 2024–2026" title="Capaian per tahun" /><Glass style={{ display: "grid", placeItems: "center" }}><YearBars rows={rows} /></Glass></div>) },
    { id: "items", label: "Item", node: (
      <div>
        <SlideHead color={cfg.accent} eyebrow={perfYear ? `Detail ${perfYear}` : "Detail"} title={cfg.itemHeading} />
        {items.length === 0 ? <Empty hint="Upload Excel (kolom: nama, target, aktual, keterangan) atau isi manual." /> : (
          <div style={{ display: "grid", gap: 18, marginTop: 6 }}>
            {items.slice(0, 7).map((p, k) => { const s = statusOf(p.pct); return (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "300px 1fr 130px", alignItems: "center", gap: 20, fontSize: 21 }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}{p.note ? <div style={{ fontSize: 12, color: BRAND.muted }}>{p.note}</div> : null}</div>
                <div style={{ height: 20, background: BRAND.line, borderRadius: 99, overflow: "hidden" }}>{p.pct != null && <div style={{ width: `${Math.min(100, p.pct)}%`, height: "100%", background: s.color, borderRadius: 99 }} />}</div>
                <div style={{ textAlign: "right", fontWeight: 700, color: s.color }}>{p.pct == null ? `${unit(p.a)}` : `${p.pct.toFixed(1)}%`}</div>
              </div>); })}
          </div>)}
      </div>) },
    { id: "journey", label: "Perjalanan", node: <JourneySlide columns={journey} /> },
    { id: "future", label: "2027", node: <FutureSlide outlooks={outlooks} wins={wins} risks={risks} hint={data.completeness[2027]?.missing?.length ? `Belum mengisi 2027: ${data.completeness[2027].missing.join(", ")}` : undefined} /> },
  ];
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