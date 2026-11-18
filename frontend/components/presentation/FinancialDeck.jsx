"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, 
  Activity, ShieldCheck, Zap, Package, FileText, Globe, 
  AlertTriangle, CheckCircle2, Award, Clock, Target, 
  TrendingUp, TrendingDown, Wallet, Receipt, Percent
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
    rose: "from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-400",
    violet: "from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-400",
  };
  
  const hasValue = value && String(value).trim() !== "" && String(value) !== "0";
  if (!hasValue) return <EmptyState label={label} />;

  return (
    <div className={`relative p-5 rounded-2xl border bg-gradient-to-br ${colors[color]} flex flex-col justify-between h-full`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl bg-slate-950/50"><Icon size={20} /></div>
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
    rose: "border-rose-500/30 bg-rose-950/20 text-rose-100",
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
export default function FinancialDeck({ report, allYearlyReports = {} }) {
  const currentYr = 2026;
  const slideLabels = [
    "1. Executive Command", 
    "2. Finance AR (Piutang)", 
    "3. Finance AP (Hutang)", 
    "4. Accounting & Tax", 
    "5. Admin TF", 
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

  const data = useMemo(() => {
    const matches = allYearlyReports[currentYr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === currentYr) : []);
    const rep = matches.length > 0 ? matches[0] : (Number(report?.year) === currentYr ? report : null);
    const m = rep?.metricsJson || rep || {};
    const hasData = !!rep;

    return {
      hasData,
      // Finance Dept
      danaCadangan: m.danaCadangan || "",
      executiveSummary: m.executiveSummary || m.financeDeptEvaluation || "",
      // AR
      arIdrAch: m.arIdrAch || "",
      arUsdAch: m.arUsdAch || "",
      badDebtControl: m.badDebtControl || "",
      badDebtList: Array.isArray(m.badDebtList) ? m.badDebtList : [],
      arEvaluation: m.arEvaluation || "",
      // AP
      monthlyReportDate: m.monthlyReportDate || "",
      budgetHutangAch: m.budgetHutangAch || "",
      claimSpaAch: m.claimSpaAch || "",
      sapUpdateAch: m.sapUpdateAch || "",
      apEvaluation: m.apEvaluation || "",
      // Accounting & Tax
      lapKeuanganDate: m.lapKeuanganDate || "",
      taxConsultantReport: m.taxConsultantReport || "",
      costCenterAnalysis: m.costCenterAnalysis || "",
      assetUpdate: m.assetUpdate || "",
      taxRevisi: m.taxRevisi || "",
      taxBatal: m.taxBatal || "",
      taxEvaluation: m.taxEvaluation || "",
      // Admin TF
      tfLuarKotaAch: m.tfLuarKotaAch || "",
      tfEmailSistemAch: m.tfEmailSistemAch || "",
      totalInvLuarKota: m.totalInvLuarKota || "",
      totalInvEmailSistem: m.totalInvEmailSistem || "",
      adminTfEvaluation: m.adminTfEvaluation || "",
      // Exim
      ipakCdakb: m.ipakCdakb || "",
      pabeanCompliance: m.pabeanCompliance || "",
      importQuotaStatus: m.importQuotaStatus || "",
      gbCustomerTarget: m.gbCustomerTarget || "",
      eximEvaluation: m.eximEvaluation || "",
      // 2027
      nextYearOutlook: m.nextYearOutlook || m.strategicInitiatives || "",
      keyMilestones: m.keyMilestones || "",
    };
  }, [allYearlyReports, report, currentYr]);

  const risks = useMemo(() => {
    const detected = [];
    if (!data.hasData) return detected;
    
    if (data.arIdrAch && toNum(data.arIdrAch) < 98) detected.push({ dept: "Finance AR", msg: `Pencapaian piutang IDR (${data.arIdrAch}) di bawah target 98%.` });
    if (data.badDebtList && data.badDebtList.length > 0) {
      const totalBadDebt = data.badDebtList.reduce((acc, curr) => acc + toNum(curr.amount), 0);
      if (totalBadDebt > 0) detected.push({ dept: "Finance AR", msg: `Terdapat ${data.badDebtList.length} akun bad debt (Total: ${formatRupiah(totalBadDebt)}).` });
    }
    if (data.taxRevisi && toNum(data.taxRevisi) > 2) detected.push({ dept: "Accounting & Tax", msg: `Faktur pajak revisi (${data.taxRevisi}%) melebihi batas 2%.` });
    if (data.taxBatal && toNum(data.taxBatal) > 1) detected.push({ dept: "Accounting & Tax", msg: `Faktur pajak batal (${data.taxBatal}%) melebihi batas 1%.` });
    if (data.monthlyReportDate && (data.monthlyReportDate.toLowerCase().includes("telat") || data.monthlyReportDate.toLowerCase().includes("belum"))) {
      detected.push({ dept: "Finance AP", msg: "Laporan bulanan mengalami keterlambatan." });
    }
    return detected;
  }, [data]);

  return (
    <div className="relative w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-slate-200">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold">Financial Command Center</div>
            <div className="text-sm text-slate-300 font-medium">{report?.plant?.name || "Consolidated Finance"} · FY {currentYr}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 font-mono">Slide <span className="text-amber-400 font-bold">{currentSlide + 1}</span> / {totalSlides}</span>
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause size={16} className="text-amber-400" /> : <Play size={16} />}
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
          <div className="relative bg-slate-950 overflow-hidden" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            
            {/* SLIDE 1: EXECUTIVE COMMAND */}
            {currentSlide === 0 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4">
                  <h1 className="text-4xl font-black text-white tracking-tight">Executive Financial Command</h1>
                  <p className="text-slate-400 mt-1">Ringkasan kinerja keuangan, likuiditas, dan kepatuhan fiskal</p>
                </div>
                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="col-span-2 grid grid-cols-3 gap-6">
                    <KpiCard label="Dana Cadangan" value={data.danaCadangan} target="10% Net Profit" icon={Wallet} color="emerald" isGood={true} />
                    <KpiCard label="Total Risiko Aktif" value={String(risks.length)} target="0" icon={AlertTriangle} color={risks.length > 0 ? "amber" : "emerald"} isGood={risks.length === 0} />
                    <KpiCard label="Status Kepatuhan" value={risks.length === 0 ? "Compliant" : "Review"} target="100%" icon={ShieldCheck} color={risks.length === 0 ? "emerald" : "amber"} isGood={risks.length === 0} />
                  </div>
                  <InsightBlock title="Executive Summary" text={data.executiveSummary} color="amber" />
                  <InsightBlock title="Risk Management & Mitigasi" text={data.taxEvaluation || data.arEvaluation || "Menunggu input data mitigasi risiko..."} color="rose" />
                </div>
              </div>
            )}

            {/* SLIDE 2: FINANCE AR */}
            {currentSlide === 1 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Receipt size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Finance AR (Piutang)</h1>
                    <p className="text-slate-400">Penagihan, pencapain, dan pengendalian bad debt</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 flex-1">
                  <KpiCard label="Pencapaian Piutang IDR" value={data.arIdrAch} target="≥ 98%" icon={TrendingUp} color="emerald" isGood={toNum(data.arIdrAch) >= 98} />
                  <KpiCard label="Pencapaian Piutang USD" value={data.arUsdAch} target="≥ 98%" icon={Globe} color="emerald" isGood={toNum(data.arUsdAch) >= 98} />
                  <KpiCard label="Kontrol Bad Debt" value={data.badDebtControl || "N/A"} target="Zero" icon={ShieldCheck} color="emerald" isGood={true} />
                  
                  {data.badDebtList && data.badDebtList.length > 0 && (
                    <div className="col-span-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rincian Bad Debt Aktif</div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {data.badDebtList.map((bd, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                              <div>
                                <div className="text-sm font-bold text-white">{bd.customerName || "Customer Tidak Diketahui"}</div>
                                <div className="text-xs text-slate-400">PIC: {bd.salesPic || "-"} · {bd.remarks || "-"}</div>
                              </div>
                            </div>
                            <div className="text-sm font-black text-rose-400">{formatRupiah(bd.amount)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="col-span-3">
                    <InsightBlock title="Evaluasi Penagihan & Piutang" text={data.arEvaluation} color="slate" />
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: FINANCE AP */}
            {currentSlide === 2 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><FileText size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Finance AP (Hutang)</h1>
                    <p className="text-slate-400">Kepatuhan pelaporan, budget, dan administrasi SAP</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="grid grid-cols-2 gap-6">
                    <KpiCard label="Laporan Bulanan" value={data.monthlyReportDate} target="Tgl 5" icon={Calendar} color="cyan" isGood={!String(data.monthlyReportDate).toLowerCase().includes("telat")} />
                    <KpiCard label="Budget Hutang" value={data.budgetHutangAch} target="100%" icon={Target} color="emerald" isGood={true} />
                    <KpiCard label="Claim SPA" value={data.claimSpaAch} target="Tgl 15" icon={CheckCircle2} color="cyan" isGood={true} />
                    <KpiCard label="Update SAP" value={data.sapUpdateAch} target="Rutin" icon={Activity} color="emerald" isGood={true} />
                  </div>
                  <InsightBlock title="Evaluasi Operasional AP" text={data.apEvaluation} color="cyan" />
                </div>
              </div>
            )}

            {/* SLIDE 4: ACCOUNTING & TAX */}
            {currentSlide === 3 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Percent size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Accounting & Tax</h1>
                    <p className="text-slate-400">Kepatuhan fiskal, laporan keuangan, dan audit</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 flex-1">
                  <KpiCard label="Laporan Keuangan" value={data.lapKeuanganDate} target="Tgl 25" icon={FileText} color="amber" isGood={!String(data.lapKeuanganDate).toLowerCase().includes("telat")} />
                  <KpiCard label="Faktur Revisi" value={data.taxRevisi} target="Max 2%" icon={AlertTriangle} color={toNum(data.taxRevisi) <= 2 ? "emerald" : "rose"} isGood={toNum(data.taxRevisi) <= 2} />
                  <KpiCard label="Faktur Batal" value={data.taxBatal} target="Max 1%" icon={AlertTriangle} color={toNum(data.taxBatal) <= 1 ? "emerald" : "rose"} isGood={toNum(data.taxBatal) <= 1} />
                  
                  <div className="col-span-1 p-5 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-center">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Lainnya</div>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div>· Konsultan: {data.taxConsultantReport || "-"}</div>
                      <div>· Cost Center: {data.costCenterAnalysis || "-"}</div>
                      <div>· Asset Update: {data.assetUpdate || "-"}</div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <InsightBlock title="Evaluasi Perpajakan & Coretax" text={data.taxEvaluation} color="amber" />
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 5: ADMIN TF */}
            {currentSlide === 4 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><FileText size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Administrasi Tukar Faktur (TF)</h1>
                    <p className="text-slate-400">Akurasi dokumen, kecepatan proses, dan mitigasi error</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="grid grid-cols-2 gap-6">
                    <KpiCard label="TF Luar Kota" value={data.tfLuarKotaAch} target="≥ 98%" icon={Globe} color="indigo" isGood={toNum(data.tfLuarKotaAch) >= 98} />
                    <KpiCard label="TF Email & Sistem" value={data.tfEmailSistemAch} target="≥ 99%" icon={Activity} color="emerald" isGood={toNum(data.tfEmailSistemAch) >= 99} />
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-center">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Inv. Luar Kota</div>
                      <div className="text-2xl font-black text-white">{data.totalInvLuarKota || "-"}</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-center">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Inv. Email/Sistem</div>
                      <div className="text-2xl font-black text-white">{data.totalInvEmailSistem || "-"}</div>
                    </div>
                  </div>
                  <InsightBlock title="Evaluasi Kendala TF" text={data.adminTfEvaluation} color="indigo" />
                </div>
              </div>
            )}

            {/* SLIDE 6: GLOBAL TRADE (EXIM) */}
            {currentSlide === 5 && (
              <div className="absolute inset-0 p-10 flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400"><Globe size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Global Trade & Exim</h1>
                    <p className="text-slate-400">Perizinan, kuota, dan ekspansi fasilitas kepabeanan</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="p-6 rounded-2xl border border-violet-500/20 bg-violet-950/10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe size={24} className="text-violet-400" />
                      <span className="text-sm font-bold text-violet-300 uppercase tracking-wider">Status Perizinan & Kuota</span>
                    </div>
                    <div className="text-2xl font-black text-white mb-2">{data.importQuotaStatus || "Menunggu input..."}</div>
                    <div className="text-sm text-slate-400 mb-4">IPAK & CDAKB: {data.ipakCdakb || "-"}</div>
                    <div className="text-sm text-slate-400">Kepatuhan Pabean: {data.pabeanCompliance || "-"}</div>
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

            {/* SLIDE 7: HORIZON 2027 */}
            {currentSlide === 6 && (
              <div className="absolute inset-0 bg-slate-950 p-10 flex flex-col animate-fadeIn">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Award size={28} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold">Strategic Outlook</div>
                      <h1 className="text-4xl font-black text-white tracking-tight">Horizon 2027</h1>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-8 relative z-10">
                  <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                      <Target size={20} /> Fokus & Target Utama Keuangan
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
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? "w-8 bg-amber-400" : "w-2 bg-slate-700 hover:bg-slate-600"}`}
              title={label}
            />
          ))}
        </div>
        <button onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)} className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer">
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