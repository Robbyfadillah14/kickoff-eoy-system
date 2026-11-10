"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload, CheckCircle2, Edit3, Eye } from "lucide-react";

export default function HrMrForm({ form, setForm }) {
  const [fileName, setFileName] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  // State untuk switch mode: "EXCEL" atau "MANUAL"
  const [inputMode, setInputMode] = useState("EXCEL");

  const rows = form.salesPerformances || [];

  // Handler Upload & Parse File Excel Fleksibel untuk HR & MR
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const mappedPerformances = jsonData.map((row, idx) => {
          const keys = Object.keys(row);
          const col0 = row[keys[0]] || "";
          const col1 = row[keys[1]] || "";
          const col2 = row[keys[2]] || "";
          const col3 = row[keys[3]] || "";

          return {
            id: Date.now() + idx,
            salesName: String(col0).trim() || `Parameter / Karyawan #${idx + 1}`,
            targetVal: String(col1).trim() || "0",
            actualVal: String(col2).trim() || "0",
            note: String(col3 || "").trim(),
          };
        });

        setForm({
          ...form,
          salesPerformances: mappedPerformances
        });

        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      } catch (err) {
        console.error("Gagal membaca file Excel:", err);
        alert("Format file Excel tidak valid atau gagal dibaca!");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6 text-white font-sans">
      
      {/* BANNER Panduan & MODE SWITCHER (PILIHAN CARA INPUT) */}
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
              Staf dapat memilih apakah ingin langsung <b>Upload File Excel / Dokumen</b> (otomatis diparse oleh sistem) atau <b>Input Manual</b> melalui form parameter di bawah.
            </p>
          </div>
        </div>

        {/* Tombol Switch Mode */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setInputMode("EXCEL")}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
              inputMode === "EXCEL"
                ? "bg-rose-500 text-slate-950 border-rose-400 shadow-lg shadow-rose-500/20"
                : "bg-bg2/60 text-sub border-line hover:text-white"
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>Mode Upload Excel (Otomatis)</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode("MANUAL")}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
              inputMode === "MANUAL"
                ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20"
                : "bg-bg2/60 text-sub border-line hover:text-white"
            }`}
          >
            <Edit3 size={16} />
            <span>Mode Input Manual Form</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* JIKA PILIH MODE EXCEL: TAMPILKAN BANNER PANDUAN & UPLOADER */}
      {/* ---------------------------------------------------- */}
      {inputMode === "EXCEL" && (
        <div className="space-y-4">
          
          {/* BANNER PEMBERITAHUAN & PANDUAN FLEKSIBEL EXCEL */}
          <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-base shrink-0 mt-0.5">
                💡
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-rose-300 tracking-tight">
                  Panduan Pengunggahan Data HRD & MR
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Silakan unggah file Excel rekapitulasi HR, manpower, dan audit ISO. Sistem otonom akan membaca dan merangkum poin-poin performanya agar langsung terintegrasi dengan dashboard presentasi tahun terkait.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  alert("Panduan Format Excel:\n- Pastikan file Excel berisi data rekap absensi, manpower, atau audit ISO.\n- Sistem akan otomatis membaca kolom target dan aktual untuk ditampilkan ke Live Presentation.");
                }}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-400 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📖</span> Lihat Ringkasan Format Excel
              </button>
            </div>
          </div>

          {/* SECTION UPLOAD EXCEL UTAMA */}
          <section className="bg-slate-900 border border-rose-500/40 p-5 rounded-xl space-y-4 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-400">Upload File Excel / Laporan Kerja (.xlsx / .csv)</h3>
                  <p className="text-xs text-slate-400">Sistem otonom akan membaca dan menampilkan preview langsung di bawah.</p>
                </div>
              </div>

              <label className="px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-2 shadow-lg shadow-rose-500/20">
                <Upload size={16} />
                <span>Pilih & Upload File</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleExcelUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            {fileName ? (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between bg-rose-950/40 border border-rose-500/30 px-3.5 py-2.5 rounded-lg text-xs font-mono">
                  <div className="flex items-center gap-2 text-rose-300">
                    <CheckCircle2 size={16} className="text-rose-400" />
                    <span>File aktif: <b>{fileName}</b></span>
                  </div>
                  {successMsg && (
                    <span className="text-rose-400 font-bold animate-pulse">
                      ✔ Berhasil diparse! ({rows.length} Baris data)
                    </span>
                  )}
                </div>

                {/* PREVIEW HASIL PARSE EXCEL */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Eye size={14} /> Preview Hasil Pembacaan Data Excel:
                    </span>
                    <span className="text-[10px] text-slate-400 italic">Data siap masuk ke Live Deck Presentation</span>
                  </div>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-xs text-left font-mono">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px]">
                          <th className="p-2.5">No</th>
                          <th className="p-2.5">Parameter / Item</th>
                          <th className="p-2.5">Target</th>
                          <th className="p-2.5">Realisasi / Aktual</th>
                          <th className="p-2.5">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} className="border-b border-slate-900/80 hover:bg-slate-900/50 text-slate-300">
                            <td className="p-2.5 text-slate-500">{i + 1}</td>
                            <td className="p-2.5 font-bold text-white">{r.salesName || "-"}</td>
                            <td className="p-2.5 text-amber-300">{r.targetVal || "-"}</td>
                            <td className="p-2.5 text-cyan-300">{r.actualVal || "-"}</td>
                            <td className="p-2.5 text-slate-400">{r.note || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2 bg-slate-950/40">
                <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Belum ada file Excel yang di-upload.</p>
                <p className="text-[11px] text-slate-600">Klik tombol "Pilih & Upload File" di atas untuk memasukkan data laporan Anda.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* JIKA PILIH MODE MANUAL: TAMPILKAN FORM PARAMETER HRD & MR */}
      {/* ---------------------------------------------------- */}
      {inputMode === "MANUAL" && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. PARAMETER MANPOWER & REKRUTMEN */}
          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Manpower & Rekrutmen Karyawan</h2>
              <p className="text-xs text-sub mt-0.5">Input persentase pemenuhan posisi, jumlah headcount, dan tingkat turnover rate.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Pemenuhan Manpower (Target 100%)</label>
                <input 
                  type="text" 
                  value={form.manpowerAch || ""} 
                  onChange={(e) => setForm({ ...form, manpowerAch: e.target.value })} 
                  placeholder="Contoh: Realisasi pemenuhan 98%..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" 
                />
              </div>

              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Turnover Rate Karyawan (Target Stabil Max 2%)</label>
                <input 
                  type="text" 
                  value={form.turnoverRate || ""} 
                  onChange={(e) => setForm({ ...form, turnoverRate: e.target.value })} 
                  placeholder="Contoh: Realisasi turnover 1.5%..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" 
                />
              </div>
            </div>
          </section>

          {/* 2. KEDISIPLINAN & ABSENSI */}
          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Absensi & Kedisiplinan Kerja</h2>
              <p className="text-xs text-sub mt-0.5">Input tingkat kehadiran, persentase keterlambatan, dan evaluasi kedisiplinan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Tingkat Ketidakhadiran / Absenteeism (Max 1%)</label>
                <input 
                  type="text" 
                  value={form.absenteeismRate || ""} 
                  onChange={(e) => setForm({ ...form, absenteeismRate: e.target.value })} 
                  placeholder="Contoh: Realisasi 0.8%..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" 
                />
              </div>

              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Tingkat Keterlambatan / Late Coming (Max 2%)</label>
                <input 
                  type="text" 
                  value={form.lateRate || ""} 
                  onChange={(e) => setForm({ ...form, lateRate: e.target.value })} 
                  placeholder="Contoh: Realisasi 1.2%..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" 
                />
              </div>
            </div>
          </section>

          {/* 3. TRAINING & DEVELOPMENT */}
          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Training & Employee Development</h2>
              <p className="text-xs text-sub mt-0.5">Input realisasi program pelatihan internal dan eksternal karyawan.</p>
            </div>

            <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5 text-xs">
              <label className="text-[11px] text-sub block font-medium">Realisasi Jadwal Pelatihan Tahunan</label>
              <input 
                type="text" 
                value={form.trainingAch || ""} 
                onChange={(e) => setForm({ ...form, trainingAch: e.target.value })} 
                placeholder="Contoh: Tercapai 95% dari 24 modul annual training schedule..." 
                className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" 
              />
            </div>
          </section>

          {/* 4. SERTIFIKASI ISO & AUDIT INTERNAL (MR) */}
          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Sertifikasi ISO & Audit Internal (MR)</h2>
              <p className="text-xs text-sub mt-0.5">Input status perpanjangan ISO, jadwal audit, dan pemeliharaan dokumen SOP.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Status & Perpanjangan Sertifikasi ISO</label>
                <input 
                  type="text" 
                  value={form.isoStatus || ""} 
                  onChange={(e) => setForm({ ...form, isoStatus: e.target.value })} 
                  placeholder="Contoh: ISO 9001:2015 Surveillance Audit / Renewal..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" 
                />
              </div>

              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Jadwal Audit Internal & Review SOP</label>
                <input 
                  type="text" 
                  value={form.internalAudit || ""} 
                  onChange={(e) => setForm({ ...form, internalAudit: e.target.value })} 
                  placeholder="Contoh: Audit semester 1 & 2 selesai (Closed findings)..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" 
                />
              </div>
            </div>

            <textarea
              rows={3}
              value={form.hrEvaluation || ""}
              onChange={(e) => setForm({ ...form, hrEvaluation: e.target.value })}
              placeholder="Tuliskan catatan evaluasi HR, kendala rekrutmen, temuan audit ISO, atau perbaikan dokumen SOP departemen..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 mt-2"
            />
          </section>

          {/* 5. CATATAN & EVALUASI BEBAS DEPARTEMEN */}
          <section className="bg-card border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Catatan & Evaluasi Bebas Departemen</h2>
              <p className="text-xs text-sub mt-0.5">Input catatan tambahan, kendala khusus, atau hal penting lainnya secara bebas.</p>
            </div>
            <textarea
              rows={3}
              value={form.generalNotes || ""}
              onChange={(e) => setForm({ ...form, generalNotes: e.target.value })}
              placeholder="Tuliskan catatan bebas atau informasi tambahan dari HRD & MR di sini..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </section>
        </div>
      )}

    </div>
  );
}