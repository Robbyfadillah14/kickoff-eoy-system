"use client";
import React from "react";
import { formatRupiah } from "../../lib/presentation";

/**
 * Isian ANGKA keuangan (Rp) yang opsional — dipakai Finance Dept, AR, AP.
 * Nilai disimpan apa adanya (teks) di form; presentasi membaca angkanya otomatis ("1.250.000.000", "1,25 M" tidak, tulis angka penuh).
 * fields: [{ key, label, hint }]
 */
export default function FinanceFigures({ form, setForm, title, desc, fields }) {
  return (
    <section className="bg-card border border-amber-500/40 rounded-xl p-4 space-y-3">
      <div>
        <h2 className="font-semibold text-sm text-amber-400">{title}</h2>
        <p className="text-xs text-sub mt-0.5">{desc} <b>Opsional</b> — jika diisi, tampil sebagai grafik di presentasi.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {fields.map((f) => {
          const raw = form[f.key];
          const has = raw !== undefined && raw !== null && String(raw).trim() !== "";
          return (
            <div key={f.key} className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
              <label className="text-[11px] text-sub block font-medium">{f.label}</label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={raw || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.hint || "Contoh: 1250000000"}
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              {has && <p className="text-[10px] text-amber-300 font-mono">= {formatRupiah(raw)}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}