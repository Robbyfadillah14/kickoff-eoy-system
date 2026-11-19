"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw,
  Activity, ShieldCheck, Zap, Package, Truck, Users,
  FileText, Globe, AlertTriangle, CheckCircle2, Award,
  Clock, Target, TrendingDown, Gauge, ClipboardList
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  HELPERS & UTILS                                                    */
/* ------------------------------------------------------------------ */
const toNum = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const isNumericOnly = (v) => /^\s*-?[\d.,]+\s*$/.test(String(v));
const fmtPct = (v) => (isNumericOnly(v) ? `${String(v).trim()}%` : String(v));
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

/* angka berhitung naik (hanya untuk nilai murni angka / persen) */
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
function ArcGauge({ pct, color, target, width = 196, children, valueTop = "36%" }) {
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
      <div className="absolute inset-x-0 text-center" style={{ top: valueTop }}>{children}</div>
    </div>
  );
}

/* KPI persen -> gauge busur (horizontal) */
function GaugeCard({ label, value, target, targetNum, icon, accent, good, d = 0, gw = 168 }) {
  if (!hasVal(value)) return <EmptyCard label={label} />;
  const color = good ? GOOD : WARN;
  return (
    <Glass d={d} className="flex items-center gap-3 px-4 py-3 h-full">
      <TopAccent color={accent} />
      <ArcGauge pct={toNum(value)} color={color} target={targetNum} width={gw}>
        <AnimatedValue text={fmtPct(value)} className="text-[26px] font-black text-white leading-none tabular-nums" />
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

/* Gauge besar (hero) */
function HeroGaugeCard({ label, value, target, targetNum, icon, accent, good, d = 0 }) {
  if (!hasVal(value)) return <EmptyCard label={label} />;
  const color = good ? GOOD : WARN;
  return (
    <Glass d={d} className="p-6 flex flex-col items-center justify-between h-full">
      <TopAccent color={accent} />
      <div className="absolute -right-10 -bottom-10 w-56 h-56 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)` }} />
      <div className="relative w-full flex items-center justify-between">
        <IconChip icon={icon} color={accent} />
        <StatusPill good={good} />
      </div>
      <ArcGauge pct={toNum(value)} color={color} target={targetNum} width={300} valueTop="38%">
        <AnimatedValue text={fmtPct(value)} className="text-[54px] font-black text-white leading-none tabular-nums" />
      </ArcGauge>
      <div className="relative text-center">
        <div className="text-[13px] font-black text-slate-200 uppercase tracking-wider">{label}</div>
        {target && <div className="text-[12px] text-slate-500 mt-1">Target: {target}</div>}
      </div>
    </Glass>
  );
}

/* KPI umum (teks / tanggal / angka) */
function StatCard({ label, value, target, icon, accent, good = true, d = 0, statusLabel }) {
  if (!hasVal(value)) return <EmptyCard label={label} />;
  return (
    <Glass d={d} className="p-5 flex flex-col justify-between h-full">
      <TopAccent color={accent} />
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)` }} />
      <div className="flex items-center justify-between">
        <IconChip icon={icon} color={accent} />
        <StatusPill good={good} label={statusLabel} />
      </div>
      <div className="mt-3 relative">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <AnimatedValue text={String(value)} className="block text-[34px] font-black text-white leading-tight break-words tabular-nums" />
        {target && <div className="text-[12px] text-slate-500 mt-1.5">Target: {target}</div>}
      </div>
    </Glass>
  );
}

/* Meter batas maksimum (turnover, absen, LC, cancel invoice, ...) */
function LimitMeter({ label, value, limit, icon, accent, unit = "%", d = 0 }) {
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
        <AnimatedValue text={unit === "%" ? fmtPct(value) : String(value)} className="block text-[36px] font-black text-white leading-none tabular-nums" />
        <div className="relative h-3 rounded-full bg-white/10 mt-3">
          <div className="h-full rounded-full" style={{ width: `${m ? fill : 0}%`, background: good ? `linear-gradient(90deg, ${GOOD}88, ${GOOD})` : `linear-gradient(90deg, ${WARN}, ${BAD})`, transition: "width 1.1s cubic-bezier(.16,1,.3,1)" }} />
          <div className="absolute -top-1.5 -bottom-1.5 w-[3px] rounded bg-white" style={{ left: "50%" }} />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
          <span>0{unit}</span>
          <span className="text-slate-300 font-semibold">Batas maks {limit}{unit}</span>
          <span>{limit * 2}{unit}</span>
        </div>
      </div>
    </Glass>
  );
}

/* Hitungan dengan titik progres menuju minimum */
function DotsCard({ label, value, min, icon, accent, d = 0 }) {
  if (!hasVal(value)) return <EmptyCard label={label} />;
  const n = Math.max(0, Math.round(toNum(value)));
  const total = Math.min(Math.max(min + 3, n, 5), 10);
  const good = n >= min;
  return (
    <Glass d={d} className="p-5 flex flex-col justify-between h-full">
      <TopAccent color={accent} />
      <div className="flex items-center justify-between">
        <IconChip icon={icon} color={accent} />
        <StatusPill good={good} />
      </div>
      <div className="mt-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <AnimatedValue text={String(value)} className="block text-[44px] font-black text-white leading-none tabular-nums" />
        <div className="flex items-center gap-1.5 mt-3">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className="w-4 h-4 rounded-full"
              style={{
                background: i < n ? (good ? GOOD : WARN) : "rgba(255,255,255,0.08)",
                boxShadow: i < n ? `0 0 8px ${good ? GOOD : WARN}88` : "none",
                outline: i === min - 1 ? "2px solid rgba(255,255,255,0.7)" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        <div className="text-[12px] text-slate-500 mt-2">Target: Min. {min} <span className="text-slate-600">(ditandai lingkaran putih)</span></div>
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

/* Dekorasi orbit untuk slide Exim */
function Orbit({ color }) {
  const dots = [
    { r: 62, a: 20, s: 7 },
    { r: 104, a: 140, s: 9 },
    { r: 146, a: 250, s: 6 },
  ];
  return (
    <svg viewBox="-160 -160 320 320" className="absolute pointer-events-none spin-slow" style={{ right: -70, top: -50, width: 330, height: 330, opacity: 0.55 }}>
      {[62, 104, 146].map((r) => (
        <circle key={r} cx="0" cy="0" r={r} fill="none" stroke={color} strokeOpacity="0.28" strokeDasharray="3 7" />
      ))}
      {dots.map((o, i) => (
        <circle key={i} cx={o.r * Math.cos((o.a * Math.PI) / 180)} cy={o.r * Math.sin((o.a * Math.PI) / 180)} r={o.s} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      ))}
      <circle cx="0" cy="0" r="22" fill={color} fillOpacity="0.18" />
    </svg>
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

  const clean = risks.length === 0;

  /* scorecard departemen (ambang sama dengan slide masing-masing) */
  const depts = [
    {
      label: "Human Capital", slide: 1, icon: Users, color: COLOR.emerald,
      has: hasVal(data.manpowerAch) || hasVal(data.turnoverRate) || hasVal(data.absenteeismRate) || hasVal(data.isoStatus),
      good: !(hasVal(data.manpowerAch) && toNum(data.manpowerAch) < 100) && !(hasVal(data.turnoverRate) && toNum(data.turnoverRate) > 2) && !(hasVal(data.absenteeismRate) && toNum(data.absenteeismRate) > 1),
      metric: hasVal(data.turnoverRate) ? `Turnover ${fmtPct(data.turnoverRate)}` : hasVal(data.manpowerAch) ? `Manpower ${fmtPct(data.manpowerAch)}` : "",
    },
    {
      label: "Purchasing", slide: 2, icon: Package, color: COLOR.cyan,
      has: hasVal(data.supplierOtd) || hasVal(data.updateLc) || hasVal(data.newSupplierDev),
      good: !(hasVal(data.supplierOtd) && toNum(data.supplierOtd) < 98) && !(hasVal(data.updateLc) && toNum(data.updateLc) > 5.5) && !(hasVal(data.newSupplierDev) && toNum(data.newSupplierDev) < 2),
      metric: hasVal(data.supplierOtd) ? `OTD ${fmtPct(data.supplierOtd)}` : "",
    },
    {
      label: "Logistics", slide: 3, icon: Truck, color: COLOR.indigo,
      has: hasVal(data.logisticOtd) || hasVal(data.logisticError) || hasVal(data.totalDo),
      good: !(hasVal(data.logisticOtd) && toNum(data.logisticOtd) < 99) && !(hasVal(data.logisticError) && toNum(data.logisticError) !== 0),
      metric: hasVal(data.logisticOtd) ? `OTD ${fmtPct(data.logisticOtd)}` : "",
    },
    {
      label: "Admin & TF", slide: 4, icon: FileText, color: COLOR.amber,
      has: hasVal(data.tfLuarKotaAch) || hasVal(data.tfEmailSistemAch) || hasVal(data.cancelInvTarget),
      good: !(hasVal(data.tfLuarKotaAch) && toNum(data.tfLuarKotaAch) < 98) && !(hasVal(data.tfEmailSistemAch) && toNum(data.tfEmailSistemAch) < 99) && !(hasVal(data.cancelInvTarget) && toNum(data.cancelInvTarget) > 150),
      metric: hasVal(data.cancelInvTarget) ? `Cancel inv. ${data.cancelInvTarget}` : "",
    },
    {
      label: "Global Trade", slide: 5, icon: Globe, color: COLOR.violet,
      has: hasVal(data.importQuotaStatus) || hasVal(data.gbCustomerTarget),
      good: true, info: true,
      metric: hasVal(data.importQuotaStatus) ? String(data.importQuotaStatus) : "",
    },
  ];

  const outlookItems = toItems(data.nextYearOutlook);
  const milestoneItems = toItems(data.keyMilestones);

  return (
    <div className="relative w-full bg-[#07121D] border border-white/10 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-slate-200">

      {/* HEADER */}
      <div className="relative flex items-center justify-between px-6 py-4 bg-[#0B1B2B]/90 backdrop-blur-md z-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-indigo-500/20">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black">Operational Excellence</div>
            <div className="text-sm text-slate-300 font-medium">{report?.plant?.name || "Consolidated Operations"} · FY {currentYr}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 font-mono">Slide <span className="text-cyan-400 font-bold">{currentSlide + 1}</span> / {totalSlides}</span>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause size={16} className="text-cyan-400" /> : <Play size={16} />}
            </button>
            <button onClick={() => setCurrentSlide(0)} className="p-2 hover:bg-white/10 rounded text-slate-300 hover:text-white transition cursor-pointer">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        <div className="absolute left-0 bottom-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500" style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }} />
      </div>

      {/* VIEWPORT (Fixed 1360x720 Aspect Ratio) */}
      <div className="flex-1 flex items-center justify-center p-4 z-10 w-full bg-[#07121D]">
        <div ref={stageRef} className="w-full rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10" style={{ maxWidth: "100%", height: STAGE_H * scale }}>
          <div
            className="relative overflow-hidden"
            style={{
              width: STAGE_W,
              height: STAGE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              background: "radial-gradient(1100px 560px at 0% -10%, rgba(99,102,241,0.28), transparent 60%), radial-gradient(900px 500px at 100% 110%, rgba(34,211,238,0.10), transparent 60%), #0A1826",
            }}
          >
            {/* dekorasi latar */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize: "30px 30px", maskImage: "linear-gradient(180deg, rgba(0,0,0,.9), transparent 85%)", WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,.9), transparent 85%)" }} />
            <div className="absolute w-72 h-72 rounded-full pointer-events-none floaty" style={{ left: "38%", top: "62%", background: "radial-gradient(circle, rgba(129,140,248,0.12), transparent 70%)" }} />
            <div className="absolute w-60 h-60 rounded-full pointer-events-none floaty2" style={{ left: "8%", top: "70%", background: "radial-gradient(circle, rgba(34,211,238,0.09), transparent 70%)" }} />

            {/* ==================== SLIDE 1: EXECUTIVE COMMAND ==================== */}
            {currentSlide === 0 && (
              <SlideShell icon={Gauge} kicker="Ringkasan Direktur" title="Executive Command Center" subtitle="Ringkasan kinerja operasional tingkat direktur dalam satu pandangan" accent={COLOR.cyan} no="01">
                <div className="grid grid-cols-[1.25fr_1fr_1fr] gap-5 shrink-0" style={{ height: 150 }}>
                  <GaugeCard d={1} gw={150} label="Efisiensi Aktual" value={data.actualEfficiency} target="≥ 95%" targetNum={95} icon={Activity} accent={COLOR.indigo} good={toNum(data.actualEfficiency) >= 95} />

                  {hasVal(data.costOptimization) ? (
                    <Glass d={2} className="p-5 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.16), rgba(255,255,255,0.03))" }}>
                      <TopAccent color={COLOR.emerald} />
                      <div className="absolute -right-4 -bottom-6 text-emerald-300 pointer-events-none" style={{ opacity: 0.10 }}><TrendingDown size={130} /></div>
                      <div className="relative">
                        <div className="text-[11px] font-black text-emerald-200 uppercase tracking-wider mb-1">Cost Optimization</div>
                        <AnimatedValue
                          text={String(data.costOptimization)}
                          className="block text-[40px] font-black leading-none tabular-nums"
                          style={{ background: "linear-gradient(90deg,#fff,#6EE7B7)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                        />
                        <div className="text-[12px] text-slate-400 mt-1.5">Target: Optimal</div>
                      </div>
                    </Glass>
                  ) : (
                    <EmptyCard label="Cost Optimization" />
                  )}

                  <Glass d={3} className="px-5 flex items-center gap-4">
                    <TopAccent color={clean ? GOOD : WARN} />
                    <Ring pct={100} color={clean ? GOOD : WARN} size={92} stroke={8}>
                      <span className="text-[34px] font-black text-white leading-none">{risks.length}</span>
                    </Ring>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Risiko Aktif</div>
                      <StatusPill good={clean} />
                      <div className="text-[12px] text-slate-500 mt-1.5">Target: 0</div>
                    </div>
                  </Glass>
                </div>

                {/* Scorecard departemen */}
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
                  <InsightPanel d={6} title="Executive Summary" text={data.executiveSummary} accent={COLOR.cyan} icon={Zap} />

                  <Glass d={7} className="p-6 flex flex-col min-h-0">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: COLOR.amber }} />
                    <div className="flex items-center gap-3 mb-3 shrink-0">
                      <IconChip icon={AlertTriangle} color={COLOR.amber} size={34} iconSize={17} />
                      <span className="text-[13px] font-black uppercase tracking-wider text-slate-200">Risk Management & Mitigasi</span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
                      {data.hasData && clean && (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10">
                          <CheckCircle2 size={20} className="text-emerald-300 shrink-0" />
                          <span className="text-[13px] text-emerald-100">Tidak ada risiko aktif terdeteksi dari indikator utama.</span>
                        </div>
                      )}
                      {risks.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.07]">
                          <div className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0 text-xs font-black">{i + 1}</div>
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">{r.dept}</div>
                            <div className="text-[13px] text-slate-200 leading-snug">{r.msg}</div>
                          </div>
                        </div>
                      ))}
                      {hasVal(data.riskManagement) ? (
                        <div className={risks.length > 0 || clean ? "pt-2.5 border-t border-white/10" : ""}>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Rencana mitigasi</div>
                          <p className="text-[14px] leading-relaxed text-slate-300 whitespace-pre-line">{data.riskManagement}</p>
                        </div>
                      ) : !data.hasData ? (
                        <EmptyCard label="mitigasi risiko" />
                      ) : null}
                    </div>
                  </Glass>
                </div>
              </SlideShell>
            )}

            {/* ==================== SLIDE 2: HUMAN CAPITAL (HR) ==================== */}
            {currentSlide === 1 && (
              <SlideShell icon={Users} kicker="HR & Management Representative" title="Human Capital & Compliance" subtitle="Kecukupan tenaga kerja, retensi, kehadiran, dan status sertifikasi" accent={COLOR.emerald} no="02">
                <div className="grid grid-cols-3 gap-5 shrink-0" style={{ height: 206 }}>
                  <GaugeCard d={1} label="Manpower Achievement" value={data.manpowerAch} target="100%" targetNum={100} icon={Users} accent={COLOR.emerald} good={toNum(data.manpowerAch) >= 100} />
                  <LimitMeter d={2} label="Turnover Rate" value={data.turnoverRate} limit={2} icon={TrendingDown} accent={COLOR.indigo} />
                  <LimitMeter d={3} label="Absenteeism Rate" value={data.absenteeismRate} limit={1} icon={Clock} accent={COLOR.violet} />
                </div>
                <div className="flex-1 min-h-0 grid grid-cols-[1fr_1.8fr] gap-5">
                  <Glass d={4} className="p-6 flex flex-col items-center justify-center text-center" style={{ background: "linear-gradient(160deg, rgba(129,140,248,0.14), rgba(255,255,255,0.03))" }}>
                    <TopAccent color={COLOR.indigo} />
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(129,140,248,0.25), transparent 70%)" }} />
                    <div className="relative w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: hasVal(data.isoStatus) ? "linear-gradient(135deg,#818CF8,#6366F1AA)" : "transparent", border: hasVal(data.isoStatus) ? "none" : "2px dashed rgba(255,255,255,0.2)", color: hasVal(data.isoStatus) ? "#06121C" : "#64748B", boxShadow: hasVal(data.isoStatus) ? "0 0 30px rgba(129,140,248,0.5)" : "none" }}>
                      <ShieldCheck size={38} />
                    </div>
                    <div className="relative text-[12px] font-black uppercase tracking-wider text-indigo-200 mb-1">Status ISO & Audit</div>
                    <div className={`relative text-[20px] font-bold leading-snug ${hasVal(data.isoStatus) ? "text-white" : "text-slate-500 italic"}`}>
                      {hasVal(data.isoStatus) ? data.isoStatus : "Menunggu input data..."}
                    </div>
                  </Glass>
                  <InsightPanel d={5} title="Evaluasi HR & MR" text={data.hrEvaluation} accent={COLOR.emerald} />
                </div>
              </SlideShell>
            )}

            {/* ==================== SLIDE 3: PROCUREMENT (PURCHASING) ==================== */}
            {currentSlide === 2 && (
              <SlideShell icon={Package} kicker="Purchasing Department" title="Procurement & Supply Chain" subtitle="Ketepatan pasokan, efisiensi biaya pendaratan, dan pengembangan pemasok" accent={COLOR.cyan} no="03">
                <div className="grid grid-cols-3 gap-5 shrink-0" style={{ height: 232 }}>
                  <GaugeCard d={1} label="Supplier OTD" value={data.supplierOtd} target="≥ 98%" targetNum={98} icon={Truck} accent={COLOR.cyan} good={toNum(data.supplierOtd) >= 98} />
                  <LimitMeter d={2} label="Landing Cost (LC)" value={data.updateLc} limit={5.5} icon={TrendingDown} accent={COLOR.emerald} />
                  <DotsCard d={3} label="New Supplier Dev" value={data.newSupplierDev} min={2} icon={Users} accent={COLOR.indigo} />
                </div>
                <div className="flex-1 min-h-0">
                  <InsightPanel d={4} title="Evaluasi Pengadaan & Rantai Pasok" text={data.purchasingEvaluation} accent={COLOR.cyan} />
                </div>
              </SlideShell>
            )}

            {/* ==================== SLIDE 4: LOGISTICS & WAREHOUSE ==================== */}
            {currentSlide === 3 && (
              <SlideShell icon={Truck} kicker="Operasional Gudang & Distribusi" title="Logistics & Warehouse" subtitle="Ketepatan pengiriman, akurasi, dan volume dokumen pengiriman" accent={COLOR.indigo} no="04">
                <div className="flex-1 min-h-0 grid grid-cols-[1fr_1.5fr] gap-5">
                  <HeroGaugeCard d={1} label="Logistic OTD" value={data.logisticOtd} target="≥ 99%" targetNum={99} icon={Truck} accent={COLOR.indigo} good={toNum(data.logisticOtd) >= 99} />
                  <div className="flex flex-col gap-5 min-h-0">
                    <div className="grid grid-cols-2 gap-5 shrink-0" style={{ height: 190 }}>
                      <StatCard d={2} label="Error Delivery" value={data.logisticError} target="0%" icon={AlertTriangle} accent={COLOR.amber} good={toNum(data.logisticError) === 0} />
                      <StatCard d={3} label="Total DO Terbit" value={data.totalDo} icon={ClipboardList} accent={COLOR.cyan} good={true} statusLabel="Tercatat" />
                    </div>
                    <div className="flex-1 min-h-0">
                      <InsightPanel d={4} title="Evaluasi Operasional Gudang" text={data.logisticEvaluation} accent={COLOR.indigo} />
                    </div>
                  </div>
                </div>
              </SlideShell>
            )}

            {/* ==================== SLIDE 5: ADMINISTRATIVE PRECISION ==================== */}
            {currentSlide === 4 && (
              <SlideShell icon={FileText} kicker="Admin Logistic & Admin Tukar Faktur" title="Administrative Precision" subtitle="Akurasi dokumen, tukar faktur, dan pengendalian cancel invoice" accent={COLOR.amber} no="05">
                <div className="grid grid-cols-3 gap-5 shrink-0" style={{ height: 206 }}>
                  <GaugeCard d={1} label="TF Luar Kota" value={data.tfLuarKotaAch} target="≥ 98%" targetNum={98} icon={Globe} accent={COLOR.amber} good={toNum(data.tfLuarKotaAch) >= 98} />
                  <GaugeCard d={2} label="TF Email & Sistem" value={data.tfEmailSistemAch} target="≥ 99%" targetNum={99} icon={Activity} accent={COLOR.emerald} good={toNum(data.tfEmailSistemAch) >= 99} />
                  <LimitMeter d={3} label="Cancel Invoice" value={data.cancelInvTarget} limit={150} unit="" icon={AlertTriangle} accent={COLOR.rose} />
                </div>
                <div className="flex-1 min-h-0 grid grid-cols-[1fr_1.4fr] gap-5">
                  <InsightPanel d={4} title="Root Cause Analysis" text={data.cancelInvAnalysis} accent={COLOR.rose} icon={Target} />
                  <InsightPanel d={5} title="Evaluasi Administrasi & Dokumen" text={data.adminTfEvaluation} accent={COLOR.amber} />
                </div>
              </SlideShell>
            )}

            {/* ==================== SLIDE 6: GLOBAL TRADE (EXIM) ==================== */}
            {currentSlide === 5 && (
              <SlideShell icon={Globe} kicker="Export - Import Department" title="Global Trade & Exim" subtitle="Perizinan, kuota impor, dan ekspansi fasilitas Gudang Berikat" accent={COLOR.violet} no="06">
                <div className="grid grid-cols-[1.35fr_1fr] gap-5 shrink-0" style={{ height: 250 }}>
                  <Glass d={1} className="p-7 flex flex-col justify-center" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.14), rgba(255,255,255,0.03))" }}>
                    <TopAccent color={COLOR.violet} />
                    <Orbit color={COLOR.violet} />
                    <div className="relative flex items-center gap-3 mb-3">
                      <IconChip icon={Globe} color={COLOR.violet} />
                      <span className="text-[12px] font-black text-violet-200 uppercase tracking-wider">Import Quota Status</span>
                    </div>
                    <div
                      className={`relative text-[38px] font-black leading-tight max-w-[78%] ${hasVal(data.importQuotaStatus) ? "" : "text-slate-600 italic"}`}
                      style={hasVal(data.importQuotaStatus) ? { background: "linear-gradient(90deg,#fff 50%,#C4B5FD)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : undefined}
                    >
                      {hasVal(data.importQuotaStatus) ? data.importQuotaStatus : "Menunggu input..."}
                    </div>
                    <p className="relative text-[13px] text-slate-400 mt-2">Status perizinan dan kuota impor tahun berjalan</p>
                  </Glass>

                  <Glass d={2} className="p-6 flex flex-col items-center justify-center text-center" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.13), rgba(167,139,250,0.07))" }}>
                    <TopAccent color={COLOR.cyan} />
                    <div className="absolute -right-10 -bottom-10 w-52 h-52 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(34,211,238,0.28), transparent 70%)" }} />
                    <Award size={34} className="relative text-cyan-300 mb-1.5" />
                    <div className="relative text-[12px] font-black text-cyan-200 uppercase tracking-wider">Gudang Berikat Expansion</div>
                    <AnimatedValue text={hasVal(data.gbCustomerTarget) ? String(data.gbCustomerTarget) : "-"} className="relative block text-[72px] font-black text-white leading-none my-1 tabular-nums" />
                    <div className="relative text-[13px] text-slate-400">Target penambahan customer legalitas</div>
                  </Glass>
                </div>
                <div className="flex-1 min-h-0">
                  <InsightPanel d={3} title="Evaluasi Kepabeanan & Ekspansi" text={data.eximEvaluation} accent={COLOR.violet} />
                </div>
              </SlideShell>
            )}

            {/* ==================== SLIDE 7: HORIZON 2027 ==================== */}
            {currentSlide === 6 && (
              <div className="absolute inset-0 p-9 flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />
                <div className="absolute -right-24 -top-24 w-[480px] h-[480px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(34,211,238,0.20), transparent 70%)" }} />
                <span className="absolute right-10 top-8 text-[170px] font-black leading-none select-none pointer-events-none text-white/[0.04]">2027</span>

                <div className="relative flex items-center gap-4 mb-5 rise">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/30">
                    <Award size={32} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-400 font-black">Strategic Outlook</div>
                    <h1 className="text-[44px] font-black tracking-tight leading-none" style={{ background: "linear-gradient(90deg,#fff 30%,#22D3EE)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Horizon 2027</h1>
                  </div>
                </div>

                <div className="relative flex-1 min-h-0 grid grid-cols-2 gap-6">
                  {[
                    { t: "Fokus & Target Utama", icon: Target, c: COLOR.cyan, items: outlookItems, raw: data.nextYearOutlook, empty: "Strategic Outlook 2027", tint: "rgba(34,211,238,0.10)" },
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
                  <button onClick={() => setCurrentSlide(0)} className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/20">
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
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? "w-8 bg-cyan-400" : "w-2 bg-slate-700 hover:bg-slate-500"}`}
                title={label}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-slate-400 tracking-wide">{slideLabels[currentSlide]}</span>
        </div>
        <button onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)} className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition cursor-pointer">
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
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-slow { animation: spinSlow 60s linear infinite; }
      `}</style>
    </div>
  );
}
