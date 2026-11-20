"use client";
import React, { useEffect, useState } from "react";
import { SlideHead, Glass, IconBubble, Sparkline, Insight, fitSize } from "./slides.jsx";
import { BRAND, formatRupiah } from "../../lib/presentation/index.js";
import { fmtPct, fmtInt } from "../../lib/presentation/hrExcel.js";

/**
 * Slide HRD & MR dari data hasil upload Excel (form.hrData): poin penting, tren bulanan, riwayat beberapa tahun.
 * Setiap angka punya tombol ⓘ -> popup rincian: sumber file & baris Excel, cara hitung, tabel per bulan, peringatan data.
 * Popup memakai position:fixed — di dalam panggung (yang di-scale dengan transform) itu otomatis menutupi satu panggung penuh.
 */

const YEARS = [2024, 2025, 2026];
const GOOD = BRAND.emerald;
const BAD = BRAND.bad;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const dPt = (d) => `${d > 0 ? "+" : d < 0 ? "−" : "±"}${fmtPct(Math.abs(d))} poin`;
const when = (iso) => { try { return iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""; } catch { return ""; } };

/* ------------------------------------------------------------------ data */

const hrOf = (data, yr) => {
  const h = data?.years?.[yr]?.byDept?.HR_MR?.metrics?.hrData;
  return h && typeof h === "object" ? h : null;
};

function snapshot(data) {
  const by = {};
  for (const y of YEARS) by[y] = hrOf(data, y);
  const years = (k) => YEARS.filter((y) => by[y]?.[k]);
  const last = (k) => { const ys = years(k); return ys.length ? ys[ys.length - 1] : null; };
  const prevOf = (k) => { const ys = years(k); return ys.length > 1 ? ys[ys.length - 2] : null; };
  const hy = last("history");
  return { by, years, last, prevOf, hist: hy ? by[hy].history : null };
}

const metricOf = (hist, key) => hist?.metrics?.find((m) => m.key === key) || null;
const monthly = (ds) => { const a = Array(12).fill(null); for (const m of ds?.months || []) if (m.m >= 1 && m.m <= 12) a[m.m - 1] = m.pct; return a; };

/* ------------------------------------------------------------------ elemen kecil */

const PrintCss = () => <style>{"@media print{.hr-noprint{display:none!important}}"}</style>;

function InfoBtn({ onClick, color = BRAND.cyan }) {
  return (
    <button type="button" className="hr-noprint" onClick={onClick} aria-label="Lihat rincian angka ini" title="Dari mana angka ini? Klik untuk rincian"
      style={{ flex: "none", width: 36, height: 36, borderRadius: 99, border: `2px solid ${color}`, background: `${color}1a`, color, fontWeight: 800, fontSize: 18, fontFamily: "Georgia, serif", fontStyle: "italic", cursor: "pointer", lineHeight: 1 }}>i</button>
  );
}

function Block({ title, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 12, letterSpacing: 2.5, fontWeight: 800, color: BRAND.muted, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Tbl({ head, rows, foot, align = [] }) {
  const th = { fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: BRAND.muted, fontWeight: 800, padding: "8px 10px", borderBottom: `1px solid ${BRAND.line}`, whiteSpace: "nowrap" };
  const td = { fontSize: 15, padding: "7px 10px", borderBottom: `1px solid ${BRAND.line}`, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{head.map((h, i) => <th key={i} style={{ ...th, textAlign: align[i] || "left" }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ ...td, textAlign: align[j] || "left" }}>{c}</td>)}</tr>)}</tbody>
      {foot && <tfoot><tr>{foot.map((c, j) => <td key={j} style={{ ...td, fontWeight: 800, background: BRAND.panel, textAlign: align[j] || "left" }}>{c}</td>)}</tr></tfoot>}
    </table>
  );
}

const Warnings = ({ list }) => (list?.length ? (
  <Block title="Perlu dicek">
    <div style={{ display: "grid", gap: 6 }}>
      {list.map((w, i) => <div key={i} style={{ fontSize: 15, lineHeight: 1.4, padding: "8px 12px", borderRadius: 10, background: `${BRAND.warn}1f`, border: `1px solid ${BRAND.warn}66` }}>⚠ {w}</div>)}
    </div>
  </Block>
) : null);

