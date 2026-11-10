"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Truck, ArrowUpRight, Users, FileText, Calendar, Layers, Sparkles, Target, Zap, ShieldCheck, Award, AlertTriangle } from "lucide-react";

export default function OperationalHospitalityDeck({ report, allYearlyReports = {} }) {
  const targetYears = [2024, 2025, 2026, 2027];
  const metrics = report?.metricsJson || report || {};
  const performances = metrics.salesPerformances || report?.salesPerformances || [];

  // Ambil hasil Intelligence Analysis dari Backend (jika file Excel di-upload)
  const intelligenceAnalysis = metrics.intelligenceAnalysis || {};
  const backendAnomalies = intelligenceAnalysis.anomalies || [];
  const backendSummary = report?.achievementSummary || intelligenceAnalysis?.summary?.executiveSummary;

  // Helper untuk mengambil laporan berdasarkan tahun
  const getReportForYear = (yr) => {
    const matches = allYearlyReports[yr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === yr) : []);
    if (matches.length > 0) return matches[0];
    if (Number(report?.year) === yr) return report;
    return null;
  };

  // 9 Slide Tematik: Cover, Executive Summary & Efisiensi, Run (2024), Grow (2025), Transform (2026), Risk & Milestones, Outlook (2027), Multi-Year, Kesimpulan
  const totalSlides = 9;
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

  return (
    <div className="relative w-full min-h-[680px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-white select-none">
      
      {/* Background Vector Aesthetic */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-end justify-start p-10 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 w-full h-1/2 items-end">
          {["RUN (2024)", "GROW (2025)", "TRANSFORM (2026)", "FUTURE (2027)"].map((t, i) => (
            <div key={i} className="bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-t-xl opacity-20" style={{ height: `${(i + 1) * 25}%` }}></div>
          ))}
        </div>
      </div>

      {/* 1. Header Navigation Control Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-3.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Sparkles size={13} className="text-cyan-400 animate-pulse" /> OPERATIONAL DIRECTOR & MASTER DECK (2024–2027)
          </span>

          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block border-l border-slate-700 pl-3">
            {report?.plant?.name || "Cabang Cikarang & Retail"} · <b className="text-cyan-400">Run, Grow, Transform</b>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Calendar size={13} /> Bagian <span className="text-white">{currentSlide + 1}</span> / {totalSlides}
          </span>
          <div className="flex items-center gap-1 bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              title={isPlaying ? "Jeda Autoplay" : "Mulai Autoplay"}
            >
              {isPlaying ? <Pause size={15} className="text-cyan-400" /> : <Play size={15} />}
            </button>
            <button
              onClick={() => setCurrentSlide(0)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              title="Reset ke Slide Pertama"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Slide Content Viewport */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center relative z-10 transition-all duration-300 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        
        {/* SLIDE 0: COVER / INTRO */}
        {currentSlide === 0 && (
          <div className="w-full max-w-4xl mx-auto space-y-6 text-center animate-fadeIn">
            <div className="p-10 sm:p-12 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-md">
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest inline-block shadow-md">
                EXECUTIVE DIRECTOR PORTAL (2024 — 2027)
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-snug tracking-tight">
                Operational & Supply Chain Master Deck
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Arahan strategis operasional: Stabilitas harian & efisiensi biaya (Run), ekspansi kuota & gudang berikat (Grow), hingga transformasi automasi penuh (Transform) menuju tahun 2027.
              </p>
              
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto font-mono text-xs">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-cyan-400 font-bold block">2024: RUN</span>
                  <span className="text-[10px] text-slate-400">Stabilitas & Efisiensi</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-amber-400 font-bold block">2025: GROW</span>
                  <span className="text-[10px] text-slate-400">Inisiatif Strategis</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-purple-400 font-bold block">2026-27: TRANSFORM</span>
                  <span className="text-[10px] text-slate-400">Digital & Outlook</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={nextSlide}
                  className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-xl shadow-cyan-500/25 cursor-pointer"
                >
                  Mulai Paparan Direktur →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: EXECUTIVE SUMMARY & EFISIENSI */}
        {currentSlide === 1 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">Executive Portal</span>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <Award size={20} /> Visi Eksekutif & Metrik Efisiensi Biaya
                </h3>
              </div>
              <span className="text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3.5 py-1.5 rounded-xl font-semibold">
                Cost & Efficiency
              </span>
            </div>

            {/* 💡 INTELLIGENCE ENGINE BRIEFING DARI BACKEND */}
            {backendSummary && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <div>
                  <b className="text-blue-300 font-mono block mb-0.5">Intelligence Engine Briefing (Otonom):</b>
                  <p className="text-slate-200 leading-relaxed font-sans">{backendSummary}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-mono">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-xl">
                <span className="text-[11px] text-slate-400 block uppercase">Target Efisiensi</span>
                <p className="text-cyan-400 text-base font-black">{metrics.targetEfficiency ? `${metrics.targetEfficiency}%` : "95%"}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-xl">
                <span className="text-[11px] text-slate-400 block uppercase">Aktual Efisiensi</span>
                <p className="text-amber-400 text-base font-black">{metrics.actualEfficiency ? `${metrics.actualEfficiency}%` : "92%"}</p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-xl">
                <span className="text-[11px] text-slate-400 block uppercase">Cost Optimization</span>
                <p className="text-emerald-400 text-sm font-bold truncate">{metrics.costOptimization || "Optimal Terkendali"}</p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 font-mono space-y-1 shadow-xl">
              <span className="text-cyan-400 font-bold block uppercase tracking-wider">Executive Summary:</span>
              <p className="font-sans leading-relaxed">{metrics.executiveSummary || "Belum di-input oleh Direktur Operasional."}</p>
            </div>
          </div>
        )}

        {/* SLIDE 2: FASE 2024 - RUN (STABILITAS & EXCEL PERFORMANCES) */}
        {currentSlide === 2 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">Fase 1 | TAHUN 2024</span>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <Zap size={20} /> RUN: Stabilitas Harian & Logistik Supply Chain
                </h3>
              </div>
              <span className="text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3.5 py-1.5 rounded-xl font-semibold">
                {performances.length > 0 ? `${performances.length} Item Terekam` : "Operational Foundation"}
              </span>
            </div>

            {/* ⚠️ TAMPILKAN ANOMALI JIKA ADA */}
            {backendAnomalies.length > 0 && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-1 text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1 font-mono">
                  <AlertTriangle size={14} /> Peringatan Anomali & Deviasi Terdeteksi:
                </span>
                {backendAnomalies.map((anom, idx) => (
                  <p key={idx} className="text-slate-200 font-mono text-[11px]">
                    • <b>{anom.item}</b>: Target {anom.target}, Aktual {anom.actual} ({anom.achievement}) — <i className="text-amber-300">{anom.recommendation}</i>
                  </p>
                ))}
              </div>
            )}

            {performances.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {performances.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2 shadow-xl font-mono text-xs">
                    <span className="text-[10px] text-cyan-400 font-bold block uppercase">🔹 {item.salesName}</span>
                    <div className="flex justify-between text-slate-300">
                      <span>Target: <b className="text-amber-400">{item.targetVal}</b></span>
                      <span>Aktual: <b className="text-cyan-400">{item.actualVal}</b></span>
                    </div>
                    {item.note && <p className="text-[11px] text-slate-400 italic">Ket: {item.note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
                <span className="text-cyan-400 font-bold block uppercase">Kinerja Supply Chain & Manajemen Stok</span>
                <p className="text-slate-300 font-sans leading-relaxed">{metrics.supplyChainMetrics || "Distribusi logistik lintas cabang dan penagihan tukar faktur berjalan lancar sesuai SLA."}</p>
              </div>
            )}
          </div>
        )}

        {/* SLIDE 3: FASE 2025 - GROW (INISIATIF STRATEGIS) */}
        {currentSlide === 3 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-0.5">Fase 2 | TAHUN 2025</span>
                <h3 className="text-lg sm:text-xl font-bold text-amber-400 flex items-center gap-2">
                  <Target size={20} /> GROW: Inisiatif Strategis & Transformasi Proses
                </h3>
              </div>
              <span className="text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-xl font-semibold">
                Strategic Growth
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-amber-400 font-bold block uppercase">Inisiatif Strategis & Ekspansi</span>
              <p className="text-slate-300 font-sans leading-relaxed">{metrics.strategicInitiatives || "Pengembangan fasilitas gudang berikat, peningkatan kuota impor, dan perluasan mitra vendor strategis."}</p>
            </div>
          </div>
        )}

        {/* SLIDE 4: FASE 2026 - TRANSFORM (RISK MANAGEMENT & AUTOMATION) */}
        {currentSlide === 4 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-0.5">Fase 3 | TAHUN 2026</span>
                <h3 className="text-lg sm:text-xl font-bold text-purple-400 flex items-center gap-2">
                  <ShieldCheck size={20} /> TRANSFORM: Manajemen Risiko & Automasi Sistem
                </h3>
              </div>
              <span className="text-xs font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3.5 py-1.5 rounded-xl font-semibold">
                Risk & Mitigation
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-purple-400 font-bold block uppercase">Manajemen Risiko & Mitigasi Kendala Lapangan</span>
              <p className="text-slate-300 font-sans leading-relaxed">{metrics.riskManagement || "Evaluasi kendala operasional tahun berjalan dan penerapan langkah preventif guna menjaga kontinuitas plant."}</p>
            </div>
          </div>
        )}

        {/* SLIDE 5: KEY MILESTONES */}
        {currentSlide === 5 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block mb-0.5">Key Milestones</span>
                <h3 className="text-lg sm:text-xl font-bold text-emerald-400 flex items-center gap-2">
                  <Award size={20} /> Pencapaian Besar & Target Utama Tercapai
                </h3>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-xl font-semibold">
                Milestones
              </span>
            </div>
            <div className="bg-slate-900/90 border border-emerald-500/30 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-emerald-400 font-bold block uppercase">Milestone & Keberhasilan Operasional</span>
              <p className="text-slate-300 font-sans leading-relaxed">{metrics.keyMilestones || "Pencapaian target operasional tahunan dan efisiensi rantai pasok berhasil direalisasikan."}</p>
            </div>
          </div>
        )}

        {/* SLIDE 6: PROYEKSI 2027 - FUTURE OUTLOOK */}
        {currentSlide === 6 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block mb-0.5">Fase 4 | TAHUN 2027</span>
                <h3 className="text-lg sm:text-xl font-bold text-indigo-400 flex items-center gap-2">
                  <ArrowUpRight size={20} /> FUTURE OUTLOOK 2027: Proyeksi & Arahan Strategis
                </h3>
              </div>
              <span className="text-xs font-mono bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3.5 py-1.5 rounded-xl font-semibold">
                Strategic Horizon
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-indigo-400 font-bold block uppercase">Proyeksi Tahun Depan</span>
              <p className="text-slate-300 font-sans leading-relaxed">{metrics.nextYearOutlook || "Fokus peningkatan kapasitas plant dan otomatisasi penuh sistem logistik pada tahun 2027."}</p>
            </div>
          </div>
        )}

        {/* SLIDE 7: KOMPARASI DATA LINTAS TAHUN (2024–2027) */}
        {currentSlide === 7 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">Multi-Year Dashboard</span>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <Calendar size={20} /> Komparasi Target & Pencapaian (2024–2027)
                </h3>
              </div>
              <span className="text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3.5 py-1.5 rounded-xl font-semibold">
                Integrated View
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {targetYears.map(yr => {
                const rep = getReportForYear(yr);
                return (
                  <div key={yr} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2 text-center font-mono">
                    <span className="text-xs font-bold text-cyan-400 block">TAHUN {yr}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border inline-block ${rep ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                      {rep ? 'Aktif' : 'Belum Ada Data'}
                    </span>
                    <p className="text-[11px] text-slate-300 pt-1">
                      {yr === 2024 ? 'Fase Run' : yr === 2025 ? 'Fase Grow' : yr === 2026 ? 'Fase Transform' : 'Future Outlook'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDE 8: KESIMPULAN & CATATAN DIREKTUR OPERASIONAL */}
        {currentSlide === 8 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-0.5">Executive Conclusion</span>
                <h3 className="text-lg sm:text-xl font-bold text-purple-400 flex items-center gap-2">
                  <Sparkles size={20} /> Kesimpulan & Catatan Direktur Operasional
                </h3>
              </div>
              <span className="text-xs font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3.5 py-1.5 rounded-xl font-semibold">
                Actionable Insights
              </span>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 p-6 rounded-2xl space-y-3 shadow-xl font-mono text-xs">
              <div className="text-xs text-purple-400 font-bold uppercase tracking-wider">Catatan & Evaluasi Bebas:</div>
              <p className="text-slate-200 whitespace-pre-line leading-relaxed text-sm font-sans">
                {metrics.generalNotes || backendSummary || "Seluruh rangkaian arahan strategis operasional berjalan optimal untuk memastikan pertumbuhan, efisiensi biaya, dan keunggulan perusahaan."}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 3. Bottom Footer Navigation Controls */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md z-10 shrink-0">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition cursor-pointer"
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx
                  ? "w-8 bg-cyan-400 shadow-md shadow-cyan-500/40"
                  : "w-2.5 bg-slate-700 hover:bg-slate-600"
              }`}
              title={`Bagian ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Selanjutnya <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}