"use client";
import React, { useState } from "react";
import { SlideHead, Glass, IconBubble, Insight, fitSize } from "./slides.jsx";
import { BRAND } from "../../lib/presentation/index.js";
import { DM_GROUPS, DM_YEARS, dmSnapshot, dmWarnings, dmFmt, dmFmtField, dmRp, dmQuarters } from "../../lib/presentation/dmFigures.js";
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
    if (group.id === "tiktok") {
      if (r.dmTtViews > 0 && r.dmTtLikes != null) derived.push(`${y}: engagement = ${dmFmt(r.dmTtLikes, 0)} likes ÷ ${dmFmt(r.dmTtViews, 0)} views = ${dmFmt((r.dmTtLikes / r.dmTtViews) * 100, 2)}%.`);
      if (r.dmTtViews > 0 && r.dmTtReach != null) derived.push(`${y}: rata-rata ${dmFmt(r.dmTtViews / r.dmTtReach, 1)} kali tonton per penonton unik (${dmFmt(r.dmTtViews, 0)} views ÷ ${dmFmt(r.dmTtReach, 0)} penonton).`);
    }
    if (group.id === "ecom") {
      const qs = dmQuarters(r);
      if (qs.length >= 2) { const b = qs.reduce((a, x) => (x.v > a.v ? x : a), qs[0]), lo = qs.reduce((a, x) => (x.v < a.v ? x : a), qs[0]); derived.push(`${y}: kuartal tertinggi Q${b.q} (${dmFmt(b.v, 0)}), terendah Q${lo.q} (${dmFmt(lo.v, 0)}); total ${dmFmt(qs.reduce((a, x) => a + x.v, 0), 0)} dari ${qs.length} kuartal terisi.`); }
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
  if (g.id === "tiktok") {
    if (r.dmTtViews > 0 && r.dmTtLikes != null) out.push(`Engagement ${dmFmt((r.dmTtLikes / r.dmTtViews) * 100, 1)}% (likes ÷ views).`);
  }
  if (g.id === "ecom") {
    if (r.dmEcomOmset > 0 && r.dmEcomProfit != null) out.push(`Margin profit ${dmFmt((r.dmEcomProfit / r.dmEcomOmset) * 100, 1)}% dari omset.`);
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
    { g: "tiktok", key: "dmTtViews", title: "Video views TikTok" },
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

/** [] bila belum ada angka yang diisi. Dipanggil ClusterDeck (klaster DIGITAL_MARKETING) setelah slide indikator. */
export function buildDmSlides(data, cfg = {}) {
  const snap = dmSnapshot(data);
  const groups = DM_GROUPS.filter((g) => lastYearWith(snap, g) != null);
  if (!groups.length) return [];
  const multi = DM_YEARS.filter((y) => snap[y].any).length >= 2;
  return [
    { id: "dm-key", label: "Poin penting", node: <DmKeySlide snap={snap} groups={groups} accent={cfg.accent} /> },
    ...(multi ? [{ id: "dm-trend", label: "Tren angka", node: <DmTrendSlide snap={snap} groups={groups} accent={cfg.accent} /> }] : []),
  ];
}