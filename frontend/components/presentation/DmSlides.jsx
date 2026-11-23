"use client";
import React, { useState } from "react";
import { SlideHead, Glass, IconBubble, Insight, fitSize } from "./slides.jsx";
import { BRAND } from "../../lib/presentation/index.js";
import { DM_GROUPS, DM_YEARS, dmSnapshot, dmWarnings, dmFmt, dmFmtField, dmRp } from "../../lib/presentation/dmFigures.js";
import { InfoBtn, Block, Tbl, DetailPopup, PrintCss, BarChart } from "./HrSlides.jsx";

/**
 * Slide Digital Marketing dari isian angka (form DmFigures): poin penting per kelompok + tren tahunan.
 * Tombol ⓘ -> popup: sumber/periode, cara menghitung turunan, tabel per tahun, peringatan kewajaran.
 */

const GOOD = BRAND.emerald, BAD = BRAND.bad;
const lastYearWith = (snap, g) => { const ys = DM_YEARS.filter((y) => g.fields.some((f) => snap[y][f.key] != null)); return ys.length ? ys[ys.length - 1] : null; };
const prevYearWith = (snap, key, before) => { const ys = DM_YEARS.filter((y) => y < before && snap[y][key] != null); return ys.length ? ys[ys.length - 1] : null; };

function delta(snap, f, y) {
  const py = prevYearWith(snap, f.key, y);
  const v = snap[y][f.key]; if (py == null || v == null) return null;
  const p = snap[py][f.key];
  if (f.kind === "pct" || f.key === "dmGscPos") { const d = v - p; return { py, text: `${d > 0 ? "+" : d < 0 ? "−" : "±"}${dmFmt(Math.abs(d), f.kind === "pct" ? 2 : 1)}${f.kind === "pct" ? " poin" : ""}`, good: f.lowerBetter ? d <= 0 : d >= 0 }; }
  if (!p) return null;
  const d = ((v - p) / p) * 100;
  return { py, text: `${d >= 0 ? "+" : "−"}${dmFmt(Math.abs(d), 0)}%`, good: d >= 0 };
}

/** isi popup satu kelompok */
export function DmDetailContent({ group, snap }) {
  const ys = DM_YEARS.filter((y) => group.fields.some((f) => snap[y][f.key] != null));
  const R = "right";
  const derived = [];
  for (const y of ys) {
    const r = snap[y];
    if (group.id === "gsc" && r.dmGscClicks != null && r.dmGscImpr > 0) derived.push(`${y}: CTR dihitung ulang = ${dmFmt(r.dmGscClicks, 0)} klik ÷ ${dmFmt(r.dmGscImpr, 0)} tayangan = ${dmFmt((r.dmGscClicks / r.dmGscImpr) * 100, 2)}%.`);
    if (group.id === "leads" && r.dmLeadsTotal != null) derived.push(`${y}: ${dmFmt(r.dmLeadsTotal, 0)} customer ÷ 12 bulan = ${dmFmt(r.dmLeadsTotal / 12, 1)} per bulan.`);
    if (group.id === "social" && r.dmSmFolActive != null && r.dmSmFolInactive != null) { const t = r.dmSmFolActive + r.dmSmFolInactive; if (t > 0) derived.push(`${y}: total followers = ${dmFmt(r.dmSmFolActive, 0)} aktif + ${dmFmt(r.dmSmFolInactive, 0)} tidak aktif = ${dmFmt(t, 0)}; ${dmFmt((r.dmSmFolActive / t) * 100, 0)}% aktif.`); }
    if (group.id === "ecom") {
      if (r.dmEcomOmset > 0 && r.dmEcomProfit != null) derived.push(`${y}: margin profit = ${dmRp(r.dmEcomProfit, true)} ÷ ${dmRp(r.dmEcomOmset, true)} = ${dmFmt((r.dmEcomProfit / r.dmEcomOmset) * 100, 1)}%.`);
      if (r.dmEcomQ1 > 0 && r.dmEcomQ4 != null) derived.push(`${y}: penjualan Q4 ${dmFmt(r.dmEcomQ4, 0)} dibanding Q1 ${dmFmt(r.dmEcomQ1, 0)} = ${r.dmEcomQ4 >= r.dmEcomQ1 ? "naik" : "turun"} ${dmFmt(Math.abs((r.dmEcomQ4 - r.dmEcomQ1) / r.dmEcomQ1) * 100, 0)}%.`);
    }
    if (group.id === "social" && r.dmSmImprFol != null && r.dmSmImprNon != null) { const t = r.dmSmImprFol + r.dmSmImprNon; if (t > 0) derived.push(`${y}: total impression = ${dmFmt(r.dmSmImprFol, 0)} + ${dmFmt(r.dmSmImprNon, 0)} = ${dmFmt(t, 0)}; ${dmFmt((r.dmSmImprNon / t) * 100, 0)}% datang dari non-followers.`); }
  }
  const warns = ys.flatMap((y) => dmWarnings(group, snap[y]).map((w) => `${y}: ${w}`));
  return (<>
    <Block title="Dari mana angka ini?">
      <div style={{ fontSize: 16, lineHeight: 1.55 }}>
        Diisi manual oleh tim Digital Marketing pada laporan tiap tahun.
        {ys.map((y) => snap[y].periods[group.id] ? <div key={y} style={{ color: BRAND.muted }}>Periode data {y}: <b style={{ color: BRAND.text }}>{snap[y].periods[group.id]}</b></div> : null)}
        <div style={{ color: BRAND.muted, fontSize: 14, marginTop: 4 }}>Cara mengambil: {group.where}</div>
      </div>
    </Block>
    {derived.length > 0 && <Block title="Cara hitung turunan"><div style={{ display: "grid", gap: 4, fontSize: 16, lineHeight: 1.45 }}>{derived.map((l, i) => <div key={i}>{l}</div>)}</div></Block>}
    <Block title="Rincian per tahun">
      <Tbl align={["left", ...ys.map(() => R)]} head={["Indikator", ...ys]} rows={group.fields.map((f) => [f.label, ...ys.map((y) => dmFmtField(f, snap[y][f.key], true))])} />
    </Block>
    {warns.length > 0 && <Block title="Perlu dicek"><div style={{ display: "grid", gap: 6 }}>{warns.map((w, i) => <div key={i} style={{ fontSize: 15, lineHeight: 1.4, padding: "8px 12px", borderRadius: 10, background: `${BRAND.warn}1f`, border: `1px solid ${BRAND.warn}66` }}>⚠ {w}</div>)}</div></Block>}
  </>);
}

