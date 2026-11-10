"use client";
import React, { useState, useEffect, useCallback } from "react";
import { 
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, TrendingUp, ArrowUpRight, 
  BarChart3, Target, Sparkles, CheckCircle, User, Package, Layers, ShieldAlert, Calendar, AlertTriangle
} from "lucide-react";

const formatRupiah = (val) => {
  const num = Number(val || 0);
  if (num === 0) return "Rp 0";
  if (Math.abs(num) >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
  if (Math.abs(num) >= 1_000_000) return `Rp ${(num / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt`;
  if (Math.abs(num) >= 1_000) return `Rp ${(num / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Rb`;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

export default function CommercialProfitDeck({ report, allYearlyReports = {} }) {
  const targetYears = [2024, 2025, 2026, 2027];
  const mJson = report?.metricsJson || {};
  const salesType = mJson.salesType || "PROFIT";

  // Ambil hasil Intelligence Analysis dari Backend (jika file Excel di-upload)
  const intelligenceAnalysis = mJson.intelligenceAnalysis || {};
  const backendAnomalies = intelligenceAnalysis.anomalies || [];
  const backendSummary = report?.achievementSummary || intelligenceAnalysis?.summary?.executiveSummary;

  const totalSlides = 5; // Diperluas mencakup milestone multi-tahun penuh (2024–2027)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % totalSlides), [totalSlides]);
  const prevSlide = useCallback(() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides), [totalSlides]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  useEffect(() => {
    let timer;
    if (isPlaying) timer = setInterval(() => nextSlide(), 10000);
    return () => clearInterval(timer);
  }, [isPlaying, nextSlide]);

  const getReportForYear = (yr) => {
    const matches = allYearlyReports[yr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === yr) : []);
    if (matches.length > 0) return matches[0];
    if (Number(report?.year) === yr) return report;
    return null;
  };

  // Akumulasi data lintas tahun (2024 - 2027)
  let totalAllActual = 0, totalAllTarget = 0, totalSalesCount = 0;
  targetYears.forEach(yr => {
    const rep = getReportForYear(yr);
    if (rep) {
      const sList = rep?.metricsJson?.salesPerformances || rep?.salesPerformances || [];
      totalAllActual += sList.reduce((acc, s) => acc + Number(s.actualVal || 0), 0);
      totalAllTarget += sList.reduce((acc, s) => acc + Number(s.targetProfit || s.targetVal || 0), 0);
      totalSalesCount += sList.length;
    }
  });

  const report2027 = getReportForYear(2027);
  const currentReportMetrics = report?.metricsJson || report || {};
  const outlook2027 = report2027?.metricsJson?.strategicOutlook2027 || report2027?.strategicOutlook2027 || currentReportMetrics.strategicOutlook2027 || "Belum ada strategic outlook 2027 yang di-input.";

  return (
    <div className="relative w-full min-h-[660px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-white select-none">
      
      {/* TOP HEADER: EXECUTIVE STATUS BAR */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-b border-slate-800/80 z-10 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <ArrowUpRight size={13} /> EKASURYA COMMAND DECK (2024–2027)
          </span>
          <span className="text-xs text-slate-300 font-mono hidden sm:inline-block border-l border-slate-700 pl-3">
            Mode: <b className="text-emerald-400">{salesType} ORIENTED</b> · Plant: {report?.plant?.name || "Cikarang"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-emerald-400 font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            Slide {currentSlide + 1} / {totalSlides}
          </span>
          <div className="flex items-center gap-1 bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 transition cursor-pointer" title={isPlaying ? "Jeda" : "Putar Otomatis"}>
              {isPlaying ? <Pause size={14} className="text-emerald-400" /> : <Play size={14} />}
            </button>
            <button onClick={() => setCurrentSlide(0)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 transition cursor-pointer" title="Reset ke Awal">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* VIEWPORT CONTENT (BENTO GRID STYLE - MULTI-YEAR GABUNGAN) */}
      <div className="flex-1 p-6 flex flex-col justify-center relative z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        
        {/* SLIDE 0: EXECUTIVE MASTER KPI DASHBOARD (2024-2027) */}
        {currentSlide === 0 && (
          <div className="w-full max-w-5xl mx-auto space-y-3 animate-fadeIn font-mono">
            
            {/* 💡 INTELLIGENCE ENGINE BRIEFING DARI BACKEND */}
            {backendSummary && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <div>
                  <b className="text-blue-300 font-mono block mb-0.5">Intelligence Engine Briefing (Otonom):</b>
                  <p className="text-slate-200 leading-relaxed font-sans">{backendSummary}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/90 border border-cyan-500/30 p-4 rounded-2xl shadow-xl space-y-1 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-3 text-cyan-400 opacity-20"><Target size={40} /></div>
                <span className="text-[10px] text-cyan-400 font-bold tracking-widest block">TOTAL PERSONEL SALES</span>
                <div className="text-3xl font-black text-white">{totalSalesCount} <span className="text-xs font-normal text-slate-400">Entri</span></div>
                <span className="text-[9px] text-slate-400">Akumulasi Lintas Periode</span>
              </div>

              <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl shadow-xl space-y-1 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-3 text-emerald-400 opacity-20"><TrendingUp size={40} /></div>
                <span className="text-[10px] text-emerald-400 font-bold tracking-widest block">AKUMULASI REVENUE (24-27)</span>
                <div className="text-2xl font-black text-emerald-400">{formatRupiah(totalAllActual)}</div>
                <span className="text-[9px] text-slate-400">Total Realisasi Keseluruhan</span>
              </div>

              <div className="bg-slate-900/90 border border-indigo-500/30 p-4 rounded-2xl shadow-xl space-y-1 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-3 text-indigo-400 opacity-20"><BarChart3 size={40} /></div>
                <span className="text-[10px] text-indigo-400 font-bold tracking-widest block">AKUMULASI TARGET (24-27)</span>
                <div className="text-2xl font-black text-indigo-400">{formatRupiah(totalAllTarget)}</div>
                <span className="text-[9px] text-slate-400">Target Sistem Terintegrasi</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3 backdrop-blur-sm">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-emerald-400" /> Komparasi Progres Realisasi 4 Tahun (2024 — 2027)
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {targetYears.map(yr => {
                  const rep = getReportForYear(yr);
                  const sList = rep ? (rep?.metricsJson?.salesPerformances || rep?.salesPerformances || []) : [];
                  const totAct = sList.reduce((acc, s) => acc + Number(s.actualVal || 0), 0);
                  const totTgt = sList.reduce((acc, s) => acc + Number(s.targetProfit || s.targetVal || 0), 0);
                  const ach = totTgt > 0 ? (totAct / totTgt) * 100 : 0;

                  return (
                    <div key={yr} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 shadow-inner">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">Tahun {yr}</span>
                        <span className="text-emerald-400 font-bold">{rep ? `${ach.toFixed(1)}%` : "N/A"}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(ach, 100)}%` }}></div>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{rep ? formatRupiah(totAct) : "Belum ada data"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: ANALISIS PERFORMA PERSONEL LINTAS TAHUN */}
        {currentSlide === 1 && (
          <div className="w-full max-w-5xl mx-auto space-y-3 animate-fadeIn font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} /> Konsistensi Performa Personel Sales (2024–2027)
              </span>
              <span className="text-[9px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">Multi-Year Aggregation</span>
            </div>

            {/* ⚠️ TAMPILKAN PERINGATAN ANOMALI JIKA ADA */}
            {backendAnomalies.length > 0 && (
              <div className="p-2.5 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs text-amber-300 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle size={13} /> Peringatan Deviasi Kinerja Sales:
                </span>
                {backendAnomalies.map((anom, idx) => (
                  <p key={idx} className="text-[11px] text-slate-200">
                    • <b>{anom.item}</b>: Target {anom.target}, Aktual {anom.actual} ({anom.achievement}) — <i className="text-amber-200">{anom.recommendation}</i>
                  </p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {targetYears.map(yr => {
                const rep = getReportForYear(yr);
                const sList = rep ? (rep?.metricsJson?.salesPerformances || rep?.salesPerformances || []) : [];
                
                return (
                  <div key={yr} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2.5 shadow-xl flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5"><Calendar size={12} className="text-cyan-400" /> Tahun {yr}</span>
                      <span className="text-[9px] bg-slate-950 text-cyan-400 px-2 py-0.5 rounded border border-slate-800">{sList.length} Personel</span>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-[170px] pr-1">
                      {sList.length > 0 ? sList.map((sp, idx) => (
                        <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                          <span className="text-cyan-400 font-bold truncate max-w-[110px]">{sp.salesName || "Sales"}</span>
                          <span className="text-emerald-400 font-bold">{formatRupiah(sp.actualVal)}</span>
                        </div>
                      )) : <div className="text-slate-500 text-xs italic py-6 text-center">Belum ada data di tahun {yr}.</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDE 2: PRODUK UNGGULAN & KATEGORI LINTAS TAHUN */}
        {currentSlide === 2 && (
          <div className="w-full max-w-5xl mx-auto space-y-3 animate-fadeIn font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} /> Tren Produk & Kategori Unggulan (2024–2027)
              </span>
              <span className="text-[9px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">Portfolio Review</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <span className="text-xs font-bold text-white block mb-1">📦 Top Produk Berjalan (Tahun Terkini)</span>
                <div className="space-y-2">
                  {currentReportMetrics.salesPerformances && currentReportMetrics.salesPerformances.some(sp => sp.topProducts?.length > 0) ? (
                    currentReportMetrics.salesPerformances.slice(0, 3).map((sp, idx) => {
                      const p = sp.topProducts[0];
                      return p ? (
                        <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs shadow-inner">
                          <span className="text-white font-bold truncate max-w-[160px]">{p.productName}</span>
                          <span className="text-emerald-400 font-bold">{formatRupiah(p.category || p.actualVal)}</span>
                        </div>
                      ) : null;
                    })
                  ) : <div className="text-slate-500 text-xs italic py-4 text-center">Belum ada data produk unggulan.</div>}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <span className="text-xs font-bold text-white block mb-1">📊 Parameter Strategi Komersial</span>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 shadow-inner">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-400">Orientasi Utama:</span>
                    <span className="text-emerald-400 font-bold">{salesType} ORIENTED</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-400">Cakupan Tahun:</span>
                    <span className="text-white font-bold">2024 — 2027 (4 Siklus)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status Integritas:</span>
                    <span className="text-cyan-400 font-bold">Sinkronisasi Penuh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: INOVASI & SALES SUPPORT LINTAS TAHUN */}
        {currentSlide === 3 && (
          <div className="w-full max-w-5xl mx-auto space-y-3 animate-fadeIn font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-purple-500/30 p-4 rounded-2xl space-y-2.5">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} /> Akumulasi Inovasi & Terobosan
                </span>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 h-[140px] overflow-y-auto shadow-inner">
                  <p className="whitespace-pre-line italic font-sans">{currentReportMetrics.branchInnovations || "Belum ada catatan inovasi komersial dari form."}</p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-2xl space-y-2.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Sales Support & Operasional
                </span>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between shadow-inner">
                    <span className="text-slate-400">Verifikasi PO:</span>
                    <span className="text-white font-bold">{currentReportMetrics.salesSupportPo || "-"}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between shadow-inner">
                    <span className="text-slate-400">Koordinasi DO:</span>
                    <span className="text-white font-bold">{currentReportMetrics.salesSupportCoord || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: FINAL STAGE — STRATEGIC OUTLOOK 2027 */}
        {currentSlide === 4 && (
          <div className="w-full max-w-3xl mx-auto space-y-4 animate-fadeIn text-center font-mono">
            <div className="bg-gradient-to-br from-purple-950/90 via-slate-900 to-slate-950 border border-purple-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">
                <Sparkles size={13} className="text-purple-400" /> FINAL STAGE — STRATEGIC OUTLOOK 2027
              </span>
              <h2 className="text-xl font-black text-white">Proyeksi Masa Depan & Fokus Perbaikan 2027</h2>
              <div className="bg-slate-950 p-4 rounded-2xl text-left text-xs text-slate-200 border border-slate-800 shadow-inner">
                <span className="text-[10px] text-purple-400 font-bold block mb-1 uppercase tracking-wider">Catatan Isu & Fokus Perbaikan 2027:</span>
                <p className="whitespace-pre-line text-xs text-slate-200 font-sans leading-relaxed">{backendSummary || outlook2027}</p>
              </div>
              <button onClick={() => setCurrentSlide(0)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition cursor-pointer">
                Restart Presentation
              </button>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM FOOTER NAVIGATION */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-t border-slate-800/80 z-10 shrink-0 backdrop-blur-md">
        <button onClick={prevSlide} disabled={currentSlide === 0} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 text-white transition cursor-pointer">
          <ChevronLeft size={16} /> Sebelumnya
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[440px] py-1">
          {["Master KPI 24-27", "Personel Sales", "Produk & Kategori", "Inovasi & Support", "Outlook 2027"].map((label, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer shrink-0 ${currentSlide === idx ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        <button onClick={nextSlide} disabled={currentSlide === totalSlides - 1} className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-30 transition cursor-pointer">
          Selanjutnya <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}