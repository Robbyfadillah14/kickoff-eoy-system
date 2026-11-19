import React from "react";
import { BRAND, phaseColor, statusOf } from "../../lib/presentation/theme.js";

export const Glass = ({ children, style, accent }) => (
  <div style={{ background: BRAND.panel, border: `1px solid ${accent ? accent + "55" : BRAND.line}`, borderRadius: 18, padding: 22, ...style }}>{children}</div>
);

export const Eyebrow = ({ children, color = BRAND.cyan }) => (
  <div style={{ fontSize: 12, letterSpacing: 3, fontWeight: 700, color, textTransform: "uppercase" }}>{children}</div>
);

export const Title = ({ children, size = 38 }) => (
  <h2 style={{ margin: "6px 0 0", fontSize: size, lineHeight: 1.1, fontWeight: 800, letterSpacing: -0.5 }}>{children}</h2>
);

export const SlideHead = ({ eyebrow, title, color, right }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 26 }}>
    <div><Eyebrow color={color}>{eyebrow}</Eyebrow><Title>{title}</Title></div>
    {right}
  </div>
);

export const Empty = ({ children = "Belum diisi", hint }) => (
  <div style={{ border: `1px dashed ${BRAND.line}`, borderRadius: 14, padding: "18px 20px", color: BRAND.muted, fontSize: 15 }}>
    {children}{hint && <div style={{ fontSize: 12, marginTop: 6 }}>{hint}</div>}
  </div>
);

export const Pill = ({ pct }) => {
  const s = statusOf(pct);
  return <span style={{ fontSize: 12, fontWeight: 700, color: s.color, background: s.color + "1f", border: `1px solid ${s.color}55`, borderRadius: 99, padding: "3px 10px" }}>{s.label}</span>;
};

/** teks persen yang aman untuk layout: nilai sangat besar ditulis "999%+" (nilai asli tetap di aria-label / tooltip) */
export const pctText = (v, d = 1) => (v == null ? "—" : v >= 1000 ? "999%+" : `${v.toFixed(d)}%`);
/** ukuran font menyesuaikan panjang teks agar tidak terpotong/membungkus */
export const fitSize = (text, big = 72, min = 40) => { const n = String(text).length; return n <= 6 ? big : n <= 8 ? Math.round(big * 0.78) : n <= 10 ? Math.round(big * 0.6) : min; };

export function ArcGauge({ pct, size = 190, color }) {
  const v = Math.max(0, Math.min(130, pct ?? 0));
  const s = statusOf(pct); const c = color || s.color;
  const r = size / 2 - 14, circ = Math.PI * 2 * r * 0.75;
  const fill = circ * Math.min(1, v / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={pct == null ? "Belum ada data" : `${pct.toFixed(1)} persen`}>
      <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BRAND.line} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${circ} 999`} />
        {pct != null && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${fill} 999`} />}
      </g>
      <text x="50%" y="52%" textAnchor="middle" fill={BRAND.text} fontSize={pctText(pct).length > 6 ? size / 6.4 : size / 5.4} fontWeight="800">{pctText(pct)}</text>
      <text x="50%" y="66%" textAnchor="middle" fill={BRAND.muted} fontSize="12">capaian</text>
    </svg>
  );
}

