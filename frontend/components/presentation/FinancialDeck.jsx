"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw,
  Activity, ShieldCheck, Zap, FileText, Globe,
  AlertTriangle, CheckCircle2, Award, Clock, Target,
  TrendingUp, Wallet, Receipt, Percent, Calendar, Layers, Building2, Landmark
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

const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const isNumericOnly = (v) => /^\s*-?[\d.,]+\s*$/.test(String(v));
const fmtPct = (v) => (isNumericOnly(v) ? `${String(v).trim()}%` : String(v));
const parseDay = (v) => {
  const m = String(v ?? "").match(/\d{1,2}/);
  const n = m ? Number(m[0]) : NaN;
  return n >= 1 && n <= 31 ? n : null;
};
const toItems = (t) =>
  String(t || "")
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

const STAGE_W = 1360;
const STAGE_H = 720;

const COLOR = {
  amber: "#FBBF24",
  emerald: "#34D399",
  cyan: "#22D3EE",
  indigo: "#818CF8",
  violet: "#A78BFA",
  rose: "#FB7185",
};
const GOOD = "#34D399";
const WARN = "#FBBF24";
const BAD = "#FB7185";

/* ------------------------------------------------------------------ */
/*  HOOKS                                                              */
/* ------------------------------------------------------------------ */
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return m;
}

function useCountUp(target, duration = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    let start;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / duration, 1);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/* angka berhitung naik (hanya kalau nilainya murni angka / persen) */
function AnimatedValue({ text, className = "", style }) {
  const s = String(text ?? "");
  const m = s.match(/^\s*(-?\d+(?:[.,]\d+)?)\s*(%?)\s*$/);
  const target = m ? parseFloat(m[1].replace(",", ".")) : 0;
  const v = useCountUp(m ? target : 0);
  if (!m) return <span className={className} style={style}>{s}</span>;
  const frac = /[.,](\d+)/.exec(m[1]);
  const dec = frac ? frac[1].length : 0;
  const sep = m[1].includes(",") ? "," : ".";
  return <span className={className} style={style}>{v.toFixed(dec).replace(".", sep) + m[2]}</span>;
}

/* ------------------------------------------------------------------ */
/*  UI COMPONENTS                                                      */
/* ------------------------------------------------------------------ */
function Glass({ children, className = "", style, d = 0 }) {
  return (
    <div
      className={`rise relative rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm overflow-hidden ${className}`}
      style={{ animationDelay: `${d * 90}ms`, ...style }}
    >
      {children}
    </div>
  );
}

function TopAccent({ color }) {
  return <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, transparent 80%)` }} />;
}

function IconChip({ icon: Icon, color, size = 40, iconSize = 20 }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: `${color}1F`, color, boxShadow: `inset 0 0 0 1px ${color}40` }}
    >
      <Icon size={iconSize} />
    </div>
  );
}

function StatusPill({ good, label }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
      style={{ background: good ? "#34D3991F" : "#FBBF241F", color: good ? GOOD : WARN }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: good ? GOOD : WARN }} />
      {label || (good ? "Optimal" : "Review")}
    </span>
  );
}

function EmptyCard({ label, className = "" }) {
  return (
    <div className={`h-full min-h-[110px] flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-2 text-slate-500">
        <FileText size={20} />
      </div>
      <span className="text-xs font-medium text-slate-500">Menunggu input {label}...</span>
    </div>
  );
}

