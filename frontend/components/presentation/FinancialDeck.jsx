"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Sparkles, CheckCircle2, Zap, Target, TrendingUp, AlertTriangle, Calendar, Layers, ShieldCheck } from "lucide-react";

export default function FinancialDeck({ report, allYearlyReports = {} }) {
  const targetYears = [2024, 2025, 2026, 2027];
  const mJson = report?.metricsJson || {};

  // Ambil hasil Intelligence Analysis dari Backend (jika ada)
  const intelligenceAnalysis = mJson.intelligenceAnalysis || {};
  const backendAnomalies = intelligenceAnalysis.anomalies || [];
  const backendSummary = report?.achievementSummary || intelligenceAnalysis?.summary?.executiveSummary;

  // State untuk mengontrol Modal Popup Detail Runtutan Data Multi-Tahun
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Helper untuk mengambil data laporan berdasarkan tahun dari allYearlyReports atau report aktif
  const getReportForYear = (yr) => {
    const matches = allYearlyReports[yr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === yr) : []);
    if (matches.length > 0) return matches[0];
    if (Number(report?.year) === yr) return report;
    return null;
  };

  // 1. Agregator Lintas Tahun (2024 - 2027) untuk Komparasi Departemen
  let totalAllTarget = 0;
  let totalAllActual = 0;
  let totalItemsCount = 0;
  let allAggregatedIssues = [];

  targetYears.forEach(yr => {
    const rep = getReportForYear(yr);
    if (rep) {
      const repMetrics = rep?.metricsJson || rep || {};
      const items = repMetrics.salesPerformances || rep?.salesPerformances || [];
      
      items.forEach((item, idx) => {
        const target = Number(item.targetVal || item.target || 0);
        const actual = Number(item.actualVal || item.actual || item.value || 0);
        totalAllTarget += target;
        totalAllActual += actual;
        totalItemsCount += 1;

        if (target > 0 && actual < target) {
          allAggregatedIssues.push({
            year: yr,
            title: `Defisit pada ${item.salesName || item.name || 'Parameter ' + (idx + 1)} (Thn ${yr})`,
            gap: target - actual,
            solution: `Perlu eskalasi percepatan operasional untuk mengejar selisih deviasi sebesar ${(target - actual).toLocaleString("id-ID")}.`
          });
        }
      });
    }
  });

  const overallAchievementRate = totalAllTarget > 0 ? ((totalAllActual / totalAllTarget) * 100).toFixed(1) : 100;

  // Ekstraksi parameter form dinamis dari report aktif
  const dynamicEntries = Object.entries(mJson).filter(([k]) => 
    !["salesPerformances", "kpiList", "challenges", "opportunities", "salesType", "intelligenceAnalysis"].includes(k) &&
    typeof mJson[k] === "string" && mJson[k].trim() !== ""
  );

  // 2. Konfigurasi Slide Eksekutif Multi-Tahun
  const slidesConfig = [
    { type: "COVER", title: "Executive Overview" },
    { type: "MULTI_YEAR_DASHBOARD", title: "Komparasi Kinerja Multi-Tahun (2024-2027)" },
    { type: "EXECUTIVE_SUMMARY", title: "Parameter Utama Departemen" },
    { type: "EXECUTIVE_AGGREGATE", title: "Ringkasan Finansial & Solusi Otonom" },
    { type: "STRATEGIC_NOTES", title: "Kesimpulan & Rekomendasi Manajemen" },
  ];

  const totalSlides = slidesConfig.length;
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
      timer = setInterval(() => nextSlide(), 8000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, nextSlide]);

  const activeSlideData = slidesConfig[currentSlide] || slidesConfig[0];

  return (
    <div className="relative w-full aspect-[16/9] max-h-[82vh] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-white">
      
      {/* Header Bar Modern */}
      <div className="flex items-center justify-between px-8 py-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/40 px-3.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/10">
            <Sparkles size={14} className="text-amber-400 animate-pulse" /> EXECUTIVE BRIEFING DECK (2024–2027)
          </span>

          <span className="text-xs text-slate-400 font-medium hidden md:inline-block border-l border-slate-700 pl-4">
            {report?.plant?.name || "Global Cabang"} · <strong className="text-slate-200">{report?.department?.name || "Financial Group"}</strong>
          </span>
        </div>

        <div className="flex items-center gap-5">
          <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-700">
            Slide <span className="text-amber-400 font-bold">{currentSlide + 1}</span> / {totalSlides}
          </span>

          <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-xl p-1 border border-slate-700 shadow-inner">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              title={isPlaying ? "Jeda Autoplay" : "Mulai Autoplay"}
            >
              {isPlaying ? <Pause size={16} className="text-amber-400" /> : <Play size={16} />}
            </button>
            <button
              onClick={() => setCurrentSlide(0)}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              title="Reset ke Slide Pertama"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Viewport Landscape */}
      <div className="flex-1 px-10 py-6 flex flex-col justify-center relative z-10 transition-all duration-500 overflow-y-auto">
        
        {/* 1. COVER SLIDE */}
        {activeSlideData.type === "COVER" && (
          <div className="w-full max-w-4xl mx-auto space-y-6 text-center animate-fadeIn my-auto">
            <div className="p-12 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
              <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest inline-block shadow-md">
                EXECUTIVE BRIEFING PRESENTATION (2024–2027)
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {report?.department?.name || "Financial & Tax Group"} Master Insight
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Paparan eksekutif otonom yang merangkum komparasi rekapitulasi data lintas tahun (2024–2027) secara terpadu untuk departemen ini.
              </p>
              <div className="pt-4">
                <button
                  onClick={nextSlide}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl transition shadow-xl shadow-amber-500/25 cursor-pointer flex items-center gap-2 mx-auto"
                >
                  Mulai Paparan Multi-Tahun →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. MULTI-YEAR DASHBOARD (2024-2027 COMPARISON) */}
        {activeSlideData.type === "MULTI_YEAR_DASHBOARD" && (
          <div className="w-full max-w-5xl mx-auto space-y-5 animate-fadeIn my-auto">
            <div className="border-b border-slate-800/80 pb-3 flex justify-between items-end">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block mb-1">Multi-Year Intelligence</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Calendar className="text-amber-400" size={24} /> Komparasi Kinerja Lintas Tahun (2024–2027)
                </h3>
              </div>
              <span className="text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-xl font-semibold">
                4 Siklus Tahun Aktif
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {targetYears.map(yr => {
                const rep = getReportForYear(yr);
                const sList = rep ? (rep?.metricsJson?.salesPerformances || rep?.salesPerformances || []) : [];
                const totAct = sList.reduce((acc, s) => acc + Number(s.actualVal || s.actual || s.value || 0), 0);
                const totTgt = sList.reduce((acc, s) => acc + Number(s.targetVal || s.target || 0), 0);
                const ach = totTgt > 0 ? ((totAct / totTgt) * 100) : 0;

                return (
                  <div key={yr} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-xs font-mono">Tahun {yr}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${rep ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        {rep ? 'Aktif' : 'Kosong'}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono">
                      <div className="text-[10px] text-slate-400">Realisasi:</div>
                      <div className="text-sm font-black text-cyan-400">{totAct > 0 ? `Rp ${totAct.toLocaleString("id-ID")}` : "-"}</div>
                    </div>

                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Pencapaian:</span>
                        <span className={ach >= 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{ach.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(ach, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex justify-between items-center font-mono text-xs">
              <span className="text-slate-300">Akumulasi Total Realisasi (2024-2027): <b className="text-emerald-400">Rp {totalAllActual.toLocaleString("id-ID")}</b></span>
              <span className="text-cyan-400 font-bold">Total Item Terekam: {totalItemsCount} Baris</span>
            </div>
          </div>
        )}

        {/* 3. EXECUTIVE SUMMARY (Parameter Form Bersih) */}
        {activeSlideData.type === "EXECUTIVE_SUMMARY" && (
          <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn my-auto">
            <div className="border-b border-slate-800/80 pb-3 flex justify-between items-end">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block mb-1">Strategic Highlights</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Zap className="text-amber-400" size={24} /> Poin Utama Kinerja Departemen ({report?.year || "2026"})
                </h3>
              </div>
              <span className="text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-xl font-semibold">
                {dynamicEntries.length} Parameter Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
              {dynamicEntries.length > 0 ? (
                dynamicEntries.map(([key, val], idx) => (
                  <div key={idx} className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl space-y-2 shadow-xl hover:border-amber-500/40 transition flex items-start gap-4">
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0 mt-0.5">
                      <Target size={18} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">{key}</div>
                      <div className="text-sm font-bold text-white leading-relaxed">{String(val)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-10 text-slate-500 font-mono text-xs">
                  Belum ada parameter naratif tambahan yang diinput pada tahun ini.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. EXECUTIVE AGGREGATE & BUKTI RINCIAN UTAMA */}
        {activeSlideData.type === "EXECUTIVE_AGGREGATE" && (
          <div className="w-full max-w-5xl mx-auto space-y-4 animate-fadeIn my-auto">
            <div className="border-b border-slate-800/80 pb-2 flex justify-between items-end">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">Spreadsheet Intelligence</span>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={20} /> Akumulasi Nilai Akhir & Bukti Kinerja
                </h3>
              </div>
              
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(true)}
                className="text-xs font-mono bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>📊</span> Runtutan & Rangkuman Multi-Tahun (Lihat Semua)
              </button>
            </div>

            {/* 💡 KOTAK BRIEFING INTELLIGENCE ENGINE DARI BACKEND */}
            {backendSummary && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <div>
                  <b className="text-blue-300 font-mono block mb-0.5">Executive Intelligence Briefing (Otonom):</b>
                  <p className="text-slate-200 leading-relaxed font-sans">{backendSummary}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl space-y-0.5">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Total Target (24-27)</span>
                <h4 className="text-lg font-extrabold text-white font-mono">
                  {totalAllTarget > 0 ? `Rp ${totalAllTarget.toLocaleString("id-ID")}` : "Tercatat"}
                </h4>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl space-y-0.5">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Total Aktual (24-27)</span>
                <h4 className="text-lg font-extrabold text-cyan-400 font-mono">
                  {totalAllActual > 0 ? `Rp ${totalAllActual.toLocaleString("id-ID")}` : "Optimal"}
                </h4>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl space-y-0.5">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Kesehatan Performa</span>
                <h4 className={`text-lg font-extrabold font-mono ${Number(overallAchievementRate) >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {overallAchievementRate}% {Number(overallAchievementRate) >= 100 ? '🚀' : '⚠️'}
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2 shadow-xl">
                <div className="flex justify-between items-center text-xs font-mono border-b border-slate-800 pb-1.5">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">✨ Status Sinkronisasi Departemen:</span>
                  <span className="text-[10px] text-slate-400">Multi-Year Ready</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 space-y-1">
                  <div>📁 Total Data Item Terekam: <b className="text-cyan-400">{totalItemsCount} Baris</b></div>
                  <div>🏢 Departemen: <b className="text-white">{report?.department?.name || "Financial"}</b></div>
                  <div>⚡ Status Engine: <b className="text-emerald-400">Aktif & Terhubung ke DB</b></div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 p-4 rounded-xl space-y-2 shadow-xl flex flex-col justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                  <AlertTriangle size={15} /> Analisis & Solusi Otonom Lintas Tahun
                </div>
                
                {backendAnomalies.length > 0 || allAggregatedIssues.length > 0 ? (
                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                    {(backendAnomalies.length > 0 ? backendAnomalies : allAggregatedIssues).slice(0, 2).map((issue, idx) => (
                      <div key={idx} className="bg-slate-950/70 border border-amber-500/20 p-2.5 rounded-lg text-xs space-y-0.5">
                        <p className="text-white font-bold">⚠️ {issue.item || issue.title}</p>
                        <p className="text-slate-300 font-mono text-[11px]"><b>Solusi:</b> {issue.recommendation || issue.solution}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    "Seluruh indikator kinerja lintas tahun berada di jalur aman dan optimal tanpa adanya deviasi signifikan."
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. STRATEGIC NOTES */}
        {activeSlideData.type === "STRATEGIC_NOTES" && (
          <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn my-auto">
            <div className="border-b border-slate-800/80 pb-3 flex justify-between items-end">
              <div>
                <span className="text-xs font-mono text-purple-400 uppercase tracking-widest block mb-1">Executive Conclusion</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <CheckCircle2 className="text-purple-400" size={24} /> Kesimpulan & Rekomendasi Manajemen
                </h3>
              </div>
              <span className="text-xs font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3.5 py-1.5 rounded-xl font-semibold">
                Actionable Insights
              </span>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 p-6 rounded-2xl space-y-3 shadow-xl font-mono text-xs">
              <div className="text-xs text-purple-400 font-bold uppercase tracking-wider">Narasi Evaluasi & Tindak Lanjut:</div>
              <p className="text-slate-200 whitespace-pre-line leading-relaxed text-sm font-sans">
                {report?.achievementSummary || mJson.generalNotes || mJson.taxEvaluation || mJson.apEvaluation || "Seluruh operasional departemen berjalan selaras dengan target tahunan tanpa kendala esensial."}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* MODAL POPUP RUNTUTAN ALUR PENGOLAHAN DATA MULTI-TAHUN */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-4xl w-full space-y-5 shadow-2xl animate-fadeIn relative flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-base text-cyan-400">Runtutan Intelligence Engine (2024–2027)</h3>
                  <p className="text-xs text-slate-400">Alur rekapitulasi data lintas tahun departemen secara transparan.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDetailModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {targetYears.map(yr => {
                const rep = getReportForYear(yr);
                const items = rep ? (rep?.metricsJson?.salesPerformances || rep?.salesPerformances || []) : [];

                return (
                  <div key={yr} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-bold text-cyan-400 text-xs font-mono">📅 Tahun {yr} ({items.length} Item Terekam)</span>
                      <span className="text-[10px] text-slate-400">{rep ? 'Status: Sinkron' : 'Status: Belum Ada Data'}</span>
                    </div>

                    <div className="space-y-1.5">
                      {items.length > 0 ? items.map((item, idx) => (
                        <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center font-mono text-xs">
                          <span className="text-white font-bold">🔹 {item.salesName || item.name || `Item #${idx + 1}`}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-amber-400">Target: {item.targetVal || item.target || "-"}</span>
                            <span className="text-cyan-400">Aktual: {item.actualVal || item.actual || item.value || "-"}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="text-slate-500 italic text-xs py-2 text-center">Tidak ada rincian baris data pada tahun {yr}.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800 shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                Multi-Year Intelligence Engine — Aktif
              </span>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 text-xs bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Tutup & Kembali ke Presentasi 🚀
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer Navigation Bar Modern */}
      <div className="flex items-center justify-between px-8 py-4 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-xl z-20">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition cursor-pointer shadow-md"
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>

        <div className="hidden sm:flex items-center gap-1.5 py-1 overflow-x-auto max-w-md">
          {slidesConfig.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx
                  ? "w-8 bg-gradient-to-r from-amber-400 to-orange-400 shadow-md shadow-amber-500/40"
                  : "w-2 bg-slate-700/80 hover:bg-slate-600"
              }`}
              title={s.title}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-2 text-xs font-extrabold px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          Selanjutnya <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}