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

  const totalSlides = 5;
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
      timer = setInterval(() => nextSlide(), 10000);
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
    <div className="relative w-full min-h-[740px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-white">
      
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <ArrowUpRight size={13} /> STRATEGI KOMERSIAL — {salesType === "OMZET" ? "OMZET ORIENTED" : "PROFIT ORIENTED"}
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
            {report?.plant?.name || "Unit Komersial"} · <b className="text-emerald-400">Executive Strategic Deck (2024–2027)</b>
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
      <div className="flex-1 p-6 flex flex-col justify-center relative z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        
        {/* SLIDE 0: DASHBOARD UTAMA (2024-2026) */}
        {currentSlide === 0 && (
          <div className="w-full space-y-4 animate-fadeIn">
            
            {userSummary && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
                <span className="text-base">📌</span>
                <div>
                  <b className="text-blue-300 font-mono block mb-0.5">Catatan & Ringkasan Laporan Divisi:</b>
                  <p className="text-slate-200 leading-relaxed font-sans">{userSummary}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-cyan-500/20 p-4 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500"></div>
                <div className="space-y-1 pl-2">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">PERSONEL SALES AKTIF</span>
                  <div className="text-2xl font-black text-white font-mono">{activeSalesNames.size} <span className="text-xs font-normal text-slate-400">Orang</span></div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
                  <Target size={24} />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-emerald-500/20 p-4 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div className="space-y-1 pl-2">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">TOTAL REVENUE (24-26)</span>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {formatRupiah(totalAllActual)}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-indigo-500/20 p-4 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                <div className="space-y-1 pl-2">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">TOTAL TARGET (24-26)</span>
                  <div className="text-xl font-black text-indigo-400 font-mono">
                    {formatRupiah(totalAllTarget)}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                  <BarChart3 size={24} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 size={16} className="text-emerald-400" /> Ringkasan Progres Historis (2024 - 2026)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">Core Years</span>
                </div>
                <div className="space-y-3 pt-1">
                  {historicalYears.map((yr) => {
                    const rep = getReportForYear(yr);
                    const sList = rep ? (rep?.metricsJson?.salesPerformances || rep?.salesPerformances || []) : [];
                    const totAct = sList.reduce((acc, s) => acc + Number(s.actualVal || 0), 0);
                    const totTgt = sList.reduce((acc, s) => acc + Number(s.targetProfit || s.targetVal || 0), 0);
                    const ach = totTgt > 0 ? ((totAct / totTgt) * 100) : 0;

                    return (
                      <div key={yr} className="space-y-1 font-mono">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span className="font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> TAHUN {yr}
                          </span>
                          <span className={rep ? "text-emerald-400 font-bold" : "text-slate-500"}>
                            {rep ? `Realisasi: ${formatRupiah(totAct)} (${ach.toFixed(1)}%)` : "Belum ada data"}
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-5 rounded-xl overflow-hidden p-0.5 border border-slate-800/80 flex items-center">
                          {rep ? (
                            <div 
                              className={`h-full rounded-lg flex items-center justify-end pr-2 text-[10px] font-extrabold text-slate-950 transition-all duration-700 ${
                                ach >= 100 
                                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 shadow-lg shadow-emerald-500/20' 
                                  : 'bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950'
                              }`}
                              style={{ width: `${Math.min(Math.max(ach, 12), 100)}%` }}
                            >
                              {ach.toFixed(0)}%
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600 px-3 italic">Data belum di-input</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
                <div className="border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16} className="text-indigo-400" /> Status Dashboard
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center font-mono">
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 shadow-inner">
                    <span className="text-3xl font-black text-white">
                      {historicalYears.filter(yr => getReportForYear(yr) !== null).length}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1 font-semibold">Tahun Historis</span>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 shadow-inner">
                    <span className="text-sm font-extrabold text-emerald-400 truncate block pt-1">{salesType}</span>
                    <span className="text-[10px] text-slate-400 block mt-1 font-semibold">Orientasi</span>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 font-medium">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span>Sistem Perhitungan Otomatis Terhubung.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: PERFORMA PER SALES DENGAN INDIKATOR NAIK/TURUN TARGET VS AKTUAL */}
        {currentSlide === 1 && (
          <div className="w-full max-w-5xl mx-auto space-y-4 animate-fadeIn">
            <div className="grid grid-cols-3 gap-4">
              {historicalYears.map((yr) => {
                const rep = getReportForYear(yr);
                const sList = rep ? (rep?.metricsJson?.salesPerformances || rep?.salesPerformances || []) : [];

                return (
                  <div key={yr} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col justify-between h-[390px] relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <User size={14} className="text-emerald-400" /> TAHUN {yr}
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        {sList.length} Sales
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pt-2 custom-scrollbar pr-1">
                      {sList.length > 0 ? (
                        sList.map((sales, idx) => {
                          const tgt = Number(sales.targetProfit || sales.targetVal || 0);
                          const act = Number(sales.actualVal || 0);
                          const ach = tgt > 0 ? ((act / tgt) * 100) : 0;
                          const isAchieved = act >= tgt;

                          return (
                            <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 font-mono shadow-inner">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-cyan-300 truncate max-w-[120px]" title={sales.salesName}>
                                  {sales.salesName || `Sales #${idx + 1}`}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ach >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {ach.toFixed(1)}%
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-900">
                                <div>
                                  <span className="text-slate-500 block">Target</span>
                                  <span className="text-indigo-300 font-bold">{formatRupiah(tgt)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Aktual</span>
                                  <span className="text-emerald-400 font-bold">{formatRupiah(act)}</span>
                                </div>
                              </div>

                              {/* Indikator Status Naik / Turun terhadap Target */}
                              <div className={`p-1.5 rounded-lg flex items-center justify-between text-[10px] font-bold border ${
                                isAchieved 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}>
                                <span className="flex items-center gap-1">
                                  {isAchieved ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {isAchieved ? "Wah Naik Nih! 📈" : "Wah Turun Nih! 📉"}
                                </span>
                                <span className="font-sans text-[9px]">{isAchieved ? "Target Tercapai" : "Belum Capai Target"}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-slate-500 text-xs italic text-center py-20 font-mono">
                          Belum ada data personel sales di tahun {yr}.
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2">
                      <span>Status: <b className="text-emerald-400">{rep ? "Logged" : "Kosong"}</b></span>
                      <span className="text-slate-500 font-bold">Tahun {yr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDE 2: DAFTAR PRODUK DENGAN INDIKATOR NAIK/TURUN TAHUN LALU VS BERJALAN */}
        {currentSlide === 2 && (
          <div className="w-full max-w-5xl mx-auto space-y-4 animate-fadeIn">
            <div className="grid grid-cols-3 gap-4">
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

                return (
                  <div key={yr} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col justify-between h-[390px] relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500"></div>
                    
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Package size={14} className="text-cyan-400" /> PRODUK TAHUN {yr}
                      </span>
                      <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                        {allProductsForYear.length} Item
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pt-2 custom-scrollbar pr-1">
                      {allProductsForYear.length > 0 ? (
                        allProductsForYear.map((prod, idx) => {
                          const isIncreased = prod.currentVal >= prod.prevValInput;

                          return (
                            <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 font-mono shadow-inner">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-cyan-300 truncate max-w-[130px]" title={prod.productName}>
                                  {prod.productName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Akt: <b className="text-emerald-400">{formatRupiah(prod.currentVal)}</b>
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-900 text-slate-400">
                                <span>Lalu: {formatRupiah(prod.prevValInput)}</span>
                                <span className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                                  isIncreased 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {isIncreased ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                  {isIncreased ? "Wah Naik Nih! 📈" : "Wah Turun Nih! 📉"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-slate-500 text-xs italic text-center py-20 font-mono">
                          Belum ada data produk di tahun {yr}.
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2">
                      <span>Status: <b className="text-cyan-400">{rep ? "Logged" : "Kosong"}</b></span>
                      <span className="text-slate-500 font-bold">Tahun {yr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDE 3: TEROBOSAN & INOVASI (2024-2026) */}
        {currentSlide === 3 && (
          <div className="w-full max-w-5xl mx-auto space-y-4 animate-fadeIn">
            <div className="grid grid-cols-3 gap-4">
              {historicalYears.map((yr) => {
                const rep = getReportForYear(yr);
                const metrics = rep ? (rep?.metricsJson || rep || {}) : {};
                const innovations = rep ? (rep?.branchInnovations || metrics.branchInnovations || "") : "";

                return (
                  <div key={yr} className="bg-slate-900/70 border border-purple-500/30 p-4 rounded-2xl space-y-3 shadow-xl relative overflow-hidden flex flex-col justify-between h-[390px] backdrop-blur-sm group hover:border-purple-500/60 transition">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>
                    
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                          <Zap size={14} />
                        </div>
                        <span className="text-xs font-mono font-bold text-white">INOVASI TAHUN {yr}</span>
                      </div>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30 font-bold uppercase tracking-wider">
                        Strategy
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed custom-scrollbar shadow-inner flex flex-col">
                      <span className="text-[10px] font-bold text-purple-400 block mb-1.5 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={12} /> Catatan Terobosan:
                      </span>
                      <p className="whitespace-pre-line text-slate-300 text-xs leading-relaxed italic font-sans">
                        {rep ? (innovations || "Belum ada catatan inovasi atau terobosan strategis untuk tahun ini.") : "Belum ada data laporan untuk tahun ini."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                      <span>Status: <b className="text-emerald-400">{rep ? "Logged" : "-"}</b></span>
                      <span className="text-purple-400 font-semibold">Tahun {yr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDE 4: BAB PENUTUP KHUSUS — STRATEGIC OUTLOOK 2027 */}
        {currentSlide === 4 && (
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
          {["Dashboard 24–26", "Performa Per Sales", "Daftar Produk", "Inovasi Komersial", "Outlook 2027"].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
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