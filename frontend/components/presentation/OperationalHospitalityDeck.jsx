"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Truck, ArrowUpRight, 
  Users, FileText, Calendar, Layers, Sparkles, Target, Zap, ShieldCheck, 
  Award, AlertTriangle, Package, FileCheck, TrendingUp, ShieldAlert 
} from "lucide-react";

export default function OperationalHospitalityDeck({ report, allYearlyReports = {}, departmentReports = {} }) {
  const targetYears = [2024, 2025, 2026, 2027];
  
  // Gabungkan metrics dari report utama (Ops Director) atau fallback ke report biasa
  const metrics = report?.metricsJson || report || {};
  const performances = metrics.salesPerformances || report?.salesPerformances || [];
  const backendSummary = report?.achievementSummary || metrics.intelligenceAnalysis?.summary?.executiveSummary;
  const backendAnomalies = metrics.intelligenceAnalysis?.anomalies || [];

  // 1. AUTO RISK RADAR (Membaca point-point kritis dari form)
  const risks = useMemo(() => {
    const detected = [];
    // HR & MR
    if (metrics.turnoverRate) {
      const tr = parseFloat(metrics.turnoverRate);
      if (tr > 2) detected.push({ dept: "HR/MR", sev: "high", msg: `Turnover rate ${tr}% melebihi batas toleransi 2%` });
    }
    if (metrics.absenteeismRate && parseFloat(metrics.absenteeismRate) > 1) {
      detected.push({ dept: "HR/MR", sev: "med", msg: `Absenteeism rate melebihi target 1%` });
    }
    // Logistic
    if (metrics.logisticError && parseFloat(metrics.logisticError) > 0) {
      detected.push({ dept: "Logistik", sev: "high", msg: `Error delivery ${metrics.logisticError}% (Target: 0%)` });
    }
    if (metrics.logisticOtd && parseFloat(metrics.logisticOtd) < 99) {
      detected.push({ dept: "Logistik", sev: "med", msg: `On-Time Delivery ${metrics.logisticOtd}% di bawah target 99%` });
    }
    // Purchasing
    if (metrics.supplierOtd && parseFloat(metrics.supplierOtd) < 98) {
      detected.push({ dept: "Purchasing", sev: "high", msg: `Supplier OTD ${metrics.supplierOtd}% di bawah target 98%` });
    }
    // Admin Logistic
    if (metrics.cancelInvTarget) {
      const match = String(metrics.cancelInvTarget).match(/\d+/);
      if (match && parseInt(match[0]) > 150) {
        detected.push({ dept: "Admin Logistic", sev: "high", msg: `Cancel invoice ${match[0]} dokumen melebihi target max 150` });
      }
    }
    // Exim
    if (metrics.pabeanCompliance && /cancel|error|pending/i.test(metrics.pabeanCompliance)) {
      detected.push({ dept: "Exim", sev: "med", msg: "Terdapat indikasi kendala dokumen pabean (cancel/error/pending)" });
    }
    return detected;
  }, [metrics]);

  const totalSlides = 9;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % totalSlides), [totalSlides]);
  const prevSlide = useCallback(() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides), [totalSlides]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
      else if (e.key === "Escape") setIsPlaying(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => nextSlide(), 10000); // 10 detik per slide biar cukup baca
    }
    return () => clearInterval(timer);
  }, [isPlaying, nextSlide]);

  return (
    <div className="relative w-full min-h-[680px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-white select-none">
      
      {/* Background Aesthetic */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-end justify-start p-10 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 w-full h-1/2 items-end">
          {["RUN", "GROW", "TRANSFORM", "FUTURE"].map((t, i) => (
            <div key={i} className="bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-t-xl opacity-20" style={{ height: `${(i + 1) * 25}%` }}></div>
          ))}
        </div>
      </div>

      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 px-3.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Sparkles size={13} className="text-indigo-400 animate-pulse" /> Operational Master Deck (2024–2027)
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block border-l border-slate-700 pl-3">
            {report?.plant?.name || "Consolidated Ops"} · <b className="text-indigo-400">Run, Grow, Transform</b>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-indigo-400 font-bold flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Calendar size={13} /> Slide <span className="text-white">{currentSlide + 1}</span> / {totalSlides}
          </span>
          <div className="flex items-center gap-1 bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause size={15} className="text-indigo-400" /> : <Play size={15} />}
            </button>
            <button onClick={() => setCurrentSlide(0)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer">
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Slide Content Viewport */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center relative z-10 transition-all duration-300 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        
        {/* SLIDE 0: COVER */}
        {currentSlide === 0 && (
          <div className="w-full max-w-4xl mx-auto space-y-6 text-center animate-fadeIn">
            <div className="p-10 sm:p-12 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-md">
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest inline-block shadow-md">
                EXECUTIVE OPERATIONAL PORTAL
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-snug tracking-tight">
                Operational & Supply Chain Master Deck
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Arahan strategis operasional: Stabilitas harian (Run), ekspansi & efisiensi (Grow), hingga transformasi automasi penuh (Transform) menuju 2027.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto font-mono text-xs">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-cyan-400 font-bold block">2024: RUN</span>
                  <span className="text-[10px] text-slate-400">Stabilitas & SLA</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-amber-400 font-bold block">2025: GROW</span>
                  <span className="text-[10px] text-slate-400">Ekspansi & SDM</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <span className="text-purple-400 font-bold block">2026-27: TRANSFORM</span>
                  <span className="text-[10px] text-slate-400">Digital & Outlook</span>
                </div>
              </div>
              <button onClick={nextSlide} className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:brightness-110 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-xl shadow-indigo-500/25 cursor-pointer">
                Mulai Paparan Direktur →
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 1: EXECUTIVE SUMMARY & EFISIENSI */}
        {currentSlide === 1 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block mb-0.5">Executive Portal</span>
                <h3 className="text-lg sm:text-xl font-bold text-indigo-400 flex items-center gap-2">
                  <Award size={20} /> Visi Eksekutif & Metrik Efisiensi Biaya
                </h3>
              </div>
            </div>
            {backendSummary && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <div>
                  <b className="text-blue-300 font-mono block mb-0.5">Intelligence Briefing:</b>
                  <p className="text-slate-200 leading-relaxed font-sans">{backendSummary}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-mono">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-xl">
                <span className="text-[11px] text-slate-400 block uppercase">Target Efisiensi</span>
                <p className="text-indigo-400 text-base font-black">{metrics.targetEfficiency ? `${metrics.targetEfficiency}%` : "95%"}</p>
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
              <span className="text-indigo-400 font-bold block uppercase tracking-wider">Executive Summary:</span>
              <p className="font-sans leading-relaxed">{metrics.executiveSummary || "Belum di-input oleh Direktur Operasional."}</p>
            </div>
          </div>
        )}

        {/* SLIDE 2: FASE 2024 - RUN (LOGISTIC & PURCHASING BASELINE) */}
        {currentSlide === 2 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">Fase 1 | TAHUN 2024</span>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <Truck size={20} /> RUN: Stabilitas Supply Chain & Logistik
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Logistic Metrics */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase"><Package size={14}/> Metrik Logistik</div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400">On-Time Delivery</span>
                    <span className={parseFloat(metrics.logisticOtd) >= 99 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {metrics.logisticOtd || "99%"} <span className="text-[10px] text-slate-500">(Target 99%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400">Error Delivery</span>
                    <span className={parseFloat(metrics.logisticError) === 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {metrics.logisticError || "0%"} <span className="text-[10px] text-slate-500">(Target 0%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400">Total DO</span>
                    <span className="text-white font-bold">{metrics.totalDo || "-"}</span>
                  </div>
                </div>
              </div>
              {/* Purchasing Metrics */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase"><TrendingUp size={14}/> Metrik Purchasing</div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400">Supplier OTD</span>
                    <span className={parseFloat(metrics.supplierOtd) >= 98 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {metrics.supplierOtd || "98%"} <span className="text-[10px] text-slate-500">(Target 98%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400">Landing Cost (LC)</span>
                    <span className="text-white font-bold">{metrics.updateLc || "Target 5.5%"}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400">New Supplier Dev</span>
                    <span className="text-emerald-400 font-bold">{metrics.newSupplierDev || "Min. 2"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: FASE 2025 - GROW (HR, EXIM & ADMIN) */}
        {currentSlide === 3 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-0.5">Fase 2 | TAHUN 2025</span>
                <h3 className="text-lg sm:text-xl font-bold text-amber-400 flex items-center gap-2">
                  <Users size={20} /> GROW: SDM, Kepatuhan & Ekspansi
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* HR & MR */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-xl text-xs font-mono">
                <div className="text-rose-400 font-bold uppercase flex items-center gap-1"><Users size={12}/> HR & MR</div>
                <div className="flex justify-between"><span className="text-slate-400">Manpower Ach</span><span className="text-white">{metrics.manpowerAch || "100%"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Turnover Rate</span><span className={parseFloat(metrics.turnoverRate) > 2 ? "text-rose-400" : "text-emerald-400"}>{metrics.turnoverRate || "< 2%"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Absenteeism</span><span className="text-white">{metrics.absenteeismRate || "< 1%"}</span></div>
                <div className="pt-1 text-[10px] text-slate-500 italic truncate">{metrics.isoStatus || "ISO Audit Terjadwal"}</div>
              </div>
              {/* Exim */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-xl text-xs font-mono">
                <div className="text-cyan-400 font-bold uppercase flex items-center gap-1"><FileCheck size={12}/> Exim</div>
                <div className="flex justify-between"><span className="text-slate-400">Kuota Import</span><span className="text-white truncate">{metrics.importQuotaStatus || "Aman"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Gudang Berikat</span><span className="text-white">{metrics.gbCustomerTarget || "Min 10"}</span></div>
                <div className="pt-1 text-[10px] text-slate-500 italic truncate">{metrics.pabeanCompliance || "Zero Cancel BC"}</div>
              </div>
              {/* Admin Logistic */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-xl text-xs font-mono">
                <div className="text-indigo-400 font-bold uppercase flex items-center gap-1"><FileText size={12}/> Admin Log</div>
                <div className="flex justify-between"><span className="text-slate-400">Total DO/INV</span><span className="text-white">{metrics.totalDoInvCreated || "-"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Cancel Inv</span><span className={String(metrics.cancelInvTarget).match(/\d+/)?.[0] > 150 ? "text-rose-400" : "text-emerald-400"}>{metrics.cancelInvTarget || "Max 150"}</span></div>
                <div className="pt-1 text-[10px] text-slate-500 italic truncate">{metrics.poSoftcopyArch || "Arsip 100%"}</div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: RISK RADAR (AUTO-DETECTED) */}
        {currentSlide === 4 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest block mb-0.5">System Intelligence</span>
                <h3 className="text-lg sm:text-xl font-bold text-rose-400 flex items-center gap-2">
                  <ShieldAlert size={20} /> Risk Radar & Mitigasi Kendala
                </h3>
              </div>
              <span className="text-xs font-mono bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3.5 py-1.5 rounded-xl font-semibold">
                {risks.length} Isu Terdeteksi
              </span>
            </div>
            
            {risks.length > 0 ? (
              <div className="space-y-2">
                {risks.map((r, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${r.sev === "high" ? "bg-rose-950/30 border-rose-500/40" : "bg-amber-950/30 border-amber-500/40"}`}>
                    <AlertTriangle size={18} className={r.sev === "high" ? "text-rose-400 shrink-0 mt-0.5" : "text-amber-400 shrink-0 mt-0.5"} />
                    <div>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${r.sev === "high" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"}`}>
                        {r.dept}
                      </span>
                      <p className="text-sm text-slate-200 mt-1 font-sans">{r.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-400" />
                <p className="text-sm text-emerald-200 font-sans">Seluruh indikator operasional (HR, Logistik, Purchasing, Admin) berada dalam batas toleransi aman.</p>
              </div>
            )}

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 font-mono space-y-1 shadow-xl mt-2">
              <span className="text-indigo-400 font-bold block uppercase tracking-wider">Catatan Mitigasi (Risk Management):</span>
              <p className="font-sans leading-relaxed">{metrics.riskManagement || "Evaluasi kendala operasional tahun berjalan dan penerapan langkah preventif guna menjaga kontinuitas plant."}</p>
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
                  <Award size={20} /> Pencapaian Besar & Target Utama
                </h3>
              </div>
            </div>
            <div className="bg-slate-900/90 border border-emerald-500/30 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-emerald-400 font-bold block uppercase">Milestone & Keberhasilan Operasional</span>
              <p className="text-slate-300 font-sans leading-relaxed text-sm">{metrics.keyMilestones || "Pencapaian target operasional tahunan dan efisiensi rantai pasok berhasil direalisasikan."}</p>
            </div>
            {/* Strategic Initiatives */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-amber-400 font-bold block uppercase">Inisiatif Strategis & Transformasi</span>
              <p className="text-slate-300 font-sans leading-relaxed text-sm">{metrics.strategicInitiatives || "Pengembangan fasilitas gudang berikat, peningkatan kuota impor, dan perluasan mitra vendor strategis."}</p>
            </div>
          </div>
        )}

        {/* SLIDE 6: PROYEKSI 2027 - FUTURE OUTLOOK */}
        {currentSlide === 6 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-0.5">Fase 4 | TAHUN 2027</span>
                <h3 className="text-lg sm:text-xl font-bold text-purple-400 flex items-center gap-2">
                  <ArrowUpRight size={20} /> FUTURE OUTLOOK: Proyeksi & Arahan
                </h3>
              </div>
            </div>
            <div className="bg-slate-900/90 border border-purple-500/30 p-5 rounded-2xl space-y-2 shadow-xl font-mono text-xs">
              <span className="text-purple-400 font-bold block uppercase">Proyeksi Tahun Depan</span>
              <p className="text-slate-300 font-sans leading-relaxed text-sm">{metrics.nextYearOutlook || "Fokus peningkatan kapasitas plant dan otomatisasi penuh sistem logistik pada tahun 2027."}</p>
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
                  <Layers size={20} /> Komparasi Target & Pencapaian (2024–2027)
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {targetYears.map(yr => {
                // Coba ambil data tahun tersebut dari allYearlyReports
                const rep = Array.isArray(allYearlyReports) 
                  ? allYearlyReports.find(r => Number(r.year) === yr) 
                  : allYearlyReports[yr];
                const m = rep?.metricsJson || rep || {};
                
                return (
                  <div key={yr} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2 text-center font-mono">
                    <span className="text-xs font-bold text-cyan-400 block">TAHUN {yr}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border inline-block ${rep ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                      {rep ? 'Data Tersedia' : 'Belum Ada'}
                    </span>
                    <div className="pt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-400"><span>Efisiensi:</span> <span className="text-white">{m.actualEfficiency || "-"}</span></div>
                      <div className="flex justify-between text-slate-400"><span>Logistik OTD:</span> <span className="text-white">{m.logisticOtd || "-"}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDE 8: KESIMPULAN & CATATAN */}
        {currentSlide === 8 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn max-h-[460px] overflow-y-auto pr-1">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block mb-0.5">Executive Conclusion</span>
                <h3 className="text-lg sm:text-xl font-bold text-indigo-400 flex items-center gap-2">
                  <Sparkles size={20} /> Kesimpulan & Catatan Direktur Operasional
                </h3>
              </div>
            </div>
            <div className="bg-slate-900/90 border border-indigo-500/30 p-6 rounded-2xl space-y-3 shadow-xl font-mono text-xs">
              <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Catatan & Evaluasi Bebas:</div>
              <p className="text-slate-200 whitespace-pre-line leading-relaxed text-sm font-sans">
                {metrics.generalNotes || backendSummary || "Seluruh rangkaian arahan strategis operasional berjalan optimal untuk memastikan pertumbuhan, efisiensi biaya, dan keunggulan perusahaan."}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 3. Bottom Footer Navigation Controls */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md z-10 shrink-0">
        <button onClick={prevSlide} disabled={currentSlide === 0} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition cursor-pointer">
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2.5 rounded-full transition-all cursor-pointer ${currentSlide === idx ? "w-8 bg-indigo-400 shadow-md shadow-indigo-500/40" : "w-2.5 bg-slate-700 hover:bg-slate-600"}`} title={`Bagian ${idx + 1}`} />
          ))}
        </div>
        <button onClick={nextSlide} disabled={currentSlide === totalSlides - 1} className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
          Selanjutnya <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}