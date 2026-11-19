"use client";
import React, { useMemo } from "react";
import DeckShell from "./DeckShell.jsx";
import { CoverSlide, SlideHead, Glass, Eyebrow, ArcGauge, YearBars, Pill, Empty, JourneySlide, FutureSlide } from "./slides.jsx";
import { buildClusterData, collectByDept, toNum, toPct, phaseOf, BRAND, phaseColor, statusOf } from "../../lib/presentation/index.js";

const ACTUAL_YEARS = [2024, 2025, 2026];
const OUTLOOK_KEYS = ["strategicOutlook2027", "outlook2027", "futureOutlook", "generalNotes"];

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => (typeof x === "string" ? x : x?.title || x?.text || "")).filter(Boolean);

/** capaian tahun itu: dari salesPerformances (sum aktual / sum target) bila ada, kalau tidak dari targetAchievedPct */
export function achievementOf(metrics = {}) {
  const perf = Array.isArray(metrics.salesPerformances) ? metrics.salesPerformances : [];
  let t = 0, a = 0;
  for (const p of perf) { t += toNum(p.targetVal); a += toNum(p.actualVal); }
  if (t > 0) return (a / t) * 100;
  const raw = metrics.targetAchievedPct;
  if (raw === undefined || raw === null || raw === "") return null;
  return toPct(raw);
}

/**
 * Satu deck Commercial untuk mode OMZET dan PROFIT (menggantikan dua file kembar + CommercialOmzetDeck yang tidak ada).
 * mode  : "OMZET" | "PROFIT"  — hanya mengubah judul/label; sumber data sama.
 * reports: hasil /api/reports (semua plant/departemen/tahun boleh campur), plantId wajib bila >1 plant.
 */
export default function CommercialDeck({ reports, plantId = null, plantName = "", mode = "OMZET", active = true, onClose }) {
  const data = useMemo(() => buildClusterData(reports, { cluster: "COMMERCIAL", plantId }), [reports, plantId]);
  const slides = useMemo(() => buildCommercialSlides(data, { mode, plantName }), [data, mode, plantName]);
  return <DeckShell title={`Commercial — ${mode === "PROFIT" ? "Profit" : "Omzet"}`} subtitle={plantName} slides={slides} accent={phaseColor("Run")} active={active} onClose={onClose} />;
}

