import React from "react";
import { BRAND, phaseColor, statusOf } from "../../lib/presentation/theme.js";

export const Glass = ({ children, style, accent }) => (
  <div className="dk-glass" style={{
    position: "relative", overflow: "hidden", borderRadius: 20, padding: 24, boxSizing: "border-box",
    background: accent ? `linear-gradient(160deg, ${accent}1f, var(--dk-card-b, rgba(255,255,255,0.025)) 58%)` : "linear-gradient(160deg, var(--dk-card-a, rgba(255,255,255,0.075)), var(--dk-card-b, rgba(255,255,255,0.025)) 60%)",
    border: `1px solid ${accent ? accent + "4d" : BRAND.line}`,
    boxShadow: "var(--dk-shadow, 0 18px 40px -22px rgba(0,0,0,.8))",
    ...style,
  }}>
    {accent && <span aria-hidden style={{ position: "absolute", left: 0, top: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${accent}, ${accent}00 85%)` }} />}
    {children}
  </div>
);

export const Eyebrow = ({ children, color = BRAND.cyan }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, letterSpacing: 3, fontWeight: 800, color, textTransform: "uppercase" }}>
    <span aria-hidden style={{ width: 22, height: 3, borderRadius: 99, background: color, flex: "none" }} />{children}
  </div>
);

export const Title = ({ children, size = 44 }) => (
  <h2 style={{ margin: "10px 0 0", fontSize: size, lineHeight: 1.08, fontWeight: 850, letterSpacing: -1 }}>{children}</h2>
);

/** kepala slide: eyebrow + judul (+ kalimat kunci `sub` agar audiens langsung tahu pesan slide) */
export const SlideHead = ({ eyebrow, title, color, right, sub }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 26, gap: 24 }}>
    <div style={{ minWidth: 0 }}>
      <Eyebrow color={color}>{eyebrow}</Eyebrow><Title>{title}</Title>
      {sub && <div style={{ marginTop: 8, fontSize: 21, color: BRAND.muted, lineHeight: 1.35, maxWidth: 940 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

export const Empty = ({ children = "Belum diisi", hint }) => (
  <div style={{ border: `1.5px dashed ${BRAND.muted}66`, borderRadius: 16, padding: "22px 24px", color: BRAND.muted, fontSize: 17, display: "flex", gap: 14, alignItems: "flex-start", background: BRAND.panel }}>
    <span aria-hidden style={{ width: 30, height: 30, borderRadius: 99, border: `1.5px solid ${BRAND.muted}88`, display: "grid", placeItems: "center", fontSize: 15, flex: "none" }}>…</span>
    <div>{children}{hint && <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.45, opacity: 0.85 }}>{hint}</div>}</div>
  </div>
);

export const Pill = ({ pct }) => {
  const s = statusOf(pct);
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800, color: s.color, background: s.color + "1f", border: `1px solid ${s.color}66`, borderRadius: 99, padding: "7px 16px", whiteSpace: "nowrap" }}><i aria-hidden style={{ width: 8, height: 8, borderRadius: 99, background: s.color }} />{s.label}</span>;
};

/* ───────── ikon & komponen infografik ───────── */
const ICONS = {
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  trendUp: "M3 17l6-6 4 4 8-8 M15 7h6v6",
  trendDown: "M3 7l6 6 4-4 8 8 M15 17h6v-6",
  check: "M20 6L9 17l-5-5",
  alert: "M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  box: "M21 8l-9-5-9 5v8l9 5 9-5z M3.3 7L12 12l8.7-5 M12 22V12",
  flag: "M4 22V4 M4 4h13l-2 4 2 4H4",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  bolt: "M13 2L3 14h8l-1 8 10-12h-8z",
  calendar: "M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4",
  bulb: "M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z",
  rocket: "M12 15l-3-3a22 22 0 0 1 2-4 13 13 0 0 1 11-6c0 3-1 8-6 11a22 22 0 0 1-4 2z M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0 M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5",
  chart: "M3 3v18h18 M7 14l4-4 3 3 5-6",
  layers: "M12 2l10 5-10 5L2 7z M2 17l10 5 10-5 M2 12l10 5 10-5",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8",
};
export const Icon = ({ name, size = 22, color = "currentColor", stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flex: "none" }}><path d={ICONS[name] || ICONS.chart} /></svg>
);

/** gelembung ikon berwarna */
export const IconBubble = ({ name, color = BRAND.cyan, size = 46 }) => (
  <span aria-hidden style={{ width: size, height: size, borderRadius: size * 0.32, background: `${color}22`, border: `1px solid ${color}44`, display: "inline-grid", placeItems: "center", flex: "none" }}>
    <Icon name={name} size={size * 0.5} color={color} />
  </span>
);

/** garis tren mini; nilai null dilewati */
export function Sparkline({ values, color = BRAND.cyan, w = 190, h = 58, target }) {
  const pts = values.map((v, k) => (v == null ? null : [k, v])).filter(Boolean);
  if (pts.length < 2) return null;
  const hi = Math.max(...pts.map((p) => p[1]), target ?? 0) * 1.1 || 1;
  const lo = Math.min(...pts.map((p) => p[1]), target ?? Infinity, 0);
  const X = (k) => 6 + (k / Math.max(1, values.length - 1)) * (w - 12);
  const Y = (v) => h - 8 - ((v - lo) / (hi - lo || 1)) * (h - 16);
  const line = pts.map((p) => `${X(p[0])},${Y(p[1])}`).join(" ");
  const gid = `sp${String(color).replace(/\W/g, "")}${w}`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`${X(pts[0][0])},${h - 4} ${line} ${X(last[0])},${h - 4}`} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p) => <circle key={p[0]} cx={X(p[0])} cy={Y(p[1])} r={p === last ? 5 : 3.5} fill={p === last ? color : BRAND.bg} stroke={color} strokeWidth="2.5" />)}
    </svg>
  );
}

/** kartu angka utama: ikon + label + nilai besar + keterangan (+ chip perubahan & sparkline) */
export function StatTile({ icon = "chart", label, value, sub, color = BRAND.cyan, chip, chipColor, spark, style }) {
  return (
    <Glass style={{ gap: 0, padding: "22px 24px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <IconBubble name={icon} color={color} />
        <div style={{ fontSize: 14, letterSpacing: 2.5, fontWeight: 800, color: BRAND.muted, textTransform: "uppercase", lineHeight: 1.25 }}>{label}</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: 18 }}>
        <div style={{ fontSize: fitSize(value, 72, 44), fontWeight: 850, letterSpacing: -2.5, lineHeight: 1, whiteSpace: "nowrap" }}>{value}</div>
        {spark}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        {chip && <span style={{ fontSize: 15, fontWeight: 800, color: chipColor || color, background: `${chipColor || color}1f`, borderRadius: 99, padding: "4px 12px", whiteSpace: "nowrap" }}>{chip}</span>}
        {sub && <span style={{ fontSize: 16, color: BRAND.muted, lineHeight: 1.35 }}>{sub}</span>}
      </div>
    </Glass>
  );
}

/** kalimat kunci dari data — satu pesan per slide */
export const Insight = ({ children, color = BRAND.cyan, icon = "bulb", label = "Insight" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 24px", borderRadius: 18, background: `${color}14`, border: `1px solid ${color}40`, borderLeft: `6px solid ${color}` }}>
    <IconBubble name={icon} color={color} size={44} />
    <div>
      <div style={{ fontSize: 12, letterSpacing: 3, fontWeight: 800, color, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.35, marginTop: 2 }}>{children}</div>
    </div>
  </div>
);

/** Slide penutup: apa yang berhasil, apa yang perlu dijaga, apa fokus berikutnya */
export function ClosingSlide({ accent = BRAND.cyan, title = "Terima kasih", subtitle, wins = [], watch = [], next = [], winsLabel = "Capaian terbaik", winsEmpty, watchEmpty }) {
  const cols = [
    { k: winsLabel, icon: "star", color: BRAND.emerald, items: wins, empty: winsEmpty || "Belum ada indikator yang menonjol." },
    { k: "Perlu dijaga", icon: "alert", color: BRAND.warn, items: watch, empty: watchEmpty || "Tidak ada indikator di bawah target." },
    { k: "Fokus 2027", icon: "rocket", color: phaseColor("Future"), items: next, empty: "Belum ada rencana 2027 yang diisi." },
  ];
  return (
    <div>
      <SlideHead eyebrow="Penutup" title={title} color={accent} sub={subtitle} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {cols.map((c) => (
          <Glass key={c.k} accent={c.color} style={{ justifyContent: "flex-start", gap: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}><IconBubble name={c.icon} color={c.color} /><div style={{ fontSize: 24, fontWeight: 850 }}>{c.k}</div></div>
            <ul style={{ margin: "20px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 20, fontSize: 23, lineHeight: 1.4 }}>
              {c.items.length ? c.items.slice(0, 3).map((t, k) => (
                <li key={k} style={{ display: "flex", gap: 12 }}><span aria-hidden style={{ width: 10, height: 10, borderRadius: 99, background: c.color, flex: "none", marginTop: 13 }} /><span>{t}</span></li>))
                : <li style={{ color: BRAND.muted, fontSize: 18 }}>{c.empty}</li>}
            </ul>
          </Glass>))}
      </div>
    </div>
  );
}

/** teks persen yang aman untuk layout: nilai sangat besar ditulis "999%+" (nilai asli tetap di aria-label / tooltip) */
export const pctText = (v, d = 1) => (v == null ? "—" : v >= 1000 ? "999%+" : `${v.toFixed(d)}%`);
/** ukuran font menyesuaikan panjang teks agar tidak terpotong/membungkus */
export const fitSize = (text, big = 72, min = 40) => { const n = String(text).length; return n <= 6 ? big : n <= 8 ? Math.round(big * 0.78) : n <= 10 ? Math.round(big * 0.6) : min; };

export function ArcGauge({ pct, size = 190, color }) {
  const v = Math.max(0, Math.min(130, pct ?? 0));
  const s = statusOf(pct); const c = color || s.color;
  const sw = Math.max(14, size / 14);
  const r = size / 2 - sw, circ = Math.PI * 2 * r * 0.75;
  const fill = circ * Math.min(1, v / 100);
  const gid = `g${Math.round(size)}${String(c).replace("#", "")}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={pct == null ? "Belum ada data" : `${pct.toFixed(1)} persen`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c} /><stop offset="1" stopColor={c} stopOpacity=".55" /></linearGradient>
        <filter id={gid + "f"} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: BRAND.track }} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${circ} 999`} />
        {pct != null && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${fill} 999`} opacity=".45" filter={`url(#${gid}f)`} />}
        {pct != null && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${fill} 999`} />}
      </g>
      <text x="50%" y="53%" textAnchor="middle" style={{ fill: BRAND.text }} fontSize={pctText(pct).length > 6 ? size / 6.6 : pctText(pct).length > 5 ? size / 5.6 : size / 4.6} fontWeight="850" letterSpacing="-1">{pctText(pct)}</text>
      <text x="50%" y="68%" textAnchor="middle" style={{ fill: BRAND.muted }} fontSize={Math.max(13, size / 15)} letterSpacing="3">CAPAIAN</text>
    </svg>
  );
}

/** bar per tahun; tahun tanpa data tampil sebagai batang kosong bergaris putus (bukan 0) */
export function YearBars({ rows, target = 100, height = 430 }) {
  const max = Math.min(200, Math.max(110, ...rows.map((r) => r.value ?? 0))); // batang dipotong di 200% agar tidak menggepengkan tahun lain
  const W = 1000, bw = 150, gap = (W - bw * rows.length) / (rows.length + 1), base = height - 56;
  const y = (v) => base - (Math.min(v, max) / max) * (base - 52); // sisakan ruang di atas untuk label nilai
  return (
    <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} style={{ maxWidth: "100%" }}>
      <defs>
        {rows.map((r) => { const col = phaseColor(r.phase); return (
          <linearGradient key={r.year} id={`yb${r.year}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={col} /><stop offset="1" stopColor={col} stopOpacity=".35" /></linearGradient>); })}
      </defs>
      <line x1="0" x2={W} y1={base} y2={base} style={{ stroke: BRAND.line }} strokeWidth="2" />
      <line x1="0" x2={W} y1={y(target)} y2={y(target)} style={{ stroke: BRAND.muted }} strokeDasharray="4 6" opacity=".8" />
      <text x={W} y={y(target) - 8} textAnchor="end" style={{ fill: BRAND.muted }} fontSize="14" letterSpacing="1">TARGET {target}%</text>
      {rows.map((r, k) => {
        const x = gap + k * (bw + gap), col = phaseColor(r.phase);
        return (
          <g key={r.year}>
            {r.value == null
              ? <rect x={x} y={y(target * 0.35)} width={bw} height={base - y(target * 0.35)} rx="14" style={{ fill: BRAND.panel, stroke: BRAND.muted }} strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="6 6" />
              : <rect x={x} y={y(r.value)} width={bw} height={Math.max(4, base - y(r.value))} rx="14" fill={`url(#yb${r.year})`} stroke={col} strokeWidth="1.5" />}
            <text x={x + bw / 2} y={r.value == null ? base - 14 : y(r.value) - 12} textAnchor="middle" style={{ fill: r.value == null ? BRAND.muted : BRAND.text }} fontSize={r.value == null ? 22 : 30} fontWeight="850">{r.value == null ? "belum ada data" : pctText(r.value)}</text>
            <text x={x + bw / 2} y={height - 26} textAnchor="middle" style={{ fill: BRAND.text }} fontSize="24" fontWeight="800">{r.year}</text>
            <text x={x + bw / 2} y={height - 6} textAnchor="middle" fill={col} fontSize="13" fontWeight="700" letterSpacing="3">{String(r.phase || "").toUpperCase()}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function CoverSlide({ eyebrow, title, subtitle, meta = [], accent = BRAND.cyan }) {
  const phases = [["2024", "Run", phaseColor("Run")], ["2025", "Grow", phaseColor("Grow")], ["2026", "Transform", phaseColor("Transform")], ["2027", "Future", phaseColor("Future")]];
  return (
    <div className="dk-cover" style={{ height: "100%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
      <div aria-hidden style={{ position: "absolute", right: -30, top: 10, fontSize: 330, fontWeight: 900, letterSpacing: -14, lineHeight: 1, color: "transparent", WebkitTextStroke: "2px var(--dk-ghost, rgba(255,255,255,.07))", userSelect: "none" }}>’27</div>
      <Eyebrow color={accent}>{eyebrow}</Eyebrow>
      <h1 style={{ margin: 0, fontSize: String(title).length > 22 ? 64 : 78, lineHeight: 1.06, fontWeight: 900, letterSpacing: -3, maxWidth: 1100, color: BRAND.text }}>{(() => { const m = String(title).match(/^(.*?)\s*(\d{4}\s?[–-]\s?\d{4})$/); return m ? <>{m[1]} <span style={{ whiteSpace: "nowrap" }}>{m[2]}</span></> : title; })()}</h1>
      <div style={{ fontSize: 25, lineHeight: 1.4, color: BRAND.muted, maxWidth: 800 }}>{subtitle}</div>
      <div style={{ display: "flex", gap: 0, marginTop: 18, maxWidth: 900 }}>
        {phases.map(([y, l, c]) => (
          <div key={y} style={{ flex: 1, paddingTop: 12, borderTop: `4px solid ${c}` }}>
            <div style={{ fontSize: 28, fontWeight: 850, color: c }}>{y}</div>
            <div style={{ fontSize: 14, letterSpacing: 3, color: BRAND.muted, fontWeight: 700, textTransform: "uppercase" }}>{l}</div>
          </div>))}
      </div>
      {meta.length > 0 && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {meta.filter((m) => !/^(Run|Grow|Transform|Future) \d{4}$/.test(m)).map((m) => <span key={m} style={{ border: `1px solid ${accent}66`, background: `${accent}14`, borderRadius: 99, padding: "8px 18px", fontSize: 16, fontWeight: 700, color: BRAND.text }}>{m}</span>)}
      </div>}
    </div>
  );
}

/** Run / Grow / Transform — satu kolom per fase dengan teks nyata dari laporan tiap tahun */
export function JourneySlide({ columns }) {
  return (
    <div>
      <SlideHead eyebrow="Perjalanan" title="Run → Grow → Transform" />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 20 }}>
        {columns.map((c) => {
          const col = phaseColor(c.phase);
          return (
            <Glass key={c.year} accent={col} style={{ minHeight: 0, justifyContent: "flex-start" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: -2, lineHeight: 1, color: col }}>{c.year}</div>
                <div style={{ fontSize: 14, letterSpacing: 3, fontWeight: 800, color: BRAND.muted, textTransform: "uppercase", paddingBottom: 6 }}>{c.phase}</div>
              </div>
              <div aria-hidden style={{ height: 1, background: BRAND.line, margin: "16px 0 0" }} />
              {c.items.length
                ? <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 22, fontSize: 27, lineHeight: 1.4 }}>
                    {c.items.slice(0, 4).map((t, k) => <li key={k} style={{ display: "flex", gap: 12 }}><span aria-hidden style={{ width: 9, height: 9, borderRadius: 99, background: col, flex: "none", marginTop: 11 }} /><span>{t}</span></li>)}
                  </ul>
                : <div style={{ marginTop: 16 }}><Empty hint="Isi RGT pada form laporan tahun ini." /></div>}
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

/** 2027 — outlook & inovasi, per departemen (bukan satu teks campuran) */
const uniq = (arr) => { const seen = new Set(); return arr.map((x) => String(x ?? "").replace(/\s+/g, " ").trim()).filter((x) => { const k = x.toLowerCase(); if (!x || seen.has(k)) return false; seen.add(k); return true; }); };
export function FutureSlide({ outlooks, wins: winsIn = [], risks: risksIn = [], hint }) {
  const col = phaseColor("Future");
  const wins = uniq(winsIn), risks = uniq(risksIn);
  return (
    <div>
      <SlideHead eyebrow="Tahun 2027 · Future" title="Harapan & inovasi ke depan" color={col} />
      <div style={{ display: "grid", gridTemplateColumns: wins.length || risks.length ? "1.5fr 1fr" : "1fr", gap: 20 }}>
        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          {outlooks.length
            ? outlooks.slice(0, 4).map((o) => (
                <Glass key={o.code + o.key} accent={col} style={{ padding: "26px 34px" }}>
                  <span aria-hidden style={{ position: "absolute", right: 26, top: -2, fontSize: 110, fontWeight: 900, color: col, opacity: 0.22, lineHeight: 1 }}>”</span>
                  <div style={{ fontSize: 13, letterSpacing: 3, color: col, fontWeight: 800 }}>{o.name.toUpperCase()}</div>
                  <div style={{ marginTop: 10, fontSize: outlooks.length <= 2 ? 36 : 25, lineHeight: 1.45 }}>{String(o.value)}</div>
                </Glass>))
            : <Empty hint={hint || "Belum ada outlook 2027 dari departemen terkait."} />}
        </div>
        {(wins.length || risks.length) ? <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <Glass><Eyebrow color={BRAND.emerald}>Peluang</Eyebrow>
            {wins.length ? <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 8, fontSize: 18 }}>{wins.slice(0, 3).map((w, k) => <li key={k} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w}</li>)}</ul> : <div style={{ color: BRAND.muted, marginTop: 8, fontSize: 14 }}>—</div>}
          </Glass>
          <Glass><Eyebrow color={BRAND.warn}>Tantangan</Eyebrow>
            {risks.length ? <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 8, fontSize: 18 }}>{risks.slice(0, 3).map((w, k) => <li key={k} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w}</li>)}</ul> : <div style={{ color: BRAND.muted, marginTop: 8, fontSize: 14 }}>—</div>}
          </Glass>
        </div> : null}
      </div>
    </div>
  );
}

/* ───────── helper cerita angka ───────── */
export const ptText = (d) => (d == null ? "—" : Math.abs(d) >= 1000 ? `${d > 0 ? "+" : "−"}999 pt+` : `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} pt`);
export const deltaColor = (d) => (d == null ? BRAND.muted : d >= 0 ? BRAND.emerald : BRAND.bad);

/** kalimat tren dari baris [{year,value}] (value null = belum ada data) */
export function trendInsight(rows, noun = "Capaian") {
  const have = rows.filter((r) => r.value != null);
  if (!have.length) return "Belum ada data capaian 2024–2026 untuk diceritakan.";
  const best = have.reduce((a, b) => (b.value > a.value ? b : a));
  const first = have[0], last = have[have.length - 1];
  if (have.length === 1) return `${noun} baru tercatat di ${last.year}: ${pctText(last.value)}.`;
  const d = last.value - first.value;
  return `${noun} tertinggi di ${best.year} (${pctText(best.value)}); dari ${first.year} ke ${last.year} ${d >= 0 ? "naik" : "turun"} ${Math.abs(d) >= 1000 ? "lebih dari 999" : Math.abs(d).toFixed(1)} poin.`;
}

/** slide tren standar: grafik batang per tahun + kalimat kunci di bawahnya */
export function TrendSlide({ accent, eyebrow = "Tren 2024–2026", title, rows, noun }) {
  const have = rows.filter((r) => r.value != null);
  const last = have[have.length - 1], prev = have[have.length - 2];
  const d = last && prev ? last.value - prev.value : null;
  return (
    <div>
      <SlideHead color={accent} eyebrow={eyebrow} title={title} right={d != null ? <span style={{ fontSize: 16, fontWeight: 800, color: deltaColor(d), background: `${deltaColor(d)}1f`, borderRadius: 99, padding: "7px 16px" }}>{ptText(d)} vs {prev.year}</span> : null} />
      <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 18, minHeight: 0 }}>
        <Glass style={{ display: "grid", placeItems: "center", padding: 14 }}><YearBars rows={rows} height={330} /></Glass>
        <Insight color={accent} icon="trendUp" label="Cerita tren">{trendInsight(rows, noun)}</Insight>
      </div>
    </div>
  );
}