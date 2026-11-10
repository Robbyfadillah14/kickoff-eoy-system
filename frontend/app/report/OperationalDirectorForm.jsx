"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload, CheckCircle2, Edit3, Eye } from "lucide-react";

export default function OperationalDirectorForm({ form, setForm }) {
  const [fileName, setFileName] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  // State untuk switch mode: "EXCEL" atau "MANUAL"
  const [inputMode, setInputMode] = useState("EXCEL");

  const rows = form.salesPerformances || [];

  // Handler Upload & Parse File Excel Fleksibel untuk Operational Director
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
            salesName: String(col0).trim() || `Inisiatif / Item #${idx + 1}`,
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
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 mt-0.5 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-300">Pilih Metode Input Laporan Direktur Operasional</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Staf eksekutif dapat memilih apakah ingin langsung <b>Upload File Excel / Dokumen</b> (otomatis diparse oleh sistem) atau <b>Input Manual</b> melalui form parameter di bawah.
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
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
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
                ? "bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/20"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
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
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-base shrink-0 mt-0.5">
                💡
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-amber-300 tracking-tight">
                  Panduan Pengunggahan Data Direktur Operasional
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Silakan unggah file Excel rekapitulasi strategis dan efisiensi operasional. Sistem otonom akan membaca dan merangkum poin-poinnya agar langsung terintegrasi dengan dashboard presentasi tahun terkait.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  alert("Panduan Format Excel:\n- Pastikan file Excel berisi data ringkasan inisiatif operasional.\n- Sistem akan otomatis membaca kolom target dan aktual untuk ditampilkan ke Live Presentation.");
                }}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📖</span> Lihat Ringkasan Format Excel
              </button>
            </div>
          </div>

          {/* SECTION UPLOAD EXCEL UTAMA */}
          <section className="bg-slate-900 border border-amber-500/40 p-5 rounded-xl space-y-4 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-400">Upload File Excel / Laporan Kerja (.xlsx / .csv)</h3>
                  <p className="text-xs text-slate-400">Sistem otonom akan membaca dan menampilkan preview langsung di bawah.</p>
                </div>
              </div>

              <label className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-2 shadow-lg shadow-amber-500/20">
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
                <div className="flex items-center justify-between bg-amber-950/40 border border-amber-500/30 px-3.5 py-2.5 rounded-lg text-xs font-mono">
                  <div className="flex items-center gap-2 text-amber-300">
                    <CheckCircle2 size={16} className="text-amber-400" />
                    <span>File aktif: <b>{fileName}</b></span>
                  </div>
                  {successMsg && (
                    <span className="text-amber-400 font-bold animate-pulse">
                      ✔ Berhasil diparse! ({rows.length} Baris data)
                    </span>
                  )}
                </div>

                {/* PREVIEW HASIL PARSE EXCEL */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Eye size={14} /> Preview Hasil Pembacaan Data Excel:
                    </span>
                    <span className="text-[10px] text-slate-400 italic">Data siap masuk ke Live Deck Presentation</span>
                  </div>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-xs text-left font-mono">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px]">
                          <th className="p-2.5">No</th>
                          <th className="p-2.5">Inisiatif / Item</th>
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
      {/* JIKA PILIH MODE MANUAL: TAMPILKAN FORM EKSEKUTIF LENGKAP */}
      {/* ---------------------------------------------------- */}
      {inputMode === "MANUAL" && (
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-6 animate-fadeIn">
          <div className="border-b border-slate-700 pb-4">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Executive Portal</span>
            <h3 className="text-xl font-black text-white mt-1">Form Laporan & Arahan Direktur Operasional</h3>
            <p className="text-xs text-slate-400 mt-1">Laporan komprehensif pencapaian operasional tahun berjalan dan proyeksi strategis.</p>
          </div>

          {/* 1. Executive Summary */}
          <div>
            <label className="block text-sm mb-1.5 text-amber-300 font-semibold">1. Executive Summary & Visi Pencapaian</label>
            <textarea
              name="executiveSummary"
              value={form.executiveSummary || ""}
              onChange={(e) => setForm({ ...form, executiveSummary: e.target.value })}
              rows="3"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              placeholder="Ringkasan performa operasional secara keseluruhan tahun ini..."
            />
          </div>

          {/* 2. Target vs Aktual Efisiensi & Cost */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1.5 text-slate-300 font-semibold">Target Efisiensi (%)</label>
              <input
                type="number"
                name="targetEfficiency"
                value={form.targetEfficiency || ""}
                onChange={(e) => setForm({ ...form, targetEfficiency: e.target.value })}
                placeholder="Contoh: 95"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-slate-300 font-semibold">Aktual Efisiensi (%)</label>
              <input
                type="number"
                name="actualEfficiency"
                value={form.actualEfficiency || ""}
                onChange={(e) => setForm({ ...form, actualEfficiency: e.target.value })}
                placeholder="Contoh: 92"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-slate-300 font-semibold">Cost Optimization (Rp / %)</label>
              <input
                type="text"
                name="costOptimization"
                value={form.costOptimization || ""}
                onChange={(e) => setForm({ ...form, costOptimization: e.target.value })}
                placeholder="Contoh: Efisiensi biaya 15%"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* 3. Strategic Initiatives */}
          <div>
            <label className="block text-sm mb-1.5 text-amber-300 font-semibold">2. Inisiatif Strategis & Transformasi Proses</label>
            <textarea
              name="strategicInitiatives"
              value={form.strategicInitiatives || ""}
              onChange={(e) => setForm({ ...form, strategicInitiatives: e.target.value })}
              rows="3"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              placeholder="Pembaruan sistem, otomatisasi, atau restrukturisasi plant..."
            />
          </div>

          {/* 4. Supply Chain & Logistik Metrics */}
          <div>
            <label className="block text-sm mb-1.5 text-slate-300 font-semibold">3. Kinerja Supply Chain & Manajemen Stok</label>
            <textarea
              name="supplyChainMetrics"
              value={form.supplyChainMetrics || ""}
              onChange={(e) => setForm({ ...form, supplyChainMetrics: e.target.value })}
              rows="2"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              placeholder="Catatan distribusi lintas cabang / gudang..."
            />
          </div>

          {/* 5. Risk Management & Mitigasi */}
          <div>
            <label className="block text-sm mb-1.5 text-slate-300 font-semibold">4. Manajemen Risiko & Evaluasi Kendala Lapangan</label>
            <textarea
              name="riskManagement"
              value={form.riskManagement || ""}
              onChange={(e) => setForm({ ...form, riskManagement: e.target.value })}
              rows="2"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              placeholder="Kendala yang dihadapi tahun ini dan langkah mitigasinya..."
            />
          </div>

          {/* 6. Key Milestones */}
          <div>
            <label className="block text-sm mb-1.5 text-emerald-400 font-semibold">5. Key Milestones & Pencapaian Utama</label>
            <textarea
              name="keyMilestones"
              value={form.keyMilestones || ""}
              onChange={(e) => setForm({ ...form, keyMilestones: e.target.value })}
              rows="2"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              placeholder="Pencapaian besar yang berhasil diraih..."
            />
          </div>

          {/* 7. Outlook & Next Year Strategy */}
          <div>
            <label className="block text-sm mb-1.5 text-amber-300 font-semibold">6. Proyeksi & Arahan Strategis Tahun Depan</label>
            <textarea
              name="nextYearOutlook"
              value={form.nextYearOutlook || ""}
              onChange={(e) => setForm({ ...form, nextYearOutlook: e.target.value })}
              rows="3"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              placeholder="Fokus operasional dan target utama untuk tahun berikutnya..."
            />
          </div>

          {/* 8. CATATAN & EVALUASI BEBAS DEPARTEMEN */}
          <div>
            <label className="block text-sm mb-1.5 text-amber-400 font-semibold">7. Catatan & Evaluasi Bebas Direktur Operasional</label>
            <textarea
              name="generalNotes"
              value={form.generalNotes || ""}
              onChange={(e) => setForm({ ...form, generalNotes: e.target.value })}
              rows="3"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              placeholder="Tuliskan catatan tambahan, arahan khusus, atau kebijakan penting lainnya secara bebas..."
            />
          </div>
        </div>
      )}

    </div>
  );
}