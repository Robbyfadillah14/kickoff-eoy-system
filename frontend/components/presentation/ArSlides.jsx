"use client";
import React, { useState } from "react";
import { SlideHead, Glass, IconBubble, Insight, fitSize } from "./slides.jsx";
import { PrintCss, InfoBtn, Block, Tbl, DetailPopup, BarChart } from "./HrSlides.jsx";
import { BRAND, feedersOf, isEmptyValue } from "../../lib/presentation/index.js";
import { fmtDec, MONTH_LABEL, rpShort, pct1, collectStatus, badDebtStatus, arFieldsFrom } from "../../lib/presentation/arExcel.js";

/**
 * Slide Finance AR dari file Excel (form.arData): pencapaian piutang IDR/USD per bulan (target tertagih), bad debt per tahun.
 * Tiap angka punya ⓘ -> popup: sumber file & baris Excel, cara hitung, tabel, peringatan.
 */

const GOOD = BRAND.emerald, BAD = BRAND.bad, WARN = BRAND.warn;
const AR_YEARS = [2024, 2025, 2026];
const YC = ["#94a3b8", "#F5B83D"];
const R = "right";
const when = (iso) => { try { return iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""; } catch { return ""; } };
const dim = (x) => <span style={{ color: BRAND.muted }}>{x}</span>;
const clipTxt = (s, n) => { const t = String(s ?? ""); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const yearChips = (items, latestColor) => items.map((x, i) => ({ ...x, c: i === items.length - 1 ? latestColor : YC[Math.max(0, YC.length - (items.length - 1 - i))] || YC[0] }));

/* ------------------------------------------------------------------ data */

/** gabung arData dari semua laporan Finance AR (tiap tahun boleh diunggah sendiri-sendiri atau satu file 3 tahun) */
export function arOf(data) {
  const found = [];
  for (const yr of [2027, 2026, 2025, 2024]) {
    const l = data?.years?.[yr]?.byDept?.FIN_AR?.metrics?.arData;
    if (l && typeof l === "object" && (l.collect || l.badDebt)) found.push({ yr, l });
  }
  if (!found.length) return null;
  const base = found[0].l;
  if (found.length === 1) return base;
  const merge = (get) => {
    const out = {};
    const ys = new Set();
    for (const f of found) Object.keys(get(f.l) || {}).forEach((y) => ys.add(Number(y)));
    for (const y of [...ys].sort()) {
      const own = found.find((f) => f.yr === y && get(f.l)?.[y]);
      const any = own || found.find((f) => get(f.l)?.[y]);
      if (any) out[y] = get(any.l)[y];
    }
    return out;
  };
  const collect = { byYear: merge((l) => l.collect?.byYear) }, badDebt = { byYear: merge((l) => l.badDebt?.byYear) };
  const years = [...new Set([...Object.keys(collect.byYear), ...Object.keys(badDebt.byYear)].map(Number))].sort();
  const warnings = [...new Set(found.flatMap((f) => (Array.isArray(f.l.warnings) ? f.l.warnings : [])))];
  return { ...base, collect, badDebt, years, warnings };
}

const emptyVal = (v) => (Array.isArray(v) ? v.length === 0 : isEmptyValue(v));

/** isi kolom KPI Finance AR (matriks / panel) untuk tahun yang laporannya belum menyimpan angkanya + vonis per tahun dari target di Excel */
export function withArBackfill(data) {
  const ds = arOf(data);
  if (!ds || !data?.years) return data;
  const dept = Object.values(data.years).map((b) => b?.byDept?.FIN_AR?.dept).find(Boolean) || feedersOf(data.cluster).find((d) => d.code === "FIN_AR");
  if (!dept) return data;
  const KEYS = ["arIdrAch", "arUsdAch", "badDebtControl", "arOutstanding", "badDebtList"];
  const years = { ...data.years };
  let changed = false;
  for (const yr of AR_YEARS) {
    const b = years[yr];
    if (!b) continue;
    const fields = arFieldsFrom(ds, yr);
    const cur = b.byDept?.FIN_AR;
    const metrics = { ...(cur?.metrics || {}) };
    const add = KEYS.filter((k) => fields[k] != null && emptyVal(metrics[k]));
    for (const k of add) metrics[k] = fields[k];
    const c = ds.collect?.byYear?.[yr], bd = ds.badDebt?.byYear?.[yr];
    const judge = { ...(metrics.logJudge || {}) };
    for (const [k, cur2] of [["arIdrAch", "idr"], ["arUsdAch", "usd"]]) { const s = collectStatus(c, cur2); if (s?.ok != null) judge[k] = { met: s.ok, targetLabel: `≥ ${s.target}%` }; }
    const bs = badDebtStatus(bd); if (bs?.ok != null) judge.badDebtControl = { met: bs.ok, targetLabel: `maks ${bs.target}%` };
    const hasJudge = Object.keys(judge).length > 0;
    if (hasJudge) metrics.logJudge = judge;
    if (!add.length && !hasJudge) continue;
    years[yr] = { ...b, hasData: true, byDept: { ...b.byDept, FIN_AR: { ...(cur || {}), dept, report: cur?.report, metrics, filledKeys: [...(cur?.filledKeys || []), ...add] } } };
    changed = true;
  }
  return changed ? { ...data, years } : data;
}

const cyc = (ds) => Object.keys(ds?.collect?.byYear || {}).map(Number).sort();
const byc = (ds) => Object.keys(ds?.badDebt?.byYear || {}).map(Number).sort();
const sgnPt = (n) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${fmtDec(Math.abs(n), 1)} poin`;

/* ------------------------------------------------------------------ popup */

function Source({ ds, sheet }) {
  const at = when(ds.importedAt);
  return (
    <Block title="Dari mana angka ini?">
      <div style={{ fontSize: 16, lineHeight: 1.55 }}>
        File <b>{ds.file || "—"}</b>{sheet ? <> · lembar <b>“{sheet}”</b></> : null}{at ? <span style={{ color: BRAND.muted }}> · diunggah {at}</span> : null}
        <div style={{ color: BRAND.muted, fontSize: 14, marginTop: 2 }}>Kolom “Baris Excel” menunjuk baris asal angka di file tersebut. Rata-rata dan total dihitung ulang dari angka di tabel, bukan dari sel rata-rata/TOTAL di Excel.</div>
      </div>
    </Block>
  );
}
const How = ({ lines }) => <Block title="Cara hitung"><div style={{ display: "grid", gap: 4, fontSize: 17, lineHeight: 1.45 }}>{lines.map((l, i) => <div key={i}>{l}</div>)}</div></Block>;
const Warnings = ({ list }) => (list?.length ? (
  <Block title="Perlu dicek">
    <div style={{ display: "grid", gap: 6 }}>{list.map((w, i) => <div key={i} style={{ fontSize: 15, lineHeight: 1.4, padding: "8px 12px", borderRadius: 10, background: `${WARN}1f`, border: `1px solid ${WARN}66` }}>⚠ {w}</div>)}</div>
  </Block>
) : null);

/** kind = collect | baddebt | customers */
export function ArDetailContent({ kind, ds }) {
  if (kind === "collect") {
    const ys = cyc(ds), by = ds.collect.byYear;
    const warn = ds.warnings.filter((w) => /rata-rata|target|baru terisi|keterangan|tercapai/i.test(w) && !/bad debt|bad_debt|write-off/i.test(w));
    return (<>
      <Source ds={ds} sheet={ys.map((y) => by[y].sheet).join(", ")} />
      <How lines={[
        "Angka per bulan = persen tertagih (realisasi penagihan ÷ piutang yang jatuh tempo bulan itu), dibaca apa adanya dari Excel.",
        "Rata-rata tahun = rata-rata bulan yang sudah terisi. Bulan kosong dianggap belum diisi (bukan nol), jadi tahun berjalan masih bisa berubah.",
        "Tercapai bila angka ≥ target tertagih pada lembar tahun itu. Penilaian memakai angka, bukan tulisan keterangan di Excel.",
      ]} />
      {["idr", "usd"].map((cur) => (
        <Block key={cur} title={`Pencapaian ${cur.toUpperCase()} per bulan`}>
          <Tbl align={["left", ...ys.map(() => R), R]} head={["Bulan", ...ys.map((y) => `${y} (target ${by[y].target}%)`), "Baris Excel"]}
            rows={MONTH_LABEL.slice(1).map((lab, i) => [lab, ...ys.map((y) => { const x = by[y].months.find((z) => z.m === i + 1); if (!x || x[cur] == null) return dim("—"); const ok = x[cur] >= by[y].target; return <span key={y} style={{ color: ok ? GOOD : BAD, fontWeight: 700 }}>{fmtDec(x[cur], 2)}% {ok ? "✓" : "✕"}</span>; }), dim(ys.map((y) => by[y].months.find((z) => z.m === i + 1)?.row).filter(Boolean).join(" / ") || "—")])}
            foot={["Rata-rata", ...ys.map((y) => { const s = collectStatus(by[y], cur); return s ? `${fmtDec(s.avg, 2)}% · ${s.okMonths}/${s.n} bln` : "—"; }), ""]} />
        </Block>
      ))}
      {ys.some((y) => by[y].conclusion) && (
        <Block title="Kesimpulan di Excel">
          <div style={{ display: "grid", gap: 4, fontSize: 16 }}>{ys.filter((y) => by[y].conclusion).map((y) => <div key={y}><b>{y}:</b> {by[y].conclusion.replace(/^kesimpulan\s*/i, "")}</div>)}</div>
        </Block>
      )}
      <Warnings list={warn} />
    </>);
  }
  if (kind === "baddebt") {
    const ys = byc(ds), by = ds.badDebt.byYear;
    const warn = ds.warnings.filter((w) => /bad debt|write-off|total piutang|target bad|persentase/i.test(w));
    return (<>
      <Source ds={ds} sheet={ys.map((y) => by[y].sheet).join(", ")} />
      <How lines={[
        "Total bad debt = jumlah AMOUNT semua baris invoice bermasalah pada lembar tahun itu.",
        "Persentase bad debt = total bad debt ÷ total piutang (s.d. tanggal yang tertulis di Excel). Dinilai terhadap target maksimum tahun itu.",
        "Tahun tanpa total piutang di file tidak bisa dinilai persentasenya; totalnya tetap ditampilkan.",
      ]} />
      <Block title="Rekap per tahun">
        <Tbl align={["left", R, R, R, "left", "left", "left"]} head={["Tahun", "Total bad debt", "Customer", "Total piutang", "% bad debt", "Target maks", "Status"]}
          rows={ys.map((y) => { const b = by[y], s = badDebtStatus(b); return [y, <b key="t">{rpShort(b.total)}</b>, b.customers.length, b.outstanding != null ? rpShort(b.outstanding) : dim("belum ada"), b.bdPct != null ? pct1(b.bdPct) : dim("—"), b.targetPct != null ? `${b.targetPct}%` : dim("—"),
            s?.ok == null ? dim("—") : <b key="s" style={{ color: s.ok ? GOOD : BAD }}>{s.ok ? "Tercapai" : "Tidak tercapai"}</b>]; })} />
      </Block>
      {ys.map((y) => (
        <Block key={y} title={`Rincian invoice bad debt ${y}`}>
          <Tbl align={["left", "left", "left", R, "left", "left", R]} head={["Customer", "Invoice", "PO", "Amount (Rp)", "PIC Sales", "Keterangan", "Baris Excel"]}
            rows={by[y].rows.map((x) => [x.customer, x.invoice, x.po, `${new Intl.NumberFormat("id-ID").format(Math.round(x.amount))}`, x.pic, x.remark || dim("—"), dim(x.row)])}
            foot={["Total", "", "", new Intl.NumberFormat("id-ID").format(Math.round(by[y].total)), "", "", ""]} />
        </Block>
      ))}
      <Warnings list={warn} />
    </>);
  }
  // customers per tahun
  const ys = byc(ds), by = ds.badDebt.byYear;
  return (<>
    <Source ds={ds} sheet={ys.map((y) => by[y].sheet).join(", ")} />
    <How lines={["Baris invoice customer yang sama digabung (kolom CODE/CUSTOMER yang kosong dibaca sebagai customer di atasnya).", "Porsi = amount customer ÷ total bad debt tahun itu."]} />
    {ys.map((y) => (
      <Block key={y} title={`Customer bad debt ${y}`}>
        <Tbl align={["left", R, R, "left", "left", R]} head={["Customer", "Amount", "Porsi", "PIC Sales", "Keterangan", "Baris Excel"]}
          rows={by[y].customers.map((x) => [x.name, rpShort(x.amount), `${fmtDec((x.amount / by[y].total) * 100, 0)}%`, x.pic, x.remarks.join("; ") || dim("—"), dim(x.rowsAt.join(", "))])}
          foot={["Total", rpShort(by[y].total), "100%", "", "", ""]} />
      </Block>
    ))}
  </>);
}

/* ------------------------------------------------------------------ elemen */

function ArCard({ icon, color, label, value, status, statusText, sub, chip, chipColor, years, onInfo }) {
  return (
    <Glass accent={color} style={{ padding: "10px 20px", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <IconBubble name={icon} color={color} size={32} />
        <div style={{ flex: 1, fontSize: 14, letterSpacing: 2.5, fontWeight: 800, color: BRAND.muted, textTransform: "uppercase", lineHeight: 1.25 }}>{label}</div>
        {status != null && <span style={{ fontSize: 13, fontWeight: 800, color, background: `${color}1f`, border: `1px solid ${color}66`, borderRadius: 99, padding: "4px 12px", whiteSpace: "nowrap" }}>{statusText}</span>}
        <InfoBtn onClick={onInfo} color={color} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ fontSize: fitSize(value, 40, 26), fontWeight: 850, letterSpacing: -2, lineHeight: 1, whiteSpace: "nowrap" }}>{value}</div>
        {years?.length > 1 && (
          <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
            {years.map((x) => (
              <div key={x.y} style={{ flex: "1 1 0", maxWidth: 150, minWidth: 0, background: `${x.c}14`, border: `1px solid ${x.c}55`, borderRadius: 10, padding: "3px 10px" }}>
                <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 800, color: x.c, whiteSpace: "nowrap" }}>{x.y}{x.note ? <span style={{ color: BRAND.muted, fontWeight: 600, letterSpacing: 0 }}> {x.note}</span> : null}</div>
                <div style={{ fontSize: 17, fontWeight: 850, lineHeight: 1.15, whiteSpace: "nowrap" }}>{x.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {chip && <span style={{ fontSize: 14, fontWeight: 800, color: chipColor || color, background: `${chipColor || color}1f`, borderRadius: 99, padding: "3px 12px", whiteSpace: "nowrap" }}>{chip}</span>}
        <span style={{ fontSize: 15, color: BRAND.muted, lineHeight: 1.35 }}>{sub}</span>
      </div>
    </Glass>
  );
}

const Legend = ({ items }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 13, color: BRAND.muted }}>
    {items.map((it) => <span key={it.t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><i style={{ width: it.dash ? 16 : 11, height: it.dash ? 0 : 11, borderRadius: 3, background: it.dash ? "transparent" : it.c, borderTop: it.dash ? `2px dashed ${it.c}` : "none" }} />{it.t}</span>)}
  </div>
);

/* ------------------------------------------------------------------ slide 1: poin penting */

function ArKeySlide({ ds, accent }) {
  const [open, setOpen] = useState(null);
  const cards = [];
  const cy = cyc(ds), ly = cy[cy.length - 1];
  const per = (c) => (c?.partial ? ` s/d ${c.lastLabel}` : "");

  for (const cur of ["idr", "usd"]) {
    const c = ds.collect.byYear[ly], s = collectStatus(c, cur);
    if (!s) continue;
    const color = s.ok ? GOOD : BAD;
    cards.push({ cid: cur, kind: "collect", icon: cur === "idr" ? "file" : "star", color, label: `Piutang ${cur.toUpperCase()} · ${ly}${c.partial ? ` (Jan–${c.lastLabel})` : ""}`, value: `${fmtDec(s.avg, 1)}%`,
      status: s.ok, statusText: s.ok ? "✓ Tercapai" : "✕ Di bawah target",
      sub: `${s.okMonths} dari ${s.n} bulan ≥ ${s.target}% · terendah ${s.worst.label} ${fmtDec(s.worst[cur], 1)}%`,
      chip: `${sgnPt(s.gap)} vs target`, chipColor: s.ok ? GOOD : WARN,
      years: yearChips(cy.map((yy) => { const sy = collectStatus(ds.collect.byYear[yy], cur); return { y: yy, v: sy ? `${fmtDec(sy.avg, 1)}%` : "—", note: sy?.partial ? `s/d ${sy.lastLabel}` : "" }; }), color) });
  }

  const by = ds.badDebt.byYear, bys = byc(ds), bl = bys[bys.length - 1];
  if (bl) {
    const b = by[bl], st = badDebtStatus(b);
    const color = st?.ok === false ? BAD : st?.ok ? GOOD : WARN;
    cards.push({ cid: "bd", kind: "baddebt", icon: "alert", color, label: `Bad debt · ${bl}`, value: rpShort(b.total),
      status: st?.ok, statusText: st?.ok ? "✓ Tercapai" : "✕ Tidak tercapai",
      sub: `${b.customers.length} customer · ${b.rows.length} invoice${b.bdPct != null ? ` · ${fmtDec(b.bdPct, 1)}% dari piutang` : ""}${b.targetPct != null ? ` · target maks ${b.targetPct}%` : ""}${st?.ok == null && b.targetPct != null ? " · total piutang belum diisi" : ""}`,
      chip: b.bdPct != null && b.targetPct != null ? `${sgnPt(b.bdPct - b.targetPct)} vs target` : null, chipColor: st?.ok ? GOOD : BAD,
      years: yearChips(bys.map((yy) => ({ y: yy, v: rpShort(by[yy].total), note: "" })), color) });
    cards.push({ cid: "cust", kind: "customers", icon: "layers", color: BRAND.cyan, label: `Konsentrasi bad debt · ${bl}`, value: `${fmtDec((b.customers[0].amount / b.total) * 100, 0)}%`,
      sub: `${clipTxt(b.customers[0].name, 34)} · ${rpShort(b.customers[0].amount)}${b.customers[0].remarks[0] ? ` · ${clipTxt(b.customers[0].remarks[0], 40)}` : ""}`,
      years: yearChips(bys.map((yy) => { const t = by[yy].customers[0]; return { y: yy, v: `${fmtDec((t.amount / by[yy].total) * 100, 0)}%`, note: clipTxt(t.name.split(",")[0], 12) }; }), BRAND.cyan) });
  }

  const arrow = (a) => a.join(" → ");
  const line = (cur, nm) => { const sy = cy.map((yy) => ({ yy, s: collectStatus(ds.collect.byYear[yy], cur) })).filter((x) => x.s); if (!sy.length) return null; const l = sy[sy.length - 1]; const oks = sy.filter((x) => x.s.ok).map((x) => x.yy); return `${nm}: ${arrow(sy.map((x) => `${fmtDec(x.s.avg, 1)}%`))} (${sy.map((x) => x.yy).join("/")}${l.s.partial ? `, ${l.yy} s/d ${l.s.lastLabel}` : ""}), target ≥${l.s.target}% — ${oks.length ? `tercapai di ${oks.join(", ")}` : "belum tercapai"}.`; };
  const bdLine = bys.length ? `Bad debt: ${arrow(bys.map((yy) => rpShort(by[yy].total)))} (${bys.join("/")})${bl && badDebtStatus(by[bl])?.ok != null ? `; ${bl} ${fmtDec(by[bl].bdPct, 1)}% dari piutang, ${badDebtStatus(by[bl]).ok ? "dalam" : "melewati"} target maks ${by[bl].targetPct}%` : ""}.` : null;
  const summary = [line("idr", "IDR"), line("usd", "USD"), bdLine].filter(Boolean).join(" ");

  const cur = cards.find((c) => c.cid === open);
  return (
    <div>
      <SlideHead color={accent} eyebrow="Finance AR" title="Poin penting Finance AR" sub="Dihitung otomatis dari Excel. Klik ⓘ untuk sumber dan cara hitung." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr auto", gap: 16, alignContent: "stretch", minHeight: 0 }}>
        <PrintCss />
        {cards.map((c, i) => <div key={c.cid} style={{ display: "flex", flexDirection: "column", minHeight: 0, gridColumn: cards.length % 2 === 1 && i === cards.length - 1 ? "1 / -1" : "auto" }}><ArCard {...c} onInfo={() => setOpen(c.cid)} /></div>)}
        {summary && <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan 2024–2026">{summary}</Insight></div>}
        {cur && <DetailPopup title={cur.label} sub="Rincian sumber dan perhitungan" onClose={() => setOpen(null)}><ArDetailContent kind={cur.kind} ds={ds} /></DetailPopup>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ slide 2: tren per bulan */

function ArTrendSlide({ ds, accent }) {
  const [open, setOpen] = useState(false);
  const ys = cyc(ds), by = ds.collect.byYear, ly = ys[ys.length - 1];
  const YEAR_COLORS = ["#94a3b8", "#F5B83D"];
  const sty = (i, latest) => { const back = ys.length - 1 - i; return back === 0 ? latest : YEAR_COLORS[Math.max(0, 1 - (back - 1))] || "#94a3b8"; };
  const labels = MONTH_LABEL.slice(1);
  const panels = ["idr", "usd"].map((cur) => {
    const latestColor = cur === "idr" ? BRAND.cyan : "#a78bfa";
    const series = ys.map((y, i) => ({ name: String(y), color: sty(i, latestColor), values: labels.map((_, mi) => by[y].months.find((x) => x.m === mi + 1)?.[cur] ?? null) }));
    const legend = ys.map((y, i) => { const s = collectStatus(by[y], cur); return { t: `${y}${by[y].partial ? ` (s/d ${by[y].lastLabel})` : ""} · rata-rata ${s ? `${fmtDec(s.avg, 1)}%` : "—"}`, c: sty(i, latestColor) }; });
    return { cur, series, legend };
  }).filter((p) => p.series.some((s) => s.values.some((v) => v != null)));
  const tg = by[ly]?.target ?? 98;
  const facts = panels.map((p) => {
    const per = ys.map((y) => { const s = collectStatus(by[y], p.cur); return s ? `${y} tertinggi ${s.best.label} ${fmtDec(s.best[p.cur], 1)}% / terendah ${s.worst.label} ${fmtDec(s.worst[p.cur], 1)}%` : null; }).filter(Boolean);
    return `${p.cur.toUpperCase()}: ${per.join(" · ")}.`;
  });
  return (
    <div>
      <SlideHead color={accent} eyebrow="Finance AR" title="Pencapaian piutang per bulan" sub={`Persen tertagih tiap bulan dibanding target ${tg}%. Bulan kosong = belum diisi.`} />
      <div style={{ display: "grid", gridTemplateColumns: panels.length > 1 ? "1fr 1fr" : "1fr", gridTemplateRows: "1fr auto", gap: 16, minHeight: 0 }}>
        <PrintCss />
        {panels.map((p) => (
          <Glass key={p.cur} style={{ padding: "16px 20px", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 19, fontWeight: 800 }}>Piutang {p.cur.toUpperCase()} tertagih per bulan (%)</div>
              <InfoBtn onClick={() => setOpen(true)} color={p.series[p.series.length - 1].color} />
            </div>
            <BarChart h={214} labels={labels} series={p.series} target={tg} targetLabel={`Target ${tg}%`} fmtTick={(v) => `${Math.round(v)}`} fmtVal={(v) => `${fmtDec(v, 1)}%`} />
            <Legend items={[...p.legend, { t: `target ${tg}%`, c: WARN, dash: true }]} />
          </Glass>
        ))}
        <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan 2024–2026">{facts.join(" ")}</Insight></div>
        {open && <DetailPopup title="Pencapaian piutang per bulan" sub="Rincian per bulan, IDR dan USD" onClose={() => setOpen(false)}><ArDetailContent kind="collect" ds={ds} /></DetailPopup>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ slide 3: bad debt */

function ArBadDebtSlide({ ds, accent }) {
  const [open, setOpen] = useState(null);
  const ys = byc(ds), by = ds.badDebt.byYear, ly = ys[ys.length - 1], b = by[ly];
  const n = b.customers.length;
  const dense = n > 8 ? 2 : n > 6 ? 1 : 0;
  const fs = [14, 13, 12][dense];
  const series = [{ name: "Total bad debt", color: "#F59E0B", showValues: true, colorOf: null, values: ys.map((y) => by[y].total) }];
  const lines = ys.map((y) => { const st = badDebtStatus(by[y]); return { y, st, b: by[y] }; });
  const topRemark = b.customers.filter((x) => x.remarks.length).slice(0, 2).map((x) => `${x.name.split(",")[0]}: ${clipTxt(x.remarks.join("; "), 70)}`);
  const facts = [
    `Bad debt per tahun: ${ys.map((y) => `${y} ${rpShort(by[y].total)}`).join(" → ")}.`,
    `${ly}: ${n} customer; terbesar ${b.customers[0].name.split(",")[0]} ${rpShort(b.customers[0].amount)} (${fmtDec((b.customers[0].amount / b.total) * 100, 0)}%).`,
    b.bdPct != null && b.targetPct != null ? `${ly}: ${fmtDec(b.bdPct, 1)}% dari piutang, target maks ${b.targetPct}% — ${b.bdPct <= b.targetPct ? "tercapai" : "tidak tercapai"}.` : b.targetPct != null ? `Target ${ly}: maks ${b.targetPct}% (total piutang tahun ini belum diisi di Excel, jadi belum dinilai).` : null,
    b.wo != null ? `Write-off ${ly}: ${rpShort(b.wo)}${b.woNote ? ` (${b.woNote})` : ""}.` : null,
  ].filter(Boolean);
  return (
    <div>
      <SlideHead color={accent} eyebrow="Finance AR" title="Bad debt & customer bermasalah" sub="Total per tahun dan rincian customer tahun terbaru. Klik ⓘ untuk invoice per baris." />
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.3fr", gridTemplateRows: "1fr auto", gap: 16, minHeight: 0 }}>
        <PrintCss />
        <Glass style={{ padding: "14px 20px", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 19, fontWeight: 800 }}>Total bad debt per tahun</div>
            <InfoBtn onClick={() => setOpen("baddebt")} color="#F59E0B" />
          </div>
          <BarChart w={460} h={200} labels={ys.map(String)} series={series} fmtTick={(v) => rpShort(v).replace("Rp ", "")} fmtVal={(v) => rpShort(v).replace("Rp ", "")} />
          <div style={{ display: "grid", gap: 3 }}>
            {lines.map((l) => (
              <div key={l.y} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                <b style={{ width: 42 }}>{l.y}</b>
                <span style={{ flex: 1, color: BRAND.muted }}>{l.b.bdPct != null ? `${fmtDec(l.b.bdPct, 1)}% dari piutang` : "total piutang belum ada"}{l.b.targetPct != null ? ` · target maks ${l.b.targetPct}%` : " · target belum ada"}</span>
                {l.st?.ok != null && <b style={{ color: l.st.ok ? GOOD : BAD }}>{l.st.ok ? "✓ Tercapai" : "✕ Tidak tercapai"}</b>}
              </div>
            ))}
          </div>
        </Glass>
        <Glass style={{ padding: "12px 18px", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 19, fontWeight: 800 }}>Customer bermasalah {ly} · {rpShort(b.total)}</div>
            <InfoBtn onClick={() => setOpen("customers")} color={BRAND.cyan} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.75fr) 84px 40px minmax(0,0.85fr) minmax(0,1.9fr)", gap: "5px 10px", fontSize: fs, alignItems: "start" }}>
            {["Customer", "Amount", "Porsi", "PIC", "Keterangan"].map((h, i) => <div key={h} style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 800, color: BRAND.muted, textAlign: i === 1 || i === 2 ? "right" : "left" }}>{h.toUpperCase()}</div>)}
            {b.customers.map((x) => (
              <React.Fragment key={x.name}>
                <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={x.name}>{x.name}</div>
                <div style={{ textAlign: "right", fontWeight: 800 }}>{rpShort(x.amount)}</div>
                <div style={{ textAlign: "right", color: BRAND.muted }}>{fmtDec((x.amount / b.total) * 100, 0)}%</div>
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: BRAND.muted }} title={x.pic}>{x.pic}</div>
                <div style={{ display: "-webkit-box", WebkitLineClamp: n > 8 ? 1 : 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.25 }} title={x.remarks.join("; ")}>{x.remarks.join("; ") || "—"}</div>
              </React.Fragment>
            ))}
          </div>
        </Glass>
        <div style={{ gridColumn: "1 / -1" }}><Insight color={accent} label="Ringkasan 2024–2026">{[...facts, ...topRemark.slice(0, 1)].join(" ")}</Insight></div>
        {open && <DetailPopup title={open === "baddebt" ? "Bad debt per tahun" : `Customer bad debt per tahun`} sub="Rincian sumber dan perhitungan" onClose={() => setOpen(null)}><ArDetailContent kind={open} ds={ds} /></DetailPopup>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ panel "Capaian per indikator" */

export function arPanels(data) {
  const ds = arOf(data);
  if (!ds) return null;
  const cy = cyc(ds);
  const mk = (key, title, icon, color, cur) => {
    const vals = AR_YEARS.map((y) => collectStatus(ds.collect.byYear[y], cur)?.avg ?? null);
    if (!vals.some((v) => v != null)) return null;
    const li = AR_YEARS[vals.map((v) => v != null).lastIndexOf(true)];
    const c = ds.collect.byYear[li];
    return { key, title, icon, color, tag: `target ≥${c?.target ?? 98}%`, numeric: true, values: vals, max: Math.max(100, ...vals.map((v) => v ?? 0)) * 1.05, fmt: (v) => `${fmtDec(v, 1)}%`, label: `${li}${c?.partial ? ` · s/d ${c.lastLabel}` : ""}`, value: `${fmtDec(vals[AR_YEARS.indexOf(li)], 1)}%` };
  };
  const bys = byc(ds);
  const bvals = AR_YEARS.map((y) => ds.badDebt.byYear[y]?.total ?? null);
  const bl = AR_YEARS[bvals.map((v) => v != null).lastIndexOf(true)];
  return {
    arIdrAch: [mk("arIdr", "Pencapaian piutang IDR", "file", BRAND.cyan, "idr")].filter(Boolean),
    arUsdAch: [mk("arUsd", "Pencapaian piutang USD", "star", "#a78bfa", "usd")].filter(Boolean),
    badDebtControl: bys.length ? [{ key: "arBd", title: "Bad debt per tahun", icon: "alert", color: "#F59E0B", tag: ds.badDebt.byYear[bl]?.targetPct != null ? `target maks ${ds.badDebt.byYear[bl].targetPct}%` : "total tiap tahun", numeric: true, values: bvals, max: Math.max(1, ...bvals.map((v) => v ?? 0)) * 1.15, fmt: (v) => rpShort(v).replace("Rp ", ""), label: `${bl}`, value: rpShort(bvals[AR_YEARS.indexOf(bl)]) }] : [],
  };
}

/* ------------------------------------------------------------------ pintu masuk dari KpiDeck */

/** [] bila belum ada file Excel Finance AR yang diunggah. Dipanggil KpiDeck tepat setelah slide matriks Finance AR. */
export function buildArSlides(data, cfg = {}) {
  const ds = arOf(data);
  if (!ds) return [];
  const out = [];
  if (cyc(ds).length || byc(ds).length) out.push({ id: "ar-key", label: "Piutang · Poin penting", node: <ArKeySlide ds={ds} accent={cfg.accent} /> });
  if (cyc(ds).length) out.push({ id: "ar-trend", label: "Piutang · Per bulan", node: <ArTrendSlide ds={ds} accent={cfg.accent} /> });
  if (byc(ds).length) out.push({ id: "ar-baddebt", label: "Piutang · Bad debt", node: <ArBadDebtSlide ds={ds} accent={cfg.accent} /> });
  return out;
}