/** bar per tahun; tahun tanpa data tampil sebagai batang kosong bergaris putus (bukan 0) */
export function YearBars({ rows, target = 100, height = 400 }) {
  const max = Math.min(200, Math.max(110, ...rows.map((r) => r.value ?? 0))); // batang dipotong di 200% agar tidak menggepengkan tahun lain
  const W = 1000, bw = 130, gap = (W - bw * rows.length) / (rows.length + 1), base = height - 44;
  const y = (v) => base - (Math.min(v, max) / max) * (base - 44); // sisakan ruang di atas untuk label nilai
  return (
    <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`}>
      <line x1="0" x2={W} y1={y(target)} y2={y(target)} stroke={BRAND.muted} strokeDasharray="4 5" />
      <text x={W} y={y(target) - 6} textAnchor="end" fill={BRAND.muted} fontSize="11">target {target}%</text>
      {rows.map((r, k) => {
        const x = gap + k * (bw + gap), col = phaseColor(r.phase);
        return (
          <g key={r.year}>
            {r.value == null
              ? <rect x={x} y={y(target * 0.35)} width={bw} height={base - y(target * 0.35)} rx="10" fill="none" stroke={BRAND.line} strokeDasharray="5 5" />
              : <rect x={x} y={y(r.value)} width={bw} height={base - y(r.value)} rx="10" fill={col} opacity="0.9" />}
            <text x={x + bw / 2} y={r.value == null ? base - 10 : y(r.value) - 8} textAnchor="middle" fill={BRAND.text} fontSize="20" fontWeight="800">{r.value == null ? "n/a" : pctText(r.value)}</text>
            <text x={x + bw / 2} y={height - 22} textAnchor="middle" fill={BRAND.text} fontSize="18" fontWeight="700">{r.year}</text>
            <text x={x + bw / 2} y={height - 6} textAnchor="middle" fill={col} fontSize="11" letterSpacing="2">{String(r.phase || "").toUpperCase()}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function CoverSlide({ eyebrow, title, subtitle, meta = [], accent = BRAND.cyan }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
      <Eyebrow color={accent}>{eyebrow}</Eyebrow>
      <h1 style={{ margin: 0, fontSize: 76, lineHeight: 1.02, fontWeight: 900, letterSpacing: -2, maxWidth: 980 }}>{title}</h1>
      <div style={{ fontSize: 22, color: BRAND.muted, maxWidth: 820 }}>{subtitle}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        {meta.map((m) => <span key={m} style={{ border: `1px solid ${BRAND.line}`, borderRadius: 99, padding: "6px 14px", fontSize: 13, color: BRAND.text }}>{m}</span>)}
      </div>
    </div>
  );
}

/** Run / Grow / Transform — satu kolom per fase dengan teks nyata dari laporan tiap tahun */
export function JourneySlide({ columns }) {
  return (
    <div>
      <SlideHead eyebrow="Perjalanan" title="Run → Grow → Transform" />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 18 }}>
        {columns.map((c) => {
          const col = phaseColor(c.phase);
          return (
            <Glass key={c.year} accent={col} style={{ minHeight: 470 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <Eyebrow color={col}>{c.phase}</Eyebrow><span style={{ color: BRAND.muted, fontSize: 13 }}>{c.year}</span>
              </div>
              {c.items.length
                ? <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 16, fontSize: 21, lineHeight: 1.45 }}>
                    {c.items.slice(0, 4).map((t, k) => <li key={k} style={{ display: "flex", gap: 10 }}><span style={{ color: col }}>●</span><span>{t}</span></li>)}
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
export function FutureSlide({ outlooks, wins = [], risks = [], hint }) {
  const col = phaseColor("Future");
  return (
    <div>
      <SlideHead eyebrow="Tahun 2027 · Future" title="Harapan & inovasi ke depan" color={col} />
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          {outlooks.length
            ? outlooks.slice(0, 4).map((o) => (
                <Glass key={o.code + o.key} accent={col} style={{ padding: "22px 26px" }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: col, fontWeight: 700 }}>{o.name.toUpperCase()}</div>
                  <div style={{ marginTop: 6, fontSize: 22, lineHeight: 1.5 }}>{String(o.value)}</div>
                </Glass>))
            : <Empty hint={hint || "Belum ada outlook 2027 dari departemen terkait."} />}
        </div>
        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <Glass><Eyebrow color={BRAND.emerald}>Peluang</Eyebrow>
            {wins.length ? <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 10, fontSize: 19 }}>{wins.slice(0, 4).map((w, k) => <li key={k}>{w}</li>)}</ul> : <div style={{ color: BRAND.muted, marginTop: 8, fontSize: 14 }}>—</div>}
          </Glass>
          <Glass><Eyebrow color={BRAND.warn}>Tantangan</Eyebrow>
            {risks.length ? <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 10, fontSize: 19 }}>{risks.slice(0, 4).map((w, k) => <li key={k}>{w}</li>)}</ul> : <div style={{ color: BRAND.muted, marginTop: 8, fontSize: 14 }}>—</div>}
          </Glass>
        </div>
      </div>
    </div>
  );
}