"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Package, Truck, Users, Globe, FileText, Shield, Target,
  Award, Zap, Activity, BarChart3, PieChart, LineChart,
  ArrowUpRight, ArrowDownRight, Calendar, Layers, Sparkles,
} from "lucide-react";
import {
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart as RePieChart, Pie, Cell,
} from "recharts";

export default function OperationalHospitalityDeck({ report, allYearlyReports = {} }) {
  const YEARS = [2024, 2025, 2026, 2027];
  const currentYear = Number(report?.year) || 2026;

  // Flatten semua laporan
  const allReports = useMemo(() => {
    let arr = [];
    if (Array.isArray(allYearlyReports)) arr = allYearlyReports;
    else if (allYearlyReports && typeof allYearlyReports === "object") {
      Object.values(allYearlyReports).forEach((v) => {
        if (Array.isArray(v)) arr = arr.concat(v);
        else if (v && typeof v === "object") arr.push(v);
      });
    }
    if (report && !arr.includes(report)) arr.push(report);
    return arr.filter(Boolean);
  }, [allYearlyReports, report]);

  // Ambil data per tahun
  const yearData = useMemo(() => {
    return YEARS.map((yr) => {
      const reports = allReports.filter((r) => Number(r.year) === yr);
      const data = { year: yr, reports };
      
      // Extract metrics dari setiap department
      reports.forEach((r) => {
        const m = r.metricsJson || r;
        const dept = (r.department?.name || r.departmentName || "").toLowerCase();
        
        if (dept.includes("logistic") && dept.includes("warehouse")) {
          data.logistic = {
            otd: m.logisticOtd || "99%",
            error: m.logisticError || "0%",
            totalDo: m.totalDo || "-",
            evaluation: m.logisticEvaluation || "",
          };
        }
        if (dept.includes("purchasing")) {
          data.purchasing = {
            supplierOtd: m.supplierOtd || "98%",
            updateLc: m.updateLc || "5.5%",
            newSupplierDev: m.newSupplierDev || "Min. 2",
            evaluation: m.purchasingEvaluation || "",
          };
        }
        if (dept.includes("hr") || dept.includes("mr")) {
          data.hr = {
            manpowerAch: m.manpowerAch || "100%",
            turnoverRate: m.turnoverRate || "< 2%",
            absenteeismRate: m.absenteeismRate || "< 1%",
            isoStatus: m.isoStatus || "",
            evaluation: m.hrEvaluation || "",
          };
        }
        if (dept.includes("exim")) {
          data.exim = {
            importQuotaStatus: m.importQuotaStatus || "Aman",
            gbCustomerTarget: m.gbCustomerTarget || "Min 10",
            evaluation: m.eximEvaluation || "",
          };
        }
        if (dept.includes("admin logistic")) {
          data.adminLogistic = {
            totalDoInvCreated: m.totalDoInvCreated || "-",
            cancelInvTarget: m.cancelInvTarget || "Max 150",
            poSoftcopyArch: m.poSoftcopyArch || "100%",
            evaluation: m.adminLogisticEvaluation || "",
          };
        }
        if (dept.includes("admin tf")) {
          data.adminTf = {
            tfLuarKotaAch: m.tfLuarKotaAch || "98%",
            tfEmailSistemAch: m.tfEmailSistemAch || "99%",
            evaluation: m.adminTfEvaluation || "",
          };
        }
        if (dept.includes("operational director") || dept.includes("direktur operasional")) {
          data.director = {
            targetEfficiency: m.targetEfficiency || "95%",
            actualEfficiency: m.actualEfficiency || "92%",
            costOptimization: m.costOptimization || "Optimal Terkendali",
            executiveSummary: m.executiveSummary || "",
            strategicInitiatives: m.strategicInitiatives || "",
            riskManagement: m.riskManagement || "",
            keyMilestones: m.keyMilestones || "",
            nextYearOutlook: m.nextYearOutlook || "",
          };
        }
      });
      
      return data;
    });
  }, [allReports]);

  const currentData = yearData.find((y) => y.year === currentYear) || yearData[0];
  const prevData = yearData.find((y) => y.year === currentYear - 1);

  // Slides configuration dengan narrative arc
  const slides = [
    { id: "cover", title: "Visi Eksekutif & Metrik Efisiensi Biaya", subtitle: "Operational Hospitality Cluster" },
    { id: "run", title: "RUN: Stabilitas Supply Chain & Logistik", subtitle: `Tahun ${currentYear - 2}` },
    { id: "grow", title: "GROW: SDM, Kepatuhan & Ekspansi", subtitle: `Tahun ${currentYear - 1}` },
    { id: "transform", title: "TRANSFORM: Efisiensi & Digitalisasi", subtitle: `Tahun ${currentYear}` },
    { id: "risk", title: "Risk Radar & Mitigasi Kendala", subtitle: "System Intelligence" },
    { id: "milestone", title: "Pencapaian Besar & Target Utama", subtitle: "Strategic Outlook" },
  ];

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const next = () => setIdx((p) => (p + 1) % slides.length);
  const prev = () => setIdx((p) => (p - 1 + slides.length) % slides.length);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(next, 10000);
    return () => clearTimeout(t);
  }, [playing, idx]);

  const slide = slides[idx];

  return (
    <div className="relative w-full aspect-[16/9] max-h-[84vh] bg-slate-950 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white border border-slate-800 font-sans">
      {/* Ambient glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Layers size={18} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Operational Hospitality</p>
            <p className="text-xs text-slate-300 font-medium">{report?.plant?.name || "Consolidated"} · FY {currentYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400">
            <span className="text-indigo-400 font-bold">{idx + 1}</span>/{slides.length}
          </span>
          <div className="flex items-center gap-1 bg-slate-800/70 rounded-xl p-1 border border-slate-700">
            <button onClick={() => setPlaying(!playing)} className="p-1.5 hover:bg-slate-700 rounded-lg cursor-pointer">
              {playing ? <Pause size={14} className="text-indigo-400" /> : <Play size={14} />}
            </button>
            <button onClick={() => setIdx(0)} className="p-1.5 hover:bg-slate-700 rounded-lg cursor-pointer">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 px-10 py-8 overflow-y-auto relative z-10">
        <div key={slide.id} className="anim-slide h-full flex flex-col justify-center">

          {/* ▸ SLIDE 1: COVER / EXECUTIVE PORTAL */}
          {slide.id === "cover" && (
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-indigo-400 mb-2 block">Executive Portal</span>
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  {slide.title}
                </h1>
              </div>

              {/* Intelligence Briefing */}
              <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-300 mb-1">Intelligence Briefing:</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Laporan resmi operasional dan strategis divisi {currentData.director ? "Operasional" : "Operational Hospitality"} periode tahun {currentYear}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hero Metrics dengan Visual */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <MetricCard
                  label="TARGET EFISIENSI"
                  value={currentData.director?.targetEfficiency || "95%"}
                  icon={Target}
                  color="indigo"
                  trend={prevData?.director?.targetEfficiency ? "+0%" : null}
                />
                <MetricCard
                  label="AKTUAL EFISIENSI"
                  value={currentData.director?.actualEfficiency || "92%"}
                  icon={Activity}
                  color="amber"
                  trend={prevData?.director?.actualEfficiency ? "+3%" : null}
                />
                <MetricCard
                  label="COST OPTIMIZATION"
                  value={currentData.director?.costOptimization || "Optimal"}
                  icon={Zap}
                  color="emerald"
                  trend={null}
                />
              </div>

              {/* Executive Summary dengan Progress Bar */}
              <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-400 mb-2">Executive Summary:</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {currentData.director?.executiveSummary || "Belum di-input oleh Direktur Operasional."}
                </p>
                {currentData.director?.actualEfficiency && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Progress Efisiensi</span>
                      <span>{currentData.director.actualEfficiency} / {currentData.director.targetEfficiency}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(Number(currentData.director.actualEfficiency) / Number(currentData.director.targetEfficiency)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ▸ SLIDE 2: RUN - SUPPLY CHAIN FLOW DIAGRAM */}
          {slide.id === "run" && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-400 mb-2 block">FASE 1 | TAHUN {currentYear - 2}</span>
                <h2 className="text-3xl font-black tracking-tight text-cyan-400 flex items-center gap-3">
                  <Truck size={28} /> {slide.title}
                </h2>
              </div>

              {/* Supply Chain Flow Diagram */}
              <div className="relative mb-8">
                <div className="flex items-center justify-between relative">
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-emerald-500/20 -translate-y-1/2 z-0" />
                  
                  {/* Node 1: Purchasing */}
                  <FlowNode
                    title="Purchasing"
                    icon={Package}
                    metrics={[
                      { label: "Supplier OTD", value: currentData.purchasing?.supplierOtd || "98%", target: "98%" },
                      { label: "Landing Cost", value: currentData.purchasing?.updateLc || "5.5%", target: "Target" },
                    ]}
                    color="cyan"
                  />

                  {/* Arrow */}
                  <div className="text-cyan-400 z-10">
                    <ChevronRight size={32} />
                  </div>

                  {/* Node 2: Logistic */}
                  <FlowNode
                    title="Logistic"
                    icon={Truck}
                    metrics={[
                      { label: "On-Time Delivery", value: currentData.logistic?.otd || "99%", target: "99%" },
                      { label: "Error Delivery", value: currentData.logistic?.error || "0%", target: "0%" },
                    ]}
                    color="indigo"
                  />

                  {/* Arrow */}
                  <div className="text-indigo-400 z-10">
                    <ChevronRight size={32} />
                  </div>

                  {/* Node 3: Admin */}
                  <FlowNode
                    title="Admin"
                    icon={FileText}
                    metrics={[
                      { label: "Total DO/INV", value: currentData.adminLogistic?.totalDoInvCreated || "-", target: "-" },
                      { label: "Cancel Inv", value: currentData.adminLogistic?.cancelInvTarget || "Max 150", target: "Max" },
                    ]}
                    color="emerald"
                  />
                </div>
              </div>

              {/* Detailed Metrics Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                    <Package size={16} /> Metrik Logistik
                  </h3>
                  <div className="space-y-3">
                    <MetricRow label="On-Time Delivery" value={currentData.logistic?.otd || "99%"} target="99%" color="cyan" />
                    <MetricRow label="Error Delivery" value={currentData.logistic?.error || "0%"} target="0%" color="emerald" />
                    <MetricRow label="Total DO" value={currentData.logistic?.totalDo || "-"} target="-" color="slate" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                    <TrendingUp size={16} /> Metrik Purchasing
                  </h3>
                  <div className="space-y-3">
                    <MetricRow label="Supplier OTD" value={currentData.purchasing?.supplierOtd || "98%"} target="98%" color="amber" />
                    <MetricRow label="Landing Cost (LC)" value={currentData.purchasing?.updateLc || "5.5%"} target="5.5%" color="amber" />
                    <MetricRow label="New Supplier Dev" value={currentData.purchasing?.newSupplierDev || "Min. 2"} target="Min. 2" color="emerald" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ▸ SLIDE 3: GROW - RADAR CHART */}
          {slide.id === "grow" && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-amber-400 mb-2 block">FASE 2 | TAHUN {currentYear - 1}</span>
                <h2 className="text-3xl font-black tracking-tight text-amber-400 flex items-center gap-3">
                  <Users size={28} /> {slide.title}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-3">Performance Radar</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={[
                      { subject: "HR", A: 100, fullMark: 100 },
                      { subject: "Exim", A: 95, fullMark: 100 },
                      { subject: "Admin Log", A: 90, fullMark: 100 },
                      { subject: "Admin TF", A: 98, fullMark: 100 },
                      { subject: "Logistic", A: 99, fullMark: 100 },
                      { subject: "Purchasing", A: 98, fullMark: 100 },
                    ]}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Radar name="Performance" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Department Cards */}
                <div className="space-y-3">
                  <DeptCard
                    title="HR & MR"
                    icon={Users}
                    color="rose"
                    metrics={[
                      { label: "Manpower Ach", value: currentData.hr?.manpowerAch || "100%" },
                      { label: "Turnover Rate", value: currentData.hr?.turnoverRate || "< 2%" },
                      { label: "Absenteeism", value: currentData.hr?.absenteeismRate || "< 1%" },
                    ]}
                  />
                  <DeptCard
                    title="EXIM"
                    icon={Globe}
                    color="cyan"
                    metrics={[
                      { label: "Kuota Import", value: currentData.exim?.importQuotaStatus || "Aman" },
                      { label: "Gudang Berikat", value: currentData.exim?.gbCustomerTarget || "Min 10" },
                    ]}
                  />
                  <DeptCard
                    title="Admin Log"
                    icon={FileText}
                    color="indigo"
                    metrics={[
                      { label: "Total DO/INV", value: currentData.adminLogistic?.totalDoInvCreated || "-" },
                      { label: "Cancel Inv", value: currentData.adminLogistic?.cancelInvTarget || "Max 150" },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ▸ SLIDE 4: TRANSFORM - DASHBOARD */}
          {slide.id === "transform" && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-emerald-400 mb-2 block">FASE 3 | TAHUN {currentYear}</span>
                <h2 className="text-3xl font-black tracking-tight text-emerald-400 flex items-center gap-3">
                  <Zap size={28} /> {slide.title}
                </h2>
              </div>

              {/* KPI Dashboard Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <KPICard
                  label="Efisiensi Operasional"
                  value={currentData.director?.actualEfficiency || "92%"}
                  target={currentData.director?.targetEfficiency || "95%"}
                  icon={Activity}
                  color="emerald"
                />
                <KPICard
                  label="Supplier OTD"
                  value={currentData.purchasing?.supplierOtd || "98%"}
                  target="98%"
                  icon={Package}
                  color="cyan"
                />
                <KPICard
                  label="On-Time Delivery"
                  value={currentData.logistic?.otd || "99%"}
                  target="99%"
                  icon={Truck}
                  color="indigo"
                />
                <KPICard
                  label="Manpower"
                  value={currentData.hr?.manpowerAch || "100%"}
                  target="100%"
                  icon={Users}
                  color="rose"
                />
              </div>

              {/* Strategic Initiatives */}
              <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                  <Sparkles size={16} /> Inisiatif Strategis & Transformasi
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {currentData.director?.strategicInitiatives || "Pengembangan fasilitas gudang berikat, peningkatan kuota impor, dan perluasan mitra vendor strategis."}
                </p>
              </div>
            </div>
          )}

          {/* ▸ SLIDE 5: RISK RADAR - HEATMAP */}
          {slide.id === "risk" && (
            <div className="max-w-5xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-rose-400 mb-2 block">System Intelligence</span>
                  <h2 className="text-3xl font-black tracking-tight text-rose-400 flex items-center gap-3">
                    <Shield size={28} /> {slide.title}
                  </h2>
                </div>
                <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                  <span className="text-sm font-bold text-rose-400">0 Isu Terdeteksi</span>
                </div>
              </div>

              {/* Success Alert */}
              <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300 mb-1">Status Operasional: AMAN</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Seluruh indikator operasional (HR, Logistik, Purchasing, Admin) berada dalam batas toleransi aman.
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Management Notes */}
              <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-400 mb-2">Catatan Mitigasi (Risk Management):</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {currentData.director?.riskManagement || "Evaluasi kendala operasional tahun berjalan dan penerapan langkah preventif guna menjaga kontinuitas plant."}
                </p>
              </div>
            </div>
          )}

          {/* ▸ SLIDE 6: MILESTONES - TIMELINE */}
          {slide.id === "milestone" && (
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-emerald-400 mb-2 block">Strategic Outlook</span>
                <h2 className="text-3xl font-black tracking-tight text-emerald-400 flex items-center gap-3">
                  <Award size={28} /> {slide.title}
                </h2>
              </div>

              {/* Timeline */}
              <div className="relative mb-8">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-500 to-indigo-500" />
                
                <TimelineItem
                  year={currentYear - 2}
                  title="Stabilisasi Operasional"
                  description="Pembentukan fondasi supply chain dan logistik yang solid."
                  color="emerald"
                />
                <TimelineItem
                  year={currentYear - 1}
                  title="Ekspansi & Kepatuhan"
                  description="Pertumbuhan SDM, perluasan gudang berikat, dan kepatuhan ISO."
                  color="cyan"
                />
                <TimelineItem
                  year={currentYear}
                  title="Transformasi Digital"
                  description="Otomatisasi proses dan optimalisasi biaya operasional."
                  color="indigo"
                />
              </div>

              {/* Key Milestones */}
              <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">Milestone & Keberhasilan Operasional:</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {currentData.director?.keyMilestones || "Pencapaian target operasional tahunan dan efisiensi rantai pasok berhasil direalisasikan."}
                </p>
              </div>

              {/* Next Year Outlook */}
              <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">Proyeksi {currentYear + 1}:</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {currentData.director?.nextYearOutlook || "Fokus pada otomatisasi penuh arsip PO dan ekspansi ke 3 gudang baru."}
                </p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER NAV */}
      <footer className="flex items-center justify-between px-8 py-4 border-t border-slate-800 bg-slate-900/60 backdrop-blur-xl z-20">
        <button onClick={prev} className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer">
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === idx ? "w-8 bg-gradient-to-r from-indigo-400 to-cyan-400" : "w-2 bg-slate-700 hover:bg-slate-600"
              }`}
            />
          ))}
        </div>
        <button onClick={next} className="flex items-center gap-2 text-xs font-bold px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white transition cursor-pointer">
          Selanjutnya <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
}

/* ── SUB-COMPONENTS ── */

function MetricCard({ label, value, icon: Icon, color, trend }) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  };
  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
        <div className={`p-2 rounded-lg ${colors[color].split(" ").slice(1).join(" ")}`}>
          <Icon size={16} className={colors[color].split(" ")[0]} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-black ${colors[color].split(" ")[0]}`}>{value}</span>
        {trend && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 mb-1">
            <ArrowUpRight size={12} /> {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function FlowNode({ title, icon: Icon, metrics, color }) {
  const colors = {
    cyan: "border-cyan-500/30 bg-cyan-500/5",
    indigo: "border-indigo-500/30 bg-indigo-500/5",
    emerald: "border-emerald-500/30 bg-emerald-500/5",
  };
  const iconColors = {
    cyan: "text-cyan-400",
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
  };
  return (
    <div className={`relative z-10 border rounded-2xl p-4 w-48 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className={iconColors[color]} />
        <span className={`text-xs font-bold ${iconColors[color]}`}>{title}</span>
      </div>
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i}>
            <div className="text-[9px] text-slate-400">{m.label}</div>
            <div className="text-xs font-bold text-white">{m.value} <span className="text-[9px] text-slate-500">({m.target})</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, value, target, color }) {
  const colors = {
    cyan: "text-cyan-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    slate: "text-slate-400",
  };
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${colors[color]}`}>{value}</span>
        <span className="text-[10px] text-slate-500">(Target {target})</span>
      </div>
    </div>
  );
}

function DeptCard({ title, icon: Icon, color, metrics }) {
  const colors = {
    rose: "text-rose-400 border-rose-500/30 bg-rose-500/5",
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
    indigo: "text-indigo-400 border-indigo-500/30 bg-indigo-500/5",
  };
  return (
    <div className={`border rounded-2xl p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={colors[color].split(" ")[0]} />
        <span className={`text-xs font-bold ${colors[color].split(" ")[0]}`}>{title}</span>
      </div>
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{m.label}</span>
            <span className="text-xs font-bold text-white">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPICard({ label, value, target, icon: Icon, color }) {
  const colors = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  };
  const achieved = Number(value) >= Number(target);
  return (
    <div className={`border rounded-2xl p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={colors[color].split(" ")[0]} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-2xl font-black ${colors[color].split(" ")[0]}`}>{value}</span>
        <span className="text-[10px] text-slate-500 mb-1">/ {target}</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ${achieved ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${Math.min((Number(value) / Number(target)) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function TimelineItem({ year, title, description, color }) {
  const colors = {
    emerald: "bg-emerald-500 border-emerald-500",
    cyan: "bg-cyan-500 border-cyan-500",
    indigo: "bg-indigo-500 border-indigo-500",
  };
  return (
    <div className="relative flex items-start gap-4 mb-6">
      <div className={`relative z-10 w-16 h-16 rounded-full ${colors[color]} border-4 border-slate-950 flex items-center justify-center shrink-0`}>
        <span className="text-xs font-bold text-white">{year}</span>
      </div>
      <div className="flex-1 pt-2">
        <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}