/* Cincin penuh */
function Ring({ pct, color, size = 112, stroke = 8, children }) {
  const m = useMounted();
  const r = (100 - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${m ? (v / 100) * c : 0} ${c}`}
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.16,1,.3,1)", filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/* Gauge busur 240° dengan tick & penanda target */
function ArcGauge({ pct, color, target, width = 196, children }) {
  const m = useMounted();
  const v = Math.min(Math.max(pct, 0), 100);
  const R = 80, cx = 100, cy = 100;
  const pt = (deg, r) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const [sx, sy] = pt(150, R);
  const [ex, ey] = pt(30, R);
  const path = `M ${sx} ${sy} A ${R} ${R} 0 1 1 ${ex} ${ey}`;
  const ticks = Array.from({ length: 11 }, (_, i) => 150 + 24 * i);
  const tAng = target != null ? 150 + (240 * Math.min(target, 100)) / 100 : null;
  return (
    <div className="relative shrink-0" style={{ width, height: width * 0.74 }}>
      <svg viewBox="0 6 200 148" className="w-full h-full">
        <path d={path} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" pathLength="100" />
        <path
          d={path} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" pathLength="100"
          strokeDasharray={`${m ? v : 0} 100`}
          style={{ opacity: m && v > 0 ? 1 : 0, transition: "stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1), opacity .3s", filter: `drop-shadow(0 0 8px ${color}99)` }}
        />
        {ticks.map((a, i) => {
          const [x1, y1] = pt(a, R - 17);
          const [x2, y2] = pt(a, R - 11);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />;
        })}
        {tAng !== null && (() => {
          const [x1, y1] = pt(tAng, R - 19);
          const [x2, y2] = pt(tAng, R + 11);
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="3" strokeLinecap="round" />;
        })()}
      </svg>
      <div className="absolute inset-x-0 text-center" style={{ top: "36%" }}>{children}</div>
    </div>
  );
}

/* KPI persen -> gauge busur */
function GaugeCard({ label, value, target, targetNum, icon, accent, good, d = 0, compact = false }) {
  if (!hasVal(value)) return <EmptyCard label={label} />;
  const color = good ? GOOD : WARN;
  return (
    <Glass d={d} className={`flex items-center ${compact ? "gap-3 px-4 py-3" : "gap-5 px-5 py-4"} h-full`}>
      <TopAccent color={accent} />
      <ArcGauge pct={toNum(value)} color={color} target={targetNum} width={compact ? 168 : 200}>
        <AnimatedValue text={fmtPct(value)} className={`${compact ? "text-[26px]" : "text-[32px]"} font-black text-white leading-none tabular-nums`} />
      </ArcGauge>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <IconChip icon={icon} color={accent} size={30} iconSize={15} />
          <StatusPill good={good} />
        </div>
        <div className="text-[12px] font-bold text-slate-200 uppercase tracking-wider leading-tight">{label}</div>
        {target && <div className="text-[12px] text-slate-500 mt-1">Target: {target}</div>}
      </div>
    </Glass>
  );
}

/* KPI umum (teks / tanggal / angka) */
function StatCard({ label, value, target, icon, accent, good = true, showBar = false, d = 0 }) {
  const m = useMounted();
  if (!hasVal(value)) return <EmptyCard label={label} />;
  const pct = showBar && /^\s*-?[\d.,]+\s*%?\s*$/.test(String(value)) ? toNum(value) : null;
  return (
    <Glass d={d} className="p-5 flex flex-col justify-between h-full">
      <TopAccent color={accent} />
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)` }} />
      <div className="flex items-center justify-between">
        <IconChip icon={icon} color={accent} />
        <StatusPill good={good} />
      </div>
      <div className="mt-3 relative">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <AnimatedValue text={String(value)} className="block text-[32px] font-black text-white leading-tight break-words tabular-nums" />
        {pct !== null && (
          <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${m ? Math.min(pct, 100) : 0}%`, background: good ? GOOD : WARN, transition: "width 1.1s cubic-bezier(.16,1,.3,1)" }} />
          </div>
        )}
        {target && <div className="text-[12px] text-slate-500 mt-1.5">Target: {target}</div>}
      </div>
    </Glass>
  );
}

/* Meter batas maksimum (faktur revisi / batal) */
function LimitMeter({ label, value, limit, icon, accent, d = 0 }) {
  const m = useMounted();
  if (!hasVal(value)) return <EmptyCard label={label} />;
  const n = toNum(value);
  const good = n <= limit;
  const fill = Math.min((n / (limit * 2)) * 100, 100);
  return (
    <Glass d={d} className="p-5 flex flex-col justify-between h-full">
      <TopAccent color={accent} />
      <div className="flex items-center justify-between">
        <IconChip icon={icon} color={accent} />
        <StatusPill good={good} />
      </div>
      <div className="mt-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <AnimatedValue text={fmtPct(value)} className="block text-[36px] font-black text-white leading-none tabular-nums" />
        <div className="relative h-3 rounded-full bg-white/10 mt-3">
          <div className="h-full rounded-full" style={{ width: `${m ? fill : 0}%`, background: good ? `linear-gradient(90deg, ${GOOD}88, ${GOOD})` : `linear-gradient(90deg, ${WARN}, ${BAD})`, transition: "width 1.1s cubic-bezier(.16,1,.3,1)" }} />
          <div className="absolute -top-1.5 -bottom-1.5 w-[3px] rounded bg-white" style={{ left: "50%" }} />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
          <span>0%</span>
          <span className="text-slate-300 font-semibold">Batas maks {limit}%</span>
          <span>{limit * 2}%</span>
        </div>
      </div>
    </Glass>
  );
}

/* Panel teks evaluasi */
function InsightPanel({ title, text, accent = COLOR.cyan, icon = Zap, className = "", d = 0 }) {
  return (
    <Glass d={d} className={`p-6 flex flex-col h-full min-h-0 ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent }} />
      <div className="absolute right-4 top-2 text-[90px] leading-none font-black select-none pointer-events-none" style={{ color: accent, opacity: 0.07 }}>”</div>
      <div className="flex items-center gap-3 mb-3 shrink-0 relative">
        <IconChip icon={icon} color={accent} size={34} iconSize={17} />
        <span className="text-[13px] font-black uppercase tracking-wider text-slate-200">{title}</span>
      </div>
      {hasVal(text) ? (
        <p className="relative flex-1 min-h-0 overflow-y-auto custom-scrollbar text-[16px] leading-relaxed text-slate-300 whitespace-pre-line pr-1">{text}</p>
      ) : (
        <div className="flex-1 min-h-0"><EmptyCard label="catatan evaluasi" /></div>
      )}
    </Glass>
  );
}

