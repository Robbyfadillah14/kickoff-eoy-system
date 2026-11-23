"use client";
import React, { useMemo } from "react";
import DeckShell from "./DeckShell.jsx";
import { Icon, Empty } from "./slides.jsx";
import { buildClusterData, collectByDept, toNum, formatRupiah, fmtAch, pctDelta, isEmptyValue } from "../../lib/presentation/index.js";
import { productsOf } from "../../lib/presentation/commercialData.js";

/* Palet khusus deck Sales (identitas Commercial: navy + lime). Panggung selalu terang. */
const NAVY = "#12324A", BLUE = "#2B6285", LIME = "#A3C400", LIME_D = "#7FA800", GREEN = "#2F7A45", AMBER = "#C98A00";
const YEAR_COLORS = [BLUE, GREEN, AMBER];
const PIE_COLORS = [BLUE, LIME, GREEN, "#5B8DB8", "#94A3B8"];
const YEARS = [2024, 2025, 2026];
const SLATE = { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b" };
const RING_R = 58, RING_C = 2 * Math.PI * RING_R;
const txt = (v) => (isEmptyValue(v) ? "" : String(v).trim());

const card = { background: "#fff", borderRadius: 16, border: `1px solid ${SLATE[200]}`, boxShadow: "0 6px 16px -8px rgba(15,23,42,.25)", boxSizing: "border-box" };
const clamp = (n) => ({ display: "-webkit-box", WebkitLineClamp: n, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-line" });
const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const rp = (v) => formatRupiah(v);

/* ───────── komponen kecil ───────── */
function DeltaChip({ cur, prev, base = "Baseline" }) {
  const d = pctDelta(cur, prev);
  const st = { padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", flex: "none" };
  if (d === null) return <span style={{ ...st, background: SLATE[200], color: SLATE[700] }}>{base}</span>;
  const up = d >= 0;
  return <span style={{ ...st, background: up ? "#d1fae5" : "#ffe4e6", color: up ? "#065f46" : "#9f1239" }}>{up ? "▲" : "▼"} {Math.abs(d) > 999 ? ">999" : Math.abs(d).toFixed(0)}%</span>;
}
const YearTag = ({ yr, idx }) => <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 99, fontSize: 14, fontWeight: 900, color: "#fff", background: YEAR_COLORS[idx % 3] }}>{yr}</span>;

function SlideHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: NAVY, color: LIME, display: "grid", placeItems: "center" }}>{icon}</div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: NAVY, lineHeight: 1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: SLATE[500], marginTop: 4 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>{YEARS.map((y, i) => <span key={y} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 900, color: "#fff", background: YEAR_COLORS[i] }}>{y}</span>)}</div>
    </div>
  );
}
const Dash = ({ text }) => <span style={{ fontSize: 14, fontStyle: "italic", color: SLATE[400] }}>{text}</span>;
const SectionTitle = ({ color, children, right }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 6, height: 16, borderRadius: 99, background: color }} />
      <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: SLATE[600] }}>{children}</span>
    </div>
    {right && <span style={{ fontSize: 11, fontWeight: 600, color: SLATE[400] }}>{right}</span>}
  </div>
);
const Track = ({ pct, color, h = 10 }) => (
  <div style={{ flex: 1, height: h, borderRadius: 99, background: SLATE[100], overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, pct))}%`, background: color, borderRadius: 99 }} /></div>
);

function MiniRing({ pct, color, size = 68, fs = 13 }) {
  const r = 26, c = 2 * Math.PI * r, v = Math.min(Math.max(pct, 0), 100);
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg viewBox="0 0 64 64" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke={SLATE[200]} strokeWidth="7" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: fs, fontWeight: 900, color }}>{fmtAch(pct)}</span>
    </div>
  );
}

function YearColHeaders({ yearData, label, sub, idW = 230 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `${idW}px 1fr 1fr 1fr`, gap: 12, flex: "none" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 8px" }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: NAVY, lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 12, color: SLATE[500] }}>{sub}</div>
      </div>
      {yearData.map((d, i) => (
        <div key={d.yr} style={{ borderRadius: 12, padding: "8px 16px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${YEAR_COLORS[i]}, ${YEAR_COLORS[i]}b3)`, boxShadow: "0 6px 14px -8px rgba(0,0,0,.4)" }}>
          <span style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{d.yr}</span>
          <div style={{ textAlign: "right", lineHeight: 1.2 }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{d.rep ? rp(d.actual) : "-"}</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>{d.rep ? `Total · ${fmtAch(d.ach)} dari target` : "Belum ada laporan"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
const EmptyCell = ({ text = "Belum ada data" }) => (
  <div style={{ borderRadius: 12, border: `1px dashed ${SLATE[300]}`, background: "rgba(248,250,252,.7)", display: "grid", placeItems: "center" }}><span style={{ fontSize: 13, fontStyle: "italic", color: SLATE[400] }}>{text}</span></div>
);
function RowIdentity({ name, rank, total, extra, compact = false, suffix = "" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 12, padding: "0 8px 0 4px", minWidth: 0 }}>
      <div style={{ position: "relative", flex: "none" }}>
        <div style={{ width: compact ? 32 : 48, height: compact ? 32 : 48, borderRadius: compact ? 11 : 16, display: "grid", placeItems: "center", fontSize: compact ? 15 : 20, fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`, boxShadow: "0 6px 12px -6px rgba(0,0,0,.4)" }}>{(name || "?").trim().charAt(0).toUpperCase()}</div>
        {rank === 0 && <span style={{ position: "absolute", top: -9, right: -9, fontSize: 15 }}>🏆</span>}
      </div>
      <div style={{ minWidth: 0 }}>
        <div title={name} style={{ ...ellipsis, fontSize: compact ? 14 : 17, fontWeight: 900, color: NAVY, lineHeight: 1.2 }}>{name}</div>
        <div style={{ ...ellipsis, fontSize: compact ? 11 : 12, color: SLATE[500] }}>Total {rp(total)}{suffix}</div>
        {extra}
      </div>
    </div>
  );
}

/* ───────── timeline ───────── */
function LinkChip({ cur, prev, fromYr }) {
  const d = prev && prev.rep && prev.actual > 0 ? pctDelta(cur.actual, prev.actual) : null;
  if (d === null) return <div style={{ padding: "4px 12px", borderRadius: 99, background: "#fff", border: `2px solid ${SLATE[300]}`, color: SLATE[400], fontWeight: 900, fontSize: 14, boxShadow: "0 4px 10px rgba(0,0,0,.12)" }}>—</div>;
  const up = d >= 0, col = up ? GREEN : "#DC2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, background: "#fff", border: `2px solid ${col}`, color: col, boxShadow: "0 8px 16px -6px rgba(0,0,0,.3)", whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 15, fontWeight: 900 }}>{up ? "▲" : "▼"} {Math.abs(d) > 999 ? ">999" : Math.abs(d).toFixed(0)}%</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: SLATE[500] }}>vs {fromYr}</span>
    </div>
  );
}

/** daftar ringkas SEMUA item: 1 kolom bila <=3 item, 2 kolom bila lebih (tidak ada "+N lainnya") */
function MiniList({ items }) {
  const two = items.length > 3;
  return (
    <div style={{ display: "grid", gridTemplateColumns: two ? "1fr 1fr" : "1fr", gap: two ? "2px 14px" : "5px 0" }}>
      {items.map((x, k) => (
        <div key={k} title={`${x.name} · ${x.right}`} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, height: two ? 16 : 22 }}>
          <span style={{ ...ellipsis, flex: 1, fontSize: two ? 12 : 14, fontWeight: 700, color: SLATE[800] }}>{x.name}</span>
          <span style={{ flex: "none", fontSize: two ? 12 : 14, fontWeight: 900, color: x.color, whiteSpace: "nowrap" }}>{x.right}</span>
          {x.delta != null && <span style={{ flex: "none", fontSize: 10, fontWeight: 900, color: x.delta >= 0 ? GREEN : "#DC2626" }}>{x.delta >= 0 ? "▲" : "▼"}</span>}
        </div>))}
    </div>
  );
}

function YearTimeline({ yearData }) {
  const logs = yearData.filter((d) => d.actual > 0).map((d) => Math.log10(d.actual));
  const lo = logs.length ? Math.min(...logs) : 0, hi = logs.length ? Math.max(...logs) : 1;
  const size = (v) => (v > 0 && hi > lo ? 108 + ((Math.log10(v) - lo) / (hi - lo)) * 32 : 108);
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 8, padding: "0 20px" }}>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, height: 156, flex: "none" }}>
        <div style={{ position: "absolute", height: 6, borderRadius: 99, left: "16.66%", right: "16.66%", top: "calc(50% - 3px)", background: `linear-gradient(90deg, ${YEAR_COLORS.join(",")})`, opacity: 0.45 }} />
        {[1, 2].map((k) => (
          <div key={k} style={{ position: "absolute", zIndex: 20, left: `${(k * 100) / 3}%`, top: "50%", transform: "translate(-50%,-50%)" }}><LinkChip cur={yearData[k]} prev={yearData[k - 1]} fromYr={yearData[k - 1].yr} /></div>
        ))}
        {yearData.map((d, i) => {
          const c = YEAR_COLORS[i], s = size(d.actual), W = s + 14, R = 46, C = 2 * Math.PI * R, v = Math.min(Math.max(d.ach, 0), 100);
          return (
            <div key={d.yr} style={{ position: "relative", zIndex: 10, display: "grid", placeItems: "center" }}>
              <div style={{ position: "relative", width: W, height: W }}>
                <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r={R} fill="white" stroke={`${c}26`} strokeWidth="5" />
                  {d.rep && <circle cx="50" cy="50" r={R} fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(v / 100) * C} ${C}`} />}
                </svg>
                <div style={{ position: "absolute", inset: 10, borderRadius: 999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, lineHeight: 1.15, background: `radial-gradient(circle at 30% 25%, ${c}cc, ${c})`, boxShadow: "0 10px 20px -8px rgba(0,0,0,.45)" }}>
                  <span style={{ fontSize: 17, padding: "0 4px", whiteSpace: "nowrap" }}>{d.rep ? rp(d.actual) : "-"}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>realisasi</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, flex: "none" }}>
        {yearData.map((d, i) => (
          <div key={d.yr} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: YEAR_COLORS[i] }}>{d.yr}</span>
              {d.rep
                ? <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 800, background: d.ach >= 100 ? "#d1fae5" : "#ffe4e6", color: d.ach >= 100 ? "#065f46" : "#9f1239" }}>{d.ach >= 100 ? "Tercapai" : "Belum"} · {fmtAch(d.ach)}</span>
                : <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 800, background: SLATE[200], color: SLATE[500] }}>Belum ada laporan</span>}
            </div>
            <div style={{ fontSize: 12, color: SLATE[500], marginTop: 2 }}>Target {d.rep ? rp(d.target) : "-"}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, flex: 1, minHeight: 0, paddingBottom: 4 }}>
        {yearData.map((d, i) => {
          const c = YEAR_COLORS[i];
          const sales = d.sList.map((sp) => { const t = toNum(sp.targetProfit || sp.targetVal), a = toNum(sp.actualVal); return { name: txt(sp.salesName), act: a, ach: t > 0 ? (a / t) * 100 : 0 }; }).filter((x) => x.name).sort((a, b) => b.act - a.act);
          const prods = [...d.products].sort((a, b) => b.jalan - a.jalan);
          const mx = Math.max(...prods.map((x) => x.jalan), 1);
          return (
            <div key={d.yr} style={{ ...card, borderTop: `4px solid ${c}`, padding: "10px 16px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 4, minHeight: 0, overflow: "hidden" }}>
              <div>
                <SectionTitle color={BLUE} right={`${sales.length} personel`}>Tim Sales</SectionTitle>
                {sales.length ? <MiniList items={sales.map((x) => ({ name: x.name, right: fmtAch(x.ach), color: x.ach >= 100 ? GREEN : "#d97706" }))} /> : <Dash text={d.rep ? "Belum diisi" : "Belum ada laporan"} />}
              </div>
              <div>
                <SectionTitle color={GREEN} right={`${prods.length} item`}>Produk</SectionTitle>
                {prods.length ? <MiniList items={prods.map((x) => { const dl = pctDelta(x.jalan, x.lalu); return { name: x.name, right: rp(x.jalan), color: SLATE[700], delta: dl }; })} /> : <Dash text={d.rep ? "Belum diisi" : "Belum ada laporan"} />}
              </div>
              <div>
                <SectionTitle color="#5B6B00">Inovasi</SectionTitle>
                {d.innovations
                  ? <div style={{ borderRadius: 10, padding: "5px 10px", fontSize: 12.5, color: SLATE[700], lineHeight: 1.3, background: `${c}14`, borderLeft: `3px solid ${c}`, ...clamp(2) }} title={d.innovations}>{d.innovations}</div>
                  : <Dash text={d.rep ? "Belum diisi" : "Belum ada laporan"} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── builder slide ───────── */
/** kepadatan baris: 0 = lega (<=5 baris), 1 = sedang (6-7), 2 = rapat (8+). Semua baris selalu tampil di SATU slide. */
export const densityOf = (n) => (n <= 5 ? 0 : n <= 7 ? 1 : 2);

export function buildSalesSlides(data, { mode = "OMZET", plantName = "" } = {}) {
  if (data.needsPlant) {
    return [{ id: "plant", label: "Pilih plant", node: <div style={{ height: "100%", display: "grid", placeItems: "center" }}><Empty hint="Data berisi lebih dari satu plant — pilih plant dulu agar angka tidak tercampur.">Plant belum dipilih</Empty></div> }];
  }
  const salesType = mode === "PROFIT" ? "Profit" : "Omzet";
  const y = data.years;

  const yearData = YEARS.map((yr) => {
    const m = y[yr].metrics || {};
    const sList = Array.isArray(m.salesPerformances) ? m.salesPerformances : [];
    const actual = sList.reduce((a, s) => a + toNum(s.actualVal), 0);
    const target = sList.reduce((a, s) => a + toNum(s.targetProfit || s.targetVal), 0);
    return {
      yr, rep: y[yr].hasData, sList, products: productsOf(m), actual, target, ach: target > 0 ? (actual / target) * 100 : 0,
      innovations: txt(m.branchInnovations), supportPo: txt(m.salesSupportPo), supportCoord: txt(m.salesSupportCoord), supportEval: txt(m.salesSupportEvaluation), notes: txt(m.generalNotes),
      outlook: txt(m.strategicOutlook2027),
    };
  });
  const totalAct = yearData.reduce((a, d) => a + d.actual, 0), totalTgt = yearData.reduce((a, d) => a + d.target, 0);
  const totalAch = totalTgt > 0 ? (totalAct / totalTgt) * 100 : 0;
  const maxYearVal = Math.max(...yearData.flatMap((d) => [d.actual, d.target]), 1);

  const names = new Set(); const agg = {}; const matrix = {};
  yearData.forEach((d, yi) => d.sList.forEach((s) => {
    const name = txt(s.salesName); if (!name) return;
    names.add(name);
    const t = toNum(s.targetProfit || s.targetVal), a = toNum(s.actualVal);
    agg[name] = agg[name] || { name, actual: 0, target: 0 }; agg[name].actual += a; agg[name].target += t;
    matrix[name] = matrix[name] || { name, total: 0, cells: [null, null, null] };
    const cell = matrix[name].cells[yi] || { tgt: 0, act: 0, note: "" };
    cell.tgt += t; cell.act += a;
    const note = txt(s.note); if (note && !cell.note.includes(note)) cell.note = cell.note ? `${cell.note} · ${note}` : note;
    matrix[name].cells[yi] = cell; matrix[name].total += a;
  }));
  const topSales = Object.values(agg).map((s) => ({ ...s, ach: s.target > 0 ? (s.actual / s.target) * 100 : 0 })).sort((a, b) => b.actual - a.actual);
  const salesRows = Object.values(matrix).sort((a, b) => b.total - a.total);

  const prodAgg = {}; const prodMatrix = {};
  yearData.forEach((d, yi) => d.products.forEach((p) => {
    prodAgg[p.name] = (prodAgg[p.name] || 0) + p.jalan;
    prodMatrix[p.name] = prodMatrix[p.name] || { name: p.name, total: 0, cells: [null, null, null] };
    const cell = prodMatrix[p.name].cells[yi] || { cur: 0, prev: 0 };
    cell.cur += p.jalan; cell.prev += p.lalu; prodMatrix[p.name].cells[yi] = cell; prodMatrix[p.name].total += p.jalan;
  }));
  const prodList = Object.entries(prodAgg).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val);
  const topProd = prodList.slice(0, 4); const other = prodList.slice(4).reduce((a, p) => a + p.val, 0);
  if (other > 0) topProd.push({ name: "Lainnya", val: other });
  const prodTotal = topProd.reduce((a, p) => a + p.val, 0);
  let acc = 0;
  const pieBg = prodTotal > 0 ? `conic-gradient(${topProd.map((p, i) => { const s = acc; acc += (p.val / prodTotal) * 100; return `${PIE_COLORS[i % 5]} ${s}% ${acc}%`; }).join(", ")})` : SLATE[200];
  const prodRows = Object.values(prodMatrix).sort((a, b) => b.total - a.total);
  const prodGrand = prodRows.reduce((a, r) => a + r.total, 0);

  const fut = collectByDept(y[2027], ["strategicOutlook2027", "outlook2027", "futureOutlook", "generalNotes"]);
  const outlook2027 = fut.length ? fut.map((o) => String(o.value)).join("\n\n") : (yearData.slice().reverse().map((d) => d.outlook).find(Boolean) || "");

  const bar = (children, extra) => <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 12, ...extra }}>{children}</div>;
  const BigStat = ({ icon, value, label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 99, background: "rgba(255,255,255,.15)", display: "grid", placeItems: "center", flex: "none" }}><Icon name={icon} size={22} color="#fff" /></div>
      <div><div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{value}</div><div style={{ fontSize: 13, color: "#e0f2fe", marginTop: 4 }}>{label}</div></div>
    </div>
  );

  const master = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, height: 250, flex: "none" }}>
        <div style={{ background: BLUE, color: "#fff", borderRadius: 16, boxShadow: "0 8px 18px -8px rgba(0,0,0,.4)", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <BigStat icon="target" value={<>{names.size} <span style={{ fontSize: 14, fontWeight: 500, color: "#e0f2fe" }}>Personel</span></>} label="Total sales aktif" />
          <BigStat icon="trendUp" value={rp(totalAct)} label="Total revenue (2024-2026)" />
          <BigStat icon="chart" value={rp(totalTgt)} label="Total target (2024-2026)" />
        </div>
        <div style={{ background: "linear-gradient(135deg,#6A9A1E,#356B1B)", color: "#fff", borderRadius: 16, boxShadow: "0 8px 18px -8px rgba(0,0,0,.4)", padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ position: "relative", width: 136, height: 136 }}>
            <svg viewBox="0 0 140 140" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle cx="70" cy="70" r={RING_R} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="14" />
              <circle cx="70" cy="70" r={RING_R} fill="none" stroke="#E4F28A" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(Math.min(totalAch, 100) / 100) * RING_C} ${RING_C}`} />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 34, fontWeight: 900 }}>{fmtAch(totalAch)}</span>
          </div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>{rp(totalAct)}</div><div style={{ fontSize: 13, color: "#ecfccb", marginTop: 2 }}>Pencapaian vs target 2024-2026</div></div>
        </div>
        <div style={{ gridColumn: "span 2", background: `linear-gradient(135deg, ${LIME}, ${LIME_D})`, color: "#1B2A02", borderRadius: 16, boxShadow: "0 8px 18px -8px rgba(0,0,0,.4)", padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div><div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{rp(totalAct)}</div><div style={{ fontSize: 13, fontWeight: 500, color: "#2E4A00", marginTop: 4 }}>{salesType} vs target per tahun</div></div>
            <div style={{ display: "flex", gap: 12, fontSize: 12, fontWeight: 600, color: "#2E4A00" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(255,255,255,.7)" }} />Target</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 12, height: 12, borderRadius: 3, background: "#1B3A00" }} />Aktual</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 24, paddingTop: 12, minHeight: 0 }}>
            {yearData.map((d) => (
              <div key={d.yr} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{rp(d.actual)}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, width: "100%", justifyContent: "center", height: 96 }}>
                  <div style={{ width: 36, borderRadius: "6px 6px 0 0", background: "rgba(255,255,255,.7)", height: `${Math.max((d.target / maxYearVal) * 100, 2)}%` }} />
                  <div style={{ width: 36, borderRadius: "6px 6px 0 0", background: "#1B3A00", height: `${Math.max((d.actual / maxYearVal) * 100, 2)}%` }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 6 }}>{d.yr}</div>
              </div>))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, flex: 1, minHeight: 0 }}>
        <div style={{ ...card, padding: 20, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Performa per tahun</div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 0 }}>
            {yearData.map((d, i) => (
              <div key={d.yr} style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0", borderTop: i > 0 ? `1px solid ${SLATE[200]}` : "none" }}>
                <div style={{ width: 190, flex: "none" }}>
                  <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: GREEN }}>{d.rep ? rp(d.actual) : "-"}</div>
                  <div style={{ fontSize: 13, color: SLATE[600], marginTop: 4 }}>{salesType} aktual {d.yr}</div>
                </div>
                {d.rep ? (<>
                  <div style={{ flex: 1, display: "grid", gap: 8 }}>
                    {[["Target", d.target, BLUE], ["Aktual", d.actual, LIME_D]].map(([l, v, col]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 48, fontSize: 12, color: SLATE[500] }}>{l}</span>
                        <Track pct={(v / maxYearVal) * 100} color={col} h={12} />
                        <span style={{ width: 84, textAlign: "right", fontSize: 12, fontWeight: 800, color: col === BLUE ? BLUE : GREEN }}>{rp(v)}</span>
                      </div>))}
                  </div>
                  <span style={{ flex: "none", padding: "6px 12px", borderRadius: 8, fontSize: 16, fontWeight: 900, background: d.ach >= 100 ? "#d1fae5" : "#fef3c7", color: d.ach >= 100 ? "#065f46" : "#92400e" }}>{fmtAch(d.ach)}</span>
                </>) : <div style={{ flex: 1, fontSize: 14, fontStyle: "italic", color: SLATE[400] }}>Belum ada data laporan.</div>}
              </div>))}
          </div>
        </div>

        <div style={{ ...card, padding: 20, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Pencapaian sales</div>
          <div style={{ fontSize: 12, color: SLATE[500], marginBottom: 8 }}>Gabungan 2024-2026, urut {salesType.toLowerCase()}</div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 0 }}>
            {topSales.length ? topSales.map((s) => (
              <div key={s.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: SLATE[800] }}>
                  <span title={s.name} style={{ ...ellipsis, maxWidth: 190 }}>{s.name}</span><span style={{ color: s.ach >= 100 ? GREEN : "#d97706" }}>{fmtAch(s.ach)}</span>
                </div>
                <div style={{ display: "flex", marginTop: topSales.length > 7 ? 2 : 4 }}><Track pct={s.ach} color={s.ach >= 100 ? LIME_D : "#F59E0B"} h={topSales.length > 7 ? 6 : 8} /></div>
              </div>)) : <Dash text="Belum ada data sales." />}
          </div>
        </div>

        <div style={{ ...card, padding: 20, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Komposisi produk</div>
          <div style={{ fontSize: 12, color: SLATE[500], marginBottom: 8 }}>Gabungan 2024-2026</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: prodList.length > 6 ? 6 : 12 }}>
            <div style={{ width: prodList.length > 6 ? 92 : 120, height: prodList.length > 6 ? 92 : 120, borderRadius: 999, background: pieBg, position: "relative" }}><div style={{ position: "absolute", inset: prodList.length > 6 ? 23 : 30, borderRadius: 999, background: "#fff" }} /></div>
          </div>
          <div style={{ flex: 1, display: "grid", gap: prodList.length > 6 ? 2 : 6, alignContent: "start", minHeight: 0, overflow: "hidden" }}>
            {prodList.length ? prodList.map((p, i) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: prodList.length > 6 ? 11 : 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}><i style={{ width: 10, height: 10, borderRadius: 99, background: PIE_COLORS[Math.min(i, 4)], flex: "none" }} /><span title={p.name} style={{ ...ellipsis, maxWidth: 110, color: SLATE[700] }}>{p.name}</span></span>
                <b style={{ color: SLATE[800] }}>{rp(p.val)}</b>
              </div>)) : <div style={{ fontSize: 14, fontStyle: "italic", color: SLATE[400], textAlign: "center" }}>Belum ada data produk.</div>}
          </div>
        </div>
      </div>
    </div>
  );

  const rowBoxFor = (lvl) => (lvl === 0
    ? { display: "grid", gridTemplateColumns: "230px 1fr 1fr 1fr", gap: 12, ...card, padding: 12, alignItems: "stretch", flex: "1 1 0", minHeight: 0, maxHeight: 230, overflow: "hidden" }
    : { display: "grid", gridTemplateColumns: "200px 1fr 1fr 1fr", gap: 10, ...card, borderRadius: 12, padding: lvl === 1 ? "6px 10px" : "3px 8px", alignItems: "stretch", flex: "1 1 0", minHeight: 0, overflow: "hidden" });
  const rowBox = rowBoxFor(0);
  const listFor = (lvl) => ({ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: lvl === 0 ? 12 : lvl === 1 ? 8 : 5 });
  const list = listFor(0);

  const teamLvl = densityOf(salesRows.length);
  const team = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <SlideHeader icon={<Icon name="users" size={22} color={LIME} />} title="Tim Sales" subtitle={`Pencapaian per personel / brand · ${salesRows.length} personel · ${salesType} oriented`} />
      <YearColHeaders yearData={yearData} label="Sales / Brand" sub={`urut total ${salesType.toLowerCase()}`} idW={teamLvl ? 200 : 230} />
      <div style={listFor(teamLvl)}>
        {salesRows.length ? salesRows.map((row, ri) => (
          <div key={row.name} style={rowBoxFor(teamLvl)}>
            <RowIdentity name={row.name} rank={ri} total={row.total} compact={teamLvl > 0} />
            {row.cells.map((cell, yi) => {
              if (!cell) return <EmptyCell key={yi} />;
              const ach = cell.tgt > 0 ? (cell.act / cell.tgt) * 100 : 0, ok = ach >= 100, prev = yi > 0 ? row.cells[yi - 1] : null;
              if (teamLvl > 0) return (
                <div key={yi} style={{ borderRadius: 10, background: SLATE[50], border: `1px solid ${SLATE[200]}`, borderLeft: `4px solid ${YEAR_COLORS[yi]}`, padding: "0 10px", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <MiniRing pct={ach} color={ok ? GREEN : "#D97706"} size={teamLvl === 1 ? 44 : 36} fs={teamLvl === 1 ? 11 : 9} />
                  <div style={{ minWidth: 0, flex: 1 }} title={cell.note || undefined}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <span style={{ ...ellipsis, fontSize: teamLvl === 1 ? 17 : 15, fontWeight: 900, color: NAVY }}>{rp(cell.act)}</span><DeltaChip cur={cell.act} prev={prev ? prev.act : 0} />
                    </div>
                    <div style={{ ...ellipsis, fontSize: 11, color: SLATE[500] }}>Target {rp(cell.tgt)} · <b style={{ color: ok ? "#065f46" : "#92400e" }}>{ok ? "Tercapai" : "Belum tercapai"}</b></div>
                    {cell.note && <div style={{ ...ellipsis, fontSize: 11, fontStyle: "italic", color: SLATE[500] }}>“{cell.note}”</div>}
                  </div>
                </div>);
              return (
                <div key={yi} style={{ borderRadius: 12, background: SLATE[50], border: `1px solid ${SLATE[200]}`, borderLeft: `4px solid ${YEAR_COLORS[yi]}`, padding: "0 12px", display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <MiniRing pct={ach} color={ok ? GREEN : "#D97706"} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ ...ellipsis, fontSize: 19, fontWeight: 900, color: NAVY }}>{rp(cell.act)}</span><DeltaChip cur={cell.act} prev={prev ? prev.act : 0} />
                    </div>
                    <div style={{ fontSize: 12, color: SLATE[500] }}>Target {rp(cell.tgt)}</div>
                    <span style={{ display: "inline-block", marginTop: 2, padding: "1px 8px", borderRadius: 99, fontSize: 11, fontWeight: 800, background: ok ? "#d1fae5" : "#fef3c7", color: ok ? "#065f46" : "#92400e" }}>{ok ? "Tercapai" : "Belum tercapai"}</span>
                    {cell.note && <div title={cell.note} style={{ ...ellipsis, fontSize: 12, fontStyle: "italic", color: SLATE[500], marginTop: 2 }}>“{cell.note}”</div>}
                  </div>
                </div>);
            })}
          </div>)) : <div style={{ padding: "40px 0", textAlign: "center" }}><Dash text="Belum ada data sales." /></div>}
      </div>
    </div>
  );

  /* Top 3 produk per sales — tahun terbaru yang punya data sales */
  const MIN_P = 3;
  const spYi = (() => { for (let i = yearData.length - 1; i >= 0; i--) if (yearData[i].sList.some((s) => txt(s.salesName))) return i; return -1; })();
  const spYear = spYi >= 0 ? yearData[spYi] : null;
  const perSales = (() => {
    if (!spYear) return [];
    const map = new Map();
    spYear.sList.forEach((s) => {
      const name = txt(s.salesName); if (!name) return;
      const e = map.get(name) || { name, act: 0, tgt: 0, prods: new Map() };
      e.act += toNum(s.actualVal); e.tgt += toNum(s.targetProfit || s.targetVal);
      (Array.isArray(s.topProducts) ? s.topProducts : []).forEach((p) => {
        const pn = txt(p?.productName); if (!pn) return;
        const [pr] = productsOf({ salesPerformances: [{ topProducts: [p] }] });
        const k = pn.toLowerCase(), c = e.prods.get(k) || { name: pn, lalu: 0, jalan: 0 };
        c.lalu += pr ? pr.lalu : 0; c.jalan += pr ? pr.jalan : 0; e.prods.set(k, c);
      });
      map.set(name, e);
    });
    return [...map.values()].map((e) => ({ ...e, prods: [...e.prods.values()].sort((a, b) => b.jalan - a.jalan), ach: e.tgt > 0 ? (e.act / e.tgt) * 100 : 0 })).sort((a, b) => b.act - a.act);
  })();
  const spCols = perSales.length <= 3 ? Math.max(perSales.length, 1) : perSales.length <= 9 ? 3 : 4;
  const spDense = perSales.length > 4;
  const salesProducts = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <SlideHeader icon={<Icon name="box" size={22} color={LIME} />} title="Top 3 Produk per Sales" subtitle={spYear ? `Tiga produk andalan tiap personel · data ${spYear.yr} · ${perSales.length} personel` : "Belum ada data sales"} />
      {perSales.length ? (
        <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: perSales.length === 1 ? "minmax(0, 640px)" : `repeat(${spCols}, 1fr)`, justifyContent: perSales.length === 1 ? "center" : "stretch", gridAutoRows: perSales.length <= 3 ? "minmax(0, 330px)" : "minmax(0, 1fr)", gap: 12, alignContent: perSales.length <= 3 ? "start" : "stretch" }}>
          {perSales.map((sp, si) => {
            const top = sp.prods.slice(0, MIN_P), mx = Math.max(...top.flatMap((p) => [p.jalan, p.lalu]), 1);
            const ok = sp.ach >= 100;
            return (
              <div key={sp.name} style={{ ...card, padding: spDense ? 9 : 14, display: "flex", flexDirection: "column", gap: spDense ? 5 : 8, minHeight: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: spDense ? 30 : 40, height: spDense ? 30 : 40, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`, flex: "none", position: "relative" }}>
                    {sp.name.charAt(0).toUpperCase()}{si === 0 && <span style={{ position: "absolute", top: -9, right: -9, fontSize: 14 }}>🏆</span>}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div title={sp.name} style={{ ...ellipsis, fontSize: 16, fontWeight: 900, color: NAVY, lineHeight: 1.2 }}>{sp.name}</div>
                    <div style={{ ...ellipsis, fontSize: 11, color: SLATE[500] }}>{sp.tgt > 0 ? `${rp(sp.act)} · ${sp.ach > 999 ? ">999" : sp.ach.toFixed(0)}% target` : `Realisasi ${rp(sp.act)}`}</div>
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 800, flex: "none", background: top.length >= MIN_P ? "#d1fae5" : "#fef3c7", color: top.length >= MIN_P ? "#065f46" : "#92400e" }}>{Math.min(top.length, MIN_P)}/{MIN_P}</span>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {Array.from({ length: MIN_P }, (_, i) => top[i] || null).map((p, i) => p && spDense ? (
                    <div key={i} style={{ flex: 1, minHeight: 0, borderRadius: 8, background: SLATE[50], border: `1px solid ${SLATE[200]}`, borderLeft: `4px solid ${PIE_COLORS[i]}`, padding: "0 8px", display: "flex", alignItems: "center", gap: 6 }} title={p.name}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: SLATE[400], flex: "none" }}>#{i + 1}</span>
                      <span style={{ ...ellipsis, flex: 1, fontSize: 12, fontWeight: 800, color: NAVY }}>{p.name}</span>
                      {(p.jalan > 0 || p.lalu > 0) ? <><span style={{ fontSize: 11, fontWeight: 800, color: SLATE[600], whiteSpace: "nowrap" }}>{rp(p.jalan)}</span><DeltaChip cur={p.jalan} prev={p.lalu} /></> : <span style={{ fontSize: 10, fontStyle: "italic", color: SLATE[400] }}>belum diisi</span>}
                    </div>
                  ) : p ? (
                    <div key={i} style={{ flex: 1, minHeight: 0, borderRadius: 10, background: SLATE[50], border: `1px solid ${SLATE[200]}`, borderLeft: `4px solid ${PIE_COLORS[i]}`, padding: "4px 10px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: SLATE[400], flex: "none" }}>#{i + 1}</span>
                        <span title={p.name} style={{ ...ellipsis, flex: 1, fontSize: 14, fontWeight: 800, color: NAVY }}>{p.name}</span>
                        {(p.jalan > 0 || p.lalu > 0) && <DeltaChip cur={p.jalan} prev={p.lalu} />}
                      </div>
                      {(p.jalan > 0 || p.lalu > 0) ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Track pct={(p.jalan / mx) * 100} color={PIE_COLORS[i]} h={7} />
                          <span style={{ width: 82, textAlign: "right", fontSize: 11, fontWeight: 800, color: SLATE[600], whiteSpace: "nowrap" }}>{rp(p.jalan)}</span>
                        </div>
                      ) : <span style={{ fontSize: 11, fontStyle: "italic", color: SLATE[400] }}>nilai belum diisi</span>}
                    </div>
                  ) : (
                    <div key={i} style={{ flex: 1, minHeight: 0, borderRadius: 10, border: `1px dashed ${SLATE[300]}`, display: "grid", placeItems: "center" }}><span style={{ fontSize: 12, fontStyle: "italic", color: SLATE[400] }}>#{i + 1} belum diisi</span></div>
                  ))}
                </div>
              </div>);
          })}
        </div>
      ) : <div style={{ padding: "40px 0", textAlign: "center" }}><Dash text="Belum ada data sales." /></div>}
    </div>
  );

  const prodLvl = densityOf(prodRows.length);
  const products = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <SlideHeader icon={<Icon name="box" size={22} color={LIME} />} title="Top Produk / Item Group" subtitle={`Penjualan berjalan vs tahun lalu · ${prodRows.length} item group`} />
      <YearColHeaders yearData={yearData} label="Item group" sub="urut total penjualan" idW={prodLvl ? 200 : 230} />
      <div style={listFor(prodLvl)}>
        {prodRows.length ? prodRows.map((row, ri) => {
          const share = prodGrand > 0 ? (row.total / prodGrand) * 100 : 0;
          return (
            <div key={row.name} style={rowBoxFor(prodLvl)}>
              <RowIdentity name={row.name} rank={ri} total={row.total} compact={prodLvl > 0} suffix={prodLvl > 0 ? ` · ${share.toFixed(0)}%` : ""} extra={prodLvl > 0 ? null : <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 80, height: 6, borderRadius: 99, background: SLATE[200], overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(share, 100)}%`, background: LIME_D }} /></div><span style={{ fontSize: 11, fontWeight: 800, color: SLATE[500] }}>{share.toFixed(0)}%</span></div>} />
              {row.cells.map((cell, yi) => {
                if (!cell) return <EmptyCell key={yi} />;
                const c = YEAR_COLORS[yi], mx = Math.max(cell.cur, cell.prev, 1);
                if (prodLvl > 0) return (
                  <div key={yi} style={{ borderRadius: 10, background: SLATE[50], border: `1px solid ${SLATE[200]}`, borderLeft: `4px solid ${c}`, padding: "2px 10px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <span style={{ ...ellipsis, fontSize: prodLvl === 1 ? 18 : 15, fontWeight: 900, color: c }}>{rp(cell.cur)}</span><DeltaChip cur={cell.cur} prev={cell.prev} base="Baseline 🚀" />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Track pct={(cell.cur / mx) * 100} color={c} h={5} />
                      <span style={{ fontSize: 10, color: SLATE[500], whiteSpace: "nowrap" }}>Lalu {rp(cell.prev)}</span>
                    </div>
                  </div>);
                return (
                  <div key={yi} style={{ borderRadius: 12, background: SLATE[50], border: `1px solid ${SLATE[200]}`, borderLeft: `4px solid ${c}`, padding: "8px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ ...ellipsis, fontSize: 20, fontWeight: 900, color: c }}>{rp(cell.cur)}</span><DeltaChip cur={cell.cur} prev={cell.prev} base="Baseline 🚀" />
                    </div>
                    {[["Berjalan", cell.cur, c, ""], ["Lalu", cell.prev, SLATE[400], rp(cell.prev)]].map(([l, v, col, t]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 54, fontSize: 11, color: SLATE[500] }}>{l}</span><Track pct={(v / mx) * 100} color={col} />
                        <span style={{ width: 78, textAlign: "right", fontSize: 11, fontWeight: 800, color: SLATE[600], whiteSpace: "nowrap" }}>{t}</span>
                      </div>))}
                  </div>);
              })}
            </div>);
        }) : <div style={{ padding: "40px 0", textAlign: "center" }}><Dash text="Belum ada data produk." /></div>}
      </div>
    </div>
  );

  const innovation = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <SlideHeader icon={<Icon name="bolt" size={22} color={LIME} />} title="Inovasi & Terobosan Komersial" subtitle="Program baru, efisiensi, dan rencana aksi dari tahun ke tahun" />
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {yearData.map((d, i) => {
          const c = YEAR_COLORS[i], prev = i > 0 ? yearData[i - 1] : null;
          return (
            <div key={d.yr} style={{ ...card, position: "relative", borderRadius: 24, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${c}, ${c}b3)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center" }}><Icon name="bolt" size={20} color="#fff" /></div><span style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{d.yr}</span></div>
                <span style={{ padding: "3px 12px", borderRadius: 99, fontSize: 12, fontWeight: 800, background: "rgba(255,255,255,.2)" }}>{d.rep ? "Logged" : "Kosong"}</span>
              </div>
              <span aria-hidden style={{ position: "absolute", right: 16, top: 64, fontSize: 130, fontWeight: 900, lineHeight: 1, color: c, opacity: 0.06 }}>{String(d.yr).slice(2)}</span>
              <div style={{ position: "relative", flex: 1, minHeight: 0, padding: 24, overflow: "hidden" }}>
                {d.innovations ? (<>
                  <div style={{ fontSize: 44, lineHeight: 1, fontWeight: 900, color: c, marginBottom: -4 }}>“</div>
                  <p style={{ margin: 0, fontSize: 20, color: SLATE[700], lineHeight: 1.5, ...clamp(9) }}>{d.innovations}</p>
                </>) : (
                  <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: SLATE[100], display: "grid", placeItems: "center" }}><Icon name="bolt" size={26} color={SLATE[300]} /></div>
                    <Dash text={d.rep ? "Belum diisi" : "Belum ada data laporan"} />
                  </div>)}
              </div>
              <div style={{ padding: "12px 24px", borderTop: `1px solid ${SLATE[100]}`, background: SLATE[50], display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 11, color: SLATE[500] }}>{salesType} {d.yr}</div><div style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.1, color: c }}>{d.rep ? rp(d.actual) : "-"}</div></div>
                {d.rep && <DeltaChip cur={d.actual} prev={prev ? prev.actual : 0} />}
              </div>
            </div>);
        })}
      </div>
    </div>
  );

  const support = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <SlideHeader icon={<Icon name="check" size={22} color={LIME} />} title="Sales Support & Operasional Pendukung" subtitle="Administrasi PO, koordinasi DO & piutang, serta evaluasi kendala" />
      <YearColHeaders yearData={yearData} label="Aspek" sub="per tahun" />
      <div style={list}>
        {[
          { key: "supportPo", title: "Input & Verifikasi PO Masuk", sub: "Target max 1 hari", icon: "file", g: `linear-gradient(135deg,${NAVY},${BLUE})` },
          { key: "supportCoord", title: "Koordinasi DO & Piutang", sub: "Sinkronisasi tim AR & shipment", icon: "chart", g: "linear-gradient(135deg,#1F5A34,#2F7A45)" },
          { key: "supportEval", title: "Evaluasi Kendala", sub: "Internal / eksternal", icon: "flag", g: "linear-gradient(135deg,#7A5600,#C98A00)" },
        ].map((row) => (
          <div key={row.key} style={rowBox}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px 0 4px", minWidth: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", background: row.g, flex: "none", boxShadow: "0 6px 12px -6px rgba(0,0,0,.4)" }}><Icon name={row.icon} size={22} color="#fff" /></div>
              <div style={{ minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 900, color: NAVY, lineHeight: 1.2 }}>{row.title}</div><div style={{ fontSize: 12, color: SLATE[500], marginTop: 2 }}>{row.sub}</div></div>
            </div>
            {yearData.map((d, yi) => d[row.key]
              ? <div key={d.yr} style={{ borderRadius: 12, background: SLATE[50], border: `1px solid ${SLATE[200]}`, borderLeft: `4px solid ${YEAR_COLORS[yi]}`, padding: "10px 16px", overflow: "hidden", minHeight: 0 }}><p style={{ margin: 0, fontSize: 19, color: SLATE[700], lineHeight: 1.4, ...clamp(5) }}>{d[row.key]}</p></div>
              : <EmptyCell key={d.yr} text={d.rep ? "Belum diisi" : "Belum ada laporan"} />)}
          </div>))}
      </div>
    </div>
  );

  const outlook = (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, height: "100%", padding: 4 }}>
      <div style={{ background: NAVY, color: "#fff", border: `1px solid ${BLUE}`, padding: 32, borderRadius: 24, boxShadow: "0 18px 40px -16px rgba(0,0,0,.5)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 8, background: `linear-gradient(90deg, ${BLUE}, ${LIME}, ${GREEN})` }} />
        <div style={{ position: "absolute", right: -64, top: -64, width: 288, height: 288, borderRadius: 999, background: "radial-gradient(circle, rgba(163,196,0,.22), transparent 70%)" }} />
        <span aria-hidden style={{ position: "absolute", right: 24, bottom: 80, fontSize: 150, fontWeight: 900, lineHeight: 1, opacity: 0.04 }}>2027</span>
        <div style={{ position: "relative", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, background: LIME, color: "#1B2A02", padding: "8px 16px", borderRadius: 99, fontSize: 14, fontWeight: 800 }}><Icon name="star" size={16} color="#1B2A02" /> Final stage: Strategic Outlook 2027</div>
        <h2 style={{ position: "relative", margin: "16px 0 0", fontSize: 32, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.15 }}>Proyeksi Masa Depan & Fokus Inovasi 2027</h2>
        <div style={{ position: "relative", flex: 1, minHeight: 0, marginTop: 16, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.15)", padding: 20, borderRadius: 16, overflow: "hidden" }}>
          <span style={{ fontSize: 14, color: LIME, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Icon name="flag" size={16} color={LIME} /> Catatan Isu & Fokus Perbaikan 2027</span>
          {outlook2027 ? <p style={{ margin: 0, fontSize: 22, color: "#f1f5f9", lineHeight: 1.5, ...clamp(8) }}>{outlook2027}</p> : <p style={{ margin: 0, fontSize: 18, fontStyle: "italic", color: SLATE[400] }}>Belum ada strategic outlook atau isu 2027 yang di-input.</p>}
        </div>
        <div style={{ position: "relative", paddingTop: 16, marginTop: 16, borderTop: "1px solid rgba(255,255,255,.15)" }}>
          <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: LIME, display: "flex", alignItems: "center", gap: 8 }}><Icon name="check" size={20} color={LIME} /> Siap Melangkah ke Tahun 2027!</h4>
          <p style={{ margin: "2px 0 0", fontSize: 14, color: SLATE[300] }}>Komitmen pertumbuhan berkelanjutan & pencapaian target komersial.</p>
        </div>
      </div>
      <div style={{ ...card, borderRadius: 24, padding: 20, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: NAVY, display: "grid", placeItems: "center" }}><Icon name="file" size={20} color={LIME} /></div>
          <div><div style={{ fontSize: 18, fontWeight: 900, color: NAVY, lineHeight: 1 }}>Catatan & Evaluasi Bebas</div><div style={{ fontSize: 12, color: SLATE[500], marginTop: 4 }}>Dari departemen per tahun</div></div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {yearData.map((d, i) => (
            <div key={d.yr} style={{ flex: 1, minHeight: 0, borderRadius: 12, background: SLATE[50], border: `1px solid ${SLATE[200]}`, borderLeft: `4px solid ${YEAR_COLORS[i]}`, padding: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ marginBottom: 6 }}><YearTag yr={d.yr} idx={i} /></div>
              {d.notes ? <p style={{ margin: 0, fontSize: 18, color: SLATE[700], lineHeight: 1.4, ...clamp(3) }}>{d.notes}</p> : <Dash text={d.rep ? "Belum diisi" : "Belum ada data laporan"} />}
            </div>))}
        </div>
      </div>
    </div>
  );

  return [
    { id: "master", label: "Master Dashboard", node: master },
    { id: "timeline", label: "Timeline", node: (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
        <SlideHeader icon={<Icon name="calendar" size={22} color={LIME} />} title="Perjalanan Kinerja 2024 – 2026" subtitle="Realisasi per tahun, panah = naik / turun vs tahun sebelumnya, rincian input di bawahnya" />
        <div style={{ ...card, flex: 1, minHeight: 0, padding: "12px 0", display: "flex", flexDirection: "column" }}><YearTimeline yearData={yearData} /></div>
      </div>) },
    { id: "team", label: "Tim Sales", node: team },
    { id: "salesProducts", label: "Top 3 Produk", node: salesProducts },
    { id: "products", label: "Produk", node: products },
    { id: "innovation", label: "Inovasi", node: innovation },
    { id: "support", label: "Sales Support", node: support },
    { id: "outlook", label: "Outlook 2027", node: outlook },
  ];
}

/** mode: "OMZET" | "PROFIT" — hanya label; sumber data sama. plantId wajib bila data >1 plant. */
export default function SalesDeck({ reports, plantId = null, plantName = "", mode = "OMZET", active = true, onClose }) {
  const data = useMemo(() => buildClusterData(reports, { cluster: "COMMERCIAL", plantId }), [reports, plantId]);
  const slides = useMemo(() => buildSalesSlides(data, { mode, plantName }), [data, mode, plantName]);
  return <DeckShell title={`Commercial — ${mode === "PROFIT" ? "Profit" : "Omzet"} · Executive Master Deck`} subtitle={plantName} slides={slides} accent={LIME_D} active={active} onClose={onClose}
    lockTheme="light" bare stageBgOverride="#EEF3F0" fileName={`Sales ${mode === "PROFIT" ? "Profit" : "Omzet"}${plantName ? ` - ${plantName}` : ""} 2024-2027`} />;
}