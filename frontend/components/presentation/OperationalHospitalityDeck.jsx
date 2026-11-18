"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, TrendingUp, TrendingDown,
  BarChart3, Target, Sparkles, CheckCircle2, Zap, ShieldCheck, Flag, Calendar,
  User, Package, FileText, Globe, Truck, AlertTriangle, Award
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const formatRupiah = (val) => {
  const num = Number(val || 0);
  if (num === 0) return "0";
  if (Math.abs(num) >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
  if (Math.abs(num) >= 1_000_000) return `Rp ${(num / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt`;
  if (Math.abs(num) >= 1_000) return `Rp ${(num / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Rb`;
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
const RING_R = 58;
const RING_C = 2 * Math.PI * RING_R;
const YEAR_COLORS = ["#4F46E5", "#0891B2", "#059669"]; // Indigo (2024), Cyan (2025), Emerald (2026)

/* ------------------------------------------------------------------ */
/*  KOMPONEN KECIL (UI Building Blocks)                                */
/* ------------------------------------------------------------------ */
function DeltaChip({ cur, prev, labelBase = "Baseline" }) {
  const d = pctDelta(cur, prev);
  if (d === null) return <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700">{labelBase}</span>;
  const up = d >= 0;
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${up ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
      {up ? "▲" : "▼"} {Math.abs(d) > 999 ? ">999" : Math.abs(d).toFixed(0)}%
    </span>
  );
}

function YearTag({ yr, idx }) {
  return <span className="inline-block px-3 py-1 rounded-full text-sm font-black text-white" style={{ background: YEAR_COLORS[idx % YEAR_COLORS.length] }}>{yr}</span>;
}

function SlideHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center justify-between shrink-0 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#1E293B] text-[#38BDF8] flex items-center justify-center">{icon}</div>
        <div>
          <div className="text-[26px] font-black text-[#0F172A] leading-none">{title}</div>
          {subtitle && <div className="text-[13px] text-slate-500 mt-1">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {["2024", "2025", "2026"].map((y, i) => (
          <span key={y} className="px-3 py-1 rounded-full text-xs font-black text-white" style={{ background: YEAR_COLORS[i] }}>{y}</span>
        ))}
      </div>
    </div>
  );
}

function Empty({ text = "Belum diisi" }) {
  return <span className="text-sm italic text-slate-400">{text}</span>;
}

function MiniRing({ pct, color, size = 68 }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#E2E8F0" strokeWidth="7" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black" style={{ color }}>{fmtAch(pct)}</span>
    </div>
  );
}

