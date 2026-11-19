"use client";
import React, { useMemo } from "react";
import DeckShell from "./DeckShell.jsx";
import { CoverSlide, SlideHead, Glass, Eyebrow, ArcGauge, YearBars, Pill, Empty, JourneySlide, FutureSlide, pctText, fitSize } from "./slides.jsx";
import { buildClusterData, collectByDept, toNum, toPct, phaseOf, BRAND, phaseColor, statusOf, isEmptyValue } from "../../lib/presentation/index.js";

const ACTUAL_YEARS = [2024, 2025, 2026];
const OWN_RGT = { 2024: "rgtRun", 2025: "rgtGrow", 2026: "rgtTransform" };
const txt = (v) => (isEmptyValue(v) ? null : String(v).trim());
const cut = (t, n) => (t && t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);
const numOnly = (v) => (/^-?[\d.,\s]+$/.test(String(v ?? "").trim()) && /\d/.test(String(v)) ? v : "");

/** produk dari semua baris sales, digabung per nama. lalu = laluVal|totalQty ; berjalan = jalanVal|actualVal|category (hanya bila angka) */
export function productsOf(metrics = {}) {
  const perf = Array.isArray(metrics.salesPerformances) ? metrics.salesPerformances : [];
  const map = new Map();
  for (const sp of perf) for (const p of Array.isArray(sp?.topProducts) ? sp.topProducts : []) {
    const name = txt(p?.productName); if (!name) continue;
    const lalu = toNum(p.laluVal ?? p.totalQty);
    const jalan = toNum(!isEmptyValue(p.jalanVal) ? p.jalanVal : !isEmptyValue(p.actualVal) ? p.actualVal : numOnly(p.category));
    if (!lalu && !jalan) continue;
    const k = name.toLowerCase(); const cur = map.get(k) || { name, lalu: 0, jalan: 0 };
    cur.lalu += lalu; cur.jalan += jalan; map.set(k, cur);
  }
  return [...map.values()].map((r) => ({ ...r, growth: r.lalu > 0 ? ((r.jalan - r.lalu) / r.lalu) * 100 : null })).sort((a, b) => b.jalan - a.jalan);
}
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

function ProductsSlide({ year, rows }) {
  const top = rows.slice(0, 8);
  const max = Math.max(1, ...top.flatMap((r) => [r.lalu, r.jalan]));
  const fmt = (v) => v.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  return (
    <div>
      <SlideHead eyebrow={`Top produk ${year}`} title="Penjualan produk: tahun lalu vs berjalan"
        right={<span style={{ fontSize: 12, color: BRAND.muted }}><span style={{ color: BRAND.muted }}>■</span> {year - 1} · <span style={{ color: BRAND.cyan }}>■</span> {year}</span>} />
      <div style={{ display: "grid", gap: 14 }}>
        {top.map((r) => { const g = r.growth; const col = g == null ? BRAND.muted : g >= 0 ? BRAND.emerald : BRAND.bad; return (
          <div key={r.name} style={{ display: "grid", gridTemplateColumns: "230px 1fr 170px", gap: 18, alignItems: "center", fontSize: 19 }}>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{r.name}</div>
            <div style={{ display: "grid", gap: 5 }}>
              <div style={{ height: 11, background: BRAND.line, borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(r.lalu / max) * 100}%`, height: "100%", background: BRAND.muted, opacity: 0.7 }} /></div>
              <div style={{ height: 11, background: BRAND.line, borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(r.jalan / max) * 100}%`, height: "100%", background: BRAND.cyan }} /></div>
            </div>
            <div style={{ textAlign: "right", fontWeight: 800, color: col, fontSize: 17 }}>{g == null ? "baru" : Math.abs(g) >= 1000 ? `${g >= 0 ? "+" : "−"}>999%` : `${g >= 0 ? "+" : "−"}${Math.round(Math.abs(g))}%`}<div style={{ fontSize: 11, color: BRAND.muted, fontWeight: 400 }}>{fmt(r.lalu)} → {fmt(r.jalan)}</div></div>
          </div>); })}
        {rows.length > 8 && <div style={{ color: BRAND.muted, fontSize: 13 }}>+{rows.length - 8} produk lain</div>}
      </div>
    </div>
  );
}

