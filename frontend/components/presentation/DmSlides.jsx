"use client";
import React, { useState } from "react";
import { SlideHead, Glass, IconBubble, Insight, fitSize } from "./slides.jsx";
import { BRAND } from "../../lib/presentation/index.js";
import { dmGroupsFor, isUgoPlant, DM_YEARS, dmSnapshot, dmWarnings, dmFmt, dmFmtField, dmRp } from "../../lib/presentation/dmFigures.js";

/** kuartal terisi satu tahun: [{q:1..4, v}] (didefinisikan di sini agar tidak bergantung pada versi dmFigures.js) */
const dmQuarters = (r) => [1, 2, 3, 4].map((q) => ({ q, v: r[`dmEcomQ${q}`] })).filter((x) => x.v != null);
import { InfoBtn, Block, Tbl, DetailPopup, PrintCss, BarChart } from "./HrSlides.jsx";

/**
 * Slide Digital Marketing dari isian angka (form DmFigures): poin penting 3 kelompok + tren tahunan.
 * Tombol ⓘ -> popup: sumber/periode, cara menghitung turunan, tabel per tahun, peringatan kewajaran.
 */

const GOOD = BRAND.emerald, BAD = BRAND.bad;
const lastYearWith = (snap, g) => { const ys = DM_YEARS.filter((y) => g.fields.some((f) => snap[y][f.key] != null)); return ys.length ? ys[ys.length - 1] : null; };
const prevYearWith = (snap, g, key, before) => { const ys = DM_YEARS.filter((y) => y < before && snap[y][key] != null); return ys.length ? ys[ys.length - 1] : null; };

function delta(snap, f, y) {
  const py = prevYearWith(snap, null || { fields: [f] }, f.key, y);
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
      const qs = dmQuarters(r);
      if (qs.length >= 2) { const b = qs.reduce((a, x) => (x.v > a.v ? x : a), qs[0]), lo = qs.reduce((a, x) => (x.v < a.v ? x : a), qs[0]); derived.push(`${y}: kuartal tertinggi Q${b.q} (${dmFmt(b.v, 0)}), terendah Q${lo.q} (${dmFmt(lo.v, 0)}); total ${dmFmt(qs.reduce((a, x) => a + x.v, 0), 0)} dari ${qs.length} kuartal terisi.`); }
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
    if (r.dmEcomQ1 > 0 && r.dmEcomQ4 != null) out.push(`Penjualan Q4 ${r.dmEcomQ4 >= r.dmEcomQ1 ? "naik" : "turun"} ${dmFmt(Math.abs((r.dmEcomQ4 - r.dmEcomQ1) / r.dmEcomQ1) * 100, 0)}% dibanding Q1.`);
  }
  return out;
}

function Metric({ f, v, d, big, dense }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dense ? 0 : 2, minWidth: 0 }}>
      <div style={{ fontSize: dense ? 11 : 13, letterSpacing: dense ? 1 : 1.6, color: BRAND.muted, fontWeight: 700, textTransform: "uppercase", lineHeight: 1.2 }}>{f.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: dense ? 6 : 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: fitSize(dmFmtField(f, v), big, dense ? 20 : 30), fontWeight: 850, letterSpacing: dense ? -1 : -1.5, lineHeight: 1.05, whiteSpace: "nowrap" }}>{dmFmtField(f, v)}</span>
        {d && <span style={{ fontSize: dense ? 11 : 13, fontWeight: 800, color: d.good ? GOOD : BAD, background: `${d.good ? GOOD : BAD}1f`, borderRadius: 99, padding: dense ? "1px 7px" : "2px 10px", whiteSpace: "nowrap" }}>{d.text} vs {d.py}</span>}
      </div>
    </div>
  );
}