function Source({ ds, showYear }) {
  const at = when(ds.importedAt);
  return (
    <Block title="Dari mana angka ini?">
      <div style={{ fontSize: 16, lineHeight: 1.55 }}>
        File <b>{ds.file || "—"}</b>{ds.sheet ? <> · lembar <b>“{ds.sheet}”</b></> : null}{ds.headerRow ? <> · judul kolom di baris ke-<b>{ds.headerRow}</b></> : null}
        {showYear && ds.year ? <> · tahun <b>{ds.year}</b> <span style={{ color: BRAND.muted }}>(dari {ds.yearSource})</span></> : null}
        {at ? <span style={{ color: BRAND.muted }}> · diunggah {at}</span> : null}
        <div style={{ color: BRAND.muted, fontSize: 14, marginTop: 2 }}>Kolom “Baris Excel” di tabel menunjuk baris asal tiap angka di file tersebut.</div>
      </div>
    </Block>
  );
}

/** isi popup per jenis data (diekspor agar bisa diuji) */
export function HrDetailContent({ kind, ds }) {
  const R = "right";
  const how = <Block title="Cara hitung"><div style={{ display: "grid", gap: 4, fontSize: 17, lineHeight: 1.45 }}>{(ds.explain || []).map((l, i) => <div key={i}>{l}</div>)}</div></Block>;
  if (kind === "late") {
    return (<>
      <Source ds={ds} showYear />{how}
      <Block title="Rincian per bulan">
        <Tbl align={["left", R, R, R, R, R, R]} head={["Bulan", "Telat", "Karyawan", "Hari kerja", "Pembagi", "Hasil", "Baris Excel"]}
          rows={ds.months.map((x) => [x.label, fmtInt(x.late), x.emp ?? "-", x.days ?? "-", fmtInt(x.den), <b key="p" style={{ color: x.pct > ds.target.value ? BAD : GOOD }}>{fmtPct(x.pct)}%</b>, <span key="r" style={{ color: BRAND.muted }}>{x.row}</span>])}
          foot={["Total", fmtInt(ds.late), "", "", fmtInt(ds.den), `${fmtPct(ds.pct)}%`, ""]} />
      </Block>
      <Warnings list={ds.warnings} />
    </>);
  }
  if (kind === "absence") {
    return (<>
      <Source ds={ds} showYear />{how}
      <Block title="Rincian per bulan">
        <Tbl align={["left", R, R, R, R, R, R, R]} head={["Bulan", "Alpa", "Cuti", "Sakit", "Dihitung", "Pembagi", "Hasil", "Baris Excel"]}
          rows={ds.months.map((x) => [x.label, x.alpa, <span key="c" style={{ color: BRAND.muted }}>{x.cuti}</span>, x.sakit, fmtInt(x.count), fmtInt(x.den), <b key="p" style={{ color: x.pct > ds.target.value ? BAD : GOOD }}>{fmtPct(x.pct)}%</b>, <span key="r" style={{ color: BRAND.muted }}>{x.row}</span>])}
          foot={["Total", fmtInt(ds.alpa), fmtInt(ds.cuti), fmtInt(ds.sakit), fmtInt(ds.count), fmtInt(ds.den), `${fmtPct(ds.pct)}%`, ""]} />
      </Block>
      <Warnings list={ds.warnings} />
    </>);
  }
  if (kind === "training") {
    return (<>
      <Source ds={ds} showYear />{how}
      <Block title="Rincian per jenis">
        <Tbl align={["left", R, R, R, R]} head={["Jenis pelatihan", "Rencana", "Actual", "Hasil", "Baris Excel"]}
          rows={ds.items.map((x) => [x.name, fmtInt(x.plan), fmtInt(x.actual), x.pct == null ? "-" : `${fmtPct(x.pct, 0)}%`, <span key="r" style={{ color: BRAND.muted }}>{x.row}</span>])}
          foot={["Total", fmtInt(ds.plan), fmtInt(ds.actual), `${fmtPct(ds.pct, 0)}%`, ""]} />
      </Block>
      <Warnings list={ds.warnings} />
    </>);
  }
  // history
  const cell = (m, y) => { const v = m.values[y]; return v == null ? "-" : m.key === "denda" ? formatRupiah(v) : m.key.startsWith("x:") ? fmtInt(v) : `${fmtPct(v, v > 0 && v < 1 ? 2 : v % 1 ? 1 : 0)}%`; };
  return (<>
    <Source ds={ds} />{how}
    <Block title="Rekap per tahun">
      <div style={{ overflowX: "auto" }}>
        <Tbl align={["left", R, ...ds.years.map(() => R), R]} head={["Keterangan", "Target", ...ds.years, "Baris"]}
          rows={ds.metrics.map((m) => [m.label, m.target == null ? "-" : `${fmtPct(m.target, m.target % 1 ? 2 : 0)}%`, ...ds.years.map((y) => cell(m, y)), <span key="r" style={{ color: BRAND.muted }}>{m.row}</span>])} />
      </div>
    </Block>
    <Warnings list={ds.warnings} />
  </>);
}

