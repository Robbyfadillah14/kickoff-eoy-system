"use client";
import React, { useState } from "react";
import { matrixFrom } from "../../lib/presentation/excelImport";
import { parseArSheets, arFieldsFrom, collectStatus, badDebtStatus, rpShort, pct1, fmtDec } from "../../lib/presentation/arExcel";
import { FileSpreadsheet, Upload, Eye } from "lucide-react";

/** Upload Excel Finance AR (pencapaian piutang IDR/USD per bulan + bad debt per tahun). Hasil disimpan di form.arData. */

function HowItWorks() {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left cursor-pointer">
        <span className="flex items-center gap-2 text-sm font-bold text-amber-300"><span>💡</span> Cara kerja halaman ini (baca sekali, 1 menit)</span>
        <span className="text-[11px] text-amber-400 font-mono">{open ? "Tutup ▲" : "Buka ▼"}</span>
      </button>
      {open && (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Anda <b>tidak perlu mengetik angka</b>. Unggah file Excel “Rekap Target Piutang” yang sudah biasa dipakai (satu file berisi lembar 2024, 2025, 2026 dan lembar BADDEBT tiap tahun).
            Sistem membaca persen tertagih per bulan (IDR dan USD) dan daftar bad debt, lalu menampilkannya sebagai slide lengkap dengan tombol <b>ⓘ</b> untuk melihat asal angka.
          </p>
          <ol className="space-y-2.5">
            {[
              ["Siapkan file Excel biasa", "Tidak perlu mengubah format. Lembar dikenali dari namanya: “2024”, “2025”, “2026” untuk pencapaian piutang dan “BADDEBT2024”, “BADDEBT2025”, “BADDEBT2026” untuk bad debt."],
              ["Klik “Pilih & Upload File”", "Hasil bacaan muncul di bawahnya. Cocokkan angkanya dengan Excel Anda."],
              ["Periksa tanda ⚠ kuning", "Berarti ada yang perlu dicek (mis. total piutang belum ada sehingga persentase bad debt belum bisa dinilai)."],
              ["Simpan laporan seperti biasa", "Slide Finance AR muncul di presentasi. Satu file cukup diunggah sekali di salah satu tahun; tahun lain yang sudah punya laporan ikut terisi."],
            ].map(([t, d], i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center text-[11px]">{i + 1}</span>
                <span><b className="text-white">{t}.</b> <span className="text-slate-400">{d}</span></span>
              </li>
            ))}
          </ol>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Aturan yang dipakai sistem</div>
            <ul className="space-y-1 text-slate-400 list-disc pl-4">
              <li><b className="text-slate-200">Rata-rata dan total dihitung ulang</b> dari angka di tabel, bukan dari sel rata-rata / TOTAL di Excel.</li>
              <li><b className="text-slate-200">Tercapai</b> bila persen tertagih ≥ target pada lembar tahun itu (mis. 98%). Penilaian memakai angka, bukan tulisan “tercapai” di Excel.</li>
              <li><b className="text-slate-200">Bulan kosong</b> (mis. Nov–Des tahun berjalan) = belum diisi, <b>bukan nol</b>.</li>
              <li><b className="text-slate-200">Bad debt</b> dinilai terhadap target maksimum tahun itu bila “Total Piutang” tertulis di lembar BADDEBT tahun tersebut. Tanpa total piutang, hanya totalnya yang ditampilkan.</li>
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
  const cy = Object.keys(ds.collect?.byYear || {}).map(Number).sort();
  const by = Object.keys(ds.badDebt?.byYear || {}).map(Number).sort();
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-slate-500 font-mono">{ds.file} · tahun terbaca: {ds.years.join(", ")}</div>
      {cy.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono text-slate-300">
            <thead><tr className="bg-slate-900 text-slate-400 border-b border-slate-800"><Th>Pencapaian piutang</Th><Th right>Rata-rata IDR</Th><Th right>Rata-rata USD</Th><Th right>Target</Th><Th>Status IDR</Th><Th>Status USD</Th></tr></thead>
            <tbody>
              {cy.map((y) => {
                const c = ds.collect.byYear[y], i = collectStatus(c, "idr"), u = collectStatus(c, "usd");
                const st = (s) => (s?.ok == null ? "—" : `${s.ok ? "Tercapai" : "Di bawah target"} (${s.okMonths}/${s.n} bln)`);
                return (
                  <tr key={y} className="border-b border-slate-900">
                    <Td cls="text-white font-bold">{y}{c.partial ? <span className="text-amber-300"> (s/d {c.lastLabel})</span> : null}</Td>
                    <Td right>{i ? `${fmtDec(i.avg, 2)}%` : "—"}</Td><Td right>{u ? `${fmtDec(u.avg, 2)}%` : "—"}</Td><Td right>≥{c.target}%</Td>
                    <Td cls={i?.ok == null ? "" : i.ok ? "text-emerald-300" : "text-rose-300"}>{st(i)}</Td>
                    <Td cls={u?.ok == null ? "" : u.ok ? "text-emerald-300" : "text-rose-300"}>{st(u)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {by.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono text-slate-300">
            <thead><tr className="bg-slate-900 text-slate-400 border-b border-slate-800"><Th>Bad debt</Th><Th right>Total</Th><Th right>Customer</Th><Th right>Total piutang</Th><Th right>% bad debt</Th><Th right>Target maks</Th><Th>Status</Th></tr></thead>
            <tbody>
              {by.map((y) => {
                const b = ds.badDebt.byYear[y], s = badDebtStatus(b);
                return (
                  <tr key={y} className="border-b border-slate-900">
                    <Td cls="text-white font-bold">{y}</Td>
                    <Td right cls="font-bold text-white">{rpShort(b.total)}</Td><Td right>{b.customers.length}</Td>
                    <Td right>{b.outstanding != null ? rpShort(b.outstanding) : <span className="text-amber-300">belum ada</span>}</Td>
                    <Td right>{b.bdPct != null ? pct1(b.bdPct) : "—"}</Td><Td right>{b.targetPct != null ? `${b.targetPct}%` : "—"}</Td>
                    <Td cls={s?.ok == null ? "" : s.ok ? "text-emerald-300" : "text-rose-300"}>{s?.ok == null ? "—" : s.ok ? "Tercapai" : "Tidak tercapai"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Warn list={ds.warnings} />
    </div>
  );
}

export default function ArUpload({ form, setForm }) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const ds = form.arData;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    const messages = [];
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheets = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "", range: 0 });
        const fmt = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "", range: 0 });
        return { name, matrix: matrixFrom(raw, fmt) };
      });
      const found = parseArSheets(sheets, { fileName: file.name });
      if (!found) {
        messages.push({ level: "error", text: `${file.name}: format belum dikenali. Pastikan ada lembar bernama tahun (mis. “2025”) dengan kolom MONTH / IDR / USD, atau lembar “BADDEBT2025”. Untuk kasus lain, gunakan tab Input Manual.` });
      } else if (!found.years.includes(Number(form.year))) {
        messages.push({ level: "error", text: `${file.name}: berisi data tahun ${found.years.join(", ")}, sedangkan laporan yang dibuka tahun ${form.year}. Tidak dimasukkan. Buka laporan tahun yang ada di file, lalu unggah lagi.` });
      } else {
        setForm({ ...form, ...arFieldsFrom(found, Number(form.year)), arData: found });
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
      <section className="bg-slate-900 border border-amber-500/40 p-5 rounded-xl space-y-4 shadow-xl">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30"><FileSpreadsheet size={24} /></div>
            <div>
              <h3 className="text-sm font-bold text-amber-400">Upload Rekap Target Piutang (.xlsx / .xls)</h3>
              <p className="text-xs text-slate-400">Laporan yang sedang dibuka: <b className="text-slate-200">tahun {form.year}</b>. Mengunggah ulang akan menimpa hasil sebelumnya.</p>
            </div>
          </div>
          <label className={`px-4 py-2.5 ${busy ? "bg-slate-700 text-slate-400" : "bg-amber-500 hover:bg-amber-400 text-slate-950"} font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-2 shadow-lg shadow-amber-500/20`}>
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
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider"><Eye size={14} /> Hasil pembacaan</div>
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