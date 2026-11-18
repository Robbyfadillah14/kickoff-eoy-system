"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, 
  TrendingUp, TrendingDown, Activity, ShieldCheck, Zap, 
  Package, Truck, Users, FileText, Globe, AlertTriangle, 
  CheckCircle2, Award, MapPin, Clock, Target
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  HELPERS & UTILS                                                    */
/* ------------------------------------------------------------------ */
const formatRupiah = (val) => {
  const num = Number(val || 0);
  if (num === 0) return "0";
  if (Math.abs(num) >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
  if (Math.abs(num) >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} Jt`;
  if (Math.abs(num) >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} Rb`;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const toNum = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const fmtAch = (v) => (v > 999 ? ">999%" : `${v.toFixed(0)}%`);
const pctDelta = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

const STAGE_W = 1360;
const STAGE_H = 720;

/* ------------------------------------------------------------------ */
/*  UI COMPONENTS                                                      */
/* ------------------------------------------------------------------ */
function StatusBadge({ isGood, text }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isGood ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
      {isGood ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
      {text}
    </span>
  );
}

function VitalSignCard({ title, value, target, icon: Icon, color, isGood, trend }) {
  const bgColors = {
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  const iconColors = {
    cyan: "text-cyan-600 bg-cyan-100",
    indigo: "text-indigo-600 bg-indigo-100",
    amber: "text-amber-600 bg-amber-100",
    emerald: "text-emerald-600 bg-emerald-100",
  };

  return (
    <div className={`rounded-2xl border p-4 flex flex-col justify-between ${bgColors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${iconColors[color]}`}>
          <Icon size={20} />
        </div>
        {trend !== null && (
          <span className={`text-[11px] font-bold flex items-center gap-1 ${trend >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 mb-1">{title}</div>
        <div className="text-2xl font-black text-slate-900 leading-none mb-1">{value}</div>
        <div className="text-[11px] text-slate-600">Target: {target}</div>
      </div>
      <div className="mt-3">
        <StatusBadge isGood={isGood} text={isGood ? "Optimal" : "Perlu Perhatian"} />
      </div>
    </div>
  );
}

function FlowNode({ title, icon: Icon, metrics, color }) {
  const colors = {
    cyan: "border-cyan-500/30 bg-cyan-500/5 text-cyan-700",
    indigo: "border-indigo-500/30 bg-indigo-500/5 text-indigo-700",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-700",
  };
  return (
    <div className={`relative z-10 border rounded-2xl p-4 w-full ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-current border-opacity-20">
        <Icon size={18} />
        <span className="text-sm font-bold">{title}</span>
      </div>
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <span className="opacity-70">{m.label}</span>
            <span className="font-black">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text = "Belum ada data terinput" }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
      <FileText size={32} className="mb-2 opacity-30" />
      <span className="text-sm italic">{text}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */
export default function OperationalHospitalityDeck({ report, allYearlyReports = {} }) {
  const historicalYears = [2024, 2025, 2026];
  const slideLabels = ["Command Center", "Supply Chain Flow", "Human Capital", "Admin Precision", "Global Trade", "Risk Radar", "Horizon 2027"];
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
    if (isPlaying) timer = setInterval(() => setCurrentSlide((p) => (p + 1) % totalSlides), 10000);
    return () => clearInterval(timer);
  }, [isPlaying, totalSlides]);

  const yearData = useMemo(() => {
    return historicalYears.map((yr) => {
      const matches = allYearlyReports[yr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === yr) : []);
      const rep = matches.length > 0 ? matches[0] : (Number(report?.year) === yr ? report : null);
      const m = rep?.metricsJson || rep || {};
      const hasData = !!rep;

      return {
        yr, hasData,
        logisticOtd: m.logisticOtd || "99%",
        logisticError: m.logisticError || "0%",
        supplierOtd: m.supplierOtd || "98%",
        updateLc: m.updateLc || "5.5%",
        manpowerAch: m.manpowerAch || "100%",
        turnoverRate: m.turnoverRate || "< 2%",
        absenteeismRate: m.absenteeismRate || "< 1%",
        isoStatus: m.isoStatus || "Compliant",
        totalDoInvCreated: m.totalDoInvCreated || "-",
        cancelInvTarget: m.cancelInvTarget || "0",
        tfLuarKotaAch: m.tfLuarKotaAch || "98%",
        tfEmailSistemAch: m.tfEmailSistemAch || "99%",
        importQuotaStatus: m.importQuotaStatus || "Aman",
        gbCustomerTarget: m.gbCustomerTarget || "0",
        actualEfficiency: m.actualEfficiency || "90%",
        costOptimization: m.costOptimization || "Optimal",
        executiveSummary: m.executiveSummary || "",
        riskManagement: m.riskManagement || "",
        evalText: m.logisticEvaluation || m.purchasingEvaluation || m.hrEvaluation || m.cancelInvAnalysis || m.adminTfEvaluation || m.eximEvaluation || "",
      };
    });
  }, [allYearlyReports, report]);

  const outlook2027 = useMemo(() => {
    const matches = allYearlyReports[2027] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === 2027) : []);
    const rep = matches.length > 0 ? matches[0] : null;
    const m = rep?.metricsJson || rep || {};
    return {
      hasData: !!rep,
      nextYearOutlook: m.nextYearOutlook || m.strategicInitiatives || "Fokus pada otomatisasi penuh arsip PO, ekspansi ke 3 gudang baru, dan peningkatan efisiensi rantai pasok.",
      keyMilestones: m.keyMilestones || "Pencapaian target operasional tahunan dan efisiensi rantai pasok berhasil direalisasikan.",
    };
  }, [allYearlyReports]);

  const risks = useMemo(() => {
    const detected = [];
    yearData.forEach((d) => {
      if (!d.hasData) return;
      if (toNum(d.cancelInvTarget) > 150) detected.push({ yr: d.yr, dept: "Admin Logistic", severity: "high", msg: `Cancel invoice tinggi (${d.cancelInvTarget} > 150 target).` });
      if (toNum(d.turnoverRate) > 2) detected.push({ yr: d.yr, dept: "HR & MR", severity: "high", msg: `Turnover rate melebihi batas (${d.turnoverRate}% > 2%).` });
      if (d.evalText.toLowerCase().includes("urgent") || d.evalText.toLowerCase().includes("telat") || d.evalText.toLowerCase().includes("kendala")) {
        detected.push({ yr: d.yr, dept: "Operasional", severity: "med", msg: "Terdapat catatan kendala operasional (urgent/telat)." });
      }
    });
    return detected;
  }, [yearData]);

  return (
    <div className="relative w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 z-10 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">Operational Excellence</div>
            <div className="text-sm text-slate-300 font-medium">{report?.plant?.name || "Consolidated Operations"} · 2024–2026</div>
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

      {/* VIEWPORT */}
      <div className="flex-1 flex items-center justify-center p-4 z-10 w-full bg-slate-950">
        <div ref={stageRef} className="w-full rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5" style={{ maxWidth: "100%", height: STAGE_H * scale }}>
          <div className="relative bg-slate-50 overflow-hidden" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            
            {/* SLIDE 1: COMMAND CENTER */}
            {currentSlide === 0 && (
              <div className="absolute inset-0 p-8 flex flex-col gap-6 animate-fadeIn">
                <div className="flex items-end justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Operational Command Center</h1>
                    <p className="text-slate-500 mt-1">Health check & efisiensi lintas departemen pendukung</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Overall Efficiency</div>
                    <div className="text-5xl font-black text-indigo-600">{yearData[2]?.actualEfficiency || "92%"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-5 flex-1">
                  <VitalSignCard title="Supplier OTD" value={yearData[2].supplierOtd} target="≥ 98%" icon={Package} color="cyan" isGood={toNum(yearData[2].supplierOtd) >= 98} trend={pctDelta(toNum(yearData[2].supplierOtd), toNum(yearData[1].supplierOtd))} />
                  <VitalSignCard title="Logistic OTD" value={yearData[2].logisticOtd} target="≥ 99%" icon={Truck} color="indigo" isGood={toNum(yearData[2].logisticOtd) >= 99} trend={pctDelta(toNum(yearData[2].logisticOtd), toNum(yearData[1].logisticOtd))} />
                  <VitalSignCard title="Manpower" value={yearData[2].manpowerAch} target="100%" icon={Users} color="emerald" isGood={toNum(yearData[2].manpowerAch) >= 100} trend={pctDelta(toNum(yearData[2].manpowerAch), toNum(yearData[1].manpowerAch))} />
                  <VitalSignCard title="Admin Accuracy" value={yearData[2].tfEmailSistemAch} target="≥ 99%" icon={FileText} color="amber" isGood={toNum(yearData[2].tfEmailSistemAch) >= 99} trend={pctDelta(toNum(yearData[2].tfEmailSistemAch), toNum(yearData[1].tfEmailSistemAch))} />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" /> Executive Summary: Cost & Process Optimization
                  </h3>
                  <p className="text-slate-600 leading-relaxed flex-1">
                    {yearData[2]?.executiveSummary || "Sepanjang tahun 2026, operasional berhasil menjaga stabilitas rantai pasok dengan peningkatan On-Time Delivery di kedua sisi. Inisiatif pengendalian biaya dan digitalisasi administrasi berkontribusi signifikan terhadap efisiensi operasional keseluruhan."}
                  </p>
                </div>
              </div>
            )}

            {/* SLIDE 2: SUPPLY CHAIN FLOW */}
            {currentSlide === 1 && (
              <div className="absolute inset-0 p-8 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-200 pb-4">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Supply Chain Flow</h1>
                  <p className="text-slate-500 mt-1">Konektivitas dari pengadaan hingga distribusi</p>
                </div>

                <div className="flex-1 flex items-center justify-center gap-4">
                  <FlowNode 
                    title="Purchasing" 
                    icon={Package} 
                    color="cyan"
                    metrics={[
                      { label: "Supplier OTD", value: yearData[2].supplierOtd },
                      { label: "Landing Cost", value: yearData[2].updateLc },
                      { label: "New Suppliers", value: yearData[2].newSupplierDev }
                    ]} 
                  />
                  
                  <div className="flex flex-col items-center text-slate-400">
                    <div className="w-24 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-400 mb-2"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">Material In</span>
                  </div>

                  <div className="flex flex-col items-center text-slate-400">
                    <div className="w-24 h-0.5 bg-gradient-to-r from-indigo-400 to-amber-400 mb-2"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">Goods Out</span>
                  </div>

                  <FlowNode 
                    title="Logistic & Warehouse" 
                    icon={Truck} 
                    color="amber"
                    metrics={[
                      { label: "Logistic OTD", value: yearData[2].logisticOtd },
                      { label: "Error Delivery", value: yearData[2].logisticError },
                      { label: "Total DO", value: yearData[2].totalDoInvCreated }
                    ]} 
                  />
                </div>

                <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 flex items-start gap-4">
                  <div className="p-2 bg-slate-800 rounded-lg text-cyan-400 shrink-0"><Activity size={20} /></div>
                  <div>
                    <div className="text-sm font-bold text-white mb-1">Operational Insight</div>
                    <p className="text-sm leading-relaxed">
                      {yearData[2]?.evalText || "Sinkronisasi antara tim Purchasing dan Logistik menunjukkan perbaikan signifikan. Penurunan error delivery berkorelasi langsung dengan peningkatan akurasi data PO dari sistem."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: HUMAN CAPITAL */}
            {currentSlide === 2 && (
              <div className="absolute inset-0 p-8 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-200 pb-4">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Human Capital & Compliance</h1>
                  <p className="text-slate-500 mt-1">Stabilitas SDM dan kepatuhan standar mutu</p>
                </div>

                <div className="grid grid-cols-3 gap-6 flex-1">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                      <Users size={32} />
                    </div>
                    <div className="text-4xl font-black text-slate-900 mb-1">{yearData[2].manpowerAch}</div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Manpower Fulfillment</div>
                    <StatusBadge isGood={toNum(yearData[2].manpowerAch) >= 100} text="Target Tercapai" />
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center gap-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700">Turnover Rate</span>
                        <span className={`text-2xl font-black ${toNum(yearData[2].turnoverRate) <= 2 ? "text-emerald-600" : "text-rose-600"}`}>{yearData[2].turnoverRate}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className={`h-3 rounded-full ${toNum(yearData[2].turnoverRate) <= 2 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${Math.min(toNum(yearData[2].turnoverRate) * 20, 100)}%` }}></div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Target: Max 2%</div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700">Absenteeism Rate</span>
                        <span className={`text-2xl font-black ${toNum(yearData[2].absenteeismRate) <= 1 ? "text-emerald-600" : "text-rose-600"}`}>{yearData[2].absenteeismRate}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className={`h-3 rounded-full ${toNum(yearData[2].absenteeismRate) <= 1 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${Math.min(toNum(yearData[2].absenteeismRate) * 50, 100)}%` }}></div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Target: Max 1%</div>
                    </div>
                  </div>

                  <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck size={24} className="text-indigo-300" />
                      <span className="text-sm font-bold uppercase tracking-wider text-indigo-200">Sertifikasi & Audit</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-2">{yearData[2].isoStatus}</div>
                        <p className="text-sm text-indigo-200 leading-relaxed px-4">
                          {yearData[2].hasData ? "Seluruh temuan audit internal telah ditutup (closed). Dokumen SOP telah diperbarui sesuai standar terbaru." : "Belum ada data audit."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 4: ADMIN PRECISION */}
            {currentSlide === 3 && (
              <div className="absolute inset-0 p-8 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-200 pb-4">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Administrative Precision</h1>
                  <p className="text-slate-500 mt-1">Akurasi dokumen, kecepatan proses, dan mitigasi error</p>
                </div>

                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                      <FileText size={16} className="text-cyan-600" /> Tukar Faktur (TF) Compliance
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-slate-700">TF Luar Kota</span>
                          <span className="font-black text-slate-900">{yearData[2].tfLuarKotaAch} <span className="text-slate-400 font-normal">/ 98%</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-4">
                          <div className="h-4 rounded-full bg-cyan-500 transition-all" style={{ width: `${Math.min(toNum(yearData[2].tfLuarKotaAch), 100)}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-slate-700">TF Email & Sistem</span>
                          <span className="font-black text-slate-900">{yearData[2].tfEmailSistemAch} <span className="text-slate-400 font-normal">/ 99%</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-4">
                          <div className="h-4 rounded-full bg-indigo-500 transition-all" style={{ width: `${Math.min(toNum(yearData[2].tfEmailSistemAch), 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-6 shadow-sm flex flex-col ${toNum(yearData[2].cancelInvTarget) > 150 ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200"}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${toNum(yearData[2].cancelInvTarget) > 150 ? "text-rose-700" : "text-slate-900"}`}>
                      <AlertTriangle size={16} /> Invoice Cancellation Rate
                    </h3>
                    <div className="flex-1 flex items-center justify-center flex-col">
                      <div className={`text-6xl font-black mb-2 ${toNum(yearData[2].cancelInvTarget) > 150 ? "text-rose-600" : "text-emerald-600"}`}>
                        {yearData[2].cancelInvTarget}
                      </div>
                      <div className="text-sm text-slate-500 mb-4">Dokumen dibatalkan (Target Max: 150)</div>
                      <StatusBadge isGood={toNum(yearData[2].cancelInvTarget) <= 150} text={toNum(yearData[2].cancelInvTarget) <= 150 ? "Dalam Batas Aman" : "Melebihi Toleransi"} />
                    </div>
                    {yearData[2].cancelInvAnalysis && (
                      <div className="mt-4 p-3 bg-white/50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-200/50">
                        <span className="font-bold">Root Cause:</span> {yearData[2].cancelInvAnalysis}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 5: GLOBAL TRADE (EXIM) */}
            {currentSlide === 4 && (
              <div className="absolute inset-0 p-8 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-200 pb-4">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Trade & Exim</h1>
                  <p className="text-slate-500 mt-1">Perizinan, kuota, dan ekspansi fasilitas kepabeanan</p>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-6">
                  <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden">
                    <Globe size={120} className="absolute -right-6 -bottom-6 text-slate-800 opacity-50" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 relative z-10">Import Quota Status</h3>
                    <div className="text-3xl font-black text-cyan-400 mb-4 relative z-10">{yearData[2].importQuotaStatus}</div>
                    <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                      {yearData[2].hasData ? "Pengajuan pertek dan kuota impor berjalan sesuai timeline. Tidak ada penahanan di Bea Cukai yang signifikan." : "Belum ada data perizinan."}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                      <MapPin size={36} />
                    </div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Gudang Berikat Expansion</div>
                    <div className="text-5xl font-black text-slate-900 mb-2">{yearData[2].gbCustomerTarget}</div>
                    <div className="text-sm text-slate-600">Target Penambahan Customer Legalitas</div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 6: RISK RADAR */}
            {currentSlide === 5 && (
              <div className="absolute inset-0 p-8 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-200 pb-4">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Operational Risk Radar</h1>
                  <p className="text-slate-500 mt-1">Deteksi otomatis penyimpangan dan bottleneck proses</p>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-rose-500" /> Active Alerts ({risks.length})
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                      {risks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-emerald-600 gap-3">
                          <CheckCircle2 size={48} className="opacity-50" />
                          <span className="font-bold text-lg">All Systems Normal</span>
                          <span className="text-sm text-slate-500 text-center max-w-xs">Tidak ada penyimpangan target kritis yang terdeteksi dari data input 2024-2026.</span>
                        </div>
                      ) : (
                        risks.map((r, i) => (
                          <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${r.severity === "high" ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"}`}>
                            <AlertTriangle size={20} className={r.severity === "high" ? "text-rose-500 shrink-0 mt-0.5" : "text-amber-500 shrink-0 mt-0.5"} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${r.severity === "high" ? "bg-rose-200 text-rose-800" : "bg-amber-200 text-amber-800"}`}>
                                  {r.yr}
                                </span>
                                <span className="text-xs font-bold text-slate-700">{r.dept}</span>
                              </div>
                              <p className={`text-sm leading-snug ${r.severity === "high" ? "text-rose-900" : "text-amber-900"}`}>{r.msg}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Zap size={16} className="text-cyan-400" /> Mitigation & Action Plan
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                      {yearData.map((d, i) => d.evalText ? (
                        <div key={i} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                          <div className="text-xs font-bold text-cyan-400 mb-1">Evaluasi {d.yr}</div>
                          <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">{d.evalText}</p>
                        </div>
                      ) : null)}
                      {!yearData.some(d => d.evalText) && <EmptyState text="Belum ada catatan mitigasi yang diinput." />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 7: HORIZON 2027 (FINALE) */}
            {currentSlide === 6 && (
              <div className="absolute inset-0 bg-slate-900 text-white p-8 flex flex-col animate-fadeIn">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <Award size={28} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">Strategic Outlook</div>
                      <h1 className="text-4xl font-black tracking-tight">Horizon 2027</h1>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Next Phase</div>
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Transformation</div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-8 relative z-10">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                      <Target size={20} /> Fokus & Target Utama
                    </h3>
                    <p className="text-xl text-slate-200 leading-relaxed flex-1 whitespace-pre-line">
                      {outlook2027.hasData ? outlook2027.nextYearOutlook : "Fokus pada otomatisasi penuh arsip PO, ekspansi ke 3 gudang baru, dan peningkatan efisiensi rantai pasok secara holistik."}
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                      <CheckCircle2 size={20} /> Key Milestones Achieved
                    </h3>
                    <p className="text-xl text-slate-200 leading-relaxed flex-1 whitespace-pre-line">
                      {outlook2027.hasData ? outlook2027.keyMilestones : "Pencapaian target operasional tahunan dan efisiensi rantai pasok berhasil direalisasikan sebagai fondasi kuat untuk 2027."}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Clock size={18} />
                    <span className="text-sm">Presentasi Selesai. Siap untuk sesi tanya jawab.</span>
                  </div>
                  <button onClick={() => setCurrentSlide(0)} className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-cyan-50 transition cursor-pointer flex items-center gap-2">
                    <RotateCcw size={16} /> Ulangi Presentasi
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* FOOTER NAV */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 z-10 border-t border-slate-800">
        <button onClick={() => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer">
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}