/** batang kecil penjualan per kuartal (Q1–Q4) */
function QuarterBars({ r, color, dense }) {
  const qs = dmQuarters(r); if (!qs.length) return null;
  const mx = Math.max(...qs.map((x) => x.v), 1), H = dense ? 38 : 70;
  const best = qs.reduce((a, x) => (x.v > a.v ? x : a), qs[0]).q;
  return (
    <div>
      <div style={{ fontSize: dense ? 11 : 13, letterSpacing: dense ? 1 : 1.6, color: BRAND.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Penjualan per kuartal</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: dense ? 8 : 12, alignItems: "end" }}>
        {[1, 2, 3, 4].map((q) => { const x = qs.find((z) => z.q === q); return (
          <div key={q} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: dense ? 12 : 15, fontWeight: 850, color: x ? (q === best ? color : BRAND.text) : BRAND.muted }}>{x ? dmFmt(x.v, 0) : "—"}</span>
            <div style={{ width: "70%", height: x ? Math.max(3, (x.v / mx) * H) : 3, borderRadius: 4, background: x ? color : BRAND.line, opacity: x ? (q === best ? 1 : 0.55) : 0.5 }} />
            <span style={{ fontSize: dense ? 11 : 13, fontWeight: 800, color: BRAND.muted }}>Q{q}</span>
          </div>); })}
      </div>
    </div>
  );
}

// baris tata letak saat grup banyak (>3): kelompok ringan di atas, kelompok padat (5 angka) di bawah
const ROW_OF = { gsc: 0, leads: 0, ecom: 0, social: 1, tiktok: 1 };

