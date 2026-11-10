"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload, CheckCircle2, Edit3, Eye } from "lucide-react";

export default function SalesForm({ form, setForm }) {
  const [fileName, setFileName] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  // State untuk switch mode: "EXCEL" atau "MANUAL"
  const [inputMode, setInputMode] = useState("EXCEL");

  const rows = form.salesPerformances || [];

  // Handler Upload & Parse File Excel Fleksibel
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

          const parsedTarget = Number(String(col1).replace(/[^0-9.-]+/g, ""));
          const parsedActual = Number(String(col2).replace(/[^0-9.-]+/g, ""));

          return {
            id: Date.now() + idx,
            salesName: String(col0).trim() || `Item / Baris #${idx + 1}`,
            targetVal: !isNaN(parsedTarget) && parsedTarget !== 0 ? String(parsedTarget) : "0",
            targetProfit: !isNaN(parsedTarget) && parsedTarget !== 0 ? String(parsedTarget) : "0",
            actualVal: !isNaN(parsedActual) && parsedActual !== 0 ? String(parsedActual) : "0",
            note: String(col3 || col2 || "").trim(),
            topProducts: [
              { id: Date.now() + idx + 1, productName: String(col0).trim(), totalQty: "", category: String(col3).trim() }
            ]
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
      <div className="bg-card border border-emerald-500/40 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 mt-0.5 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-emerald-300">Pilih Metode Input Laporan Sales (Surabaya, EAM, & Cikarang)</h3>
            <p className="text-xs text-sub leading-relaxed">
              Staf dapat memilih apakah ingin langsung <b>Upload File Excel / Dokumen Rekap Sales</b> (otomatis diparse oleh sistem) atau <b>Input Manual Form</b> per Sales & Brand.
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
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
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
                ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20"
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
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-base shrink-0 mt-0.5">
                💡
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-amber-300 tracking-tight">
                  Panduan Pengunggahan Data Laporan Sales
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Silakan unggah file Excel laporan kerja sales per unit (EIISBY, EAM, Cikarang). Sistem akan otomatis membaca target, omset/profit aktual, serta item brand untuk disajikan di live presentation Kick Off Meeting 2026.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  alert("Panduan Format Excel:\nPastikan file Excel berisi data rekapitulasi Sales / Brand (Kolom 1: Nama Sales/Brand, Kolom 2: Target 2025/2026, Kolom 3: Realisasi Penjualan/Profit, Kolom 4: Keterangan/Ach %).\nSistem akan otomatis membaca data untuk Live Deck.");
                }}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📖</span> Lihat Ringkasan Format Excel
              </button>
            </div>
          </div>

          {/* SECTION UPLOAD EXCEL UTAMA */}
          <section className="bg-slate-900 border border-emerald-500/40 p-5 rounded-xl space-y-4 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-400">Upload File Excel / Rekap Sales (.xlsx / .csv)</h3>
                  <p className="text-xs text-slate-400">Sistem otonom akan membaca dan menampilkan preview langsung di bawah.</p>
                </div>
              </div>

              <label className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-2 shadow-lg shadow-emerald-500/20">
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
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-2.5 rounded-lg text-xs font-mono">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>File aktif: <b>{fileName}</b></span>
                  </div>
                  {successMsg && (
                    <span className="text-emerald-400 font-bold animate-pulse">
                      ✔ Berhasil diparse! ({rows.length} Baris data)
                    </span>
                  )}
                </div>

                {/* PREVIEW HASIL PARSE EXCEL */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Eye size={14} /> Preview Hasil Pembacaan Data Excel:
                    </span>
                    <span className="text-[10px] text-slate-400 italic">Data siap masuk ke Live Deck Presentation</span>
                  </div>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-xs text-left font-mono">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px]">
                          <th className="p-2.5">No</th>
                          <th className="p-2.5">Nama Item / Sales</th>
                          <th className="p-2.5">Target / Kolom 1</th>
                          <th className="p-2.5">Aktual / Kolom 2</th>
                          <th className="p-2.5">Catatan / Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} className="border-b border-slate-900/80 hover:bg-slate-900/50 text-slate-300">
                            <td className="p-2.5 text-slate-500">{i + 1}</td>
                            <td className="p-2.5 font-bold text-white">{r.salesName || "-"}</td>
                            <td className="p-2.5 text-amber-300">{Number(r.targetVal) ? `Rp ${Number(r.targetVal).toLocaleString("id-ID")}` : (r.targetVal || "-")}</td>
                            <td className="p-2.5 text-cyan-300">{Number(r.actualVal) ? `Rp ${Number(r.actualVal).toLocaleString("id-ID")}` : (r.actualVal || "-")}</td>
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
      {/* JIKA PILIH MODE MANUAL: TAMPILKAN FORM LENGKAP + TOP PRODUK */}
      {/* ---------------------------------------------------- */}
      {inputMode === "MANUAL" && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. PILIHAN FOKUS STRATEGI TARGET */}
          <section className="bg-card border border-accent/40 rounded-xl p-4 space-y-2.5">
            <h2 className="font-semibold text-sm text-accent">Fokus Strategi Target Komersial:</h2>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-bg2/60 border border-line p-3 rounded-lg flex-1">
                <input 
                  type="radio" 
                  name="salesType" 
                  value="OMZET" 
                  checked={form.salesType === "OMZET"} 
                  onChange={(e) => setForm({ ...form, salesType: e.target.value })} 
                />
                <span><b>Omzet Oriented</b></span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-bg2/60 border border-line p-3 rounded-lg flex-1">
                <input 
                  type="radio" 
                  name="salesType" 
                  value="PROFIT" 
                  checked={form.salesType === "PROFIT"} 
                  onChange={(e) => setForm({ ...form, salesType: e.target.value })} 
                />
                <span><b>Profit Oriented</b></span>
              </label>
            </div>
          </section>

          {/* 2. RINCIAN PERFORMA & TARGET PER SALES */}
          <section className="bg-card border border-accent/40 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-sm text-accent">Rincian Performa & Target Per Sales / Brand</h2>
                <p className="text-xs text-sub mt-0.5">Input target, performa aktual (omset/profit), dan daftar top produk per sales.</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setForm({
                    ...form,
                    salesPerformances: [
                      ...(rows || []),
                      { 
                        id: Date.now(), 
                        salesName: "", 
                        targetVal: "", 
                        actualVal: "", 
                        targetProfit: "", 
                        note: "",
                        topProducts: [
                          { id: Date.now() + 1, productName: "", totalQty: "", category: "" }
                        ]
                      }
                    ]
                  });
                }}
                className="px-3 py-1.5 bg-accent/20 text-accent text-xs font-semibold rounded-lg hover:bg-accent/30 transition cursor-pointer"
              >
                + Tambah Personel Sales / Brand
              </button>
            </div>

            <div className="space-y-6">
              {rows.map((sp, idx) => (
                <div key={sp.id || idx} className="bg-bg2/60 border border-line/80 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-line/60 pb-2">
                    <span className="text-xs font-bold text-accent font-mono">Sales Person / Item #{idx + 1}</span>
                    {rows.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setForm({
                            ...form,
                            salesPerformances: rows.filter((_, i) => i !== idx)
                          });
                        }} 
                        className="text-red-400 text-xs hover:underline cursor-pointer"
                      >
                        Hapus Baris
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={sp.salesName || ""}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[idx].salesName = e.target.value;
                        setForm({ ...form, salesPerformances: updated });
                      }}
                      placeholder="Contoh: Martha Leeni / Dian Anggia / Elmer / Pulpies..."
                      className="w-full bg-bg border border-line rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-sub block mb-1">
                          {form.salesType === "OMZET" ? "Target Omzet (Rp)" : "Target Profit (Rp)"}
                        </label>
                        <input 
                          type="text" 
                          value={sp.targetProfit || sp.targetVal || ""} 
                          onChange={(e) => {
                            const updated = [...rows];
                            const val = e.target.value;
                            updated[idx].targetProfit = val;
                            updated[idx].targetVal = val;
                            setForm({ ...form, salesPerformances: updated });
                          }} 
                          placeholder="Contoh: 4800000000 (Martha) / 5300000000 (Jimmy)" 
                          className="w-full bg-bg border border-line rounded px-2.5 py-1 text-white font-mono focus:outline-none focus:border-accent" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-sub block mb-1">
                          {form.salesType === "OMZET" ? "Omzet Aktual (Rp)" : "Profit Aktual (Rp)"}
                        </label>
                        <input 
                          type="text" 
                          value={sp.actualVal || ""} 
                          onChange={(e) => {
                            const updated = [...rows];
                            updated[idx].actualVal = e.target.value;
                            setForm({ ...form, salesPerformances: updated });
                          }} 
                          placeholder="Contoh: 17999983231 (Realisasi Sales)" 
                          className="w-full bg-bg border border-line rounded px-2.5 py-1 text-white font-mono focus:outline-none focus:border-accent" 
                        />
                      </div>
                    </div>

                    <input 
                      type="text" 
                      value={sp.note || ""} 
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[idx].note = e.target.value;
                        setForm({ ...form, salesPerformances: updated });
                      }} 
                      placeholder="Status Ach / Slogan (Contoh: Menyala Queen, Gas Terus, Ach 94%)..." 
                      className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent" 
                    />
                  </div>

                  {/* Sub-Section Top Produk Per Sales */}
                  <div className="bg-bg/60 border border-emerald-500/30 rounded-xl p-3 space-y-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        Top Produk / Item Group (Kimberly, Alpha, Haikou, Loctite, Panasonic, dll)[cite: 107]
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...rows];
                          if (!updated[idx].topProducts) updated[idx].topProducts = [];
                          updated[idx].topProducts.push({
                            id: Date.now(),
                            productName: "",
                            totalQty: "",
                            category: "",
                            laluVal: "",
                            jalanVal: ""
                          });
                          setForm({ ...form, salesPerformances: updated });
                        }}
                        className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded hover:bg-emerald-500/30 transition cursor-pointer"
                      >
                        + Tambah Produk Ini
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {(sp.topProducts || []).map((prod, pIdx) => (
                        <div key={prod.id || pIdx} className="bg-bg2 border border-line rounded-lg p-2.5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-slate-400">Produk / Item Group #{pIdx + 1}</span>
                            {(sp.topProducts || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...rows];
                                  updated[idx].topProducts = updated[idx].topProducts.filter((_, pi) => pi !== pIdx);
                                  setForm({ ...form, salesPerformances: updated });
                                }}
                                className="text-red-400 text-[10px] hover:underline cursor-pointer"
                              >
                                Hapus Produk
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            value={prod.productName || ""}
                            onChange={(e) => {
                              const updated = [...rows];
                              updated[idx].topProducts[pIdx].productName = e.target.value;
                              setForm({ ...form, salesPerformances: updated });
                            }}
                            placeholder="Nama Item Group (Contoh: KIMBERLY CLARK, ALPHA, LOCTITE, ELMER...)"
                            className="w-full bg-bg border border-line rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[9px] text-sub block mb-0.5">Penjualan 2024 / Lalu (Rp)</label>
                              <input
                                type="text"
                                value={prod.totalQty || prod.laluVal || ""}
                                onChange={(e) => {
                                  const updated = [...rows];
                                  const val = e.target.value;
                                  updated[idx].topProducts[pIdx].totalQty = val;
                                  updated[idx].topProducts[pIdx].laluVal = val;
                                  setForm({ ...form, salesPerformances: updated });
                                }}
                                placeholder="Contoh: 30089205146"
                                className="w-full bg-bg border border-line rounded px-2 py-1 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-sub block mb-0.5">Penjualan 2025 / Berjalan (Rp)</label>
                              <input
                                type="text"
                                value={prod.category || prod.jalanVal || prod.actualVal || ""}
                                onChange={(e) => {
                                  const updated = [...rows];
                                  const val = e.target.value;
                                  updated[idx].topProducts[pIdx].category = val;
                                  updated[idx].topProducts[pIdx].jalanVal = val;
                                  updated[idx].topProducts[pIdx].actualVal = val;
                                  setForm({ ...form, salesPerformances: updated });
                                }}
                                placeholder="Contoh: 20489383222"
                                className="w-full bg-bg border border-line rounded px-2 py-1 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </section>

          {/* 3. INOVASI & TEROBOSAN KOMERSIAL */}
          <section className="bg-card border border-purple-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-purple-400">Inovasi & Terobosan Komersial / Strategi 2026</h2>
              <p className="text-xs text-sub mt-0.5">Tuliskan program baru, terobosan efisiensi, atau rencana aksi 2026.</p>
            </div>
            <textarea
              rows={3}
              value={form.branchInnovations || ""}
              onChange={(e) => setForm({ ...form, branchInnovations: e.target.value })}
              placeholder="Contoh: Road show customer gathering, penambahan series item online shop, pemisahan PIC sales retail & trading, get back existing customer..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </section>

          {/* 4. SALES SUPPORT & OPERASIONAL PENDUKUNG */}
          <section className="bg-card border border-amber-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-amber-400">Sales Support & Operasional Pendukung</h2>
              <p className="text-xs text-sub mt-0.5">Input performa administrasi sales support, PO, dan kendala operasional.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Input & Verifikasi PO Masuk (Max 1 Hari)</label>
                <input 
                  type="text" 
                  value={form.salesSupportPo || ""} 
                  onChange={(e) => setForm({ ...form, salesSupportPo: e.target.value })} 
                  placeholder="Contoh: Terkendala quota import / forecast principal..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" 
                />
              </div>
              <div className="bg-bg2/60 border border-line p-3 rounded-lg space-y-1.5">
                <label className="text-[11px] text-sub block font-medium">Koordinasi DO & Follow Up Piutang Sales</label>
                <input 
                  type="text" 
                  value={form.salesSupportCoord || ""} 
                  onChange={(e) => setForm({ ...form, salesSupportCoord: e.target.value })} 
                  placeholder="Contoh: Sinkronisasi dengan tim AR & efisiensi shipment by air..." 
                  className="w-full bg-bg border border-line rounded px-2.5 py-1.5 text-white" 
                />
              </div>
            </div>
            <textarea
              rows={3}
              value={form.salesSupportEvaluation || ""}
              onChange={(e) => setForm({ ...form, salesSupportEvaluation: e.target.value })}
              placeholder="Tuliskan catatan evaluasi kendala internal/eksternal sales support (misal: mencari alternatif produk diluar distributor)..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 mt-2"
            />
          </section>

          {/* 5. STRATEGIC OUTLOOK & ISSUE 2027 */}
          <section className="bg-card border border-purple-500/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-purple-400">Strategic Outlook & Issue 2027</h2>
              <p className="text-xs text-sub mt-0.5">Input bayangan masa depan, isu-isu krusial, atau perbaikan strategis jangka panjang.</p>
            </div>
            <textarea
              rows={4}
              value={form.strategicOutlook2027 || ""}
              onChange={(e) => setForm({ ...form, strategicOutlook2027: e.target.value })}
              placeholder="Tuliskan isu atau rencana perbaikan strategis 2027..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </section>

          {/* 6. CATATAN & EVALUASI BEBAS DEPARTEMEN */}
          <section className="bg-card border border-accent/40 rounded-xl p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-sm text-accent">Catatan & Evaluasi Bebas Departemen</h2>
              <p className="text-xs text-sub mt-0.5">Input catatan tambahan atau hal penting lainnya secara bebas.</p>
            </div>
            <textarea
              rows={3}
              value={form.generalNotes || ""}
              onChange={(e) => setForm({ ...form, generalNotes: e.target.value })}
              placeholder="Tuliskan catatan bebas dari Sales di sini..."
              className="w-full bg-bg border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent"
            />
          </section>
        </div>
      )}

    </div>
  );
}