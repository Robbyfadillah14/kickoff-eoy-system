"use client";
import React from "react";
import { SlideHead, Icon, Empty, ptText } from "./slides.jsx";
import { BRAND, formatRupiah, phaseOf } from "../../lib/presentation/index.js";

/* Dashboard KPI bergaya panel berwarna (teal / hijau / biru-slate) — dipakai deck Financial & Operational.
   Panel selalu berwarna solid dengan teks putih, jadi tetap terbaca di tema terang maupun gelap. */
const C = { teal: "#2F9DB3", green: "#3FAF7A", slate: "#476486", amber: "#F5B83D", rose: "#FB7185", white: "#ffffff" };
const YEARS = [2024, 2025, 2026];
const ell = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const clipTxt = (s, n) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t; };
const rule = "1px solid rgba(255,255,255,.4)";

export function Panel({ title, icon = "chart", color = C.teal, tag, label, value, valueColor, right, children, style }) {
  return (
    <div style={{ background: color, color: "#fff", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, boxShadow: "0 14px 30px -16px rgba(0,0,0,.55)", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: rule, flex: "none" }}>
        <span aria-hidden style={{ width: 30, height: 30, borderRadius: 99, background: "rgba(8,24,48,.55)", display: "grid", placeItems: "center", flex: "none" }}><Icon name={icon} size={16} color="#fff" /></span>
        <b style={{ fontSize: 19, ...ell }}>{title}</b>
        {tag && <span style={{ fontSize: 12, letterSpacing: 1.5, opacity: 0.85, whiteSpace: "nowrap" }}>— {tag}</span>}
        {right && <span style={{ marginLeft: "auto" }}>{right}</span>}
      </div>
      {(label != null || value != null) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "7px 16px", borderBottom: rule, background: "rgba(255,255,255,.08)", flex: "none" }}>
          <span style={{ fontSize: 16, ...ell }}>{label}</span>
          <b style={{ fontSize: 32, letterSpacing: -1, lineHeight: 1.1, color: valueColor || "#fff", whiteSpace: "nowrap" }}>{value}</b>
        </div>)}
      <div style={{ flex: 1, minHeight: 0, padding: "10px 16px 12px", display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

/** batang putih per label; series kedua (opsional) berwarna lain */
export function BarsChart({ labels, series, max, h = 130, fmt = (v) => `${Math.round(v)}` }) {
  const W = 400, n = labels.length, groups = series.length;
  const mx = max || Math.max(1, ...series.flatMap((s) => s.values.map((v) => v ?? 0)));
  const slot = W / n, bw = Math.min(54, (slot - 26) / groups);
  const base = h - 24, top = 20;
  const Y = (v) => base - (Math.min(v, mx) / mx) * (base - top);
  return (
    <svg viewBox={`0 0 ${W} ${h}`} style={{ width: "100%", height: "100%", minHeight: 0 }} preserveAspectRatio="xMidYMid meet" aria-hidden>
      <line x1="0" x2={W} y1={base} y2={base} stroke="rgba(255,255,255,.55)" />
      {labels.map((lb, i) => {
        const x0 = slot * i + slot / 2 - (bw * groups) / 2;
        return (
          <g key={lb}>
            {series.map((s, g) => { const v = s.values[i]; const x = x0 + g * bw;
              return v == null
                ? <rect key={g} x={x + 2} y={base - 26} width={bw - 4} height="26" rx="3" fill="none" stroke="rgba(255,255,255,.6)" strokeDasharray="4 3" />
                : <g key={g}><rect x={x + 2} y={Y(v)} width={bw - 4} height={Math.max(3, base - Y(v))} rx="3" fill={s.color || "#fff"} />
                    <text x={x + bw / 2} y={Y(v) - 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{fmt(v)}</text></g>; })}
            <text x={slot * i + slot / 2} y={h - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{lb}</text>
          </g>);
      })}
    </svg>
  );
}

export function LineChart({ labels, values, max = 100, h = 130 }) {
  const W = 400, n = labels.length, base = h - 24, top = 18;
  const X = (i) => 36 + (i / Math.max(1, n - 1)) * (W - 72);
  const Y = (v) => base - (Math.min(v, max) / max) * (base - top);
  const pts = values.map((v, i) => (v == null ? null : [X(i), Y(v), v])).filter(Boolean);
  return (
    <svg viewBox={`0 0 ${W} ${h}`} style={{ width: "100%", height: "100%", minHeight: 0 }} preserveAspectRatio="xMidYMid meet" aria-hidden>
      {[0, 50, 100].map((g) => <g key={g}><line x1="28" x2={W} y1={Y(g)} y2={Y(g)} stroke="rgba(255,255,255,.28)" /><text x="0" y={Y(g) + 4} fontSize="12" fill="#fff" opacity=".85">{g}</text></g>)}
      {pts.length > 1 && <polyline points={pts.map((p) => `${p[0]},${p[1]}`).join(" ")} fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
      {pts.map((p, i) => <g key={i}><circle cx={p[0]} cy={p[1]} r="6" fill="#fff" /><text x={p[0]} y={p[1] - 11} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{Math.round(p[2])}%</text></g>)}
      {labels.map((lb, i) => <text key={lb} x={X(i)} y={h - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{lb}</text>)}
    </svg>
  );
}

const WhiteBox = ({ big, small, color = "#1f3a5f" }) => (
  <div style={{ background: "#fff", borderRadius: 8, textAlign: "center", padding: "10px 8px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }}>
    <div style={{ fontSize: 40, fontWeight: 850, color, lineHeight: 1, letterSpacing: -1.5 }}>{big}</div>
    <div style={{ fontSize: 14, color: "#64748b", marginTop: 6, lineHeight: 1.25 }}>{small}</div>
  </div>
);

const Chip = ({ ok }) => (
  <span aria-hidden style={{ width: 24, height: 24, borderRadius: 99, display: "inline-grid", placeItems: "center", flex: "none", background: ok === true ? C.amber : ok === false ? "rgba(8,24,48,.6)" : "rgba(255,255,255,.25)", color: ok === true ? "#4a3200" : "#fff", fontSize: 14, fontWeight: 900 }}>{ok === true ? "✓" : ok === false ? "✕" : "•"}</span>
);

/**
 * input:
 *  scores  [{year, ok, bad, total, pct}] untuk 2024-2027  · latest · cur · delta
 *  rows    indikator tahun terbaru [{dept, label, targetLabel, cell}] (cell: {met, display})
 *  attention [{dept,label,shown,target}]
 *  badDebt {year, list} | null · completeness {year:{filled,total}}
 */
export function DashboardSlide({ title, plantName, latest, scores, cur, delta, rows, attention, badDebt, completeness, solo, filledNote }) {
  const yr3 = YEARS.map((y) => scores.find((s) => s.year === y));
  const labels = YEARS.map(String);
  const pcts = yr3.map((s) => (s && s.total > 0 ? s.pct : null));
  const ordered = [...rows].sort((a, b) => (a.cell.met === false ? 0 : a.cell.met === true ? 1 : 2) - (b.cell.met === false ? 0 : b.cell.met === true ? 1 : 2));
  const worst = attention[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flex: "none" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, letterSpacing: 3, fontWeight: 800, color: C.teal, textTransform: "uppercase" }}><span style={{ width: 22, height: 3, borderRadius: 99, background: C.teal }} />{plantName || "Unit"} · {latest ?? "—"}{latest ? ` · ${phaseOf(latest)?.label}` : ""}</div>
          <h2 style={{ margin: "6px 0 0", fontSize: 38, lineHeight: 1.05, fontWeight: 850, letterSpacing: -1 }}>{title}</h2>
        </div>
        {cur && cur.total > 0 && <div style={{ fontSize: 16, lineHeight: 1.35, color: BRAND.muted, maxWidth: 520, textAlign: "right" }}>{cur.ok} dari {cur.total} indikator bertarget tercapai di {latest}{delta == null ? "" : `, ${delta >= 0 ? "naik" : "turun"} ${Math.abs(delta).toFixed(1)} poin dibanding ${latest - 1}`}. {filledNote}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <Panel title="Indikator tercapai" icon="check" color={C.teal} label={`${latest} · ${cur?.ok ?? 0}/${cur?.total ?? 0} indikator`} value={cur?.pct != null ? `${cur.pct.toFixed(0)}%` : "—"}>
          <BarsChart labels={labels} series={[{ values: pcts }]} max={100} fmt={(v) => `${Math.round(v)}%`} />
        </Panel>
        <Panel title="Tren skor" icon="trendUp" color={C.green} tag="2024–2026" label={`Vs ${latest ? latest - 1 : "—"}`} value={ptText(delta)}>
          <LineChart labels={labels} values={pcts} />
        </Panel>
        <Panel title="Tercapai vs belum" icon="layers" color={C.slate} label={<span style={{ display: "flex", gap: 14, fontSize: 13 }}><span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 99, background: "#fff", marginRight: 6 }} />Tercapai</span><span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 99, background: C.amber, marginRight: 6 }} />Belum</span></span>} value={cur ? `${cur.total}` : "—"}>
          <BarsChart labels={labels} series={[{ values: yr3.map((s) => (s && s.total > 0 ? s.ok : null)) }, { values: yr3.map((s) => (s && s.total > 0 ? s.bad : null)), color: C.amber }]} fmt={(v) => `${v}`} />
        </Panel>

        <Panel title={solo ? "Status indikator" : "Status indikator"} icon="target" color={C.slate} tag={`${latest}`} label={`${rows.length} dinilai`} value={attention.length ? `${attention.length} perlu perhatian` : "Semua ✓"} valueColor={attention.length ? C.amber : "#fff"} style={{ }}>
          {rows.length ? (
            <div style={{ display: "grid", gap: 6, alignContent: "start" }}>
              {ordered.slice(0, 4).map((r, k) => (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "26px 1fr auto", gap: 10, alignItems: "center", fontSize: 16 }}>
                  <Chip ok={r.cell.met} />
                  <span style={ell} title={r.label}>{solo ? "" : r.dept + " · "}{r.label}</span>
                  <b style={{ fontSize: 15, whiteSpace: "nowrap" }}>{clipTxt(r.cell.display, 16)}</b>
                </div>))}
              {rows.length > 4 && <div style={{ fontSize: 12, opacity: 0.85 }}>+{rows.length - 4} indikator lain di slide matriks</div>}
            </div>) : <div style={{ opacity: 0.85, fontSize: 15 }}>Belum ada indikator tahun ini.</div>}
        </Panel>

        <Panel title="Perlu perhatian" icon="alert" color={C.teal} tag={`${latest}`}>
          <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
            <WhiteBox big={attention.length} small="indikator di bawah target" color={attention.length ? "#c2410c" : "#15803d"} />
            <WhiteBox big={worst ? clipTxt(worst.shown, 9) : "✓"} small={worst ? clipTxt(`${worst.label}${worst.target ? ` (target ${worst.target})` : ""}`, 44) : "semua tercapai"} color="#1f3a5f" />
          </div>
        </Panel>

        {badDebt ? (
          <Panel title="Bad debt" icon="file" color={C.green} tag={`${badDebt.year}`} label={`${badDebt.list.length} customer`} value={formatRupiah(badDebt.list.reduce((a, b) => a + (Number(String(b.amount ?? "").replace(/[^0-9.-]/g, "")) || 0), 0))}>
            <div style={{ display: "grid", gap: 5, alignContent: "start", fontSize: 15 }}>
              {badDebt.list.slice(0, 3).map((b, k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={ell}>{b.customerName || "—"}</span><b style={{ whiteSpace: "nowrap" }}>{formatRupiah(b.amount)}</b></div>)}
            </div>
          </Panel>
        ) : (
          <Panel title="Kelengkapan laporan" icon="file" color={C.green} tag="2024–2026" label={`${latest ?? ""} · departemen mengisi`} value={completeness[latest] ? `${completeness[latest].filled}/${completeness[latest].total}` : "—"}>
            <BarsChart labels={labels} series={[{ values: YEARS.map((y) => (completeness[y] && completeness[y].total ? (completeness[y].filled / completeness[y].total) * 100 : null)) }]} max={100} fmt={(v) => `${Math.round(v)}%`} />
          </Panel>)}
      </div>
    </div>
  );
}

/** panel per departemen (mode klaster) atau per indikator (mode satu divisi): batang tiga tahun + nilai terbaru */
export function PanelsSlide({ title, eyebrow, items, sub }) {
  const colors = [C.teal, C.green, C.slate, C.green, C.slate, C.teal];
  if (!items.length) return <div><SlideHead color={C.teal} eyebrow={eyebrow} title={title} /><Empty hint="Belum ada indikator yang terisi." /></div>;
  const cols = items.length <= 2 ? items.length : items.length === 4 ? 2 : 3;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <SlideHead color={C.teal} eyebrow={eyebrow} title={title} sub={sub} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: "1fr", gap: 14, flex: 1, minHeight: 0, marginTop: -8 }}>
        {items.slice(0, 6).map((it, k) => (
          <Panel key={it.key} title={clipTxt(it.title, 30)} icon={it.icon || "chart"} color={colors[k % 6]} tag={it.tag} label={it.label} value={it.value}>
            {it.numeric
              ? <BarsChart labels={YEARS.map(String)} series={it.series || [{ values: it.values }]} max={it.max} fmt={it.fmt} h={items.length > 3 ? 150 : 290} />
              : <div style={{ fontSize: 17, lineHeight: 1.4, opacity: 0.95 }}>{it.text || "Belum diisi."}</div>}
          </Panel>))}
      </div>
    </div>
  );
}