function DetailPopup({ title, sub, onClose, children }) {
  useEffect(() => {
    // Esc menutup popup dulu (bukan menutup presentasi): listener fase-capture + stopPropagation
    const h = (e) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="hr-noprint" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(2,6,14,.66)", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 48px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 1080, maxWidth: "100%", maxHeight: "100%", overflowY: "auto", background: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.line}`, borderRadius: 22, boxShadow: "0 30px 80px -20px rgba(0,0,0,.75)", padding: "24px 30px 28px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 850, letterSpacing: -0.5 }}>{title}</div>
            {sub && <div style={{ fontSize: 15, color: BRAND.muted, marginTop: 2 }}>{sub}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup rincian" style={{ flex: "none", border: `1px solid ${BRAND.line}`, background: BRAND.panel, color: BRAND.text, borderRadius: 12, padding: "8px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Tutup ✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** grafik batang: kategori (bulan/tahun) x beberapa seri, garis target putus-putus */
function BarChart({ labels, series, target, targetLabel, fmtTick, fmtVal, h = 262, w = 560 }) {
  const padL = 50, padR = 8, padT = 20, padB = 28;
  const vals = series.flatMap((s) => s.values.filter((v) => v != null));
  const mx = Math.max(target ?? 0, ...vals, 1e-9) * 1.18;
  const slot = (w - padL - padR) / labels.length;
  const gw = slot * 0.78, bw = gw / series.length;
  const Y = (v) => padT + (1 - v / mx) * (h - padT - padB);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }} role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={padL} x2={w - padR} y1={Y(mx * f)} y2={Y(mx * f)} stroke={BRAND.line} strokeWidth="1" />
          <text x={padL - 8} y={Y(mx * f) + 4} textAnchor="end" fontSize="11" fill={BRAND.muted}>{fmtTick(mx * f)}</text>
        </g>
      ))}
      {series.map((s, si) => s.values.map((v, i) => v == null ? null : (
        <g key={`${si}-${i}`}>
          <rect x={padL + i * slot + (slot - gw) / 2 + si * bw} y={Y(v)} width={Math.max(2, bw - 2)} height={Math.max(0, h - padB - Y(v))} rx="3" fill={s.colorOf ? s.colorOf(v) : s.color} opacity={s.opacity ?? 1}>
            <title>{`${s.name} · ${labels[i]}: ${fmtVal(v)}`}</title>
          </rect>
          {s.showValues && <text x={padL + i * slot + (slot - gw) / 2 + si * bw + (bw - 2) / 2} y={Y(v) - 5} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={BRAND.text}>{fmtVal(v)}</text>}
        </g>
      )))}
      {target != null && (
        <g>
          <line x1={padL} x2={w - padR} y1={Y(target)} y2={Y(target)} stroke={BRAND.warn} strokeWidth="2" strokeDasharray="7 5" />
          <text x={w - padR} y={Y(target) - 6} textAnchor="end" fontSize="12" fontWeight="800" fill={BRAND.warn}>{targetLabel}</text>
        </g>
      )}
      {labels.map((l, i) => <text key={i} x={padL + i * slot + slot / 2} y={h - 8} textAnchor="middle" fontSize="11.5" fill={BRAND.muted}>{l}</text>)}
    </svg>
  );
}

