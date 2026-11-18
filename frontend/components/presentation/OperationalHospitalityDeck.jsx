"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, 
  Activity, ShieldCheck, Zap, Package, Truck, Users, 
  FileText, Globe, AlertTriangle, CheckCircle2, Award, 
  Clock, Target, TrendingUp, TrendingDown
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  HELPERS & UTILS                                                    */
/* ------------------------------------------------------------------ */
const toNum = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const fmtAch = (v) => (v > 999 ? ">999%" : `${v.toFixed(0)}%`);

const STAGE_W = 1360;
const STAGE_H = 720;

/* ------------------------------------------------------------------ */
/*  MODERN UI COMPONENTS                                               */
/* ------------------------------------------------------------------ */
function EmptyState({ label }) {
  return (
    <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30">
      <FileText size={24} className="text-slate-600 mb-2" />
      <span className="text-xs font-medium text-slate-500">Menunggu input data {label}...</span>
    </div>
  );
}

function KpiCard({ label, value, target, icon: Icon, color, isGood }) {
  const colors = {
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400",
    indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400",
    violet: "from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-400",
  };
  
  const hasValue = value && String(value).trim() !== "" && String(value) !== "0";

  if (!hasValue) return <EmptyState label={label} />;

  return (
    <div className={`relative p-5 rounded-2xl border bg-gradient-to-br ${colors[color]} flex flex-col justify-between h-full`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl bg-slate-950/50`}>
          <Icon size={20} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${isGood ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
          {isGood ? "Optimal" : "Review"}
        </span>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-3xl font-black text-white leading-none mb-1">{value}</div>
        {target && <div className="text-[11px] text-slate-500">Target: {target}</div>}
      </div>
    </div>
  );
}

function InsightBlock({ title, text, color = "slate" }) {
  const colors = {
    slate: "border-slate-700 bg-slate-900/50 text-slate-300",
    cyan: "border-cyan-500/30 bg-cyan-950/20 text-cyan-100",
    amber: "border-amber-500/30 bg-amber-950/20 text-amber-100",
  };
  if (!text || String(text).trim() === "") return <EmptyState label="Catatan Evaluasi" />;
  
  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} h-full`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className={color === "slate" ? "text-slate-400" : `text-${color}-400`} />
        <span className="text-sm font-bold uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */
export default function OperationalHospitalityDeck({ report, allYearlyReports = {} }) {
  const currentYr = 2026; // Fokus presentasi ke tahun terbaru
  const slideLabels = [
    "1. Executive Command", 
    "2. Human Capital (HR)", 
    "3. Procurement (Purchasing)", 
    "4. Logistics & Warehouse", 
    "5. Administrative Precision", 
    "6. Global Trade (Exim)", 
    "7. Horizon 2027"
  ];
  const totalSlides = slideLabels.length;
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth / STAGE_W, 1));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") setCurrentSlide((p) => (p + 1) % totalSlides);
      else if (e.key === "ArrowLeft") setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSlides]);

  useEffect(() => {
    let timer;
    if (isPlaying) timer = setInterval(() => setCurrentSlide((p) => (p + 1) % totalSlides), 12000);
    return () => clearInterval(timer);
  }, [isPlaying, totalSlides]);

  // Ambil data tahun 2026 (atau tahun terbaru yang tersedia)
  const data = useMemo(() => {
    const matches = allYearlyReports[currentYr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === currentYr) : []);
    const rep = matches.length > 0 ? matches[0] : (Number(report?.year) === currentYr ? report : null);
    const m = rep?.metricsJson || rep || {};
    const hasData = !!rep;

    return {
      hasData,
      // Director
      actualEfficiency: m.actualEfficiency || "",
      costOptimization: m.costOptimization || "",
      executiveSummary: m.executiveSummary || "",
      riskManagement: m.riskManagement || "",
      // HR
      manpowerAch: m.manpowerAch || "",
      turnoverRate: m.turnoverRate || "",
      absenteeismRate: m.absenteeismRate || "",
      isoStatus: m.isoStatus || "",
      hrEvaluation: m.hrEvaluation || "",
      // Purchasing
      supplierOtd: m.supplierOtd || "",
      updateLc: m.updateLc || "",
      newSupplierDev: m.newSupplierDev || "",
      purchasingEvaluation: m.purchasingEvaluation || "",
      // Logistic
      logisticOtd: m.logisticOtd || "",
      logisticError: m.logisticError || "",
      totalDo: m.totalDo || m.totalDoInvCreated || "",
      logisticEvaluation: m.logisticEvaluation || "",
      // Admin
      cancelInvTarget: m.cancelInvTarget || "",
      cancelInvAnalysis: m.cancelInvAnalysis || "",
      tfLuarKotaAch: m.tfLuarKotaAch || "",
      tfEmailSistemAch: m.tfEmailSistemAch || "",
      adminTfEvaluation: m.adminTfEvaluation || "",
      // Exim
      importQuotaStatus: m.importQuotaStatus || "",
      gbCustomerTarget: m.gbCustomerTarget || "",
      eximEvaluation: m.eximEvaluation || "",
      // 2027
      nextYearOutlook: m.nextYearOutlook || m.strategicInitiatives || "",
      keyMilestones: m.keyMilestones || "",
    };
  }, [allYearlyReports, report, currentYr]);

  // Auto Risk Detection
  const risks = useMemo(() => {
    const detected = [];
    if (!data.hasData) return detected;
    if (toNum(data.cancelInvTarget) > 150) detected.push({ dept: "Admin Logistic", msg: `Cancel invoice tinggi (${data.cancelInvTarget} > 150).` });
    if (toNum(data.turnoverRate) > 2) detected.push({ dept: "HR & MR", msg: `Turnover rate melebihi batas (${data.turnoverRate}% > 2%).` });
    const evalText = (data.logisticEvaluation + " " + data.purchasingEvaluation + " " + data.hrEvaluation).toLowerCase();
    if (evalText.includes("urgent") || evalText.includes("telat") || evalText.includes("kendala")) {
      detected.push({ dept: "Operasional", msg: "Terdapat catatan kendala operasional (urgent/telat)." });
    }
    return detected;
  }, [data]);

  return (
    <div className="relative w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-slate-200">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">Operational Excellence</div>
            <div className="text-sm text-slate-300 font-medium">{report?.plant?.name || "Consolidated Operations"} · FY {currentYr}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 font-mono">Slide <span className="text-cyan-400 font-bold">{currentSlide + 1}</span> / {totalSlides}</span>
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause size={16} className="text-cyan-400" /> : <Play size={16} />}
            </button>
            <button onClick={() => setCurrentSlide(0)} className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* VIEWPORT (Fixed 1360x720 Aspect Ratio) */}
      <div className="flex-1 flex items-center justify-center p-4 z-10 w-full bg-slate-950">
        <div ref={stageRef} className="w-full rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5" style={{ maxWidth: "100%", height: STAGE_H * scale }}>
          <div className="relative bg-slate-950 overflow-hidden" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            
            {/* ==================== SLIDE 1: EXECUTIVE COMMAND ==================== */}
            {currentSlide === 0 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h1 className="text-4xl font-black text-white tracking-tight">Executive Command Center</h1>
                  <p className="text-slate-400 mt-1">Ringkasan kinerja operasional tingkat direktur</p>
                </div>
                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="col-span-2 grid grid-cols-3 gap-6">
                    <KpiCard label="Efisiensi Aktual" value={data.actualEfficiency} target="≥ 95%" icon={Activity} color="indigo" isGood={toNum(data.actualEfficiency) >= 95} />
                    <KpiCard label="Cost Optimization" value={data.costOptimization} target="Optimal" icon={TrendingDown} color="emerald" isGood={true} />
                    <KpiCard label="Total Risiko Aktif" value={String(risks.length)} target="0" icon={AlertTriangle} color={risks.length > 0 ? "amber" : "emerald"} isGood={risks.length === 0} />
                  </div>
                  <InsightBlock title="Executive Summary" text={data.executiveSummary} color="cyan" />
                  <InsightBlock title="Risk Management & Mitigasi" text={data.riskManagement} color="amber" />
                </div>
              </div>
            )}

            {/* ==================== SLIDE 2: HUMAN CAPITAL (HR) ==================== */}
            {currentSlide === 1 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Users size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Human Capital & Compliance</h1>
                    <p className="text-slate-400">HR & Management Representative</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 flex-1">
                  <KpiCard label="Manpower Achievement" value={data.manpowerAch} target="100%" icon={Users} color="emerald" isGood={toNum(data.manpowerAch) >= 100} />
                  <KpiCard label="Turnover Rate" value={data.turnoverRate} target="Max 2%" icon={TrendingDown} color={toNum(data.turnoverRate) <= 2 ? "emerald" : "amber"} isGood={toNum(data.turnoverRate) <= 2} />
                  <KpiCard label="Absenteeism Rate" value={data.absenteeismRate} target="Max 1%" icon={Clock} color={toNum(data.absenteeismRate) <= 1 ? "emerald" : "amber"} isGood={toNum(data.absenteeismRate) <= 1} />
                  <div className="col-span-2">
                    <InsightBlock title="Evaluasi HR & MR" text={data.hrEvaluation} color="slate" />
                  </div>
                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-center items-center text-center">
                    <ShieldCheck size={40} className="text-indigo-400 mb-3" />
                    <div className="text-lg font-bold text-white mb-1">Status ISO & Audit</div>
                    <div className="text-sm text-slate-400">{data.isoStatus || "Menunggu input data..."}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SLIDE 3: PROCUREMENT (PURCHASING) ==================== */}
            {currentSlide === 2 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><Package size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Procurement & Supply Chain</h1>
                    <p className="text-slate-400">Purchasing Department</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 flex-1">
                  <KpiCard label="Supplier OTD" value={data.supplierOtd} target="≥ 98%" icon={Truck} color="cyan" isGood={toNum(data.supplierOtd) >= 98} />
                  <KpiCard label="Landing Cost (LC)" value={data.updateLc} target="≤ 5.5%" icon={TrendingDown} color="emerald" isGood={toNum(data.updateLc) <= 5.5} />
                  <KpiCard label="New Supplier Dev" value={data.newSupplierDev} target="Min. 2" icon={Users} color="indigo" isGood={toNum(data.newSupplierDev) >= 2} />
                  <div className="col-span-3">
                    <InsightBlock title="Evaluasi Pengadaan & Rantai Pasok" text={data.purchasingEvaluation} color="cyan" />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SLIDE 4: LOGISTICS & WAREHOUSE ==================== */}
            {currentSlide === 3 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Truck size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Logistics & Warehouse</h1>
                    <p className="text-slate-400">Operasional Gudang & Distribusi</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 flex-1">
                  <KpiCard label="Logistic OTD" value={data.logisticOtd} target="≥ 99%" icon={Truck} color="indigo" isGood={toNum(data.logisticOtd) >= 99} />
                  <KpiCard label="Error Delivery" value={data.logisticError} target="0%" icon={AlertTriangle} color={toNum(data.logisticError) === 0 ? "emerald" : "amber"} isGood={toNum(data.logisticError) === 0} />
                  <KpiCard label="Total DO Terbit" value={data.totalDo} target="-" icon={FileText} color="slate" isGood={true} />
                  <div className="col-span-3">
                    <InsightBlock title="Evaluasi Operasional Gudang" text={data.logisticEvaluation} color="slate" />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SLIDE 5: ADMINISTRATIVE PRECISION ==================== */}
            {currentSlide === 4 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><FileText size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Administrative Precision</h1>
                    <p className="text-slate-400">Admin Logistic & Admin Tukar Faktur (TF)</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-6 flex-1">
                  <KpiCard label="TF Luar Kota" value={data.tfLuarKotaAch} target="≥ 98%" icon={FileText} color="amber" isGood={toNum(data.tfLuarKotaAch) >= 98} />
                  <KpiCard label="TF Email & Sistem" value={data.tfEmailSistemAch} target="≥ 99%" icon={FileText} color="emerald" isGood={toNum(data.tfEmailSistemAch) >= 99} />
                  <KpiCard label="Cancel Invoice" value={data.cancelInvTarget} target="Max 150" icon={AlertTriangle} color={toNum(data.cancelInvTarget) <= 150 ? "emerald" : "amber"} isGood={toNum(data.cancelInvTarget) <= 150} />
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-center">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Root Cause Analysis</div>
                    <div className="text-sm text-slate-300 leading-relaxed">{data.cancelInvAnalysis || "Menunggu input data..."}</div>
                  </div>
                  <div className="col-span-4">
                    <InsightBlock title="Evaluasi Administrasi & Dokumen" text={data.adminTfEvaluation} color="amber" />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SLIDE 6: GLOBAL TRADE (EXIM) ==================== */}
            {currentSlide === 5 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400"><Globe size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Global Trade & Exim</h1>
                    <p className="text-slate-400">Export - Import Department</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="p-6 rounded-2xl border border-violet-500/20 bg-violet-950/10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe size={24} className="text-violet-400" />
                      <span className="text-sm font-bold text-violet-300 uppercase tracking-wider">Import Quota Status</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-2">{data.importQuotaStatus || "Menunggu input..."}</div>
                    <p className="text-sm text-slate-400">Status perizinan dan kuota impor tahun berjalan</p>
                  </div>
                  <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 flex flex-col justify-center items-center text-center">
                    <Award size={40} className="text-cyan-400 mb-3" />
                    <div className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-1">Gudang Berikat Expansion</div>
                    <div className="text-5xl font-black text-white mb-2">{data.gbCustomerTarget || "-"}</div>
                    <div className="text-sm text-slate-400">Target Penambahan Customer Legalitas</div>
                  </div>
                  <div className="col-span-2">
                    <InsightBlock title="Evaluasi Kepabeanan & Ekspansi" text={data.eximEvaluation} color="slate" />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SLIDE 7: HORIZON 2027 ==================== */}
            {currentSlide === 6 && (
              <div className="absolute inset-0 bg-slate-950 p-10 flex flex-col animate-fadeIn">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <Award size={28} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">Strategic Outlook</div>
                      <h1 className="text-4xl font-black text-white tracking-tight">Horizon 2027</h1>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-8 relative z-10">
                  <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                      <Target size={20} /> Fokus & Target Utama
                    </h3>
                    {data.nextYearOutlook ? (
                      <p className="text-lg text-slate-200 leading-relaxed flex-1 whitespace-pre-line">{data.nextYearOutlook}</p>
                    ) : <EmptyState label="Strategic Outlook 2027" />}
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                      <CheckCircle2 size={20} /> Key Milestones Achieved
                    </h3>
                    {data.keyMilestones ? (
                      <p className="text-lg text-slate-200 leading-relaxed flex-1 whitespace-pre-line">{data.keyMilestones}</p>
                    ) : <EmptyState label="Key Milestones" />}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Clock size={18} />
                    <span className="text-sm">Presentasi Selesai. Siap untuk sesi diskusi.</span>
                  </div>
                  <button onClick={() => setCurrentSlide(0)} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition cursor-pointer flex items-center gap-2 border border-slate-700">
                    <RotateCcw size={16} /> Ulangi Presentasi
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* FOOTER NAV */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md z-10 border-t border-slate-800">
        <button onClick={() => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer border border-slate-700">
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        <div className="flex items-center gap-2">
          {slideLabels.map((label, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentSlide(idx)} 
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? "w-8 bg-cyan-400" : "w-2 bg-slate-700 hover:bg-slate-600"}`}
              title={label}
            />
          ))}
        </div>
        <button onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)} className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition cursor-pointer">
          Selanjutnya <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}