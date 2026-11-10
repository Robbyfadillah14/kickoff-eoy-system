"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Box, Cpu, Rocket, Sparkles, Target, Zap } from "lucide-react";

export default function ProductDevelopmentDeck({ report, allYearlyReports = {} }) {
  const targetYears = [2024, 2025, 2026, 2027];
  const metrics = report?.metricsJson || report || {};
  const performances = metrics.salesPerformances || report?.salesPerformances || [];

  const getReportForYear = (yr) => {
    const matches = allYearlyReports[yr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === yr) : []);
    if (matches.length > 0) return matches[0];
    if (Number(report?.year) === yr) return report;
    return null;
  };

  const totalSlides = 6;
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
    <div className="relative w-full h-[580px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-white select-none">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/40 px-3 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Box size={12} /> PRODUCT DEVELOPMENT ROADMAP (2024–2027)
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block border-l border-slate-700 pl-3">
            {report?.plant?.name || "R&D Department"} · <b className="text-orange-400">Run, Grow, Transform</b>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-orange-400 font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            Slide <span className="text-white">{currentSlide + 1}</span> / {totalSlides}
          </span>
          <div className="flex items-center gap-1 bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause size={14} className="text-orange-400" /> : <Play size={14} />}
            </button>
            <button onClick={() => setCurrentSlide(0)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Viewport - Strict Landscape Fit tanpa scroll */}
      <div className="flex-1 px-8 py-4 flex flex-col justify-center relative z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        
        {/* SLIDE 0: COVER */}
        {currentSlide === 0 && (
          <div className="w-full max-w-3xl mx-auto space-y-4 text-center animate-fadeIn">
            <div className="p-8 sm:p-10 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-950/80 via-slate-900 to-slate-950 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-md">
              <span className="text-[10px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/40 px-3.5 py-1 rounded-full font-bold uppercase tracking-widest inline-block">
                INNOVATION & R&D ROADMAP (2024–2027)
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                Product Development & R&D Strategy
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                Pengembangan produk berkelanjutan: Stabilisasi kualitas core produk (Run), diversifikasi varian & ekspansi fitur (Grow), hingga inovasi teknologi mutakhir berbasis sistem cerdas (Transform).
              </p>
              <div className="pt-2">
                <button onClick={nextSlide} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-xl shadow-orange-500/25 cursor-pointer">
                  Mulai Paparan Produk →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: FASE 2024 - RUN */}
        {currentSlide === 1 && (
          <div className="w-full max-w-4xl mx-auto space-y-3 animate-fadeIn">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest block mb-0.5">Fase 1 | TAHUN 2024</span>
                <h3 className="text-base sm:text-lg font-bold text-orange-400 flex items-center gap-2">
                  <Zap size={18} /> RUN: Stabilisasi Kualitas & Rekapitulasi Data Excel
                </h3>
              </div>
              <span className="text-[11px] font-mono bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-lg font-semibold">
                {performances.length} Item Terekam
              </span>
            </div>

            {performances.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {performances.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1.5 shadow-xl font-mono text-xs">
                    <span className="text-[10px] text-orange-400 font-bold block uppercase truncate">🔹 {item.salesName}</span>
                    <div className="flex justify-between text-slate-300 text-[11px]">
                      <span>Target: <b className="text-amber-400">{item.targetVal}</b></span>
                      <span>Aktual: <b className="text-cyan-400">{item.actualVal}</b></span>
                    </div>
                    {item.note && <p className="text-[10px] text-slate-400 italic truncate">Ket: {item.note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1.5 shadow-xl">
                  <span className="text-[10px] text-orange-400 font-bold block uppercase">Riset & Launching Produk Baru</span>
                  <p className="text-white text-sm font-bold">{metrics.newProductLaunch || "Belum di-input"}</p>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-1.5 shadow-xl">
                  <span className="text-[10px] text-orange-400 font-bold block uppercase">Pengujian Sampel & Kepatuhan</span>
                  <p className="text-white text-sm font-bold">{metrics.sampleTesting || "Belum di-input"}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SLIDE 2: FASE 2025 - GROW */}
        {currentSlide === 2 && (
          <div className="w-full max-w-3xl mx-auto space-y-3 animate-fadeIn">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-0.5">Fase 2 | TAHUN 2025</span>
                <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
                  <Target size={18} /> GROW: Diversifikasi Fitur & Ekspansi Varian
                </h3>
              </div>
              <span className="text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-lg font-semibold">
                Expansion
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-amber-400 font-bold block uppercase">Evaluasi & Pengembangan Produk 2025</span>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                {metrics.productDevEvaluation || "Perluasan varian produk dan penyempurnaan sampel berdasarkan masukan dari pasar dan standar regulasi."}
              </p>
            </div>
          </div>
        )}

        {/* SLIDE 3: FASE 2026 - TRANSFORM */}
        {currentSlide === 3 && (
          <div className="w-full max-w-3xl mx-auto space-y-3 animate-fadeIn">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-0.5">Fase 3 | TAHUN 2026</span>
                <h3 className="text-base sm:text-lg font-bold text-purple-400 flex items-center gap-2">
                  <Cpu size={18} /> TRANSFORM: Integrasi Teknologi & Automasi R&D
                </h3>
              </div>
              <span className="text-[11px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-1 rounded-lg font-semibold">
                Next-Gen Tech
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-purple-400 font-bold block uppercase">Inovasi Sistem & Digitalisasi R&D</span>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                Penerapan sistem manajemen data riset terpusat dan otomatisasi formulasi untuk mempercepat siklus peluncuran produk baru ke pasar.
              </p>
            </div>
          </div>
        )}

        {/* SLIDE 4: OUTLOOK 2027 */}
        {currentSlide === 4 && (
          <div className="w-full max-w-3xl mx-auto space-y-3 animate-fadeIn">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">Fase 4 | TAHUN 2027</span>
                <h3 className="text-base sm:text-lg font-bold text-cyan-400 flex items-center gap-2">
                  <Rocket size={18} /> FUTURE OUTLOOK 2027: Global Standard Ecosystem
                </h3>
              </div>
              <span className="text-[11px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3 py-1 rounded-lg font-semibold">
                Vision
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-cyan-400 font-bold block uppercase">Ekosistem Produk Kelas Dunia</span>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                Pengembangan lini produk unggulan yang memenuhi standar mutu internasional dan siap bersaing di pasar global secara berkelanjutan.
              </p>
            </div>
          </div>
        )}

        {/* SLIDE 5: KESIMPULAN */}
        {currentSlide === 5 && (
          <div className="w-full max-w-3xl mx-auto space-y-3 animate-fadeIn">
            <div className="border-b border-slate-800 pb-2 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest block mb-0.5">Executive Conclusion</span>
                <h3 className="text-base sm:text-lg font-bold text-orange-400 flex items-center gap-2">
                  <Sparkles size={18} /> Kesimpulan & Rekomendasi R&D
                </h3>
              </div>
            </div>
            <div className="bg-slate-900/90 border border-orange-500/30 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <p className="text-slate-200 leading-relaxed font-sans text-xs">
                {metrics.generalNotes || "Roadmap pengembangan produk dari 2024 hingga 2027 dirancang sistematis untuk memastikan kualitas produk, inovasi varian, dan adopsi teknologi terdepan."}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md z-10 shrink-0">
        <button onClick={prevSlide} disabled={currentSlide === 0} className="flex items-center gap-1 text-xs font-semibold px-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 text-white transition cursor-pointer">
          <ChevronLeft size={15} /> Sebelumnya
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2 rounded-full transition-all cursor-pointer ${currentSlide === idx ? "w-6 bg-orange-400" : "w-2 bg-slate-700"}`} />
          ))}
        </div>
        <button onClick={nextSlide} disabled={currentSlide === totalSlides - 1} className="flex items-center gap-1 text-xs font-semibold px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold disabled:opacity-30 transition cursor-pointer">
          Selanjutnya <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}