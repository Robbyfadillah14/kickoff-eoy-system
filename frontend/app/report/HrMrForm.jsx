"use client";
import React, { useState } from "react";
import { parseExcelFile, applyExcelImport } from "../../lib/reportExcel";
import { matrixFrom } from "../../lib/presentation/excelImport";
import { parseHrSheets, mergeHrData, hrFieldsFrom, crossCheck, fmtPct, fmtInt } from "../../lib/presentation/hrExcel";
import { FileSpreadsheet, Upload, CheckCircle2, Edit3, Eye } from "lucide-react";

const TYPE_META = {
  late: { title: "Keterlambatan Karyawan", icon: "⏰" },
  absence: { title: "Ketidakhadiran Karyawan", icon: "🗓️" },
  training: { title: "Pelatihan Terprogram", icon: "🎓" },
  history: { title: "Review Beberapa Tahun", icon: "📊" },
};
const SLOT = { LATE: "late", ABSENCE: "absence", TRAINING: "training", HISTORY: "history" };

/* ------------------------------------------------------------------ penjelasan cara kerja */
function HowItWorks() {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left cursor-pointer">
        <span className="flex items-center gap-2 text-sm font-bold text-rose-300"><span>💡</span> Cara kerja halaman ini (baca sekali, 1 menit)</span>
        <span className="text-[11px] text-rose-400 font-mono">{open ? "Tutup ▲" : "Buka ▼"}</span>
      </button>

      {open && (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Anda <b>tidak perlu mengetik angka satu per satu</b>. Cukup unggah file Excel rekap HRD yang sudah biasa dipakai.
            Sistem membaca angka mentah per bulan, menghitung hasil tahunannya sendiri, mengisi kolom KPI, lalu menampilkannya di slide presentasi.
          </p>

          <ol className="space-y-2.5">
            {[
              ["Siapkan file Excel biasa", "Tidak perlu mengubah format. Bisa rekap keterlambatan, ketidakhadiran, pelatihan, atau review beberapa tahun. Satu file = satu tahun. Boleh pilih beberapa file sekaligus."],
              ["Klik “Pilih & Upload File”", "Sistem mengenali jenis file dari judul kolomnya (mis. “Jumlah Datang telat”, “alpa / cuti / sakit”, “Rencana / Actual Pelatihan”), bukan dari nama file."],
              ["Periksa kartu hasil di bawahnya", "Tiap file jadi satu kartu berisi hasil dan keterangan tercapai / belum tercapai. Klik “Lihat perhitungan” untuk melihat rincian per bulan, lalu cocokkan dengan Excel Anda."],
              ["Simpan laporan seperti biasa", "Hasil otomatis masuk ke kolom KPI (lihat tab Input Manual) dan ke slide HRD & MR. Kalau ada angka yang ingin diubah, ubah di sana lalu simpan."],
            ].map(([t, d], i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-center text-[11px]">{i + 1}</span>
                <span><b className="text-white">{t}.</b> <span className="text-slate-400">{d}</span></span>
              </li>
            ))}
          </ol>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">Rumus yang dipakai sistem</div>
            <ul className="space-y-1 text-slate-400 list-disc pl-4">
              <li><b className="text-slate-200">Keterlambatan</b> = total kejadian datang telat ÷ total (jumlah karyawan × hari kerja). Target maksimal 2%.</li>
              <li><b className="text-slate-200">Ketidakhadiran</b> = mengikuti rumus di Excel Anda (dibaca dari kolom Rata-Rata). Pada file contoh: alpa + sakit, <b>cuti tidak dihitung</b>. Target maksimal 1%.</li>
              <li><b className="text-slate-200">Pelatihan</b> = pelatihan terlaksana ÷ pelatihan yang direncanakan. Target 100%.</li>
              <li>Hasil tahunan dihitung dari <b>total dibagi total</b>, bukan rata-rata dari rata-rata bulanan, jadi bulan dengan hari kerja lebih banyak punya bobot lebih besar.</li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Yang perlu diperhatikan</div>
            <ul className="space-y-1 text-amber-100/80 list-disc pl-4">
              <li><b>Tahun file harus sama dengan tahun laporan</b> yang sedang dibuka. Kalau berbeda, sistem menolak dan memberi tahu. Buka laporan tahun yang benar, lalu unggah lagi.</li>
              <li>Tanda <b>⚠ kuning</b> berarti sistem menemukan data yang janggal (mis. jumlah karyawan beda antar file). Hasil tetap dihitung, tetapi mohon dicek.</li>
              <li>File yang tidak dikenali akan diberi tahu. Pakai tab <b>Input Manual</b> untuk kasus itu.</li>
              <li>File asli Anda tidak diubah. Mengunggah ulang file jenis yang sama akan <b>menimpa</b> hasil sebelumnya.</li>
              <li>Narasi audit ISO, kendala, dan evaluasi tetap diisi manual di tab Input Manual.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ kartu hasil per file */
function Badge({ met }) {
  if (met == null) return null;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${met ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" : "bg-rose-500/15 text-rose-300 border-rose-500/40"}`}>{met ? "Tercapai" : "Belum tercapai"}</span>;
}

function Warn({ list }) {
  if (!list?.length) return null;
  return (
    <ul className="space-y-1">
      {list.map((w, i) => <li key={i} className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">⚠ {w}</li>)}
    </ul>
  );
}

const Th = ({ children, right }) => <th className={`p-2 font-semibold ${right ? "text-right" : "text-left"}`}>{children}</th>;
const Td = ({ children, right, cls = "" }) => <td className={`p-2 ${right ? "text-right" : ""} ${cls}`}>{children}</td>;

function DatasetCard({ kind, ds }) {
  const [detail, setDetail] = useState(false);
  const meta = TYPE_META[kind];
  const isPct = kind === "late" || kind === "absence" || kind === "training";

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-sm font-bold text-white flex items-center gap-2"><span>{meta.icon}</span>{meta.title}{ds.year && kind !== "history" ? ` ${ds.year}` : ""}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {ds.file}{ds.sheet ? ` · lembar “${ds.sheet}”` : ""}{ds.yearSource && kind !== "history" ? ` · tahun dari ${ds.yearSource}` : ""}
          </div>
        </div>
        {isPct && <Badge met={ds.met} />}
      </div>

      {isPct && (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <div className="text-3xl font-black text-white leading-none">{fmtPct(ds.pct, kind === "training" ? 0 : 2)}%</div>
            <div className="text-[10px] text-slate-500 mt-1">target {ds.target.label}</div>
          </div>
          {kind === "late" && <div className="text-[11px] text-slate-400 space-y-0.5"><div>{fmtInt(ds.late)} kejadian telat · {ds.periode}</div><div>Terbaik: <b className="text-slate-200">{ds.best.label}</b> ({fmtPct(ds.best.pct)}%) · Terburuk: <b className="text-slate-200">{ds.worst.label}</b> ({fmtPct(ds.worst.pct)}%)</div></div>}
          {kind === "absence" && <div className="text-[11px] text-slate-400 space-y-0.5"><div>{fmtInt(ds.count)} hari ({ds.formula.label}) · {ds.periode}</div><div>Cuti {fmtInt(ds.cuti)} hari {ds.formula.countsCuti ? "ikut dihitung" : "tidak dihitung"}</div></div>}
          {kind === "training" && <div className="text-[11px] text-slate-400 space-y-0.5"><div>{fmtInt(ds.actual)} dari {fmtInt(ds.plan)} pelatihan terlaksana</div>{ds.items.map((x) => <div key={x.name}>{x.name}: {fmtInt(x.actual)}/{fmtInt(x.plan)}</div>)}</div>}
        </div>
      )}

      <Warn list={ds.warnings} />

      <button type="button" onClick={() => setDetail(!detail)} className="text-[11px] font-semibold text-rose-300 hover:text-rose-200 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer">
        {detail ? "Tutup perhitungan ▲" : "Lihat perhitungan ▼"}
      </button>

      {detail && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1">
            <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Cara hitung</div>
            {ds.explain.map((l, i) => <div key={i} className="text-[11px] text-slate-300">{l}</div>)}
            {ds.headerRow && <div className="text-[10px] text-slate-500 pt-1">Sumber: judul kolom berada di baris ke-{ds.headerRow} pada file. Kolom “Baris Excel” di bawah menunjuk baris asal tiap angka.</div>}
          </div>

          <div className="overflow-x-auto">
            {kind === "late" && (
              <table className="w-full text-[11px] font-mono text-slate-300">
                <thead><tr className="bg-slate-900 text-slate-400 border-b border-slate-800"><Th>Bulan</Th><Th right>Telat</Th><Th right>Karyawan</Th><Th right>Hari kerja</Th><Th right>Pembagi</Th><Th right>Hasil</Th><Th right>Baris Excel</Th></tr></thead>
                <tbody>{ds.months.map((x) => <tr key={x.m} className="border-b border-slate-900"><Td>{x.label}</Td><Td right>{fmtInt(x.late)}</Td><Td right>{x.emp ?? "-"}</Td><Td right>{x.days ?? "-"}</Td><Td right>{fmtInt(x.den)}</Td><Td right cls={x.pct > ds.target.value ? "text-rose-300" : "text-emerald-300"}>{fmtPct(x.pct)}%</Td><Td right cls="text-slate-500">{x.row}</Td></tr>)}</tbody>
                <tfoot><tr className="bg-slate-900 text-white font-bold"><Td>Total</Td><Td right>{fmtInt(ds.late)}</Td><Td right></Td><Td right></Td><Td right>{fmtInt(ds.den)}</Td><Td right>{fmtPct(ds.pct)}%</Td><Td right></Td></tr></tfoot>
              </table>
            )}

            {kind === "absence" && (
              <table className="w-full text-[11px] font-mono text-slate-300">
                <thead><tr className="bg-slate-900 text-slate-400 border-b border-slate-800"><Th>Bulan</Th><Th right>Alpa</Th><Th right>Cuti</Th><Th right>Sakit</Th><Th right>Dihitung</Th><Th right>Pembagi</Th><Th right>Hasil</Th><Th right>Baris Excel</Th></tr></thead>
                <tbody>{ds.months.map((x) => <tr key={x.m} className="border-b border-slate-900"><Td>{x.label}</Td><Td right>{x.alpa}</Td><Td right cls="text-slate-500">{x.cuti}</Td><Td right>{x.sakit}</Td><Td right>{fmtInt(x.count)}</Td><Td right>{fmtInt(x.den)}</Td><Td right cls={x.pct > ds.target.value ? "text-rose-300" : "text-emerald-300"}>{fmtPct(x.pct)}%</Td><Td right cls="text-slate-500">{x.row}</Td></tr>)}</tbody>
                <tfoot><tr className="bg-slate-900 text-white font-bold"><Td>Total</Td><Td right>{fmtInt(ds.alpa)}</Td><Td right>{fmtInt(ds.cuti)}</Td><Td right>{fmtInt(ds.sakit)}</Td><Td right>{fmtInt(ds.count)}</Td><Td right>{fmtInt(ds.den)}</Td><Td right>{fmtPct(ds.pct)}%</Td><Td right></Td></tr></tfoot>
              </table>
            )}

            {kind === "training" && (
              <table className="w-full text-[11px] font-mono text-slate-300">
                <thead><tr className="bg-slate-900 text-slate-400 border-b border-slate-800"><Th>Jenis</Th><Th right>Rencana</Th><Th right>Actual</Th><Th right>Hasil</Th><Th right>Baris Excel</Th></tr></thead>
                <tbody>{ds.items.map((x) => <tr key={x.name} className="border-b border-slate-900"><Td>{x.name}</Td><Td right>{fmtInt(x.plan)}</Td><Td right>{fmtInt(x.actual)}</Td><Td right>{x.pct == null ? "-" : `${fmtPct(x.pct, 0)}%`}</Td><Td right cls="text-slate-500">{x.row}</Td></tr>)}</tbody>
                <tfoot><tr className="bg-slate-900 text-white font-bold"><Td>Total</Td><Td right>{fmtInt(ds.plan)}</Td><Td right>{fmtInt(ds.actual)}</Td><Td right>{fmtPct(ds.pct, 0)}%</Td><Td right></Td></tr></tfoot>
              </table>
            )}

            {kind === "history" && (
              <table className="w-full text-[11px] font-mono text-slate-300">
                <thead><tr className="bg-slate-900 text-slate-400 border-b border-slate-800"><Th>Keterangan</Th><Th right>Target</Th>{ds.years.map((y) => <Th key={y} right>{y}</Th>)}</tr></thead>
                <tbody>{ds.metrics.map((mt) => (
                  <tr key={mt.label} className="border-b border-slate-900">
                    <Td>{mt.label}</Td>
                    <Td right cls="text-amber-300">{mt.target == null ? "-" : `${fmtPct(mt.target, mt.target % 1 ? 2 : 0)}%`}</Td>
                    {ds.years.map((y) => {
                      const v = mt.values[y];
                      const shown = v == null ? "-" : mt.key === "denda" ? `Rp${fmtInt(v)}` : mt.key.startsWith("x:") ? fmtInt(v) : `${fmtPct(v, v > 0 && v < 1 ? 2 : v % 1 ? 1 : 0)}%`;
                      return <Td key={y} right>{shown}</Td>;
                    })}
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ catatan kolom terisi otomatis */
const Auto = ({ show, text }) => (show ? <div className="text-[10px] text-emerald-400 font-mono">✔ Terisi otomatis dari Excel — {text}. Boleh diubah manual; unggah ulang akan menimpa.</div> : null);

/* ------------------------------------------------------------------ form */
export default function HrMrForm({ form, setForm }) {
  const [fileName, setFileName] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);
  const [inputMode, setInputMode] = useState("EXCEL"); // "EXCEL" | "MANUAL"
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]); // [{ level: "ok"|"error", text }]

  const rows = form.salesPerformances || [];
  const hr = form.hrData || {};
  const hasHr = !!(hr.late || hr.absence || hr.training || hr.history);
  const cross = crossCheck(hr);

  // Upload rekap HR (beberapa file sekaligus). Jenis file dikenali dari judul kolom; angka tahunan dihitung ulang dari data bulanan.
  const handleHrFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    const messages = [];
    let nextHr = form.hrData || {};
    let changed = false;
    try {
      const XLSX = await import("xlsx");
      for (const file of files) {
        try {
          const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
          // range: 0 -> nomor baris sama dengan nomor baris di Excel (judul di atas tabel tidak menggeser hitungan)
          const sheets = wb.SheetNames.map((name) => {
            const ws = wb.Sheets[name];
            const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "", range: 0 });
            const fmt = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "", range: 0 });
            return { name, matrix: matrixFrom(raw, fmt) };
          });
          const found = parseHrSheets(sheets, { fileName: file.name, defaultYear: Number(form.year) });
          if (!found.length) {
            messages.push({ level: "error", text: `${file.name}: format belum dikenali. Pastikan ada kolom bulan (Jan, Feb, …) dengan kolom telat atau alpa/cuti/sakit, atau tabel Rencana & Actual pelatihan. Untuk kasus lain, gunakan tab Input Manual.` });
            continue;
          }
          for (const ds of found) {
            const label = TYPE_META[SLOT[ds.type]].title;
            if (ds.type !== "HISTORY" && ds.year && Number(ds.year) !== Number(form.year)) {
              messages.push({ level: "error", text: `${file.name}: ${label} ini data tahun ${ds.year}, sedangkan laporan yang dibuka tahun ${form.year}. Tidak dimasukkan. Buka laporan tahun ${ds.year}, lalu unggah lagi.` });
              continue;
            }
            nextHr = mergeHrData(nextHr, [ds]);
            changed = true;
            const guessed = ds.type !== "HISTORY" && ds.yearSource === "tahun laporan";
            messages.push({ level: "ok", text: `${file.name}: ${label} terbaca${guessed ? ` (file tidak menyebut tahun, dianggap data tahun ${form.year} — pastikan benar)` : ""}.` });
          }
        } catch (err) {
          console.error("Gagal membaca file:", file.name, err);
          messages.push({ level: "error", text: `${file.name}: tidak bisa dibaca (${err?.message || "format tidak valid"}).` });
        }
      }
      if (changed) setForm({ ...form, ...hrFieldsFrom(nextHr), hrData: nextHr });
    } catch (err) {
      console.error(err);
      messages.push({ level: "error", text: "Pembaca Excel gagal dimuat. Muat ulang halaman lalu coba lagi." });
    } finally {
      setLog(messages);
      setBusy(false);
    }
  };

  // Upload tabel Target–Aktual biasa (cara lama)
  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const res = await parseExcelFile(file, { year: form.year, sales: false });
      setForm(applyExcelImport(form, res));
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      console.error("Gagal membaca file Excel:", err);
      alert("File Excel tidak bisa dibaca: " + (err?.message || "format tidak valid"));
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6 text-white font-sans">
      {/* PILIH CARA INPUT */}
      <div className="bg-card border border-rose-500/40 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 mt-0.5 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-300">Pilih Metode Input Laporan HRD & MR</h3>
            <p className="text-xs text-sub leading-relaxed">
              <b>Upload Excel</b>: sistem membaca file rekap dan menghitung sendiri. <b>Input Manual</b>: isi kolom KPI dan narasi satu per satu. Keduanya bisa dipakai bersamaan.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button type="button" onClick={() => setInputMode("EXCEL")}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${inputMode === "EXCEL" ? "bg-rose-500 text-slate-950 border-rose-400 shadow-lg shadow-rose-500/20" : "bg-bg2/60 text-sub border-line hover:text-white"}`}>
            <FileSpreadsheet size={16} /><span>Mode Upload Excel (Otomatis)</span>
          </button>
          <button type="button" onClick={() => setInputMode("MANUAL")}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${inputMode === "MANUAL" ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20" : "bg-bg2/60 text-sub border-line hover:text-white"}`}>
            <Edit3 size={16} /><span>Mode Input Manual Form</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- MODE EXCEL */}
      {inputMode === "EXCEL" && (
        <div className="space-y-4">
          <HowItWorks />

          <section className="bg-slate-900 border border-rose-500/40 p-5 rounded-xl space-y-4 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30"><FileSpreadsheet size={24} /></div>
                <div>
                  <h3 className="text-sm font-bold text-rose-400">Upload Rekap HRD (.xlsx / .xls)</h3>
                  <p className="text-xs text-slate-400">Boleh pilih beberapa file sekaligus. Laporan yang sedang dibuka: <b className="text-slate-200">tahun {form.year}</b>.</p>
                </div>
              </div>
              <label className={`px-4 py-2.5 ${busy ? "bg-slate-700 text-slate-400" : "bg-rose-500 hover:bg-rose-400 text-slate-950"} font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-2 shadow-lg shadow-rose-500/20`}>
                <Upload size={16} /><span>{busy ? "Membaca file…" : "Pilih & Upload File"}</span>
                <input type="file" multiple accept=".xlsx,.xls" onChange={handleHrFiles} disabled={busy} className="hidden" />
              </label>
            </div>

            {log.length > 0 && (
              <ul className="space-y-1.5">
                {log.map((l, i) => (
                  <li key={i} className={`text-[11px] rounded-lg px-3 py-2 border ${l.level === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>
                    {l.level === "ok" ? "✔ " : "✖ "}{l.text}
                  </li>
                ))}
              </ul>
            )}

            {hasHr ? (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider"><Eye size={14} /> Hasil pembacaan</div>
                {cross.length > 0 && (
                  <Warn list={[`Data karyawan / hari kerja berbeda antara file keterlambatan dan ketidakhadiran: ${cross.slice(0, 4).join("; ")}${cross.length > 4 ? `; dan ${cross.length - 4} lainnya` : ""}. Masing-masing file memakai pembagi dari file-nya sendiri. Mohon samakan di Excel bila memang seharusnya sama.`]} />
                )}
                {["late", "absence", "training", "history"].map((k) => hr[k] && <DatasetCard key={k} kind={k} ds={hr[k]} />)}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2 bg-slate-950/40">
                <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Belum ada file yang diunggah.</p>
                <p className="text-[11px] text-slate-600">Klik “Pilih & Upload File”. Hasil perhitungan akan muncul di sini.</p>
              </div>
            )}
          </section>

          {/* cara lama: tabel Target–Aktual biasa */}
          <details className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <summary className="text-xs font-semibold text-slate-300 cursor-pointer select-none">Punya tabel Target–Aktual biasa (bukan rekap bulanan)? Klik di sini</summary>
            <div className="pt-3 space-y-3">
              <p className="text-[11px] text-slate-400">Untuk tabel berisi kolom Nama/Item, Target, Aktual, dan Keterangan. Kolom dikenali dari judulnya.</p>
              <label className="inline-flex px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 font-bold text-xs rounded-lg cursor-pointer transition items-center gap-2">
                <Upload size={14} /><span>Upload tabel Target–Aktual</span>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />
              </label>
              {fileName && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-rose-950/40 border border-rose-500/30 px-3 py-2 rounded-lg text-xs font-mono">
                    <span className="flex items-center gap-2 text-rose-300"><CheckCircle2 size={14} className="text-rose-400" />File aktif: <b>{fileName}</b></span>
                    {successMsg && <span className="text-rose-400 font-bold">✔ Berhasil ({rows.length} baris)</span>}
                  </div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-xs text-left font-mono">
                      <thead><tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px]"><th className="p-2">No</th><th className="p-2">Parameter</th><th className="p-2">Target</th><th className="p-2">Aktual</th><th className="p-2">Keterangan</th></tr></thead>
                      <tbody>{rows.map((r, i) => (
                        <tr key={i} className="border-b border-slate-900/80 text-slate-300">
                          <td className="p-2 text-slate-500">{i + 1}</td><td className="p-2 font-bold text-white">{r.salesName || "-"}</td>
                          <td className="p-2 text-amber-300">{r.targetVal || "-"}</td><td className="p-2 text-cyan-300">{r.actualVal || "-"}</td><td className="p-2 text-slate-400">{r.note || "-"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      {/* ---------------------------------------------------- MODE MANUAL */}
      {inputMode === "MANUAL" && (
        <div className="space-y-6 animate-fadeIn">
          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Manpower & Rekrutmen Karyawan</h2>
              <p className="text-xs text-sub mt-0.5">Input persentase pemenuhan posisi, jumlah headcount, dan tingkat turnover rate.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Pemenuhan Manpower (Target 100%)</label>
                <input type="text" value={form.manpowerAch || ""} onChange={(e) => setForm({ ...form, manpowerAch: e.target.value })} placeholder="Contoh: Realisasi pemenuhan 98%..." className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" />
              </div>
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Turnover Rate Karyawan (Target Stabil Max 2%)</label>
                <input type="text" value={form.turnoverRate || ""} onChange={(e) => setForm({ ...form, turnoverRate: e.target.value })} placeholder="Contoh: Realisasi turnover 1.5%..." className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" />
              </div>
            </div>
          </section>

          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Absensi & Kedisiplinan Kerja</h2>
              <p className="text-xs text-sub mt-0.5">Input tingkat kehadiran, persentase keterlambatan, dan evaluasi kedisiplinan. Kalau sudah upload Excel, kolom ini terisi sendiri.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Tingkat Ketidakhadiran / Absenteeism (Max 1%)</label>
                <input type="text" value={form.absenteeismRate || ""} onChange={(e) => setForm({ ...form, absenteeismRate: e.target.value })} placeholder="Contoh: Realisasi 0.8%..." className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" />
                <Auto show={!!hr.absence} text="file ketidakhadiran" />
              </div>
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Tingkat Keterlambatan / Late Coming (Max 2%)</label>
                <input type="text" value={form.lateRate || ""} onChange={(e) => setForm({ ...form, lateRate: e.target.value })} placeholder="Contoh: Realisasi 1.2%..." className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" />
                <Auto show={!!hr.late} text="file keterlambatan" />
              </div>
            </div>
          </section>

          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Training & Employee Development</h2>
              <p className="text-xs text-sub mt-0.5">Input realisasi program pelatihan internal dan eksternal karyawan.</p>
            </div>
            <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5 text-xs">
              <label className="text-[11px] text-sub block font-medium">Realisasi Jadwal Pelatihan Tahunan</label>
              <input type="text" value={form.trainingAch || ""} onChange={(e) => setForm({ ...form, trainingAch: e.target.value })} placeholder="Contoh: Tercapai 95% dari 24 modul annual training schedule..." className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" />
              <Auto show={!!hr.training} text="file pelatihan" />
            </div>
          </section>

          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Sertifikasi ISO & Audit Internal (MR)</h2>
              <p className="text-xs text-sub mt-0.5">Input status perpanjangan ISO, jadwal audit, dan pemeliharaan dokumen SOP.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Status & Perpanjangan Sertifikasi ISO</label>
                <input type="text" value={form.isoStatus || ""} onChange={(e) => setForm({ ...form, isoStatus: e.target.value })} placeholder="Contoh: ISO 9001:2015 Surveillance Audit / Renewal..." className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" />
              </div>
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Jadwal Audit Internal & Review SOP</label>
                <input type="text" value={form.internalAudit || ""} onChange={(e) => setForm({ ...form, internalAudit: e.target.value })} placeholder="Contoh: Audit semester 1 & 2 selesai (Closed findings)..." className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" />
              </div>
            </div>
            <textarea rows={3} value={form.hrEvaluation || ""} onChange={(e) => setForm({ ...form, hrEvaluation: e.target.value })}
              placeholder="Tuliskan catatan evaluasi HR, kendala rekrutmen, temuan audit ISO, atau perbaikan dokumen SOP departemen..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 mt-2" />
          </section>

          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Catatan & Evaluasi Bebas Departemen</h2>
              <p className="text-xs text-sub mt-0.5">Input catatan tambahan, kendala khusus, atau hal penting lainnya secara bebas.</p>
            </div>
            <textarea rows={3} value={form.generalNotes || ""} onChange={(e) => setForm({ ...form, generalNotes: e.target.value })}
              placeholder="Tuliskan catatan bebas atau informasi tambahan dari HRD & MR di sini..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500" />
          </section>
        </div>
      )}
    </div>
  );
}