function SupportSlide({ columns }) {
  return (
    <div>
      <SlideHead eyebrow="Sales support" title="Operasional pendukung per tahun" />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 18 }}>
        {columns.map((c) => { const col = phaseColor(c.phase); return (
          <Glass key={c.year} accent={col} style={{ minHeight: 430 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><Eyebrow color={col}>{c.phase}</Eyebrow><span style={{ color: BRAND.muted, fontSize: 13 }}>{c.year}</span></div>
            {c.items.length
              ? <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 16, fontSize: 19, lineHeight: 1.45 }}>{c.items.map((t, k) => <li key={k} style={{ display: "flex", gap: 10 }}><span style={{ color: col }}>●</span><span>{t}</span></li>)}</ul>
              : <div style={{ marginTop: 16 }}><Empty hint="Belum diisi di form Sales Support tahun ini." /></div>}
          </Glass>); })}
      </div>
    </div>
  );
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
    const firstText = (yr, k) => { for (const r of y[yr].reports) if (txt(r?.[k])) return txt(r[k]); return null; };
    // setiap kolom = RGT miliknya sendiri + isian form tahun itu (inovasi, catatan). Tidak lagi mencampur RGT fase lain.
    const journey = ACTUAL_YEARS.map((yr) => {
      const m = y[yr].metrics;
      return { year: yr, phase: phaseOf(yr)?.phase, items: [
        cut(firstText(yr, OWN_RGT[yr]), 120),
        txt(m.branchInnovations) && `Inovasi: ${cut(txt(m.branchInnovations), 110)}`,
        txt(m.generalNotes) && `Catatan: ${cut(txt(m.generalNotes), 110)}`,
      ].filter(Boolean) };
    });
    // sales support per tahun
    const support = ACTUAL_YEARS.map((yr) => {
      const m = y[yr].metrics;
      return { year: yr, phase: phaseOf(yr)?.phase, items: [
        txt(m.salesSupportPo) && `Input & verifikasi PO: ${cut(txt(m.salesSupportPo), 100)}`,
        txt(m.salesSupportCoord) && `Koordinasi DO & piutang: ${cut(txt(m.salesSupportCoord), 100)}`,
        txt(m.salesSupportEvaluation) && `Evaluasi: ${cut(txt(m.salesSupportEvaluation), 110)}`,
      ].filter(Boolean) };
    });
    // top produk: tahun terbaru yang punya data produk
    const prodYear = [...ACTUAL_YEARS].reverse().find((yr) => productsOf(y[yr].metrics).length) ?? null;
    const products = prodYear ? productsOf(y[prodYear].metrics) : [];
    const f = y[2027];
    let outlooks = collectByDept(f, OUTLOOK_KEYS);
    if (!outlooks.length) {
      // form Sales menulis "Strategic Outlook & Issue {tahun+1}" di laporan tahun berjalan -> outlook 2027 ada di laporan 2026
      for (const yr of [...ACTUAL_YEARS].reverse()) {
        const hit = collectByDept(y[yr], ["strategicOutlook2027"]);
        if (hit.length) { outlooks = hit.map((o) => ({ ...o, name: `${o.name} · dari laporan ${yr}` })); break; }
      }
    }
    const wins = f.reports.flatMap((r) => asList(r.opportunities));
    const risks = f.reports.flatMap((r) => asList(r.challenges));
    const deltaText = delta == null ? "—" : Math.abs(delta) >= 1000 ? `${delta > 0 ? "+" : "−"}999 pt+` : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pt`;
    const filled = y[latest ?? 2026]?.filled?.length ?? 0, total = data.completeness[latest ?? 2026]?.total ?? 0;

    return [
      { id: "cover", label: "Cover", node: <CoverSlide eyebrow={`Commercial · ${label}`} title={`Kinerja ${label} 2024–2027`} subtitle="Dari fondasi (Run), pertumbuhan (Grow), transformasi (Transform) hingga arah 2027." meta={[plantName || "Semua plant terpilih", "Run 2024", "Grow 2025", "Transform 2026", "Future 2027"]} /> },
      { id: "exec", label: "Ringkasan", node: (
        <div>
          <SlideHead eyebrow={latest ? `Ringkasan ${latest}` : "Ringkasan"} title={`Capaian ${label}`} right={<Pill pct={latestVal} />} />
          {latest == null ? <Empty hint="Belum ada laporan Commercial 2024–2026 yang terisi untuk plant ini." /> : (
            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 1fr", gap: 22, alignItems: "stretch" }}>
              <Glass style={{ display: "grid", placeItems: "center" }}><ArcGauge pct={latestVal} size={260} /></Glass>
              <Glass><Eyebrow>Vs tahun lalu</Eyebrow><div style={{ fontSize: fitSize(deltaText), fontWeight: 800, marginTop: 18, whiteSpace: "nowrap", color: delta == null ? BRAND.muted : delta >= 0 ? BRAND.emerald : BRAND.bad }}>{deltaText}</div><div style={{ color: BRAND.muted, fontSize: 17, marginTop: 8 }}>{delta == null ? "Tahun pembanding belum terisi" : `dibanding ${latest - 1}`}</div></Glass>
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
                  <div style={{ textAlign: "right", fontWeight: 700, color: s.color }}>{pctText(p.pct)}</div>
                </div>); })}
            </div>)}
        </div>) },
      ...(products.length ? [{ id: "products", label: "Top produk", node: <ProductsSlide year={prodYear} rows={products} /> }] : []),
      { id: "journey", label: "Perjalanan", node: <JourneySlide columns={journey} /> },
      ...(support.some((c) => c.items.length) ? [{ id: "support", label: "Sales support", node: <SupportSlide columns={support} /> }] : []),
      { id: "future", label: "2027", node: <FutureSlide outlooks={outlooks} wins={wins} risks={risks} hint={data.completeness[2027]?.missing?.length ? `Belum mengisi 2027: ${data.completeness[2027].missing.join(", ")}` : undefined} /> },
    ];
  }
}