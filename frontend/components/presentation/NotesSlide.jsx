"use client";
import React, { useState } from "react";
import { SlideHead, Glass } from "./slides.jsx";
import { PrintCss, DetailPopup, Block } from "./HrSlides.jsx";
import { BRAND, phaseColor, phaseOf, isEmptyValue } from "../../lib/presentation/index.js";
import { DEPT_KPIS } from "../../lib/presentation/kpi.js";

/**
 * "Catatan & isian divisi" — menampilkan SEMUA isian teks yang diketik staf (evaluasi, catatan,
 * kendala, peluang, dan isian teks lain) per tahun, agar tidak ada isian yang tidak tampil di presentasi.
 * Teks panjang dipotong di kartu; tombol "Lihat semua" membuka popup berisi teks lengkap.
 * Hanya untuk mode satu divisi (solo).
 */

const YEARS = [2024, 2025, 2026];

// isian terstruktur / sudah punya tampilan sendiri -> jangan dobel
const SKIP = new Set([
  "salesType", "kpiList", "salesPerformances", "salesSupportPerformances", "metrics", "weeklyRevenue", "targetAchievedPct",
  "branchInnovations", "challenges", "opportunities", "strategicOutlook2027", "nextYearOutlook", "logData", "arData", "hrData", "dmFigures",
]);
const LABELS = {
  generalNotes: "Catatan umum", cancelInvAnalysis: "Analisis cancel invoice", hrEvaluation: "Evaluasi HR",
};
const human = (k) => LABELS[k] || String(k).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const clean = (v) => (isEmptyValue(v) ? "" : String(v).replace(/\s+/g, " ").trim());
const titles = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => clean(typeof x === "string" ? x : x?.title || x?.text)).filter(Boolean);
const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** entri teks satu divisi untuk satu tahun: [{label, items:[string]}] */
export function notesFor(data, deptCode, yr) {
  const e = data?.years?.[yr]?.byDept?.[deptCode];
  if (!e) return [];
  const m = e.metrics || {}, rep = e.report || {};
  const spec = DEPT_KPIS[deptCode] || {};
  const kpiKeys = new Set((spec.kpis || []).map((k) => k.key));
  const out = [];
  const add = (label, items) => { const list = items.map(clean).filter(Boolean); if (list.length) out.push({ label, items: list }); };

  if (spec.evaluationKey) add("Evaluasi", [m[spec.evaluationKey]]);
  add("Catatan umum", [m.generalNotes]);
  add("Kendala", titles(rep.challenges?.length ? rep.challenges : m.challenges));
  add("Peluang", titles(rep.opportunities?.length ? rep.opportunities : m.opportunities));
  for (const k of Object.keys(m)) {
    if (SKIP.has(k) || kpiKeys.has(k) || k === spec.evaluationKey || k === "generalNotes") continue;
    if (typeof m[k] === "string" && clean(m[k]).length >= 3) add(human(k), [m[k]]);
  }
  return out;
}

function NotesSlide({ data, dept, accent }) {
  const [open, setOpen] = useState(false);
  const cols = YEARS.map((yr) => ({ yr, phase: phaseOf(yr)?.phase, label: phaseOf(yr)?.label, entries: notesFor(data, dept.code, yr) }));
  const total = cols.reduce((s, c) => s + c.entries.length, 0);
  return (
    <div>
      <PrintCss />
      <SlideHead color={accent} eyebrow={dept.name} title="Catatan & isian divisi"
        sub="Semua yang diketik staf di form, per tahun."
        right={<button type="button" className="hr-noprint" onClick={() => setOpen(true)} style={{ border: `2px solid ${accent}`, background: `${accent}1a`, color: accent, fontWeight: 800, fontSize: 15, borderRadius: 99, padding: "8px 18px", cursor: "pointer" }}>Lihat semua teks lengkap</button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, minHeight: 0 }}>
        {cols.map((c) => {
          const col = phaseColor(c.phase);
          const shown = c.entries.slice(0, 4), more = c.entries.length - shown.length;
          const per = shown.length >= 4 ? 120 : shown.length === 3 ? 170 : 240;
          return (
            <Glass key={c.yr} accent={col} style={{ padding: "14px 18px", gap: 10, justifyContent: "flex-start", minHeight: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1, color: col }}>{c.yr}</div>
                <div style={{ fontSize: 13, letterSpacing: 3, fontWeight: 800, color: BRAND.muted, textTransform: "uppercase" }}>{c.label}</div>
              </div>
              {shown.length ? shown.map((en, i) => (
                <div key={i} style={{ borderLeft: `4px solid ${col}`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 800, color: BRAND.muted, textTransform: "uppercase", marginBottom: 2 }}>{en.label}</div>
                  {en.items.length === 1
                    ? <div style={{ fontSize: 17, lineHeight: 1.4 }}>{cut(en.items[0], per)}</div>
                    : <ul style={{ margin: 0, paddingLeft: 18, fontSize: 17, lineHeight: 1.4 }}>{en.items.slice(0, 3).map((t, k) => <li key={k}>{cut(t, 70)}</li>)}{en.items.length > 3 ? <li style={{ color: BRAND.muted }}>+{en.items.length - 3} lainnya</li> : null}</ul>}
                </div>
              )) : <div style={{ fontSize: 15, color: BRAND.muted, fontStyle: "italic", paddingTop: 6 }}>Belum ada isian teks untuk {c.yr}.</div>}
              {more > 0 && <div style={{ fontSize: 14, color: BRAND.muted }}>+{more} isian lain (lihat semua teks lengkap)</div>}
            </Glass>
          );
        })}
      </div>
      {open && (
        <DetailPopup title={`Isian ${dept.name}`} sub={`${total} isian teks, ditampilkan lengkap`} onClose={() => setOpen(false)}>
          {cols.map((c) => c.entries.length ? (
            <Block key={c.yr} title={`${c.yr} · ${c.label}`}>
              <div style={{ display: "grid", gap: 10 }}>
                {c.entries.map((en, i) => (
                  <div key={i} style={{ fontSize: 16, lineHeight: 1.5 }}>
                    <b>{en.label}: </b>
                    {en.items.length === 1 ? en.items[0] : <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>{en.items.map((t, k) => <li key={k}>{t}</li>)}</ul>}
                  </div>
                ))}
              </div>
            </Block>
          ) : null)}
        </DetailPopup>
      )}
    </div>
  );
}

/** [] bila tidak ada isian teks sama sekali. Hanya mode satu divisi. */
export function buildNotesSlides(data, { solo, accent } = {}) {
  if (!solo) return [];
  const any = YEARS.some((yr) => notesFor(data, solo.code, yr).length);
  if (!any) return [];
  return [{ id: "notes", label: "Catatan & isian", node: <NotesSlide data={data} dept={solo} accent={accent} /> }];
}