function DmKeySlide({ snap, groups, accent }) {
  const [open, setOpen] = useState(null);
  const cur = groups.find((g) => g.id === open);
  const dense = groups.length > 3;
  let rows = [groups];
  if (dense) {
    const top = groups.filter((g) => (ROW_OF[g.id] ?? 1) === 0), bot = groups.filter((g) => (ROW_OF[g.id] ?? 1) === 1);
    rows = top.length && bot.length ? [top, bot] : [groups.slice(0, Math.ceil(groups.length / 2)), groups.slice(Math.ceil(groups.length / 2))].filter((r) => r.length);
  }
  const facts = [];
  for (const g of groups) {
    const y = lastYearWith(snap, g), f = g.fields.find((x) => x.key === g.headline) || g.fields[0], v = snap[y][f.key];
    if (v != null) { const d = delta(snap, f, y); facts.push(dense ? `${g.short} ${dmFmtField(f, v)}${d ? ` (${d.text})` : ""}` : `${g.short} ${y}: ${f.label.replace(/ \(Rp\)/, "").toLowerCase()} ${dmFmtField(f, v)}${d ? ` (${d.text} vs ${d.py})` : ""}.`); }
  }
  return (
    <div>
      <SlideHead color={accent} eyebrow="Digital Marketing" title="Poin penting Digital Marketing" sub={dense ? "Klik ⓘ di tiap kelompok untuk sumber dan rincian." : "Angka dari tim Digital Marketing. Klik ⓘ di tiap kelompok untuk sumber, periode, dan rinciannya."} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridTemplateRows: dense ? rows.map(() => "1fr").join(" ") : `${rows.map(() => "1fr").join(" ")} auto`, gap: dense ? 12 : 16, minHeight: 0 }}>
        <PrintCss />
        {rows.map((row, ri) => row.map((g) => {
          const y = lastYearWith(snap, g), span = 6 / row.length;
          const showQ = !!g.quarters && dmQuarters(snap[y]).length > 0;
          const fields = g.fields.filter((f) => snap[y][f.key] != null && !(showQ && g.quarters.includes(f.key)));
          const cols = dense ? (span >= 3 ? (fields.length >= 5 ? 3 : 2) : fields.length >= 3 ? 2 : 1) : (groups.length <= 2 && g.fields.length > 2 ? 2 : 1);
          const nts = notes(g, snap[y]);
          return (
            <Glass key={g.id} accent={g.color} style={{ gridColumn: `span ${span}`, gridRow: ri + 1, padding: dense ? "10px 16px" : "16px 22px", gap: dense ? 6 : g.fields.length >= 5 ? 10 : 14, justifyContent: dense ? "flex-start" : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: dense ? 8 : 12 }}>
                <IconBubble name={g.icon} color={g.color} size={dense ? 30 : 40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: dense ? 14 : 17, fontWeight: 800, lineHeight: 1.2 }}>{g.title}</div>
                  <div style={{ fontSize: dense ? 11 : 13, color: BRAND.muted }}>Tahun {y}{snap[y].periods[g.id] ? ` · ${snap[y].periods[g.id]}` : ""}</div>
                </div>
                <InfoBtn onClick={() => setOpen(g.id)} color={g.color} />
              </div>
              {showQ && <QuarterBars r={snap[y]} color={g.color} dense={dense} />}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: dense ? "6px 14px" : g.fields.length >= 5 ? "10px 18px" : g.fields.length > 3 ? "16px 18px" : 18, alignContent: "start" }}>
                {fields.map((f) => <Metric key={f.key} f={f} v={snap[y][f.key]} d={delta(snap, f, y)} dense={dense} big={dense ? 28 : g.fields.length >= 5 ? 34 : groups.length <= 2 ? 44 : g.fields.length > 3 ? 40 : 52} />)}
              </div>
              {nts.length > 0 && <div style={{ fontSize: dense ? 12 : 14, color: BRAND.muted, lineHeight: 1.35 }}>{nts.join(" ")}</div>}
            </Glass>
          );
        }))}
        {!dense && facts.length > 0 && <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan">{facts.join(" ")}</Insight></div>}
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
    { g: "social", key: "dmSmReach", title: "Reach Instagram" },
    { g: "tiktok", key: "dmTtReach", title: "Penonton unik TikTok" },
    { g: "ecom", key: "dmEcomOmset", title: "Omset e-commerce" },
  ].map((p) => ({ ...p, group: groups.find((x) => x.id === p.g) })).filter((p) => p.group);
  const panels = picks.map((p) => {
    const f = p.group.fields.find((x) => x.key === p.key);
    const ys = DM_YEARS.filter((y) => snap[y][p.key] != null);
    return { ...p, f, ys };
  }).filter((p) => p.ys.length >= 1);
  // penjualan per kuartal: satu deret per tahun
  const qYears = groups.some((g) => g.id === "ecom") ? DM_YEARS.filter((y) => dmQuarters(snap[y]).length) : [];
  const qPanel = qYears.length ? { key: "quarters", g: "ecom", group: groups.find((x) => x.id === "ecom"), title: "Penjualan e-commerce per kuartal", qYears } : null;
  const all = qPanel ? [...panels, qPanel] : panels;
  const many = all.length > 4;
  const tick = (v) => (v >= 1e9 ? `${dmFmt(v / 1e9, 1)} M` : v >= 1e6 ? `${dmFmt(v / 1e6, 1)} Jt` : v >= 1e4 ? `${dmFmt(v / 1e3, 0)} rb` : dmFmt(v, 0));
  const val = (v) => (v >= 1e9 ? `${dmFmt(v / 1e9, 2)} M` : v >= 1e6 ? `${dmFmt(v / 1e6, 1)} Jt` : dmFmt(v, 0));
  const op = (i, n) => (n - 1 - i === 0 ? 1 : n - 1 - i === 1 ? 0.55 : 0.35);
  return (
    <div>
      <SlideHead color={accent} eyebrow="Digital Marketing" title="Tren tahunan" sub="Perbandingan angka utama dari tahun ke tahun." />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${many ? 3 : Math.max(1, all.length)}, 1fr)`, gridTemplateRows: many ? "1fr 1fr" : undefined, gap: many ? 12 : 16, minHeight: 0 }}>
        <PrintCss />
        {all.map((p) => (
          <Glass key={p.key} style={{ padding: many ? "10px 16px" : "16px 20px", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: many ? 15 : 18, fontWeight: 800 }}>{p.title}</div>
              <InfoBtn onClick={() => setOpen(p.g)} color={p.group.color} />
            </div>
            {p.key === "quarters"
              ? <BarChart w={many ? 400 : 320} h={many ? 188 : 300} labels={["Q1", "Q2", "Q3", "Q4"]} series={p.qYears.map((y, i) => ({ name: String(y), color: p.group.color, opacity: op(i, p.qYears.length), showValues: i === p.qYears.length - 1, values: [1, 2, 3, 4].map((q) => snap[y][`dmEcomQ${q}`] ?? null) }))} fmtTick={tick} fmtVal={val} />
              : <BarChart w={many ? 400 : 320} h={many ? 188 : 300} labels={p.ys.map(String)} series={[{ name: p.title, color: p.group.color, showValues: true, values: p.ys.map((y) => snap[y][p.key]) }]} fmtTick={tick} fmtVal={val} />}
            {p.key === "quarters" && p.qYears.length > 1 && <div style={{ fontSize: 11, color: BRAND.muted }}>{p.qYears.map((y, i) => `${y}${i === p.qYears.length - 1 ? " (nilai tampil)" : ""}`).join(" · ")}</div>}
          </Glass>
        ))}
        {cur && <DetailPopup title={cur.title} sub="Sumber dan rincian angka" onClose={() => setOpen(null)}><DmDetailContent group={cur} snap={snap} /></DetailPopup>}
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ UGO: marketing principal */

const UGO_COLORS = ["#06b6d4", "#a78bfa", "#f59e0b", "#f472b6", "#34d399"];
const YCH = ["#94a3b8", "#F5B83D"];

function UgoKeySlide({ snap, group, accent }) {
  const [open, setOpen] = useState(null);
  const ys = DM_YEARS.filter((y) => snap[y].any);
  const fields = group.fields.filter((f) => ys.some((y) => snap[y][f.key] != null));
  const cur = fields.find((f) => f.key === open);
  const ly = ys[ys.length - 1];
  const chipColor = (i) => (i === ys.length - 1 ? accent || GOOD : YCH[Math.max(0, YCH.length - (ys.length - 1 - i))] || YCH[0]);
  return (
    <div>
      <SlideHead color={accent} eyebrow="Marketing" title="Marketing Principal" sub="Lima poin kerja marketing principal ke distributor, dibanding tahun sebelumnya. Klik ⓘ untuk sumber dan rinciannya." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridTemplateRows: "1fr 1fr", gap: 14, minHeight: 0 }}>
        <PrintCss />
        {fields.map((f, i) => {
          const col = UGO_COLORS[i % UGO_COLORS.length], v = snap[ly][f.key], d = delta(snap, f, ly);
          const span = fields.length === 5 ? (i < 3 ? 2 : 3) : fields.length === 4 ? 3 : 2;
          return (
            <Glass key={f.key} accent={col} style={{ gridColumn: `span ${span}`, padding: "12px 18px", gap: 6, justifyContent: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 99, background: `${col}22`, border: `1px solid ${col}66`, color: col, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 15 }}>{f.no}</div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{f.name}</div>
                <InfoBtn onClick={() => setOpen(f.key)} color={col} />
              </div>
              <div style={{ fontSize: 12.5, color: BRAND.muted, lineHeight: 1.35 }}>{f.desc}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: fitSize(dmFmtField(f, v), 44, 28), fontWeight: 850, letterSpacing: -1.5, lineHeight: 1 }}>{v == null ? "—" : dmFmtField(f, v)}</span>
                {d && <span style={{ fontSize: 13, fontWeight: 800, color: d.good ? GOOD : BAD, background: `${d.good ? GOOD : BAD}1f`, borderRadius: 99, padding: "2px 10px", whiteSpace: "nowrap" }}>{d.text} vs {d.py}</span>}
              </div>
              <div style={{ fontSize: 12, color: BRAND.muted, lineHeight: 1.3 }}>{f.label}</div>
              {ys.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                  {ys.map((y, k) => (
                    <div key={y} style={{ flex: 1, minWidth: 0, background: `${chipColor(k)}14`, border: `1px solid ${chipColor(k)}55`, borderRadius: 9, padding: "2px 8px" }}>
                      <div style={{ fontSize: 10.5, letterSpacing: 1.4, fontWeight: 800, color: chipColor(k) }}>{y}</div>
                      <div style={{ fontSize: 15, fontWeight: 850, lineHeight: 1.1 }}>{snap[y][f.key] == null ? "—" : dmFmtField(f, snap[y][f.key])}</div>
                    </div>
                  ))}
                </div>
              )}
            </Glass>
          );
        })}
        {cur && <DetailPopup title={`${cur.no}. ${cur.name}`} sub="Sumber dan rincian angka" onClose={() => setOpen(null)}><DmDetailContent group={{ ...group, fields: [cur] }} snap={snap} /></DetailPopup>}
      </div>
    </div>
  );
}

function UgoTrendSlide({ snap, group, accent }) {
  const [open, setOpen] = useState(null);
  const panels = group.fields.map((f, i) => ({ f, col: UGO_COLORS[i % UGO_COLORS.length], ys: DM_YEARS.filter((y) => snap[y][f.key] != null) })).filter((p) => p.ys.length);
  const cur = panels.find((p) => p.f.key === open);
  return (
    <div>
      <SlideHead color={accent} eyebrow="Marketing" title="Tren marketing principal" sub="Perbandingan lima poin dari tahun ke tahun." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "1fr 1fr", gap: 12, minHeight: 0 }}>
        <PrintCss />
        {panels.map((p) => (
          <Glass key={p.f.key} style={{ padding: "10px 16px", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{p.f.no}. {p.f.name}</div>
              <InfoBtn onClick={() => setOpen(p.f.key)} color={p.col} />
            </div>
            <BarChart w={400} h={188} labels={p.ys.map(String)} series={[{ name: p.f.name, color: p.col, showValues: true, values: p.ys.map((y) => snap[y][p.f.key]) }]} fmtTick={(v) => dmFmt(v, 0)} fmtVal={(v) => dmFmt(v, 0)} />
          </Glass>
        ))}
        {cur && <DetailPopup title={`${cur.f.no}. ${cur.f.name}`} sub="Sumber dan rincian angka" onClose={() => setOpen(null)}><DmDetailContent group={{ ...group, fields: [cur.f] }} snap={snap} /></DetailPopup>}
      </div>
    </div>
  );
}

/** [] bila belum ada angka yang diisi. Dipanggil ClusterDeck (klaster DIGITAL_MARKETING) setelah slide indikator. */
export function buildDmSlides(data, cfg = {}) {
  const snap = dmSnapshot(data);
  const groups = dmGroupsFor(cfg.plantName).filter((g) => lastYearWith(snap, g) != null);
  if (!groups.length) return [];
  const multi = DM_YEARS.filter((y) => snap[y].any).length >= 2;
  if (isUgoPlant(cfg.plantName)) {
    const g = groups[0];
    return [
      { id: "dm-key", label: "Marketing principal", node: <UgoKeySlide snap={snap} group={g} accent={cfg.accent} /> },
      ...(multi ? [{ id: "dm-trend", label: "Tren principal", node: <UgoTrendSlide snap={snap} group={g} accent={cfg.accent} /> }] : []),
    ];
  }
  return [
    { id: "dm-key", label: "Poin penting", node: <DmKeySlide snap={snap} groups={groups} accent={cfg.accent} /> },
    ...(multi ? [{ id: "dm-trend", label: "Tren angka", node: <DmTrendSlide snap={snap} groups={groups} accent={cfg.accent} /> }] : []),
  ];
}