/** dipisah dari komponen agar bisa dites tanpa DOM */
export function buildCommercialSlides(data, { mode = "OMZET", plantName = "" } = {}) {
  const label = mode === "PROFIT" ? "Profit" : "Omzet";
  {
    if (data.needsPlant) {
      return [{ id: "plant", label: "Pilih plant", node: <div style={{ height: "100%", display: "grid", placeItems: "center" }}><Empty hint="Data berisi lebih dari satu plant — pilih plant dulu agar angka tidak tercampur.">Plant belum dipilih</Empty></div> }];
    }
    const y = data.years;
    const rows = ACTUAL_YEARS.map((yr) => ({ year: yr, phase: phaseOf(yr)?.phase, value: y[yr].hasData ? achievementOf(y[yr].metrics) : null }));
    const latest = [...ACTUAL_YEARS].reverse().find((yr) => rows.find((r) => r.year === yr)?.value != null) ?? null;
    const latestVal = latest ? rows.find((r) => r.year === latest).value : null;
    const prev = latest ? rows.find((r) => r.year === latest - 1)?.value : null;
    const delta = latestVal != null && prev != null ? latestVal - prev : null;
    const perf = latest ? (Array.isArray(y[latest].metrics.salesPerformances) ? y[latest].metrics.salesPerformances : []) : [];
    const ranked = perf.map((p) => ({ name: p.salesName || "—", t: toNum(p.targetVal), a: toNum(p.actualVal), note: p.note })).filter((p) => p.t > 0).map((p) => ({ ...p, pct: (p.a / p.t) * 100 })).sort((a, b) => b.pct - a.pct);
    const firstText = (yr, k) => { for (const r of y[yr].reports) if (r?.[k] && String(r[k]).trim()) return String(r[k]).trim(); return null; };
    const journey = ACTUAL_YEARS.map((yr) => ({ year: yr, phase: phaseOf(yr)?.phase, items: ["rgtRun", "rgtGrow", "rgtTransform"].map((k) => firstText(yr, k)).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) }));
    // setiap fase menonjolkan RGT miliknya sendiri
    const own = { 2024: "rgtRun", 2025: "rgtGrow", 2026: "rgtTransform" };
    journey.forEach((c) => { const t = firstText(c.year, own[c.year]); c.items = t ? [t, ...c.items.filter((x) => x !== t)] : c.items; });
    const f = y[2027];
    const outlooks = collectByDept(f, OUTLOOK_KEYS);
    const wins = f.reports.flatMap((r) => asList(r.opportunities));
    const risks = f.reports.flatMap((r) => asList(r.challenges));
    const filled = y[latest ?? 2026]?.filled?.length ?? 0, total = data.completeness[latest ?? 2026]?.total ?? 0;

    return [
      { id: "cover", label: "Cover", node: <CoverSlide eyebrow={`Commercial · ${label}`} title={`Kinerja ${label} 2024–2027`} subtitle="Dari fondasi (Run), pertumbuhan (Grow), transformasi (Transform) hingga arah 2027." meta={[plantName || "Semua plant terpilih", "Run 2024", "Grow 2025", "Transform 2026", "Future 2027"]} /> },
      { id: "exec", label: "Ringkasan", node: (
        <div>
          <SlideHead eyebrow={latest ? `Ringkasan ${latest}` : "Ringkasan"} title={`Capaian ${label}`} right={<Pill pct={latestVal} />} />
          {latest == null ? <Empty hint="Belum ada laporan Commercial 2024–2026 yang terisi untuk plant ini." /> : (
            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 1fr", gap: 22, alignItems: "stretch" }}>
              <Glass style={{ display: "grid", placeItems: "center" }}><ArcGauge pct={latestVal} size={260} /></Glass>
              <Glass><Eyebrow>Vs tahun lalu</Eyebrow><div style={{ fontSize: 72, fontWeight: 800, marginTop: 18, color: delta == null ? BRAND.muted : delta >= 0 ? BRAND.emerald : BRAND.bad }}>{delta == null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pt`}</div><div style={{ color: BRAND.muted, fontSize: 17, marginTop: 8 }}>{delta == null ? "Tahun pembanding belum terisi" : `dibanding ${latest - 1}`}</div></Glass>
              <Glass><Eyebrow>Kelengkapan data</Eyebrow><div style={{ fontSize: 72, fontWeight: 800, marginTop: 18 }}>{filled}/{total}</div><div style={{ color: BRAND.muted, fontSize: 17, marginTop: 8 }}>departemen Commercial sudah mengisi {latest}</div></Glass>
            </div>)}
        </div>) },
      { id: "trend", label: "Tren", node: (
        <div>
          <SlideHead eyebrow="Tren 2024–2026" title={`Capaian ${label} per tahun`} />
          <Glass style={{ display: "grid", placeItems: "center" }}><YearBars rows={rows} /></Glass>
        </div>) },
      { id: "perf", label: "Performa", node: (
        <div>
          <SlideHead eyebrow={latest ? `Detail ${latest}` : "Detail"} title="Capaian per item" />
          {ranked.length === 0 ? <Empty hint="Isi tabel performa (target & aktual) di form Sales." /> : (
            <div style={{ display: "grid", gap: 22, marginTop: 10 }}>
              {ranked.slice(0, 7).map((p) => { const s = statusOf(p.pct); return (
                <div key={p.name} style={{ display: "grid", gridTemplateColumns: "300px 1fr 110px", alignItems: "center", gap: 20, fontSize: 22 }}>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ height: 22, background: BRAND.line, borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${Math.min(100, p.pct)}%`, height: "100%", background: s.color, borderRadius: 99 }} /></div>
                  <div style={{ textAlign: "right", fontWeight: 700, color: s.color }}>{p.pct.toFixed(1)}%</div>
                </div>); })}
            </div>)}
        </div>) },
      { id: "journey", label: "Perjalanan", node: <JourneySlide columns={journey} /> },
      { id: "future", label: "2027", node: <FutureSlide outlooks={outlooks} wins={wins} risks={risks} hint={data.completeness[2027]?.missing?.length ? `Belum mengisi 2027: ${data.completeness[2027].missing.join(", ")}` : undefined} /> },
    ];
  }
}