"use client";
import React, { useState } from "react";
import { matrixFrom } from "../../lib/presentation/excelImport";
import { parseLogisticsSheets, logFieldsFrom, cancelStatus, targetText, flowCompare, fmtInt, fmtDec } from "../../lib/presentation/logisticsExcel";
import { FileSpreadsheet, Upload, Eye } from "lucide-react";

/** Upload Excel Admin Logistic (DO/INV per bulan, rekap cancel invoice, alasan cancel, arsip PO, on-time delivery). Hasil disimpan di form.logData. */

function HowItWorks() {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left cursor-pointer">
        <span className="flex items-center gap-2 text-sm font-bold text-teal-300"><span>💡</span> Cara kerja halaman ini (baca sekali, 1 menit)</span>
        <span className="text-[11px] text-teal-400 font-mono">{open ? "Tutup ▲" : "Buka ▼"}</span>
      </button>
      {open && (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Anda <b>tidak perlu mengetik angka</b>. Unggah file Excel rekap Admin Logistic yang sudah biasa dipakai (satu file boleh berisi data 2024, 2025, dan 2026).
            Sistem membaca angka per bulan, menghitung totalnya sendiri, lalu menampilkannya sebagai slide sederhana lengkap dengan tombol <b>ⓘ</b> untuk melihat asal angka.
          </p>
          <ol className="space-y-2.5">
            {[
              ["Siapkan file Excel biasa", "Tidak perlu mengubah format. Sistem mencari tabel dari judulnya: “Pembuatan Delivery Order (DO)”, “Pembuatan Invoice (INV)”, “Rekapan Cancel <tahun>”, “Analisis & Rincian Cancel Invoice <tahun>”, “Arsip PO Customer”, dan “Support On Time Delivery”."],
              ["Klik “Pilih & Upload File”", "Hasil bacaan muncul di bawahnya. Cocokkan angkanya dengan Excel Anda."],
              ["Periksa tanda ⚠ kuning", "Berarti ada yang perlu dicek (mis. total di Excel tidak sama dengan jumlah per bulan, atau target berubah antar tahun)."],
              ["Simpan laporan seperti biasa", "Slide Admin Logistic muncul di presentasi. Cukup unggah sekali; slide membaca data dari laporan tahun terbaru yang memuatnya."],
            ].map(([t, d], i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center text-[11px]">{i + 1}</span>
                <span><b className="text-white">{t}.</b> <span className="text-slate-400">{d}</span></span>
              </li>
            ))}
          </ol>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">Aturan yang dipakai sistem</div>
            <ul className="space-y-1 text-slate-400 list-disc pl-4">
              <li><b className="text-slate-200">Total dihitung ulang</b> dari angka per bulan, bukan dari sel TOTAL di Excel.</li>
              <li><b className="text-slate-200">Bulan yang masih kosong</b> (mis. Nov–Des tahun berjalan) dianggap belum diisi / masih berjalan, <b>bukan nol</b>. Perbandingan antar tahun memakai periode bulan yang sama (mis. Jan–Okt).</li>
              <li><b className="text-slate-200">Cancel invoice</b> = internal + eksternal, dinilai dengan target pada judul tabel tahun itu sendiri (target 2026 berbeda dari 2024/2025).</li>
              <li>Narasi kendala dan evaluasi tetap diisi manual di tab Input Manual.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const Warn = ({ list }) => (list?.length ? (
  <ul className="space-y-1">{list.map((w, i) => <li key={i} className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">⚠ {w}</li>)}</ul>
) : null);

const Th = ({ children, right }) => <th className={`p-2 font-semibold ${right ? "text-right" : "text-left"}`}>{children}</th>;
const Td = ({ children, right, cls = "" }) => <td className={`p-2 ${right ? "text-right" : ""} ${cls}`}>{children}</td>;

function Summary({ ds }) {
  const flows = ["do", "inv"].filter((k) => ds.flow?.[k]);
  const cy = Object.keys(ds.cancel?.byYear || {}).map(Number).sort();
  const ry = Object.keys(ds.reasons?.byYear || {}).map(Number).sort();
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-slate-500 font-mono">{ds.file} · lembar “{ds.sheet}” · tahun terbaca: {ds.years.join(", ")}</div>

      {flows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono text-slate-300">
            <thead><tr className="bg-slate-900 text-slate-400 border-b border-slate-800"><Th>Dokumen terbit</Th>{ds.years.map((y) => <Th key={y} right>{y}</Th>)}<Th right>vs tahun lalu (periode sama)</Th></tr></thead>
            <tbody>
              {flows.map((k) => {
                const f = ds.flow[k], c = flowCompare(ds, k);
                return (
                  <tr key={k} className="border-b border-slate-900">
                    <Td cls="text-white font-bold">{k === "do" ? "DO" : "Invoice"}</Td>
                    {ds.years.map((y) => <Td key={y} right>{f.byYear[y] ? <>{fmtInt(f.byYear[y].total)}{f.byYear[y].partial ? <span className="text-amber-300"> (s/d {f.byYear[y].lastLabel})</span> : null}</> : "—"}</Td>)}
                    <Td right cls={c?.pct == null ? "" : c.pct >= 0 ? "text-emerald-300" : "text-amber-300"}>{c?.pct == null ? "—" : `${c.pct >= 0 ? "+" : "−"}${fmtDec(Math.abs(c.pct))}%`}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {cy.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono text-slate-300">
            <thead><tr className="bg-slate-900 text-slate-400 border-b border-slate-800"><Th>Cancel invoice</Th><Th right>Internal</Th><Th right>Eksternal</Th><Th right>Total</Th><Th>Target</Th><Th>Status</Th></tr></thead>
            <tbody>
              {cy.map((y) => {
                const c = ds.cancel.byYear[y], s = cancelStatus(c);
                return (
                  <tr key={y} className="border-b border-slate-900">
                    <Td cls="text-white font-bold">{y}{c.partial ? <span className="text-amber-300"> (s/d {c.lastLabel})</span> : null}</Td>
                    <Td right>{c.int}</Td><Td right>{c.ext}</Td><Td right cls="font-bold text-white">{c.total}</Td>
                    <Td>{targetText(c.target)}</Td>
                    <Td cls={s?.ok == null ? "" : s.ok ? "text-emerald-300" : "text-rose-300"}>{s?.ok == null ? "—" : s.ok ? (c.partial ? "Dalam target" : "Tercapai") : "Melewati target"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-[11px] text-slate-400 space-y-0.5">
        {ry.length > 0 ? <div>Rincian alasan cancel terbaca untuk tahun: <b className="text-slate-200">{ry.join(", ")}</b>.</div> : <div>Rincian alasan cancel tidak ditemukan.</div>}
        {ds.kpis?.map((k) => <div key={k.key}>{k.label}: <b className="text-slate-200">{k.pct == null ? "—" : `${Math.round(k.pct)}%`}</b>{k.note ? ` — ${k.note}` : ""}</div>)}
      </div>

      <Warn list={ds.warnings} />
    </div>
  );
}

export default function LogUpload({ form, setForm }) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const ds = form.logData;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    const messages = [];
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      // range: 0 -> nomor baris sama dengan nomor baris di Excel
      const sheets = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "", range: 0 });
        const fmt = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "", range: 0 });
        return { name, matrix: matrixFrom(raw, fmt) };
      });
      const found = parseLogisticsSheets(sheets, { fileName: file.name });
      if (!found) {
        messages.push({ level: "error", text: `${file.name}: format belum dikenali. Pastikan ada tabel “Pembuatan Delivery Order (DO)” / “Pembuatan Invoice (INV)” dengan kolom BULAN dan tahun, atau tabel “Rekapan Cancel <tahun>”. Untuk kasus lain, gunakan tab Input Manual.` });
      } else if (!found.years.includes(Number(form.year))) {
        messages.push({ level: "error", text: `${file.name}: berisi data tahun ${found.years.join(", ")}, sedangkan laporan yang dibuka tahun ${form.year}. Tidak dimasukkan. Buka laporan tahun yang ada di file, lalu unggah lagi.` });
      } else {
        setForm({ ...form, ...logFieldsFrom(found, Number(form.year)), logData: found });
        messages.push({ level: "ok", text: `${file.name}: terbaca (tahun ${found.years.join(", ")}). Kolom di tab Input Manual untuk tahun ${form.year} ikut terisi otomatis.` });
      }
    } catch (err) {
      console.error("Gagal membaca file:", err);
      messages.push({ level: "error", text: `${file.name}: tidak bisa dibaca (${err?.message || "format tidak valid"}).` });
    } finally {
      setLog(messages);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <HowItWorks />
      <section className="bg-slate-900 border border-teal-500/40 p-5 rounded-xl space-y-4 shadow-xl">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30"><FileSpreadsheet size={24} /></div>
            <div>
              <h3 className="text-sm font-bold text-teal-400">Upload Rekap Admin Logistic (.xlsx / .xls)</h3>
              <p className="text-xs text-slate-400">Laporan yang sedang dibuka: <b className="text-slate-200">tahun {form.year}</b>. Mengunggah ulang akan menimpa hasil sebelumnya.</p>
            </div>
          </div>
          <label className={`px-4 py-2.5 ${busy ? "bg-slate-700 text-slate-400" : "bg-teal-500 hover:bg-teal-400 text-slate-950"} font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-2 shadow-lg shadow-teal-500/20`}>
            <Upload size={16} /><span>{busy ? "Membaca file…" : "Pilih & Upload File"}</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleFile} disabled={busy} className="hidden" />
          </label>
        </div>

        {log.length > 0 && (
          <ul className="space-y-1.5">
            {log.map((l, i) => (
              <li key={i} className={`text-[11px] rounded-lg px-3 py-2 border ${l.level === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>{l.level === "ok" ? "✔ " : "✖ "}{l.text}</li>
            ))}
          </ul>
        )}

        {ds ? (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider"><Eye size={14} /> Hasil pembacaan</div>
            <Summary ds={ds} />
            <div className="text-[10px] text-slate-500">Rincian per bulan dan baris Excel asal tiap angka tersedia di slide presentasi (klik ⓘ).</div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2 bg-slate-950/40">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Belum ada file yang diunggah.</p>
            <p className="text-[11px] text-slate-600">Klik “Pilih & Upload File”. Hasil perhitungan akan muncul di sini.</p>
          </div>
        )}
      </section>
    </div>
  );
}