/** catatan turunan di bawah kartu (dihitung otomatis) */
function notes(g, r) {
  const out = [];
  if (g.id === "social") {
    if (r.dmSmImprFol != null && r.dmSmImprNon != null && r.dmSmImprFol + r.dmSmImprNon > 0) out.push(`${dmFmt((r.dmSmImprNon / (r.dmSmImprFol + r.dmSmImprNon)) * 100, 0)}% impression datang dari non-followers.`);
    if (r.dmSmFolActive != null && r.dmSmFolInactive != null && r.dmSmFolActive + r.dmSmFolInactive > 0) out.push(`${dmFmt((r.dmSmFolActive / (r.dmSmFolActive + r.dmSmFolInactive)) * 100, 0)}% followers aktif.`);
  }
  if (g.id === "ecom") {
    if (r.dmEcomOmset > 0 && r.dmEcomProfit != null) out.push(`Margin profit ${dmFmt((r.dmEcomProfit / r.dmEcomOmset) * 100, 1)}% dari omset.`);
    if (r.dmEcomQ1 > 0 && r.dmEcomQ4 != null) out.push(`Penjualan Q4 ${r.dmEcomQ4 >= r.dmEcomQ1 ? "naik" : "turun"} ${dmFmt(Math.abs((r.dmEcomQ4 - r.dmEcomQ1) / r.dmEcomQ1) * 100, 0)}% dibanding Q1.`);
  }
  return out;
}

function Metric({ f, v, d, big }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <div style={{ fontSize: 13, letterSpacing: 1.6, color: BRAND.muted, fontWeight: 700, textTransform: "uppercase" }}>{f.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: fitSize(dmFmtField(f, v), big, 30), fontWeight: 850, letterSpacing: -1.5, lineHeight: 1.05, whiteSpace: "nowrap" }}>{dmFmtField(f, v)}</span>
        {d && <span style={{ fontSize: 13, fontWeight: 800, color: d.good ? GOOD : BAD, background: `${d.good ? GOOD : BAD}1f`, borderRadius: 99, padding: "2px 10px", whiteSpace: "nowrap" }}>{d.text} vs {d.py}</span>}
      </div>
    </div>
  );
}