function YearColHeaders({ yearData, label, sub }) {
  return (
    <div className="grid grid-cols-[230px_1fr_1fr_1fr] gap-3 shrink-0 mb-3">
      <div className="flex flex-col justify-center px-2">
        <div className="text-[15px] font-black text-[#0F172A] leading-tight">{label}</div>
        <div className="text-[12px] text-slate-500">{sub}</div>
      </div>
      {yearData.map((d, i) => {
        const c = YEAR_COLORS[i % YEAR_COLORS.length];
        return (
          <div key={d.yr} className="rounded-xl px-4 py-2 text-white flex items-center justify-between shadow-md" style={{ background: `linear-gradient(135deg, ${c}, ${c}B3)` }}>
            <span className="text-[28px] font-black leading-none">{d.yr}</span>
            <div className="text-right leading-tight">
              <div className="text-[11px] opacity-90">{d.hasData ? "Data Terekam" : "Belum ada data"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyCell() {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 flex items-center justify-center h-full"><span className="text-[13px] italic text-slate-400">Belum ada data</span></div>;
}

function RowIdentity({ name, icon: Icon, color, extra }) {
  return (
    <div className="flex items-center gap-3 pl-1 pr-2 min-w-0">
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
          <Icon size={20} />
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[16px] font-black text-[#0F172A] leading-tight truncate" title={name}>{name}</div>
        {extra}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KOMPONEN UTAMA                                                     */
/* ------------------------------------------------------------------ */
export default function OperationalHospitalityDeck({ report, allYearlyReports = {} }) {
  const historicalYears = [2024, 2025, 2026];
  const slideLabels = ["Master Dashboard", "Supply Chain & Logistik", "HR & Kepatuhan", "Admin & Support", "Exim & Global", "Risk Radar", "Outlook 2027"];
  const totalSlides = slideLabels.length;
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Auto-scaling untuk menjaga aspect ratio 1360x720
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth / STAGE_W, 1)); // Max scale 1 agar tidak terlalu besar di layar kecil
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") setCurrentSlide((p) => (p + 1) % totalSlides);
      else if (e.key === "ArrowLeft") setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSlides]);

  // Autoplay
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => setCurrentSlide((p) => (p + 1) % totalSlides), 12000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalSlides]);

  // Data Aggregation per Year
  const yearData = useMemo(() => {
    return historicalYears.map((yr) => {
      const matches = allYearlyReports[yr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === yr) : []);
      const rep = matches.length > 0 ? matches[0] : (Number(report?.year) === yr ? report : null);
      const m = rep?.metricsJson || rep || {};
      const hasData = !!rep;

      return {
        yr, hasData,
        // Logistic
        logisticOtd: m.logisticOtd || "99%",
        logisticError: m.logisticError || "0%",
        totalDo: m.totalDo || "-",
        logisticEval: m.logisticEvaluation || "",
        // Purchasing
        supplierOtd: m.supplierOtd || "98%",
        updateLc: m.updateLc || "5.5%",
        newSupplierDev: m.newSupplierDev || "0",
        purchasingEval: m.purchasingEvaluation || "",
        // HR
        manpowerAch: m.manpowerAch || "100%",
        turnoverRate: m.turnoverRate || "< 2%",
        absenteeismRate: m.absenteeismRate || "< 1%",
        isoStatus: m.isoStatus || "",
        hrEval: m.hrEvaluation || "",
        // Admin Logistic
        totalDoInvCreated: m.totalDoInvCreated || "-",
        cancelInvTarget: m.cancelInvTarget || "0",
        cancelInvAnalysis: m.cancelInvAnalysis || "",
        // Admin TF
        tfLuarKotaAch: m.tfLuarKotaAch || "98%",
        tfEmailSistemAch: m.tfEmailSistemAch || "99%",
        adminTfEval: m.adminTfEvaluation || "",
        // Exim
        importQuotaStatus: m.importQuotaStatus || "Aman",
        gbCustomerTarget: m.gbCustomerTarget || "0",
        eximEval: m.eximEvaluation || "",
        // Director (Aggregate)
        actualEfficiency: m.actualEfficiency || "90%",
        costOptimization: m.costOptimization || "Optimal",
        executiveSummary: m.executiveSummary || "",
        riskManagement: m.riskManagement || "",
      };
    });
  }, [allYearlyReports, report]);

  // 2027 Outlook Data
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

  // Risk Detection Logic
  const risks = useMemo(() => {
    const detected = [];
    yearData.forEach((d) => {
      if (!d.hasData) return;
      const cancelInv = toNum(d.cancelInvTarget);
      if (cancelInv > 150) detected.push({ yr: d.yr, dept: "Admin Logistic", msg: `Cancel invoice tinggi (${cancelInv} > 150 target).` });
      
      const turnover = toNum(d.turnoverRate);
      if (turnover > 2) detected.push({ yr: d.yr, dept: "HR & MR", msg: `Turnover rate melebihi batas (${turnover}% > 2%).` });

      if (d.logisticEval.toLowerCase().includes("urgent") || d.logisticEval.toLowerCase().includes("telat")) {
        detected.push({ yr: d.yr, dept: "Logistic", msg: "Terdapat kendala urgent delivery atau keterlambatan." });
      }
    });
    return detected;
  }, [yearData]);

  return (
    <div className="relative w-full bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-slate-900 tabular-nums">
      
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#1E293B] z-10 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#38BDF8] text-[#0F172A] px-3.5 py-1.5 rounded-full font-bold tracking-wide flex items-center gap-1.5">
            <ShieldCheck size={15} /> Operational Hospitality Cluster
          </span>
          <span className="text-sm text-slate-300 font-medium hidden sm:inline-block">
            {report?.plant?.name || "Consolidated"} · <b className="text-white">Executive Master Deck (2024–2026)</b>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300 font-semibold">Slide <span className="text-[#38BDF8] font-bold text-base">{currentSlide + 1}</span> / {totalSlides}</span>
          <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/15">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/15 rounded-lg text-slate-200 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause size={16} className="text-[#38BDF8]" /> : <Play size={16} />}
            </button>
            <button onClick={() => setCurrentSlide(0)} className="p-2 hover:bg-white/15 rounded-lg text-slate-200 hover:text-white transition cursor-pointer">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Slide Viewport (Fixed Aspect Ratio 1360x720) */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 z-10 w-full bg-slate-950">
        <div ref={stageRef} className="w-full rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10" style={{ maxWidth: "100%", height: STAGE_H * scale }}>
          <div className="relative bg-[#F8FAFC] overflow-hidden" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            
            {/* ==================== SLIDE 1: MASTER DASHBOARD ==================== */}
            {currentSlide === 0 && (
              <div className="absolute inset-0 p-6 flex flex-col gap-5 animate-fadeIn">
                <SlideHeader icon={<BarChart3 size={24} />} title="Master Dashboard Operasional" subtitle="Ringkasan eksekutif efisiensi, biaya, dan pencapaian lintas departemen" />
                
                <div className="grid grid-cols-4 gap-5 h-[220px] shrink-0">
                  <div className="bg-[#4F46E5] text-white rounded-2xl shadow-md p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0"><Zap size={22} /></div>
                      <div><div className="text-[28px] font-black leading-none">{yearData[2]?.actualEfficiency || "92%"}</div><div className="text-[13px] text-indigo-100 mt-1">Efisiensi Aktual 2026</div></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0"><Target size={22} /></div>
                      <div><div className="text-[28px] font-black leading-none">{yearData[2]?.costOptimization || "Optimal"}</div><div className="text-[13px] text-indigo-100 mt-1">Cost Optimization</div></div>
                    </div>
                  </div>

                  <div className="col-span-3 bg-gradient-to-br from-[#059669] to-[#047857] text-white rounded-2xl shadow-md p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <div><div className="text-[22px] font-black leading-none">Executive Summary</div><div className="text-[13px] text-emerald-100 mt-1">Arahan Direktur Operasional</div></div>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-xl p-4 overflow-y-auto custom-scrollbar">
                      <p className="text-[16px] text-white leading-relaxed whitespace-pre-line">
                        {yearData[2]?.executiveSummary || "Operasional tahun 2026 menunjukkan peningkatan signifikan dalam efisiensi rantai pasok dan kepatuhan administrasi, didukung oleh digitalisasi proses dan pengawasan ketat terhadap SLA departemen."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
                  {["Supply Chain", "HR & Compliance", "Admin & Support"].map((title, i) => (
                    <div key={title} className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col min-h-0">
                      <div className="text-base font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                        <span className="w-2 h-6 rounded-full" style={{ background: YEAR_COLORS[i] }}></span>
                        {title} Highlights (2026)
                      </div>
                      <div className="flex-1 space-y-3">
                        {i === 0 && (
                          <>
                            <MetricRow label="Supplier OTD" value={yearData[2].supplierOtd} target="98%" color="#0891B2" />
                            <MetricRow label="Logistic OTD" value={yearData[2].logisticOtd} target="99%" color="#4F46E5" />
                          </>
                        )}
                        {i === 1 && (
                          <>
                            <MetricRow label="Manpower Ach" value={yearData[2].manpowerAch} target="100%" color="#059669" />
                            <MetricRow label="Turnover Rate" value={yearData[2].turnoverRate} target="< 2%" color="#F59E0B" />
                          </>
                        )}
                        {i === 2 && (
                          <>
                            <MetricRow label="Total DO/INV" value={yearData[2].totalDoInvCreated} target="-" color="#4F46E5" />
                            <MetricRow label="TF Email/Sistem" value={yearData[2].tfEmailSistemAch} target="99%" color="#0891B2" />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== SLIDE 2: SUPPLY CHAIN (Logistic + Purchasing) ==================== */}
            {currentSlide === 1 && (
              <div className="absolute inset-0 p-6 flex flex-col gap-4 animate-fadeIn">
                <SlideHeader icon={<Truck size={24} />} title="Supply Chain & Logistik" subtitle="Performa pengadaan dan distribusi lintas tahun" />
                <YearColHeaders yearData={yearData} label="Metrik Utama" sub="Target vs Realisasi" />
                
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  {[
                    { key: "supplierOtd", title: "Supplier On-Time Delivery", sub: "Target: 98%", icon: Package, color: "#0891B2" },
                    { key: "logisticOtd", title: "Logistic On-Time Delivery", sub: "Target: 99%", icon: Truck, color: "#4F46E5" },
                    { key: "logisticError", title: "Logistic Error Delivery", sub: "Target: 0%", icon: AlertTriangle, color: "#F59E0B" },
                  ].map((row) => (
                    <div key={row.key} className="grid grid-cols-[230px_1fr_1fr_1fr] gap-3 bg-white rounded-2xl shadow-md border border-slate-200 p-3 items-stretch" style={{ flex: "1 1 0", minHeight: 100 }}>
                      <RowIdentity name={row.title} icon={row.icon} color={row.color} extra={<div className="text-[12px] text-slate-500 mt-0.5">{row.sub}</div>} />
                      {yearData.map((d, yi) => {
                        if (!d.hasData) return <EmptyCell key={yi} />;
                        const val = toNum(d[row.key]);
                        const prevVal = yi > 0 ? toNum(yearData[yi - 1][row.key]) : 0;
                        const isGood = row.key === "logisticError" ? val <= 0 : val >= 98;
                        return (
                          <div key={yi} className="rounded-xl bg-slate-50 border border-slate-200 px-3 flex items-center gap-3 min-w-0" style={{ borderLeft: `4px solid ${YEAR_COLORS[yi]}` }}>
                            <MiniRing pct={row.key === "logisticError" ? (100 - val) : val} color={isGood ? "#059669" : "#F59E0B"} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[19px] font-black text-[#0F172A]">{d[row.key]}</span>
                                <DeltaChip cur={val} prev={prevVal} />
                              </div>
                              <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 ${isGood ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                {isGood ? "Tercapai" : "Perlu Perhatian"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== SLIDE 3: HR & COMPLIANCE ==================== */}
            {currentSlide === 2 && (
              <div className="absolute inset-0 p-6 flex flex-col gap-4 animate-fadeIn">
                <SlideHeader icon={<User size={24} />} title="HR & Kepatuhan (MR)" subtitle="Manpower, disiplin, dan sertifikasi standar" />
                <YearColHeaders yearData={yearData} label="Metrik SDM" sub="Kesehatan organisasi" />
                
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  {[
                    { key: "manpowerAch", title: "Pemenuhan Manpower", sub: "Target: 100%", icon: User, color: "#059669" },
                    { key: "turnoverRate", title: "Turnover Rate", sub: "Target: Max 2%", icon: TrendingDown, color: "#F59E0B" },
                    { key: "absenteeismRate", title: "Absenteeism Rate", sub: "Target: Max 1%", icon: Calendar, color: "#EF4444" },
                  ].map((row) => (
                    <div key={row.key} className="grid grid-cols-[230px_1fr_1fr_1fr] gap-3 bg-white rounded-2xl shadow-md border border-slate-200 p-3 items-stretch" style={{ flex: "1 1 0", minHeight: 100 }}>
                      <RowIdentity name={row.title} icon={row.icon} color={row.color} extra={<div className="text-[12px] text-slate-500 mt-0.5">{row.sub}</div>} />
                      {yearData.map((d, yi) => {
                        if (!d.hasData) return <EmptyCell key={yi} />;
                        const val = toNum(d[row.key]);
                        const prevVal = yi > 0 ? toNum(yearData[yi - 1][row.key]) : 0;
                        const isGood = row.key === "manpowerAch" ? val >= 100 : val <= 2;
                        return (
                          <div key={yi} className="rounded-xl bg-slate-50 border border-slate-200 px-3 flex items-center gap-3 min-w-0" style={{ borderLeft: `4px solid ${YEAR_COLORS[yi]}` }}>
                            <MiniRing pct={row.key === "manpowerAch" ? val : (100 - val)} color={isGood ? "#059669" : "#EF4444"} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[19px] font-black text-[#0F172A]">{d[row.key]}</span>
                                <DeltaChip cur={val} prev={prevVal} />
                              </div>
                              <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 ${isGood ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                {isGood ? "Aman" : "Melebihi Batas"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  
                  {/* ISO Status Row */}
                  <div className="grid grid-cols-[230px_1fr_1fr_1fr] gap-3 bg-white rounded-2xl shadow-md border border-slate-200 p-3 items-stretch" style={{ flex: "1 1 0", minHeight: 100 }}>
                    <RowIdentity name="Sertifikasi ISO & Audit" icon={ShieldCheck} color="#4F46E5" extra={<div className="text-[12px] text-slate-500 mt-0.5">Status Kepatuhan</div>} />
                    {yearData.map((d, yi) => (
                      <div key={yi} className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center min-w-0" style={{ borderLeft: `4px solid ${YEAR_COLORS[yi]}` }}>
                        <p className="text-[14px] text-slate-700 leading-snug">{d.hasData ? (d.isoStatus || "Audit berjalan normal") : <Empty />}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SLIDE 4: ADMIN & SUPPORT ==================== */}
            {currentSlide === 3 && (
              <div className="absolute inset-0 p-6 flex flex-col gap-4 animate-fadeIn">
                <SlideHeader icon={<FileText size={24} />} title="Admin & Support Operasional" subtitle="Administrasi dokumen, tukar faktur, dan akurasi data" />
                <YearColHeaders yearData={yearData} label="Metrik Admin" sub="Akurasi & Kecepatan" />
                
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  {[
                    { key: "cancelInvTarget", title: "Cancel Invoice", sub: "Target: Max 150", icon: AlertTriangle, color: "#EF4444", isBadHigh: true },
                    { key: "tfLuarKotaAch", title: "TF Luar Kota", sub: "Target: 98%", icon: FileText, color: "#0891B2", isBadHigh: false },
                    { key: "tfEmailSistemAch", title: "TF Email & Sistem", sub: "Target: 99%", icon: FileText, color: "#059669", isBadHigh: false },
                  ].map((row) => (
                    <div key={row.key} className="grid grid-cols-[230px_1fr_1fr_1fr] gap-3 bg-white rounded-2xl shadow-md border border-slate-200 p-3 items-stretch" style={{ flex: "1 1 0", minHeight: 100 }}>
                      <RowIdentity name={row.title} icon={row.icon} color={row.color} extra={<div className="text-[12px] text-slate-500 mt-0.5">{row.sub}</div>} />
                      {yearData.map((d, yi) => {
                        if (!d.hasData) return <EmptyCell key={yi} />;
                        const val = toNum(d[row.key]);
                        const prevVal = yi > 0 ? toNum(yearData[yi - 1][row.key]) : 0;
                        const isGood = row.isBadHigh ? val <= 150 : val >= 98;
                        return (
                          <div key={yi} className="rounded-xl bg-slate-50 border border-slate-200 px-3 flex items-center gap-3 min-w-0" style={{ borderLeft: `4px solid ${YEAR_COLORS[yi]}` }}>
                            <MiniRing pct={row.isBadHigh ? (val > 150 ? 50 : 100) : val} color={isGood ? "#059669" : "#EF4444"} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[19px] font-black text-[#0F172A]">{d[row.key]}</span>
                                <DeltaChip cur={val} prev={prevVal} />
                              </div>
                              <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 ${isGood ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                {isGood ? "Aman" : "Melebihi Batas"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== SLIDE 5: EXIM & GLOBAL ==================== */}
            {currentSlide === 4 && (
              <div className="absolute inset-0 p-6 flex flex-col gap-4 animate-fadeIn">
                <SlideHeader icon={<Globe size={24} />} title="Exim & Global Trade" subtitle="Perizinan, kuota, dan pengembangan gudang berikat" />
                <YearColHeaders yearData={yearData} label="Metrik Exim" sub="Kepatuhan & Ekspansi" />
                
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col">
                    <div className="text-base font-bold text-[#0F172A] mb-4 flex items-center gap-2"><Globe size={20} className="text-[#0891B2]" /> Kuota & Perizinan Import</div>
                    <div className="flex-1 space-y-4">
                      {yearData.map((d, i) => (
                        <div key={d.yr} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200" style={{ borderLeft: `4px solid ${YEAR_COLORS[i]}` }}>
                          <YearTag yr={d.yr} idx={i} />
                          <div className="flex-1">
                            <div className="text-[15px] font-bold text-[#0F172A]">{d.importQuotaStatus}</div>
                            <div className="text-[12px] text-slate-500">Status Kuota Import</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col">
                    <div className="text-base font-bold text-[#0F172A] mb-4 flex items-center gap-2"><Package size={20} className="text-[#059669]" /> Gudang Berikat (GB)</div>
                    <div className="flex-1 space-y-4">
                      {yearData.map((d, i) => (
                        <div key={d.yr} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200" style={{ borderLeft: `4px solid ${YEAR_COLORS[i]}` }}>
                          <YearTag yr={d.yr} idx={i} />
                          <div className="flex-1">
                            <div className="text-[24px] font-black text-[#059669]">{d.gbCustomerTarget}</div>
                            <div className="text-[12px] text-slate-500">Target Penambahan Customer Legalitas</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SLIDE 6: RISK RADAR ==================== */}
            {currentSlide === 5 && (
              <div className="absolute inset-0 p-6 flex flex-col gap-4 animate-fadeIn">
                <SlideHeader icon={<ShieldCheck size={24} />} title="Risk Radar & Mitigasi" subtitle="Deteksi otomatis penyimpangan target dan catatan evaluasi" />
                
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col">
                    <div className="text-base font-bold text-[#0F172A] mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-[#EF4444]" /> Isu Terdeteksi ({risks.length})</div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                      {risks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 size={32} /></div>
                          <p className="text-[16px] font-bold text-emerald-700">Seluruh Indikator Aman</p>
                          <p className="text-sm text-slate-500">Tidak ada penyimpangan target kritis yang terdeteksi dari data input 2024-2026.</p>
                        </div>
                      ) : (
                        risks.map((r, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200">
                            <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-800 text-[11px] font-black">{r.yr}</span>
                                <span className="text-[12px] font-bold text-rose-700">{r.dept}</span>
                              </div>
                              <p className="text-[14px] text-rose-900 leading-snug">{r.msg}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col">
                    <div className="text-base font-bold text-[#0F172A] mb-4 flex items-center gap-2"><Zap size={20} className="text-[#F59E0B]" /> Catatan Mitigasi & Evaluasi</div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                      {yearData.map((d, i) => {
                        const evalText = d.hrEval || d.logisticEval || d.purchasingEval || d.cancelInvAnalysis || d.adminTfEval || d.eximEval;
                        if (!d.hasData || !evalText) return null;
                        return (
                          <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                            <div className="text-[12px] font-bold text-amber-700 mb-1">Evaluasi {d.yr}</div>
                            <p className="text-[14px] text-amber-900 leading-snug whitespace-pre-line">{evalText}</p>
                          </div>
                        );
                      })}
                      {yearData.every(d => !d.hasData || !(d.hrEval || d.logisticEval || d.purchasingEval || d.cancelInvAnalysis || d.adminTfEval || d.eximEval)) && (
                        <Empty text="Belum ada catatan evaluasi yang diinput." />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SLIDE 7: OUTLOOK 2027 (GRAND FINALE) ==================== */}
            {currentSlide === 6 && (
              <div className="absolute inset-0 p-6 flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#0F172A] text-[#38BDF8] flex items-center justify-center"><Award size={24} /></div>
                    <div>
                      <div className="text-[26px] font-black text-[#0F172A] leading-none">Strategic Outlook 2027</div>
                      <div className="text-[13px] text-slate-500 mt-1">Proyeksi masa depan & fokus inovasi operasional</div>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 rounded-full text-sm font-black text-white bg-[#059669]">TARGET TAHUN DEPAN</span>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[1.5fr_1fr] gap-5">
                  <div className="bg-[#0F172A] text-white border border-slate-700 p-6 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col min-h-0">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#4F46E5] via-[#0891B2] to-[#059669]"></div>
                    <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(56,189,248,0.15), transparent 70%)" }} />
                    <span className="absolute right-6 bottom-20 text-[150px] font-black leading-none pointer-events-none select-none text-white" style={{ opacity: 0.04 }}>2027</span>
                    
                    <div className="relative inline-flex self-start items-center gap-2 bg-[#38BDF8] text-[#0F172A] px-4 py-2 rounded-full text-sm font-bold mb-4">
                      <Sparkles size={16} /> Final Stage: Strategic Outlook
                    </div>
                    
                    <h2 className="relative text-[28px] font-black tracking-tight leading-tight mb-4">Fokus & Target Utama Operasional</h2>
                    
                    <div className="relative flex-1 min-h-0 bg-white/[0.07] border border-white/15 p-5 rounded-2xl overflow-y-auto custom-scrollbar">
                      <span className="text-sm text-[#38BDF8] font-bold flex items-center gap-2 mb-2"><Flag size={16} /> Arahan Strategis</span>
                      {outlook2027.hasData ? (
                        <p className="whitespace-pre-line text-[18px] text-slate-100 leading-relaxed">{outlook2027.nextYearOutlook}</p>
                      ) : (
                        <p className="text-lg italic text-slate-400">Belum ada strategic outlook yang di-input untuk tahun 2027.</p>
                      )}
                    </div>

                    <div className="relative pt-4 mt-4 border-t border-white/15 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-[#38BDF8] flex items-center gap-2"><CheckCircle2 size={20} /> Siap Melangkah ke 2027!</h4>
                        <p className="text-sm text-slate-300">Komitmen efisiensi berkelanjutan dan transformasi operasional.</p>
                      </div>
                      <button onClick={() => setCurrentSlide(0)} className="px-5 py-3 rounded-xl bg-[#38BDF8] text-[#0F172A] font-black text-sm shadow-lg hover:brightness-110 transition cursor-pointer flex items-center gap-2 shrink-0">
                        <RotateCcw size={16} /> Restart Deck
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 flex flex-col min-h-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-[#38BDF8] flex items-center justify-center"><Award size={20} /></div>
                      <div>
                        <div className="text-lg font-black text-[#0F172A] leading-none">Key Milestones</div>
                        <div className="text-xs text-slate-500 mt-1">Pencapaian besar yang menjadi fondasi 2027</div>
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-xl p-4 overflow-y-auto custom-scrollbar border border-slate-200">
                      {outlook2027.hasData ? (
                        <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-line">{outlook2027.keyMilestones}</p>
                      ) : (
                        <Empty text="Belum ada milestone yang diinput." />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 3. Footer Navigation Controls */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#1E293B] z-10 border-t border-slate-700">
        <button onClick={() => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides)} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition cursor-pointer">
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {slideLabels.map((label, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${currentSlide === idx ? "bg-[#38BDF8] text-[#0F172A] shadow-md" : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)} className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-xl bg-[#38BDF8] hover:brightness-110 text-[#0F172A] font-bold transition cursor-pointer">
          Selanjutnya <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SUB-COMPONENT: Metric Row                                          */
/* ------------------------------------------------------------------ */
function MetricRow({ label, value, target, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-[14px] font-bold text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-slate-400">Target: {target}</span>
        <span className="text-[16px] font-black" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}