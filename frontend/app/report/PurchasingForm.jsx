"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload, CheckCircle2, Edit3, Eye } from "lucide-react";

export default function PurchasingForm({ form, setForm }) {
  const [fileName, setFileName] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  // State untuk switch mode: "EXCEL" atau "MANUAL"
  const [inputMode, setInputMode] = useState("EXCEL");

  const rows = form.salesPerformances || [];

  // Handler Upload & Parse File Excel Fleksibel untuk Purchasing
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
            salesName: String(col0).trim() || `Item / Material #${idx + 1}`,
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
      <div className="bg-card border border-blue-500/40 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 mt-0.5 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-blue-300">Pilih Metode Input Laporan Purchasing</h3>
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
                ? "bg-blue-500 text-slate-950 border-blue-400 shadow-lg shadow-blue-500/20"
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
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20"
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
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-base shrink-0 mt-0.5">
                💡
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-blue-300 tracking-tight">
                  Panduan Pengunggahan Data Purchasing
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Silakan unggah file Excel rekapitulasi kinerja purchasing. Sistem otonom akan membaca dan merangkum poin-poin parameter agar langsung terintegrasi dengan dashboard presentasi tahun terkait.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  alert("Panduan Format Excel:\n- Pastikan file Excel berisi data rekap material/supplier.\n- Sistem akan otomatis membaca kolom target dan aktual untuk ditampilkan ke Live Presentation.");
                }}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📖</span> Lihat Ringkasan Format Excel
              </button>
            </div>
          </div>

          {/* SECTION UPLOAD EXCEL UTAMA */}
          <section className="bg-slate-900 border border-blue-500/40 p-5 rounded-xl space-y-4 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-400">Upload File Excel / Laporan Kerja (.xlsx / .csv)</h3>
                  <p className="text-xs text-slate-400">Sistem otonom akan membaca dan menampilkan preview langsung di bawah.</p>
                </div>
              </div>

              <label className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-2 shadow-lg shadow-blue-500/20">
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
                <div className="flex items-center justify-between bg-blue-950/40 border border-blue-500/30 px-3.5 py-2.5 rounded-lg text-xs font-mono">
                  <div className="flex items-center gap-2 text-blue-300">
                    <CheckCircle2 size={16} className="text-blue-400" />
                    <span>File aktif: <b>{fileName}</b></span>
                  </div>
                  {successMsg && (
                    <span className="text-blue-400 font-bold animate-pulse">
                      ✔ Berhasil diparse! ({rows.length} Baris data)
                    </span>
                  )}
                </div>

                {/* PREVIEW HASIL PARSE EXCEL */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Eye size={14} /> Preview Hasil Pembacaan Data Excel:
                    </span>
                    <span className="text-[10px] text-slate-400 italic">Data siap masuk ke Live Deck Presentation</span>
                  </div>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-xs text-left font-mono">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px]">
                          <th className="p-2.5">No</th>
                          <th className="p-2.5">Nama Item / Material</th>
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
      {/* JIKA PILIH MODE MANUAL: TAMPILKAN FORM PARAMETER PURCHASING */}
      {/* ---------------------------------------------------- */}
      {inputMode === "MANUAL" && (
        <div className="space-y-6 animate-fadeIn">
          {/* SECTION TARGET & PENCAPAIAN PURCHASING */}
          <section className="bg-card border border-blue-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-blue-400">Parameter & Kepatuhan Purchasing</h2>
              <p className="text-xs text-sub mt-0.5">Input target supplier on-time delivery, STO 3 bulan, dan update landing cost (LC).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Supplier On-Time Delivery (Target 98%)</label>
                <input 
                  type="text" 
                  value={form.supplierOtd || ""} 
                  onChange={(e) => setForm({ ...form, supplierOtd: e.target.value })} 
                  placeholder="Contoh: Realisasi 99.72%..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white font-mono" 
                />
              </div>

              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Update Landing Cost (LC) Max 1 Hari</label>
                <input 
                  type="text" 
                  value={form.updateLc || ""} 
                  onChange={(e) => setForm({ ...form, updateLc: e.target.value })} 
                  placeholder="Contoh: Tercapai (Target LC = 5.5%)" 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" 
                />
              </div>

              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">STO 3 Months Schedule</label>
                <input 
                  type="text" 
                  value={form.stoSchedule || ""} 
                  onChange={(e) => setForm({ ...form, stoSchedule: e.target.value })} 
                  placeholder="Contoh: Maret, Juni, Oktober, Desember" 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" 
                />
              </div>

              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Pengembangan Supplier Baru (Target Min. 2)</label>
                <input 
                  type="text" 
                  value={form.newSupplierDev || ""} 
                  onChange={(e) => setForm({ ...form, newSupplierDev: e.target.value })} 
                  placeholder="Contoh: Top Supplier 30 Days min 2 Suppliers..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" 
                />
              </div>
            </div>

            <textarea
              rows={3}
              value={form.purchasingEvaluation || ""}
              onChange={(e) => setForm({ ...form, purchasingEvaluation: e.target.value })}
              placeholder="Tuliskan catatan evaluasi purchasing (mis. cek stock minimum deviation di SAP, follow up email supplier)..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 mt-2"
            />
          </section>

          {/* CATATAN & EVALUASI BEBAS DEPARTEMEN */}
          <section className="bg-card border border-blue-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-blue-400">Catatan & Evaluasi Bebas Departemen</h2>
              <p className="text-xs text-sub mt-0.5">Input catatan tambahan, kendala khusus, atau hal penting lainnya secara bebas.</p>
            </div>
            <textarea
              rows={3}
              value={form.generalNotes || ""}
              onChange={(e) => setForm({ ...form, generalNotes: e.target.value })}
              placeholder="Tuliskan catatan bebas atau informasi tambahan dari Purchasing di sini..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </section>
        </div>
      )}

    </div>
  );
}