/* Kerangka tiap slide */
function SlideShell({ icon, kicker, title, subtitle, accent, no, children }) {
  return (
    <div className="absolute inset-0 p-9 flex flex-col gap-5">
      <div
        className="absolute -right-24 -top-24 w-[440px] h-[440px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}26, transparent 70%)` }}
      />
      <span className="absolute right-9 top-3 text-[130px] font-black leading-none select-none pointer-events-none text-white/[0.04]">{no}</span>
      <div className="relative flex items-center gap-4 shrink-0 rise">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}AA)`, boxShadow: `0 8px 24px ${accent}40` }}
        >
          {React.createElement(icon, { size: 28 })}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-black" style={{ color: accent }}>{kicker}</div>
          <h1
            className="text-[34px] font-black tracking-tight leading-tight"
            style={{ background: `linear-gradient(90deg, #fff 40%, ${accent})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            {title}
          </h1>
          {subtitle && <p className="text-[14px] text-slate-400 -mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="relative flex-1 min-h-0 flex flex-col gap-5">{children}</div>
    </div>
  );
}

/* Strip tenggat tanggal 1-31 (target vs realisasi) */
function DeadlineStrip({ items }) {
  return (
    <Glass d={4} className="px-6 pt-4 pb-3 shrink-0" style={{ height: 132 }}>
      <TopAccent color={COLOR.cyan} />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Tenggat Bulanan</span>
        <span className="text-[11px] text-slate-500">▾ target &nbsp; ● realisasi</span>
      </div>
      <div className="relative mx-3" style={{ height: 78 }}>
        <div className="absolute left-0 right-0 rounded-full bg-white/10" style={{ top: 44, height: 8 }} />
        {items.map((it, i) => {
          const tx = ((it.target - 1) / 30) * 100;
          const ad = parseDay(it.actual);
          const ax = ad ? ((ad - 1) / 30) * 100 : null;
          const ok = ad !== null && ad <= it.target;
          return (
            <React.Fragment key={i}>
              <div className="absolute -translate-x-1/2 text-center" style={{ left: `${tx}%`, top: 0 }}>
                <div className="text-[11px] font-bold text-slate-300 whitespace-nowrap">{it.label}</div>
                <div className="text-[10px] text-slate-500">tgl {it.target}</div>
                <div className="w-[2px] h-3 bg-white/60 mx-auto" />
              </div>
              {ax !== null && (
                <>
                  <div className="absolute -translate-x-1/2 w-4 h-4 rounded-full border-2 border-[#0A1826]" style={{ left: `${ax}%`, top: 40, background: ok ? GOOD : BAD, boxShadow: `0 0 10px ${ok ? GOOD : BAD}` }} />
                  <div className="absolute -translate-x-1/2 text-[10px] font-bold whitespace-nowrap" style={{ left: `${ax}%`, top: 60, color: ok ? GOOD : BAD }}>tgl {ad}</div>
                </>
              )}
            </React.Fragment>
          );
        })}
        <span className="absolute left-0 text-[10px] text-slate-600" style={{ top: 60 }}>1</span>
        <span className="absolute right-0 text-[10px] text-slate-600" style={{ top: 60 }}>31</span>
      </div>
    </Glass>
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

  const compliant = risks.length === 0;
  const badDebtTotal = data.badDebtList.reduce((acc, curr) => acc + toNum(curr.amount), 0);

  /* scorecard departemen (memakai ambang yang sama dengan slide masing-masing) */
  const lateAp = String(data.monthlyReportDate).toLowerCase().includes("telat");
  const lateLap = String(data.lapKeuanganDate).toLowerCase().includes("telat");
  const depts = [
    {
      label: "Finance AR", slide: 1, icon: Receipt, color: COLOR.emerald,
      has: hasVal(data.arIdrAch) || hasVal(data.arUsdAch) || data.badDebtList.length > 0,
      good: !(hasVal(data.arIdrAch) && toNum(data.arIdrAch) < 98) && !(hasVal(data.arUsdAch) && toNum(data.arUsdAch) < 98) && data.badDebtList.length === 0,
      metric: hasVal(data.arIdrAch) ? `IDR ${fmtPct(data.arIdrAch)}` : "",
    },
    {
      label: "Finance AP", slide: 2, icon: FileText, color: COLOR.cyan,
      has: hasVal(data.monthlyReportDate) || hasVal(data.budgetHutangAch) || hasVal(data.claimSpaAch) || hasVal(data.sapUpdateAch),
      good: !lateAp,
      metric: hasVal(data.monthlyReportDate) ? `Lap. ${data.monthlyReportDate}` : "",
    },
    {
      label: "Accounting & Tax", slide: 3, icon: Percent, color: COLOR.amber,
      has: hasVal(data.lapKeuanganDate) || hasVal(data.taxRevisi) || hasVal(data.taxBatal),
      good: !lateLap && !(hasVal(data.taxRevisi) && toNum(data.taxRevisi) > 2) && !(hasVal(data.taxBatal) && toNum(data.taxBatal) > 1),
      metric: hasVal(data.taxRevisi) || hasVal(data.taxBatal) ? `Rev ${data.taxRevisi || "-"}% · Batal ${data.taxBatal || "-"}%` : "",
    },
    {
      label: "Admin TF", slide: 4, icon: Activity, color: COLOR.indigo,
      has: hasVal(data.tfLuarKotaAch) || hasVal(data.tfEmailSistemAch),
      good: !(hasVal(data.tfLuarKotaAch) && toNum(data.tfLuarKotaAch) < 98) && !(hasVal(data.tfEmailSistemAch) && toNum(data.tfEmailSistemAch) < 99),
      metric: hasVal(data.tfLuarKotaAch) || hasVal(data.tfEmailSistemAch) ? `${hasVal(data.tfLuarKotaAch) ? fmtPct(data.tfLuarKotaAch) : "-"} · ${hasVal(data.tfEmailSistemAch) ? fmtPct(data.tfEmailSistemAch) : "-"}` : "",
    },
    {
      label: "Global Trade", slide: 5, icon: Globe, color: COLOR.violet,
      has: hasVal(data.importQuotaStatus) || hasVal(data.ipakCdakb) || hasVal(data.pabeanCompliance) || hasVal(data.gbCustomerTarget),
      good: true, info: true,
      metric: hasVal(data.importQuotaStatus) ? String(data.importQuotaStatus) : "",
    },
  ];

  const invA = toNum(data.totalInvLuarKota);
  const invB = toNum(data.totalInvEmailSistem);
  const invShare = invA + invB > 0 ? (invA / (invA + invB)) * 100 : null;

  const outlookItems = toItems(data.nextYearOutlook);
  const milestoneItems = toItems(data.keyMilestones);

  return (
    <div className="relative w-full bg-[#07121D] border border-white/10 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-slate-200">

      {/* HEADER */}
      <div className="relative flex items-center justify-between px-6 py-4 bg-[#0B1B2B]/90 backdrop-blur-md z-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-black">Financial Command Center</div>
            <div className="text-sm text-slate-300 font-medium">{report?.plant?.name || "Consolidated Finance"} · FY {currentYr}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 font-mono">Slide <span className="text-amber-400 font-bold">{currentSlide + 1}</span> / {totalSlides}</span>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause size={16} className="text-amber-400" /> : <Play size={16} />}
            </button>
            <button onClick={() => setCurrentSlide(0)} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition cursor-pointer">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        <div className="absolute left-0 bottom-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }} />
      </div>

      {/* VIEWPORT */}
      <div className="flex-1 flex items-center justify-center p-4 z-10 w-full bg-[#07121D]">
        <div ref={stageRef} className="w-full rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10" style={{ maxWidth: "100%", height: STAGE_H * scale }}>
          <div
            className="relative overflow-hidden"
            style={{
              width: STAGE_W,
              height: STAGE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              background: "radial-gradient(1100px 560px at 0% -10%, rgba(43,98,133,0.32), transparent 60%), radial-gradient(900px 500px at 100% 110%, rgba(163,196,0,0.07), transparent 60%), #0A1826",
            }}
          >
            {/* dekorasi latar: pola titik + orb melayang */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize: "30px 30px", maskImage: "linear-gradient(180deg, rgba(0,0,0,.9), transparent 85%)", WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,.9), transparent 85%)" }} />
            <div className="absolute w-72 h-72 rounded-full pointer-events-none floaty" style={{ left: "38%", top: "62%", background: "radial-gradient(circle, rgba(34,211,238,0.10), transparent 70%)" }} />
            <div className="absolute w-60 h-60 rounded-full pointer-events-none floaty2" style={{ left: "8%", top: "70%", background: "radial-gradient(circle, rgba(251,191,36,0.08), transparent 70%)" }} />

            {/* SLIDE 1: EXECUTIVE COMMAND */}
            {currentSlide === 0 && (
              <SlideShell icon={Landmark} kicker="Ringkasan Eksekutif" title="Executive Financial Command" subtitle="Kinerja keuangan, likuiditas, dan kepatuhan fiskal dalam satu pandangan" accent={COLOR.amber} no="01">
                <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-5 shrink-0" style={{ height: 132 }}>
                  {hasVal(data.danaCadangan) ? (
                    <Glass d={1} className="p-5 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.16), rgba(255,255,255,0.03))" }}>
                      <TopAccent color={COLOR.emerald} />
                      <div className="absolute -right-4 -bottom-8 text-emerald-300 pointer-events-none" style={{ opacity: 0.10 }}><Wallet size={150} /></div>
                      <div className="relative">
                        <div className="text-[11px] font-black text-emerald-200 uppercase tracking-wider mb-1">Dana Cadangan</div>
                        <AnimatedValue
                          text={String(data.danaCadangan)}
                          className="block text-[44px] font-black leading-none tabular-nums"
                          style={{ background: "linear-gradient(90deg,#fff,#6EE7B7)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                        />
                        <div className="text-[12px] text-slate-400 mt-1.5">Target: 10% Net Profit</div>
                      </div>
                    </Glass>
                  ) : (
                    <EmptyCard label="Dana Cadangan" />
                  )}

                  <Glass d={2} className="px-5 flex items-center gap-4">
                    <TopAccent color={compliant ? GOOD : WARN} />
                    <Ring pct={100} color={compliant ? GOOD : WARN} size={92} stroke={8}>
                      <span className="text-[34px] font-black text-white leading-none">{risks.length}</span>
                    </Ring>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Risiko Aktif</div>
                      <StatusPill good={compliant} />
                      <div className="text-[12px] text-slate-500 mt-1.5">Target: 0</div>
                    </div>
                  </Glass>

                  <Glass d={3} className="px-5 flex items-center gap-4">
                    <TopAccent color={compliant ? GOOD : WARN} />
                    <div className="w-[92px] h-[92px] rounded-full flex items-center justify-center shrink-0" style={{ background: `radial-gradient(circle, ${compliant ? GOOD : WARN}30, transparent 70%)`, color: compliant ? GOOD : WARN }}>
                      <ShieldCheck size={46} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Kepatuhan</div>
                      <div className="text-[26px] font-black text-white leading-tight">{compliant ? "Compliant" : "Review"}</div>
                      <div className="text-[12px] text-slate-500">Target: 100%</div>
                    </div>
                  </Glass>
                </div>

                {/* Scorecard departemen (klik untuk lompat ke slide) */}
                <div className="shrink-0">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Scorecard Departemen · klik untuk detail</div>
                  <div className="grid grid-cols-5 gap-4">
                    {depts.map((dp, i) => {
                      const state = !dp.has ? "empty" : dp.info ? "info" : dp.good ? "ok" : "review";
                      const sc = state === "ok" ? GOOD : state === "review" ? WARN : state === "info" ? COLOR.cyan : "#64748B";
                      const stLabel = state === "ok" ? "Optimal" : state === "review" ? "Review" : state === "info" ? "Terisi" : "Belum ada data";
                      return (
                        <button
                          key={dp.label}
                          onClick={() => setCurrentSlide(dp.slide)}
                          className="rise text-left relative rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 overflow-hidden hover:-translate-y-1 hover:bg-white/[0.09] transition cursor-pointer"
                          style={{ animationDelay: `${(i + 3) * 90}ms` }}
                        >
                          <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: sc }} />
                          <div className="flex items-center justify-between mb-2">
                            <IconChip icon={dp.icon} color={dp.color} size={32} iconSize={16} />
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: sc, boxShadow: `0 0 10px ${sc}` }} />
                          </div>
                          <div className="text-[13px] font-black text-white leading-tight">{dp.label}</div>
                          <div className="text-[11px] text-slate-400 truncate h-[15px]">{dp.metric || "—"}</div>
                          <div className="text-[10px] font-black uppercase tracking-wider mt-1" style={{ color: sc }}>{stLabel}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
                  <InsightPanel d={6} title="Executive Summary" text={data.executiveSummary} accent={COLOR.amber} icon={Zap} />

                  <Glass d={7} className="p-6 flex flex-col min-h-0">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: COLOR.rose }} />
                    <div className="flex items-center gap-3 mb-3 shrink-0">
                      <IconChip icon={AlertTriangle} color={COLOR.rose} size={34} iconSize={17} />
                      <span className="text-[13px] font-black uppercase tracking-wider text-slate-200">Risk Management & Mitigasi</span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
                      {!data.hasData ? (
                        <EmptyCard label={`data FY ${currentYr}`} />
                      ) : compliant ? (
                        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10">
                          <CheckCircle2 size={22} className="text-emerald-300 shrink-0" />
                          <span className="text-[14px] text-emerald-100">Semua indikator utama sesuai target. Tidak ada risiko aktif.</span>
                        </div>
                      ) : (
                        risks.map((r, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07]">
                            <div className="w-7 h-7 rounded-lg bg-rose-400/15 text-rose-300 flex items-center justify-center shrink-0 text-xs font-black">{i + 1}</div>
                            <div className="min-w-0">
                              <div className="text-[10px] font-black uppercase tracking-wider text-rose-300">{r.dept}</div>
                              <div className="text-[13px] text-slate-200 leading-snug">{r.msg}</div>
                            </div>
                          </div>
                        ))
                      )}
                      {hasVal(data.taxEvaluation || data.arEvaluation) && (
                        <div className="pt-2.5 border-t border-white/10">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Catatan mitigasi</div>
                          <p className="text-[13px] leading-relaxed text-slate-300 whitespace-pre-line">{data.taxEvaluation || data.arEvaluation}</p>
                        </div>
                      )}
                    </div>
                  </Glass>
                </div>
              </SlideShell>
            )}

            {/* SLIDE 2: FINANCE AR */}
            {currentSlide === 1 && (
              <SlideShell icon={Receipt} kicker="Finance · Piutang" title="Finance AR (Piutang)" subtitle="Penagihan, pencapaian, dan pengendalian bad debt" accent={COLOR.emerald} no="02">
                <div className="grid grid-cols-3 gap-5 shrink-0" style={{ height: 206 }}>
                  <GaugeCard d={1} label="Pencapaian Piutang IDR" value={data.arIdrAch} target="≥ 98%" targetNum={98} icon={TrendingUp} accent={COLOR.emerald} good={toNum(data.arIdrAch) >= 98} compact />
                  <GaugeCard d={2} label="Pencapaian Piutang USD" value={data.arUsdAch} target="≥ 98%" targetNum={98} icon={Globe} accent={COLOR.cyan} good={toNum(data.arUsdAch) >= 98} compact />
                  <StatCard d={3} label="Kontrol Bad Debt" value={data.badDebtControl || "N/A"} target="Zero" icon={ShieldCheck} accent={COLOR.violet} good={data.badDebtList.length === 0} />
                </div>
                <div className={`flex-1 min-h-0 grid gap-5 ${data.badDebtList.length > 0 ? "grid-cols-[1.15fr_1fr]" : "grid-cols-1"}`}>
                  {data.badDebtList.length > 0 && (
                    <Glass d={4} className="p-5 flex flex-col min-h-0">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: COLOR.rose }} />
                      <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-3">
                          <IconChip icon={AlertTriangle} color={COLOR.rose} size={34} iconSize={17} />
                          <span className="text-[13px] font-black uppercase tracking-wider text-slate-200">Rincian Bad Debt Aktif</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total</div>
                          <div className="text-[20px] font-black text-rose-300 leading-none">{formatRupiah(badDebtTotal)}</div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {data.badDebtList.map((bd, idx) => {
                          const share = badDebtTotal > 0 ? (toNum(bd.amount) / badDebtTotal) * 100 : 0;
                          return (
                            <div key={idx} className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-rose-400/15 text-rose-300 flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</div>
                                  <div className="min-w-0">
                                    <div className="text-[14px] font-bold text-white truncate">{bd.customerName || "Customer Tidak Diketahui"}</div>
                                    <div className="text-[12px] text-slate-400 truncate">PIC: {bd.salesPic || "-"} · {bd.remarks || "-"}</div>
                                  </div>
                                </div>
                                <div className="text-[15px] font-black text-rose-300 shrink-0">{formatRupiah(bd.amount)}</div>
                              </div>
                              <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
                                <div className="h-full rounded-full bg-rose-400" style={{ width: `${share}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Glass>
                  )}
                  <InsightPanel d={5} title="Evaluasi Penagihan & Piutang" text={data.arEvaluation} accent={COLOR.emerald} />
                </div>
              </SlideShell>
            )}

            {/* SLIDE 3: FINANCE AP */}
            {currentSlide === 2 && (
              <SlideShell icon={FileText} kicker="Finance · Hutang" title="Finance AP (Hutang)" subtitle="Kepatuhan pelaporan, budget, dan administrasi SAP" accent={COLOR.cyan} no="03">
                <div className="flex-1 min-h-0 grid grid-cols-[1.25fr_1fr] gap-5">
                  <div className="flex flex-col gap-5 min-h-0">
                    <div className="grid grid-cols-2 grid-rows-2 gap-5 flex-1 min-h-0">
                      <StatCard d={1} label="Laporan Bulanan" value={data.monthlyReportDate} target="Tgl 5" icon={Calendar} accent={COLOR.cyan} good={!lateAp} />
                      <StatCard d={2} label="Budget Hutang" value={data.budgetHutangAch} target="100%" icon={Target} accent={COLOR.emerald} good={true} showBar />
                      <StatCard d={3} label="Claim SPA" value={data.claimSpaAch} target="Tgl 15" icon={CheckCircle2} accent={COLOR.indigo} good={true} />
                      <StatCard d={4} label="Update SAP" value={data.sapUpdateAch} target="Rutin" icon={Activity} accent={COLOR.amber} good={true} />
                    </div>
                    <DeadlineStrip
                      items={[
                        { label: "Laporan Bulanan", target: 5, actual: data.monthlyReportDate },
                        { label: "Claim SPA", target: 15, actual: data.claimSpaAch },
                      ]}
                    />
                  </div>
                  <InsightPanel d={5} title="Evaluasi Operasional AP" text={data.apEvaluation} accent={COLOR.cyan} />
                </div>
              </SlideShell>
            )}

            {/* SLIDE 4: ACCOUNTING & TAX */}
            {currentSlide === 3 && (
              <SlideShell icon={Percent} kicker="Accounting · Perpajakan" title="Accounting & Tax" subtitle="Kepatuhan fiskal, laporan keuangan, dan audit" accent={COLOR.amber} no="04">
                <div className="grid grid-cols-3 gap-5 shrink-0" style={{ height: 196 }}>
                  <StatCard d={1} label="Laporan Keuangan" value={data.lapKeuanganDate} target="Tgl 25" icon={FileText} accent={COLOR.amber} good={!lateLap} />
                  <LimitMeter d={2} label="Faktur Pajak Revisi" value={data.taxRevisi} limit={2} icon={AlertTriangle} accent={COLOR.indigo} />
                  <LimitMeter d={3} label="Faktur Pajak Batal" value={data.taxBatal} limit={1} icon={AlertTriangle} accent={COLOR.violet} />
                </div>
                <div className="flex-1 min-h-0 grid grid-cols-[1fr_1.7fr] gap-5">
                  <Glass d={4} className="p-5 flex flex-col min-h-0">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">Kelengkapan Pendukung</div>
                    <div className="flex-1 flex flex-col justify-between gap-2">
                      {[
                        { l: "Laporan Konsultan Pajak", v: data.taxConsultantReport, i: Building2 },
                        { l: "Analisa Cost Center", v: data.costCenterAnalysis, i: Layers },
                        { l: "Update Asset", v: data.assetUpdate, i: Landmark },
                      ].map((row) => {
                        const ok = hasVal(row.v);
                        return (
                          <div key={row.l} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                            <IconChip icon={row.i} color={ok ? COLOR.amber : "#64748B"} size={36} iconSize={18} />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">{row.l}</div>
                              <div className={`text-[14px] font-semibold truncate ${ok ? "text-white" : "text-slate-500 italic"}`}>{ok ? row.v : "Belum diisi"}</div>
                            </div>
                            {ok && <CheckCircle2 size={18} className="text-emerald-300 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </Glass>
                  <InsightPanel d={5} title="Evaluasi Perpajakan & Coretax" text={data.taxEvaluation} accent={COLOR.amber} />
                </div>
              </SlideShell>
            )}

            {/* SLIDE 5: ADMIN TF */}
            {currentSlide === 4 && (
              <SlideShell icon={FileText} kicker="Administrasi · Tukar Faktur" title="Administrasi Tukar Faktur (TF)" subtitle="Akurasi dokumen, kecepatan proses, dan mitigasi error" accent={COLOR.indigo} no="05">
                <div className="flex-1 min-h-0 grid grid-cols-[1.3fr_1fr] gap-5">
                  <div className="grid grid-rows-[1fr_1fr] gap-5 min-h-0">
                    <div className="grid grid-cols-2 gap-5 min-h-0">
                      <GaugeCard compact d={1} label="TF Luar Kota" value={data.tfLuarKotaAch} target="≥ 98%" targetNum={98} icon={Globe} accent={COLOR.indigo} good={toNum(data.tfLuarKotaAch) >= 98} />
                      <GaugeCard compact d={2} label="TF Email & Sistem" value={data.tfEmailSistemAch} target="≥ 99%" targetNum={99} icon={Activity} accent={COLOR.emerald} good={toNum(data.tfEmailSistemAch) >= 99} />
                    </div>
                    <Glass d={3} className="p-5 flex flex-col justify-between min-h-0">
                      <TopAccent color={COLOR.indigo} />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Volume Invoice</span>
                        {invShare !== null && <span className="text-[11px] text-slate-500">{invShare.toFixed(0)}% luar kota · {(100 - invShare).toFixed(0)}% email/sistem</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR.indigo }} />Luar Kota</div>
                          <AnimatedValue text={hasVal(data.totalInvLuarKota) ? String(data.totalInvLuarKota) : "-"} className="block text-[40px] font-black text-white leading-none mt-1 tabular-nums" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR.emerald }} />Email / Sistem</div>
                          <AnimatedValue text={hasVal(data.totalInvEmailSistem) ? String(data.totalInvEmailSistem) : "-"} className="block text-[40px] font-black text-white leading-none mt-1 tabular-nums" />
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
                        {invShare !== null ? (
                          <>
                            <div style={{ width: `${invShare}%`, background: COLOR.indigo }} />
                            <div style={{ width: `${100 - invShare}%`, background: COLOR.emerald }} />
                          </>
                        ) : null}
                      </div>
                    </Glass>
                  </div>
                  <InsightPanel d={4} title="Evaluasi Kendala TF" text={data.adminTfEvaluation} accent={COLOR.indigo} />
                </div>
              </SlideShell>
            )}

            {/* SLIDE 6: GLOBAL TRADE (EXIM) */}
            {currentSlide === 5 && (
              <SlideShell icon={Globe} kicker="Exim · Kepabeanan" title="Global Trade & Exim" subtitle="Perizinan, kuota, dan ekspansi fasilitas kepabeanan" accent={COLOR.violet} no="06">
                <Glass d={1} className="px-8 pt-6 pb-5 shrink-0" style={{ height: 262 }}>
                  <TopAccent color={COLOR.violet} />
                  <div className="absolute left-[12.5%] right-[12.5%] h-[5px] rounded-full" style={{ top: 62, background: `linear-gradient(90deg, ${COLOR.cyan}, ${COLOR.violet}, ${COLOR.amber})`, opacity: 0.4 }} />
                  <div className="relative grid grid-cols-4 gap-4 h-full">
                    {[
                      { l: "IPAK & CDAKB", v: data.ipakCdakb, i: ShieldCheck, c: COLOR.cyan },
                      { l: "Kepatuhan Pabean", v: data.pabeanCompliance, i: CheckCircle2, c: COLOR.emerald },
                      { l: "Status Kuota Impor", v: data.importQuotaStatus, i: Globe, c: COLOR.violet },
                      { l: "Gudang Berikat", v: data.gbCustomerTarget, i: Award, c: COLOR.amber, big: true },
                    ].map((n, i) => {
                      const ok = hasVal(n.v);
                      return (
                        <div key={n.l} className="flex flex-col items-center text-center">
                          <div
                            className="w-[74px] h-[74px] rounded-full flex items-center justify-center shrink-0"
                            style={ok
                              ? { background: `linear-gradient(135deg, ${n.c}, ${n.c}99)`, color: "#06121C", boxShadow: `0 0 28px ${n.c}66` }
                              : { border: "2px dashed rgba(255,255,255,0.2)", color: "#64748B" }}
                          >
                            {React.createElement(n.i, { size: 30 })}
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2">Tahap {i + 1}</div>
                          <div className="text-[12px] font-black uppercase tracking-wider mt-0.5" style={{ color: ok ? n.c : "#64748B" }}>{n.l}</div>
                          {n.big ? (
                            <>
                              <AnimatedValue text={ok ? String(n.v) : "-"} className="block text-[46px] font-black text-white leading-none mt-1 tabular-nums" />
                              <div className="text-[11px] text-slate-400 mt-1">Target customer legalitas</div>
                            </>
                          ) : (
                            <div className={`text-[18px] font-bold leading-snug mt-1.5 px-1 line-clamp-3 ${ok ? "text-white" : "text-slate-600 italic"}`}>{ok ? n.v : "Belum diisi"}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Glass>
                <div className="flex-1 min-h-0">
                  <InsightPanel d={2} title="Evaluasi Kepabeanan & Ekspansi" text={data.eximEvaluation} accent={COLOR.violet} />
                </div>
              </SlideShell>
            )}

            {/* SLIDE 7: HORIZON 2027 */}
            {currentSlide === 6 && (
              <div className="absolute inset-0 p-9 flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400" />
                <div className="absolute -right-24 -top-24 w-[480px] h-[480px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(251,191,36,0.20), transparent 70%)" }} />
                <span className="absolute right-10 top-8 text-[170px] font-black leading-none select-none pointer-events-none text-white/[0.04]">2027</span>

                <div className="relative flex items-center gap-4 mb-5 rise">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
                    <Award size={32} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-amber-400 font-black">Strategic Outlook</div>
                    <h1 className="text-[44px] font-black tracking-tight leading-none" style={{ background: "linear-gradient(90deg,#fff 30%,#FBBF24)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Horizon 2027</h1>
                  </div>
                </div>

                <div className="relative flex-1 min-h-0 grid grid-cols-2 gap-6">
                  {[
                    { t: "Fokus & Target Utama Keuangan", icon: Target, c: COLOR.amber, items: outlookItems, raw: data.nextYearOutlook, empty: "Strategic Outlook 2027", tint: "rgba(251,191,36,0.10)" },
                    { t: "Key Milestones Achieved", icon: CheckCircle2, c: COLOR.emerald, items: milestoneItems, raw: data.keyMilestones, empty: "Key Milestones", tint: "rgba(52,211,153,0.10)" },
                  ].map((col, ci) => (
                    <Glass key={col.t} d={ci + 1} className="p-7 flex flex-col min-h-0" style={{ background: `linear-gradient(160deg, ${col.tint}, rgba(255,255,255,0.03))` }}>
                      <div className="flex items-center gap-3 mb-4 shrink-0">
                        <IconChip icon={col.icon} color={col.c} size={42} iconSize={22} />
                        <h3 className="text-[18px] font-black" style={{ color: col.c }}>{col.t}</h3>
                      </div>
                      {col.items.length > 1 ? (
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                          {col.items.map((it, k) => (
                            <div key={k} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.05] border border-white/10">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-black shrink-0" style={{ background: `${col.c}22`, color: col.c }}>{k + 1}</div>
                              <p className="text-[17px] text-slate-100 leading-snug">{it}</p>
                            </div>
                          ))}
                        </div>
                      ) : col.items.length === 1 ? (
                        <p className="flex-1 min-h-0 overflow-y-auto custom-scrollbar text-[19px] text-slate-100 leading-relaxed whitespace-pre-line pr-1">{col.raw}</p>
                      ) : (
                        <div className="flex-1 min-h-0"><EmptyCard label={col.empty} /></div>
                      )}
                    </Glass>
                  ))}
                </div>

                <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Clock size={18} />
                    <span className="text-sm">Presentasi selesai. Siap untuk sesi diskusi.</span>
                  </div>
                  <button onClick={() => setCurrentSlide(0)} className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20">
                    <RotateCcw size={16} /> Ulangi Presentasi
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* FOOTER NAV */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0B1B2B]/90 backdrop-blur-md z-10 border-t border-white/10">
        <button onClick={() => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition cursor-pointer border border-white/10">
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            {slideLabels.map((label, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? "w-8 bg-amber-400" : "w-2 bg-slate-700 hover:bg-slate-500"}`}
                title={label}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-slate-400 tracking-wide">{slideLabels[currentSlide]}</span>
        </div>
        <button onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)} className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition cursor-pointer">
          Selanjutnya <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        @keyframes rise { from { opacity: 0; transform: translateY(16px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .rise { opacity: 0; animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes floaty { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-24px); } }
        @keyframes floaty2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-26px,20px); } }
        .floaty { animation: floaty 14s ease-in-out infinite; }
        .floaty2 { animation: floaty2 17s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