const Legend = ({ items }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 13, color: BRAND.muted }}>
    {items.map((it) => <span key={it.t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><i style={{ width: it.dash ? 16 : 11, height: it.dash ? 0 : 11, borderRadius: 3, background: it.dash ? "transparent" : it.c, borderTop: it.dash ? `2px dashed ${it.c}` : "none", opacity: it.o ?? 1 }} />{it.t}</span>)}
  </div>
);

/* ------------------------------------------------------------------ slide 1: poin penting */

function KeyCard({ icon, color, label, value, status, sub, chip, chipColor, spark, onInfo }) {
  return (
    <Glass accent={color} style={{ padding: "16px 24px", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <IconBubble name={icon} color={color} size={42} />
        <div style={{ flex: 1, fontSize: 14, letterSpacing: 2.5, fontWeight: 800, color: BRAND.muted, textTransform: "uppercase", lineHeight: 1.25 }}>{label}</div>
        {status != null && <span style={{ fontSize: 13, fontWeight: 800, color, background: `${color}1f`, border: `1px solid ${color}66`, borderRadius: 99, padding: "4px 12px", whiteSpace: "nowrap" }}>{status ? "✓ Tercapai" : "✕ Belum tercapai"}</span>}
        <InfoBtn onClick={onInfo} color={color} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: fitSize(value, 62, 38), fontWeight: 850, letterSpacing: -2, lineHeight: 1, whiteSpace: "nowrap" }}>{value}</div>
        {spark}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {chip && <span style={{ fontSize: 14, fontWeight: 800, color: chipColor || color, background: `${chipColor || color}1f`, borderRadius: 99, padding: "3px 12px", whiteSpace: "nowrap" }}>{chip}</span>}
        <span style={{ fontSize: 15, color: BRAND.muted, lineHeight: 1.35 }}>{sub}</span>
      </div>
    </Glass>
  );
}

