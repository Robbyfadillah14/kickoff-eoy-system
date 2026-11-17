"use client";
import React, { useState, useEffect, useCallback } from "react";
import { 
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, TrendingUp, ArrowUpRight, 
  BarChart3, Target, Sparkles, CheckCircle2, Zap, 
  ShieldCheck, ArrowRightLeft, Flag, CheckCircle, Calendar, User, Package, AlertTriangle, TrendingDown
} from "lucide-react";

const formatRupiah = (val) => {
  const num = Number(val || 0);
  if (num === 0) return "Rp 0";
  if (Math.abs(num) >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt`;
  }
  if (Math.abs(num) >= 1_000) {
    return `Rp ${(num / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Rb`;
  }
  return `Rp ${num.toLocaleString('id-ID')}`;
};

export default function CommercialProfitDeck({ report, allYearlyReports = {} }) {
  const historicalYears = [2024, 2025, 2026]; 
  const mJson = report?.metricsJson || {};
  const salesType = mJson.salesType || "PROFIT";

  const userSummary = report?.achievementSummary || mJson.achievementSummary || "Belum ada ringkasan pencapaian yang di-input.";

  // Slide 0: Executive Master Dashboard (Gabungan Semua Data 2024-2026), Slide 1: Strategic Outlook 2027
  const totalSlides = 2;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

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
    if (isPlaying) {
      timer = setInterval(() => nextSlide(), 15000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, nextSlide]);

  const getReportForYear = (yr) => {
    const matches = allYearlyReports[yr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === yr) : []);
    if (matches.length > 0) return matches[0];
    if (Number(report?.year) === yr) return report;
    return null;
  };

  let totalAllActual = 0;
  let totalAllTarget = 0;
  
  const activeSalesNames = new Set();
  historicalYears.forEach(yr => {
    const rep = getReportForYear(yr);
    if (rep) {
      const sList = rep?.metricsJson?.salesPerformances || rep?.salesPerformances || [];
      totalAllActual += sList.reduce((acc, s) => acc + Number(s.actualVal || 0), 0);
      totalAllTarget += sList.reduce((acc, s) => acc + Number(s.targetProfit || s.targetVal || 0), 0);
      sList.forEach(s => {
        if (s.salesName) activeSalesNames.add(s.salesName.trim());
      });
    }
  });

  const report2027 = getReportForYear(2027);
  const outlook2027 = report2027?.metricsJson?.strategicOutlook2027 || report2027?.strategicOutlook2027 || mJson.strategicOutlook2027 || "Belum ada strategic outlook atau isu 2027 yang di-input.";

  return (
    <div className="relative w-full min-h-[760px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-white">
      
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <ArrowUpRight size={13} /> STRATEGI KOMERSIAL — {salesType === "OMZET" ? "OMZET ORIENTED" : "PROFIT ORIENTED"}
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
            {report?.plant?.name || "Unit Komersial"} · <b className="text-emerald-400">Executive Master Deck (2024–2026)</b>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-slate-400 font-semibold">
            Slide <span className="text-emerald-400 font-bold">{currentSlide + 1}</span> / {totalSlides}
          </span>
          <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700/60">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause size={15} className="text-emerald-400" /> : <Play size={15} />}
            </button>
            <button onClick={() => setCurrentSlide(0)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer">
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Slide Content Viewport */}
      <div className="flex-1 p-5 flex flex-col justify-center relative z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        
        {/* SLIDE 0: EXECUTIVE MASTER DASHBOARD (GABUNGAN SEMUA DATA 2024-2026 DALAM 1 LAYAR ALA SLIDEMODEL) */}
        {currentSlide === 0 && (
          <div className="w-full max-w-6xl mx-auto space-y-3 animate-fadeIn">
            
            {/* Top Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/90 border border-cyan-500/20 p-3 rounded-xl shadow-lg flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <div className="space-y-0.5 pl-2">
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">TOTAL SALES AKTIF</span>
                  <div className="text-xl font-black text-white font-mono">{activeSalesNames.size} <span className="text-[11px] font-normal text-slate-400">Personel</span></div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
                  <Target size={18} />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-emerald-500/20 p-3 rounded-xl shadow-lg flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="space-y-0.5 pl-2">
                  <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">TOTAL REVENUE (2024-2026)</span>
                  <div className="text-lg font-black text-emerald-400 font-mono">{formatRupiah(totalAllActual)}</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-indigo-500/20 p-3 rounded-xl shadow-lg flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div className="space-y-0.5 pl-2">
                  <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">TOTAL TARGET (2024-2026)</span>
                  <div className="text-lg font-black text-indigo-400 font-mono">{formatRupiah(totalAllTarget)}</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                  <BarChart3 size={18} />
                </div>
              </div>
            </div>

            {/* Master Grid / Tabel Referensi Gabungan Per Tahun (2024, 2025, 2026) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {historicalYears.map((yr) => {
                const rep = getReportForYear(yr);
                const metrics = rep ? (rep?.metricsJson || rep || {}) : {};
                const sList = metrics.salesPerformances || [];
                
                let allProductsForYear = [];
                if (rep) {
                  sList.forEach(sp => {
                    if (sp.topProducts && Array.isArray(sp.topProducts)) {
                      sp.topProducts.forEach(prod => {
                        if (prod.productName && prod.productName.trim() !== "") {
                          allProductsForYear.push({
                            productName: prod.productName.trim(),
                            currentVal: Number(prod.category || prod.actualVal || 0),
                            prevValInput: Number(prod.prevCategory || prod.prevVal || 0)
                          });
                        }
                      });
                    }
                  });
                }

                const innovations = rep ? (rep?.branchInnovations || metrics.branchInnovations || "Belum ada catatan inovasi.") : "Belum ada data laporan.";

                return (
                  <div key={yr} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl flex flex-col justify-between h-[410px] relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                    
                    {/* Header Kolom Tahun */}
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Calendar size={13} className="text-emerald-400" /> TAHUN OPERASIONAL {yr}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${rep ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        {rep ? "Logged" : "Kosong"}
                      </span>
                    </div>

                    {/* Scrollable Content Container */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar text-[11px] font-mono">
                      
                      {/* Section 1: Sales Performance */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block flex items-center gap-1">
                          <User size={11} /> Tim Sales ({sList.length}):
                        </span>
                        {sList.length > 0 ? (
                          sList.map((sales, sIdx) => {
                            const tgt = Number(sales.targetProfit || sales.targetVal || 0);
                            const act = Number(sales.actualVal || 0);
                            const ach = tgt > 0 ? ((act / tgt) * 100) : 0;
                            const isAchieved = act >= tgt;

                            return (
                              <div key={sIdx} className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 space-y-1">
                                <div className="flex justify-between items-center font-bold text-slate-200">
                                  <span className="truncate max-w-[110px]" title={sales.salesName}>{sales.salesName}</span>
                                  <span className={ach >= 100 ? 'text-emerald-400' : 'text-amber-400'}>{ach.toFixed(0)}%</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-400 border-t border-slate-900 pt-0.5">
                                  <div>Tgt: <b className="text-indigo-300">{formatRupiah(tgt)}</b></div>
                                  <div>Akt: <b className="text-emerald-400">{formatRupiah(act)}</b></div>
                                </div>
                                <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex justify-between ${isAchieved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                  <span>{isAchieved ? "Wah Naik Nih!" : "Wah Turun Nih!"}</span>
                                  <span>{isAchieved ? "Tercapai" : "Belum"}</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-slate-600 italic text-[10px] py-1">Belum ada data sales.</div>
                        )}
                      </div>

                      {/* Section 2: Products */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                          <Package size={11} /> Produk ({allProductsForYear.length}):
                        </span>
                        {allProductsForYear.length > 0 ? (
                          allProductsForYear.map((prod, pIdx) => {
                            const hasPrev = prod.prevValInput > 0;
                            const isIncreased = !hasPrev || prod.currentVal >= prod.prevValInput;

                            return (
                              <div key={pIdx} className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 space-y-1">
                                <div className="flex justify-between items-center font-bold text-slate-200">
                                  <span className="truncate max-w-[110px]" title={prod.productName}>{prod.productName}</span>
                                  <span className="text-emerald-400">{formatRupiah(prod.currentVal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-900 pt-0.5">
                                  <span>Lalu: {formatRupiah(prod.prevValInput)}</span>
                                  <span className={`px-1 py-0.2 rounded font-bold ${!hasPrev ? 'bg-slate-800 text-slate-300' : isIncreased ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {!hasPrev ? "Baseline 🚀" : isIncreased ? "Wah Naik Nih!" : "Wah Turun Nih!"}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-slate-600 italic text-[10px] py-1">Belum ada data produk.</div>
                        )}
                      </div>

                      {/* Section 3: Innovations */}
                      <div className="space-y-1 pt-1 border-t border-slate-800/80 font-sans">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block flex items-center gap-1">
                          <Zap size={11} /> Inovasi:
                        </span>
                        <p className="text-[10px] text-slate-300 italic bg-slate-950 p-2 rounded-xl border border-slate-800 leading-tight">
                          {rep ? innovations : "Belum ada catatan inovasi."}
                        </p>
                      </div>

                    </div>

                    {/* Footer card */}
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>Status: <b className="text-emerald-400">{rep ? "Aman & Sinkron" : "Kosong"}</b></span>
                      <span className="font-bold text-slate-500">Tahun {yr}</span>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* SLIDE 1: STRATEGIC OUTLOOK 2027 (CLOSING STAGE) */}
        {currentSlide === 1 && (
          <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn text-center">
            <div className="bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-950 border border-purple-500/40 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-emerald-400 to-indigo-500"></div>

              <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-300 border border-purple-500/30 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest shadow-md">
                <Sparkles size={14} className="text-purple-400" /> FINAL STAGE — STRATEGIC OUTLOOK 2027
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Proyeksi Masa Depan & Fokus Inovasi 2027
              </h2>

              <div className="bg-slate-900/90 border border-purple-500/30 p-6 rounded-2xl text-left text-xs font-mono text-slate-200 shadow-inner leading-relaxed min-h-[140px] flex flex-col justify-center">
                <span className="text-[10px] text-purple-400 font-bold block mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={14} /> Catatan Isu & Fokus Perbaikan 2027:
                </span>
                <p className="whitespace-pre-line text-sm text-slate-200 leading-relaxed font-sans">{outlook2027}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Siap Melangkah ke Tahun 2027!
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">Komitmen pertumbuhan berkelanjutan & pencapaian target komersial.</p>
                </div>
                
                <button 
                  onClick={() => setCurrentSlide(0)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw size={15} /> Restart Presentation
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. Footer Navigation Controls */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-sm z-10">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 text-white transition cursor-pointer"
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>

        <div className="flex items-center gap-2">
          {["Master Dashboard (2024-2026)", "Strategic Outlook 2027"].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                currentSlide === idx
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-30 transition cursor-pointer"
        >
          Selanjutnya <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}