function DmKeySlide({ snap, groups, accent, page, pages }) {
  const [open, setOpen] = useState(null);
  const cur = groups.find((g) => g.id === open);
  const facts = [];
  for (const g of groups) {
    const y = lastYearWith(snap, g), f = g.fields.find((x) => x.key === g.headline) || g.fields[0], v = snap[y][f.key];
    if (v != null) { const d = delta(snap, f, y); facts.push(`${g.short} ${y}: ${f.label.replace(/ \(Rp\)/, "").toLowerCase()} ${dmFmtField(f, v)}${d ? ` (${d.text} vs ${d.py})` : ""}.`); }
  }
  return (
    <div>
      <SlideHead color={accent} eyebrow="Digital Marketing" title={pages > 1 ? `Poin penting Digital Marketing (${page}/${pages})` : "Poin penting Digital Marketing"} sub="Angka dari tim Digital Marketing. Klik ⓘ di tiap kelompok untuk sumber, periode, dan rinciannya." />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${groups.length}, 1fr)`, gridTemplateRows: "1fr auto", gap: 16, minHeight: 0 }}>
        <PrintCss />
        {groups.map((g) => {
          const y = lastYearWith(snap, g);
          return (
            <Glass key={g.id} accent={g.color} style={{ padding: "16px 22px", gap: g.fields.length >= 5 ? 10 : 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <IconBubble name={g.icon} color={g.color} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{g.title}</div>
                  <div style={{ fontSize: 13, color: BRAND.muted }}>Tahun {y}{snap[y].periods[g.id] ? ` · ${snap[y].periods[g.id]}` : ""}</div>
                </div>
                <InfoBtn onClick={() => setOpen(g.id)} color={g.color} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: groups.length <= 2 && g.fields.length > 2 ? "1fr 1fr" : "1fr", gap: g.fields.length >= 5 ? "10px 18px" : g.fields.length > 3 ? "16px 18px" : 18, alignContent: "start" }}>
                {g.fields.filter((f) => snap[y][f.key] != null).map((f) => <Metric key={f.key} f={f} v={snap[y][f.key]} d={delta(snap, f, y)} big={g.fields.length >= 5 ? 34 : groups.length <= 2 ? 44 : g.fields.length > 3 ? 40 : 52} />)}
              </div>
              {notes(g, snap[y]).length > 0 && <div style={{ fontSize: 14, color: BRAND.muted, lineHeight: 1.45 }}>{notes(g, snap[y]).join(" ")}</div>}
            </Glass>
          );
        })}
        {facts.length > 0 && <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan">{facts.join(" ")}</Insight></div>}
        {cur && <DetailPopup title={cur.title} sub="Sumber dan rincian angka" onClose={() => setOpen(null)}><DmDetailContent group={cur} snap={snap} /></DetailPopup>}
      </div>
    </div>
  );
}

function DmTrendSlide({ snap, groups, accent }) {
  const [open, setOpen] = useState(null);
  const cur = groups.find((g) => g.id === open);
  const picks = [
    { g: "gsc", key: "dmGscClicks", title: "Klik website per tahun" },
    { g: "leads", key: "dmLeadsTotal", title: "Total customer dari leads WA" },
    { g: "social", key: "dmSmReach", title: "Reach sosial media" },
    { g: "ecom", key: "dmEcomOmset", title: "Omset e-commerce" },
  ].map((p) => ({ ...p, group: groups.find((x) => x.id === p.g) })).filter((p) => p.group);
  const panels = picks.map((p) => ({ ...p, ys: DM_YEARS.filter((y) => snap[y][p.key] != null) })).filter((p) => p.ys.length >= 1);
  return (
    <div>
      <SlideHead color={accent} eyebrow="Digital Marketing" title="Tren tahunan" sub="Perbandingan angka utama dari tahun ke tahun." />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, panels.length)}, 1fr)`, gap: 16, minHeight: 0 }}>
        <PrintCss />
        {panels.map((p) => (
          <Glass key={p.key} style={{ padding: "16px 20px", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 18, fontWeight: 800 }}>{p.title}</div>
              <InfoBtn onClick={() => setOpen(p.g)} color={p.group.color} />
            </div>
            <BarChart w={320} h={300} labels={p.ys.map(String)} series={[{ name: p.title, color: p.group.color, showValues: true, values: p.ys.map((y) => snap[y][p.key]) }]}
              fmtTick={(v) => (v >= 1e9 ? `${dmFmt(v / 1e9, 1)} M` : v >= 1e6 ? `${dmFmt(v / 1e6, 1)} Jt` : v >= 1e3 ? `${dmFmt(v / 1e3, 0)} rb` : dmFmt(v, 0))}
              fmtVal={(v) => (v >= 1e9 ? `${dmFmt(v / 1e9, 2)} M` : v >= 1e6 ? `${dmFmt(v / 1e6, 1)} Jt` : dmFmt(v, 0))} />
          </Glass>
        ))}
        {cur && <DetailPopup title={cur.title} sub="Sumber dan rincian angka" onClose={() => setOpen(null)}><DmDetailContent group={cur} snap={snap} /></DetailPopup>}
      </div>
    </div>
  );
}

/** [] bila belum ada angka yang diisi. Dipanggil ClusterDeck (klaster DIGITAL_MARKETING) setelah slide indikator. */
export function buildDmSlides(data, cfg = {}) {
  const snap = dmSnapshot(data);
  const groups = DM_GROUPS.filter((g) => lastYearWith(snap, g) != null);
  if (!groups.length) return [];
  const multi = DM_YEARS.filter((y) => snap[y].any).length >= 2;
  const per = groups.length <= 3 ? groups.length : 2;
  const chunks = []; for (let i = 0; i < groups.length; i += per) chunks.push(groups.slice(i, i + per));
  return [
    ...chunks.map((c, i) => ({ id: i ? `dm-key${i + 1}` : "dm-key", label: chunks.length > 1 ? `Poin penting ${i + 1}/${chunks.length}` : "Poin penting", node: <DmKeySlide snap={snap} groups={c} accent={cfg.accent} page={i + 1} pages={chunks.length} /> })),
    ...(multi ? [{ id: "dm-trend", label: "Tren angka", node: <DmTrendSlide snap={snap} groups={groups} accent={cfg.accent} /> }] : []),
  ];
}