function HrKeySlide({ snap, accent }) {
  const [open, setOpen] = useState(null);
  const cards = [];
  const facts = [];

  const ly = snap.last("late");
  if (ly) {
    const ds = snap.by[ly].late, py = snap.prevOf("late"), pd = py ? snap.by[py].late : null, d = pd ? ds.pct - pd.pct : null;
    cards.push({ cid: "late", kind: "late", ds, icon: "alert", color: ds.met ? GOOD : BAD, label: `Keterlambatan ${ly}`, value: `${fmtPct(ds.pct)}%`, status: ds.met,
      sub: `target ${ds.target.label} · ${fmtInt(ds.late)} kejadian · terbaik ${ds.best.label}, terburuk ${ds.worst.label}`,
      chip: d == null ? null : `${dPt(d)} vs ${py}`, chipColor: d != null && d <= 0 ? GOOD : BAD,
      spark: <Sparkline values={ds.months.map((m) => m.pct)} color={ds.met ? GOOD : BAD} target={ds.target.value} w={200} h={62} /> });
    facts.push(`Keterlambatan ${ly} ${fmtPct(ds.pct)}% ${ds.met ? "masih di bawah" : "melewati"} batas ${ds.target.value}%${d == null ? "" : `, ${d <= 0 ? "turun" : "naik"} ${fmtPct(Math.abs(d))} poin dari ${py}`}.`);
  }
  const ay = snap.last("absence");
  if (ay) {
    const ds = snap.by[ay].absence, py = snap.prevOf("absence"), pd = py ? snap.by[py].absence : null, d = pd ? ds.pct - pd.pct : null;
    cards.push({ cid: "absence", kind: "absence", ds, icon: "calendar", color: ds.met ? GOOD : BAD, label: `Ketidakhadiran ${ay}`, value: `${fmtPct(ds.pct)}%`, status: ds.met,
      sub: `target ${ds.target.label} · ${ds.formula.label}${ds.formula.countsCuti ? "" : " (cuti tidak dihitung)"}`,
      chip: d == null ? null : `${dPt(d)} vs ${py}`, chipColor: d != null && d <= 0 ? GOOD : BAD,
      spark: <Sparkline values={ds.months.map((m) => m.pct)} color={ds.met ? GOOD : BAD} target={ds.target.value} w={200} h={62} /> });
    facts.push(`Ketidakhadiran ${ay} ${fmtPct(ds.pct)}% (${ds.met ? "di bawah" : "di atas"} batas ${ds.target.value}%).`);
  }
  const ty = snap.last("training");
  if (ty) {
    const ds = snap.by[ty].training, py = snap.prevOf("training"), pd = py ? snap.by[py].training : null, d = pd && pd.pct != null && ds.pct != null ? ds.pct - pd.pct : null;
    const sp = pd && pd.pct != null && ds.pct != null ? <Sparkline values={[pd.pct, ds.pct]} color={ds.met ? GOOD : BAD} target={100} w={200} h={62} /> : null;
    cards.push({ cid: "training", kind: "training", ds, icon: "star", color: ds.met ? GOOD : BAD, label: `Pelatihan ${ty}`, value: `${fmtPct(ds.pct, 0)}%`, status: ds.met,
      sub: `${fmtInt(ds.actual)} dari ${fmtInt(ds.plan)} pelatihan terprogram terlaksana`,
      chip: d == null ? null : `${dPt(d)} vs ${py}`, chipColor: d != null && d >= 0 ? GOOD : BAD, spark: sp });
    facts.push(`Pelatihan ${ty}: ${fmtInt(ds.actual)} dari ${fmtInt(ds.plan)} terlaksana.`);
  }
  const hist = snap.hist, dm = metricOf(hist, "denda");
  if (hist && dm) {
    const ys = hist.years.filter((y) => dm.values[y] != null);
    const Y = ys[ys.length - 1], P = ys[ys.length - 2];
    if (Y != null) {
      const v = dm.values[Y], pv = P != null ? dm.values[P] : null, g = pv ? ((v - pv) / pv) * 100 : null;
      cards.push({ cid: "history", kind: "history", ds: hist, icon: "file", color: BRAND.warn, label: `Denda karyawan ${Y}`, value: formatRupiah(v),
        sub: `total denda tahun ${Y}${P != null ? ` · ${P}: ${formatRupiah(pv)}` : ""}`,
        chip: g == null ? null : `${g >= 0 ? "+" : "−"}${fmtPct(Math.abs(g), 0)}% vs ${P}`, chipColor: BRAND.warn,
        spark: <Sparkline values={ys.slice(-6).map((y) => dm.values[y])} color={BRAND.warn} w={200} h={62} /> });
    }
  }

  const cur = cards.find((c) => c.cid === open);
  return (
    <div>
      <SlideHead color={accent} eyebrow="HRD & MR" title="Poin penting HRD" sub="Dihitung otomatis dari file Excel HRD. Klik ⓘ di tiap angka untuk melihat sumber dan cara hitungnya." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr auto", gap: 16, alignContent: "stretch", minHeight: 0 }}>
        <PrintCss />
        {cards.map((c, i) => <div key={c.cid} style={{ display: "flex", flexDirection: "column", minHeight: 0, gridColumn: cards.length % 2 === 1 && i === cards.length - 1 ? "1 / -1" : "auto" }}><KeyCard {...c} onInfo={() => setOpen(c.cid)} /></div>)}
        {facts.length > 0 && <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan">{facts.slice(0, 2).join(" ")}</Insight></div>}
        {cur && <DetailPopup title={cur.label} sub="Rincian sumber dan perhitungan" onClose={() => setOpen(null)}><HrDetailContent kind={cur.kind} ds={cur.ds} /></DetailPopup>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ slide 2: tren bulanan */

function HrMonthlySlide({ snap, accent }) {
  const [open, setOpen] = useState(null);
  const panels = [];
  for (const k of ["late", "absence"]) {
    const y = snap.last(k);
    if (!y) continue;
    const ds = snap.by[y][k], py = snap.prevOf(k), pd = py ? snap.by[py][k] : null;
    const color = k === "late" ? BRAND.cyan : "#a78bfa";
    const series = [
      ...(pd ? [{ name: String(py), color: BRAND.muted, opacity: 0.5, values: monthly(pd) }] : []),
      { name: String(y), color, colorOf: (v) => (v > ds.target.value ? BAD : color), showValues: !pd, values: monthly(ds) },
    ];
    const over = ds.months.filter((m) => m.pct > ds.target.value).length;
    panels.push({ key: k, ds, y, py, color, series, label: k === "late" ? "Keterlambatan per bulan" : "Ketidakhadiran per bulan",
      fact: `${k === "late" ? "Keterlambatan" : "Ketidakhadiran"} ${y}: tertinggi ${ds.worst.label} (${fmtPct(ds.worst.pct)}%), terendah ${ds.best.label} (${fmtPct(ds.best.pct)}%); ${over} dari ${ds.months.length} bulan melewati batas ${ds.target.value}%.` });
  }
  const cur = panels.find((p) => p.key === open);
  return (
    <div>
      <SlideHead color={accent} eyebrow="HRD & MR" title="Tren bulanan kedisiplinan" sub="Persentase per bulan terhadap batas target. Batang merah = bulan yang melewati batas." />
      <div style={{ display: "grid", gridTemplateColumns: panels.length > 1 ? "1fr 1fr" : "1fr", gridTemplateRows: "1fr auto", gap: 16, minHeight: 0 }}>
        <PrintCss />
        {panels.map((p) => (
          <Glass key={p.key} style={{ padding: "16px 20px", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 19, fontWeight: 800 }}>{p.label}</div>
              <span style={{ fontSize: 24, fontWeight: 850, color: p.ds.met ? GOOD : BAD }}>{fmtPct(p.ds.pct)}%</span>
              <InfoBtn onClick={() => setOpen(p.key)} color={p.color} />
            </div>
            <BarChart labels={MONTHS} series={p.series} target={p.ds.target.value} targetLabel={`target ${p.ds.target.label}`} fmtTick={(v) => `${v.toFixed(1).replace(".", ",")}%`} fmtVal={(v) => `${fmtPct(v, 2)}%`} />
            <Legend items={[...(p.py ? [{ t: String(p.py), c: BRAND.muted, o: 0.5 }] : []), { t: String(p.y), c: p.color }, { t: "melewati batas", c: BAD }, { t: "batas target", c: BRAND.warn, dash: true }]} />
          </Glass>
        ))}
        <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan">{panels.map((p) => p.fact).join(" ")}</Insight></div>
        {cur && <DetailPopup title={cur.label} sub={`Tahun ${cur.y}`} onClose={() => setOpen(null)}><HrDetailContent kind={cur.key} ds={cur.ds} /></DetailPopup>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ slide 3: riwayat beberapa tahun */

function HrHistorySlide({ snap, accent }) {
  const [open, setOpen] = useState(false);
  const hist = snap.hist;
  const dm = metricOf(hist, "denda"), tm = metricOf(hist, "training");
  const panels = [];
  if (dm) {
    const ys = hist.years.filter((y) => dm.values[y] != null);
    panels.push({ key: "denda", label: "Rekapitulasi denda per tahun", labels: ys.map(String), values: ys.map((y) => dm.values[y]), color: BRAND.warn, fmtTick: (v) => (v >= 1e6 ? `${Math.round(v / 1e6)} Jt` : String(Math.round(v))), fmtVal: (v) => `${(v / 1e6).toFixed(1).replace(".", ",")}`, unit: "Rp juta" });
  }
  if (tm) {
    const ys = hist.years.filter((y) => tm.values[y] != null);
    panels.push({ key: "training", label: "Pencapaian pelatihan per tahun", labels: ys.map(String), values: ys.map((y) => tm.values[y]), color: BRAND.emerald, target: tm.target ?? 100, fmtTick: (v) => `${Math.round(v)}%`, fmtVal: (v) => `${Math.round(v)}%`, unit: "%" });
  }
  const facts = [];
  if (dm) { const ys = hist.years.filter((y) => dm.values[y] != null); const Y = ys[ys.length - 1], P = ys[ys.length - 2]; if (P != null) { const g = ((dm.values[Y] - dm.values[P]) / dm.values[P]) * 100; facts.push(`Denda ${Y} ${formatRupiah(dm.values[Y])}, ${g >= 0 ? "naik" : "turun"} ${fmtPct(Math.abs(g), 0)}% dari ${P} (${formatRupiah(dm.values[P])}).`); } }
  if (tm) { const ys = hist.years.filter((y) => tm.values[y] != null); const low = ys.reduce((a, y) => (tm.values[y] < tm.values[a] ? y : a), ys[0]); facts.push(`Pelatihan terendah ${fmtPct(tm.values[low], 0)}% pada ${low}.`); }
  return (
    <div>
      <SlideHead color={accent} eyebrow="HRD & MR" title="Riwayat beberapa tahun" sub="Rekap dari file Review HRD. Klik ⓘ untuk tabel lengkap dan catatan kualitas data."
        right={hist.warnings?.length ? <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.warn, border: `1px solid ${BRAND.warn}66`, background: `${BRAND.warn}1a`, borderRadius: 99, padding: "6px 14px", whiteSpace: "nowrap" }}>⚠ {hist.warnings.length} catatan data</span> : null} />
      <div style={{ display: "grid", gridTemplateColumns: panels.length > 1 ? "1fr 1fr" : "1fr", gridTemplateRows: "1fr auto", gap: 16, minHeight: 0 }}>
        <PrintCss />
        {panels.map((p) => (
          <Glass key={p.key} style={{ padding: "16px 20px", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 19, fontWeight: 800 }}>{p.label}<span style={{ fontSize: 13, color: BRAND.muted, fontWeight: 500 }}> · {p.unit}</span></div>
              <InfoBtn onClick={() => setOpen(true)} color={p.color} />
            </div>
            <BarChart labels={p.labels} series={[{ name: p.label, color: p.color, showValues: true, values: p.values }]} target={p.target} targetLabel={p.target != null ? `target ${Math.round(p.target)}%` : ""} fmtTick={p.fmtTick} fmtVal={p.fmtVal} />
          </Glass>
        ))}
        {facts.length > 0 && <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan">{facts.join(" ")}</Insight></div>}
        {open && <DetailPopup title="Review beberapa tahun" sub="Seluruh isi file, disamakan satuannya" onClose={() => setOpen(false)}><HrDetailContent kind="history" ds={hist} /></DetailPopup>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pintu masuk dari KpiDeck */

/** [] bila belum ada data hasil upload Excel HR. Dipanggil KpiDeck tepat setelah slide matriks HRD & MR. */
export function buildHrSlides(data, cfg = {}) {
  const snap = snapshot(data);
  const accent = cfg.accent;
  const hasKey = ["late", "absence", "training"].some((k) => snap.years(k).length);
  const hasHist = !!(snap.hist && (metricOf(snap.hist, "denda") || metricOf(snap.hist, "training")));
  const out = [];
  if (hasKey || hasHist) out.push({ id: "hr-key", label: "HRD · Poin penting", node: <HrKeySlide snap={snap} accent={accent} /> });
  if (snap.years("late").length || snap.years("absence").length) out.push({ id: "hr-monthly", label: "HRD · Tren bulanan", node: <HrMonthlySlide snap={snap} accent={accent} /> });
  if (hasHist) out.push({ id: "hr-history", label: "HRD · Riwayat", node: <HrHistorySlide snap={snap} accent={accent} /> });
  return out;
}