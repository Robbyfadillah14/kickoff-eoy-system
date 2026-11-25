"use client";
import React from "react";
import { dmGroupsFor, isUgoPlant, dmNum, dmFmt, dmFmtField, dmWarnings } from "../../lib/presentation/dmFigures";

/**
 * Isian ANGKA utama Digital Marketing (per tahun laporan): Google Search Console, Leads WhatsApp, Insight sosial media.
 * Disimpan datar di form (key dmGsc*, dmLeads*, dmSm*) -> otomatis tersimpan bersama laporan, dan tampil di presentasi
 * sebagai slide "Poin penting" lengkap dengan tombol ⓘ rincian.
 */
export default function DmFigures({ form, setForm, plantName = "" }) {
  const groups = dmGroupsFor(plantName);
  const ugo = isUgoPlant(plantName);
  const set = (key, value) => setForm({ ...form, [key]: value });
  return (
    <section className="bg-card border border-pink-500/40 rounded-xl p-4 space-y-4">
      <div>
        <h2 className="font-semibold text-sm text-pink-400">{ugo ? "Marketing Principal" : "Angka Utama Digital Marketing"} {form.year || ""}</h2>
        {ugo
          ? <p className="text-xs text-sub mt-0.5">Isi <b>lima poin</b> marketing principal di bawah, masing-masing satu angka untuk tahun laporan ini. Sistem langsung menampilkannya sebagai slide <b>Poin penting</b> di mode presentasi, dibandingkan dengan tahun sebelumnya, dan tiap angka bisa diklik ⓘ untuk melihat sumbernya. <b>Opsional</b> — poin yang kosong tidak ditampilkan.</p>
          : <p className="text-xs text-sub mt-0.5">Isi angka dari sumber di bawah (cukup salin dari dashboard-nya). Sistem langsung menampilkannya sebagai slide <b>Poin penting</b> di mode presentasi, dibandingkan dengan tahun sebelumnya, dan tiap angka bisa diklik ⓘ untuk melihat sumbernya. <b>Opsional</b> — kelompok yang kosong tidak ditampilkan.</p>}
        <p className="text-[11px] text-slate-400 mt-1">Cara menulis: angka biasa saja, tanpa singkatan. Contoh <span className="font-mono">12345</span> atau <span className="font-mono">12.345</span> (bukan “12 rb”); desimal pakai koma, misalnya <span className="font-mono">2,7</span>.</p>
      </div>

      {groups.map((g) => {
        const r = {}; for (const f of g.fields) r[f.key] = dmNum(form[f.key], f.kind);
        const warns = dmWarnings(g, r);
        const bad = g.fields.filter((f) => String(form[f.key] ?? "").trim() && r[f.key] == null);
        return (
          <div key={g.id} className="border border-line rounded-xl p-3 space-y-3 bg-bg2/40">
            <div>
              <h3 className="text-xs font-bold" style={{ color: g.color }}>{g.title}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ambil dari: {g.where}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {g.fields.map((f) => (
                <div key={f.key} className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                  {f.name && <div><p className="text-xs font-bold text-white">{f.no}. {f.name}</p><p className="text-[11px] text-slate-400 leading-snug">{f.desc}</p></div>}
                  <label className="text-[11px] text-sub block font-medium">{f.name ? `• ${f.label}` : f.label}</label>
                  <input type="text" inputMode="decimal" value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                    placeholder={`Contoh: ${f.hint}`} className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" />
                  {r[f.key] != null && <p className="text-[10px] font-mono" style={{ color: g.color }}>terbaca: {dmFmtField(f, r[f.key])}</p>}
                  {String(form[f.key] ?? "").trim() && r[f.key] == null && <p className="text-[10px] text-red-400">Bukan angka — tidak akan ditampilkan.</p>}
                </div>
              ))}
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5 md:col-span-2">
                <label className="text-[11px] text-sub block font-medium">Periode data (muncul di popup presentasi)</label>
                <input type="text" value={form[g.periodKey] ?? ""} onChange={(e) => set(g.periodKey, e.target.value)}
                  placeholder="Contoh: 1 Jan – 31 Des 2025" className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" />
              </div>
            </div>
            {g.id === "social" && r.dmSmImprFol != null && r.dmSmImprNon != null && r.dmSmImprFol + r.dmSmImprNon > 0 && (
              <p className="text-[11px] text-slate-300">Total impression = {dmFmt(r.dmSmImprFol + r.dmSmImprNon)} · {dmFmt((r.dmSmImprNon / (r.dmSmImprFol + r.dmSmImprNon)) * 100, 0)}% dari non-followers (dihitung otomatis).</p>
            )}
            {warns.map((w, i) => <p key={i} className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">⚠ {w}</p>)}
          </div>
        );
      })}
    </section>
  );
}