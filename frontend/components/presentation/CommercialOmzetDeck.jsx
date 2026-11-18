"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, TrendingUp, ArrowUpRight,
  BarChart3, Target, Sparkles, CheckCircle2, Zap,
  ShieldCheck, Flag, Calendar, User, Package, TrendingDown, FileText
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const formatRupiah = (val) => {
  const num = Number(val || 0);
  if (num === 0) return "Rp 0";
  if (Math.abs(num) >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt`;
  }
  if (Math.abs(num) >= 1_000) {
    return `Rp ${(num / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Rb`;
  }
  return `Rp ${num.toLocaleString('id-ID')}`;
};

// parse aman: "12.000", "Rp 5000", "abc" -> angka / 0 (tidak pernah NaN)
const toNum = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// persentase ekstrem (mis. 100042%) dipendekkan biar tidak jebol kotak
const fmtAch = (v) => (v > 999 ? ">999%" : `${v.toFixed(0)}%`);

// perubahan % dari prev ke cur (null kalau tidak ada pembanding)
const pctDelta = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

const STAGE_W = 1360;
const STAGE_H = 720;
const RING_R = 58;
const RING_C = 2 * Math.PI * RING_R;
const PIE_COLORS = ["#2B6285", "#A3C400", "#2F7A45", "#5B8DB8", "#94A3B8"];
const YEAR_COLORS = ["#2B6285", "#2F7A45", "#C98A00"]; // 2024, 2025, 2026

/* ------------------------------------------------------------------ */
/*  KOMPONEN KECIL                                                     */
/* ------------------------------------------------------------------ */
function DeltaChip({ cur, prev, labelBase = "Baseline" }) {
  const d = pctDelta(cur, prev);
  if (d === null) {
    return <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700">{labelBase}</span>;
  }
  const up = d >= 0;
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${up ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
      {up ? "▲" : "▼"} {Math.abs(d) > 999 ? ">999" : Math.abs(d).toFixed(0)}%
    </span>
  );
}

function YearTag({ yr, idx }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full text-sm font-black text-white" style={{ background: YEAR_COLORS[idx % YEAR_COLORS.length] }}>
      {yr}
    </span>
  );
}

function SlideHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#12324A] text-[#A3C400] flex items-center justify-center">{icon}</div>
        <div>
          <div className="text-[26px] font-black text-[#12324A] leading-none">{title}</div>
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

/* Timeline ringkas: bubble kecil + panah YoY, lalu rincian input per tahun di bawahnya */
function YearTimeline({ yearData }) {
  const logs = yearData.filter((d) => d.actual > 0).map((d) => Math.log10(d.actual));
  const lo = logs.length ? Math.min(...logs) : 0;
  const hi = logs.length ? Math.max(...logs) : 1;
  const size = (v) => (v > 0 && hi > lo ? 76 + ((Math.log10(v) - lo) / (hi - lo)) * 38 : 76);

  return (
    <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 px-4">
      {yearData.map((d, i) => {
        const prev = i > 0 ? yearData[i - 1] : null;
        const hasPrev = prev && prev.rep && prev.actual > 0;
        const delta = hasPrev ? pctDelta(d.actual, prev.actual) : null;
        const up = delta === null ? null : delta >= 0;
        const s = size(d.actual);
        const c = YEAR_COLORS[i % YEAR_COLORS.length];

        const topSalesYr = d.sList
          .map((sp) => {
            const tgt = toNum(sp.targetProfit || sp.targetVal);
            const act = toNum(sp.actualVal);
            return { name: String(sp.salesName || "").trim(), act, ach: tgt > 0 ? (act / tgt) * 100 : 0 };
          })
          .filter((x) => x.name)
          .sort((a, b) => b.act - a.act);
        const topProdYr = d.products.slice().sort((a, b) => b.currentVal - a.currentVal);

        return (
          <div key={d.yr} className="flex flex-col min-h-0">
            {/* ---- bagian atas: bubble + panah + tahun ---- */}
            <div className="flex flex-col items-center text-center shrink-0">
              <div className="flex items-center justify-center" style={{ height: 114 }}>
                <div
                  className="rounded-full flex flex-col items-center justify-center text-white font-black leading-tight shadow-lg"
                  style={{ width: s, height: s, background: `radial-gradient(circle at 30% 25%, ${c}CC, ${c})` }}
                >
                  <span className="text-[14px] px-1">{d.rep ? formatRupiah(d.actual) : "-"}</span>
                  <span className="text-[10px] font-semibold opacity-80">realisasi</span>
                </div>
              </div>
              <div
                className="mt-1 w-[84px] pt-1.5 pb-4 text-white text-[13px] font-black"
                style={{
                  clipPath: "polygon(0 0,100% 0,100% 70%,50% 100%,0 70%)",
                  background:
                    up === null
                      ? "linear-gradient(#64748B,#CBD5E1)"
                      : up
                      ? "linear-gradient(#2F7A45,#86EFAC)"
                      : "linear-gradient(#DC2626,#FCA5A5)",
                }}
              >
                {up === null ? "Baseline" : `${up ? "▲" : "▼"} ${Math.abs(delta) > 999 ? ">999" : Math.abs(delta).toFixed(0)}%`}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[30px] font-black leading-none" style={{ color: c }}>{d.yr}</span>
                {d.rep ? (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${d.ach >= 100 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {d.ach >= 100 ? "Tercapai" : "Belum"} · {fmtAch(d.ach)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-500">Belum ada laporan</span>
                )}
              </div>
              <div className="text-[12px] text-slate-500 mt-0.5">Target {d.rep ? formatRupiah(d.target) : "-"}</div>
            </div>

            {/* ---- bagian bawah: rincian sesuai inputan ---- */}
            <div className="flex-1 min-h-0 mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 overflow-y-auto custom-scrollbar space-y-2.5" style={{ borderTop: `3px solid ${c}` }}>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-[#2B6285] mb-1">Tim Sales ({topSalesYr.length})</div>
                {topSalesYr.length > 0 ? (
                  <>
                    {topSalesYr.slice(0, 3).map((x, k) => (
                      <div key={k} className="flex justify-between text-[13px] leading-snug">
                        <span className="truncate max-w-[150px] font-semibold text-slate-800" title={x.name}>{x.name}</span>
                        <span className={`font-black ${x.ach >= 100 ? "text-[#2F7A45]" : "text-amber-600"}`}>{fmtAch(x.ach)}</span>
                      </div>
                    ))}
                    {topSalesYr.length > 3 && <div className="text-[11px] text-slate-400">+{topSalesYr.length - 3} lainnya</div>}
                  </>
                ) : (
                  <Empty text={d.rep ? "Belum diisi" : "Belum ada laporan"} />
                )}
              </div>

              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-[#2F7A45] mb-1">Produk ({topProdYr.length})</div>
                {topProdYr.length > 0 ? (
                  <>
                    {topProdYr.slice(0, 3).map((x, k) => (
                      <div key={k} className="flex justify-between items-center gap-2 text-[13px] leading-snug">
                        <span className="truncate max-w-[110px] font-semibold text-slate-800" title={x.productName}>{x.productName}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-black text-[#2F7A45]">{formatRupiah(x.currentVal)}</span>
                          <DeltaChip cur={x.currentVal} prev={x.prevValInput} labelBase="Baseline" />
                        </span>
                      </div>
                    ))}
                    {topProdYr.length > 3 && <div className="text-[11px] text-slate-400">+{topProdYr.length - 3} lainnya</div>}
                  </>
                ) : (
                  <Empty text={d.rep ? "Belum diisi" : "Belum ada laporan"} />
                )}
              </div>

              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-[#5B6B00] mb-1">Inovasi</div>
                {d.innovations ? (
                  <p className="text-[13px] text-slate-700 leading-snug whitespace-pre-line">{d.innovations}</p>
                ) : (
                  <Empty text={d.rep ? "Belum diisi" : "Belum ada laporan"} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Cincin progress kecil (achievement) */
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

/* Header kolom tahun (gradasi berwarna + total tahun itu) */
function YearColHeaders({ yearData, label, sub }) {
  return (
    <div className="grid grid-cols-[230px_1fr_1fr_1fr] gap-3 shrink-0">
      <div className="flex flex-col justify-center px-2">
        <div className="text-[15px] font-black text-[#12324A] leading-tight">{label}</div>
        <div className="text-[12px] text-slate-500">{sub}</div>
      </div>
      {yearData.map((d, i) => {
        const c = YEAR_COLORS[i % YEAR_COLORS.length];
        return (
          <div key={d.yr} className="rounded-xl px-4 py-2 text-white flex items-center justify-between shadow-md" style={{ background: `linear-gradient(135deg, ${c}, ${c}B3)` }}>
            <span className="text-[28px] font-black leading-none">{d.yr}</span>
            <div className="text-right leading-tight">
              <div className="text-[16px] font-black">{d.rep ? formatRupiah(d.actual) : "-"}</div>
              <div className="text-[11px] opacity-90">{d.rep ? `Total · ${fmtAch(d.ach)} dari target` : "Belum ada laporan"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyCell() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 flex items-center justify-center">
      <span className="text-[13px] italic text-slate-400">Belum ada data</span>
    </div>
  );
}

function RowIdentity({ name, rank, total, extra }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 pl-1 pr-2 min-w-0">
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md" style={{ background: "linear-gradient(135deg,#12324A,#2B6285)" }}>{initial}</div>
        {rank === 0 && <span className="absolute -top-2 -right-2 text-[15px]">🏆</span>}
      </div>
      <div className="min-w-0">
        <div className="text-[17px] font-black text-[#12324A] leading-tight truncate" title={name}>{name}</div>
        <div className="text-[12px] text-slate-500 truncate">Total {formatRupiah(total)}</div>
        {extra}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KOMPONEN UTAMA                                                     */
/* ------------------------------------------------------------------ */
export default function CommercialProfitDeck({ report, allYearlyReports = {} }) {
  const historicalYears = [2024, 2025, 2026];
  const mJson = report?.metricsJson || {};
  const salesType = mJson.salesType || "PROFIT";

  // Master + Timeline + Tim Sales + Produk + Inovasi + Sales Support + Outlook
  const slideLabels = ["Master Dashboard", "Timeline", "Tim Sales", "Produk", "Inovasi", "Sales Support", "Outlook 2027"];
  const totalSlides = slideLabels.length;
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
      timer = setInterval(() => nextSlide(), 15000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, nextSlide]);

  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / STAGE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getReportForYear = (yr) => {
    const matches = allYearlyReports[yr] || (Array.isArray(allYearlyReports) ? allYearlyReports.filter(r => Number(r.year) === yr) : []);
    if (matches.length > 0) return matches[0];
    if (Number(report?.year) === yr) return report;
    return null;
  };

  // ambil field teks dari report (metricsJson dulu, lalu root report)
  const pickText = (rep, key) => {
    if (!rep) return "";
    const m = rep.metricsJson || {};
    return String(m[key] || rep[key] || "").trim();
  };

  const getSalesList = (rep) => {
    const list = rep?.metricsJson?.salesPerformances || rep?.salesPerformances || [];
    return Array.isArray(list) ? list : [];
  };

  /* ---------------- data per tahun ---------------- */
  let totalAllActual = 0;
  let totalAllTarget = 0;
  const activeSalesNames = new Set();
  historicalYears.forEach(yr => {
    const rep = getReportForYear(yr);
    if (rep) {
      const sList = getSalesList(rep);
      totalAllActual += sList.reduce((acc, s) => acc + toNum(s.actualVal), 0);
      totalAllTarget += sList.reduce((acc, s) => acc + toNum(s.targetProfit || s.targetVal), 0);
      sList.forEach(s => {
        if (s.salesName) activeSalesNames.add(String(s.salesName).trim());
      });
    }
  });

  const yearData = historicalYears.map((yr) => {
    const rep = getReportForYear(yr);
    const sList = rep ? getSalesList(rep) : [];

    const products = [];
    sList.forEach(sp => {
      if (sp.topProducts && Array.isArray(sp.topProducts)) {
        sp.topProducts.forEach(prod => {
          if (prod.productName && String(prod.productName).trim() !== "") {
            products.push({
              productName: String(prod.productName).trim(),
              // nilai berjalan: dukung semua nama field yang dipakai form / Excel
              currentVal: toNum(prod.category || prod.jalanVal || prod.actualVal),
              // nilai tahun lalu: form menyimpan ke laluVal / totalQty
              prevValInput: toNum(prod.laluVal || prod.totalQty || prod.prevCategory || prod.prevVal),
            });
          }
        });
      }
    });

    const actual = sList.reduce((acc, s) => acc + toNum(s.actualVal), 0);
    const target = sList.reduce((acc, s) => acc + toNum(s.targetProfit || s.targetVal), 0);

    return {
      yr, rep, sList, products, actual, target,
      ach: target > 0 ? (actual / target) * 100 : 0,
      innovations: pickText(rep, "branchInnovations"),
      supportPo: pickText(rep, "salesSupportPo"),
      supportCoord: pickText(rep, "salesSupportCoord"),
      supportEval: pickText(rep, "salesSupportEvaluation"),
      notes: pickText(rep, "generalNotes"),
    };
  });

  const totalAch = totalAllTarget > 0 ? (totalAllActual / totalAllTarget) * 100 : 0;
  const maxYearVal = Math.max(...yearData.flatMap(d => [d.actual, d.target]), 1);

  /* ---------------- agregat master ---------------- */
  const salesAgg = {};
  yearData.forEach(d => d.sList.forEach(s => {
    const name = String(s.salesName || "").trim();
    if (!name) return;
    salesAgg[name] = salesAgg[name] || { name, actual: 0, target: 0 };
    salesAgg[name].actual += toNum(s.actualVal);
    salesAgg[name].target += toNum(s.targetProfit || s.targetVal);
  }));
  const topSales = Object.values(salesAgg)
    .map(s => ({ ...s, ach: s.target > 0 ? (s.actual / s.target) * 100 : 0 }))
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 6);

  const prodAgg = {};
  yearData.forEach(d => d.products.forEach(p => {
    prodAgg[p.productName] = (prodAgg[p.productName] || 0) + p.currentVal;
  }));
  const prodList = Object.entries(prodAgg).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val);
  const topProd = prodList.slice(0, 4);
  const otherVal = prodList.slice(4).reduce((acc, p) => acc + p.val, 0);
  if (otherVal > 0) topProd.push({ name: "Lainnya", val: otherVal });
  const prodTotal = topProd.reduce((acc, p) => acc + p.val, 0);
  let pieAcc = 0;
  const pieSegments = topProd.map((p, i) => {
    const start = pieAcc;
    pieAcc += prodTotal > 0 ? (p.val / prodTotal) * 100 : 0;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${pieAcc}%`;
  }).join(", ");
  const pieBg = prodTotal > 0 ? `conic-gradient(${pieSegments})` : "#E2E8F0";

  /* ---------------- matriks Tim Sales (baris = sales, kolom = tahun) ---------------- */
  const salesMatrix = {};
  yearData.forEach((d, yi) => d.sList.forEach(s => {
    const name = String(s.salesName || "").trim();
    if (!name) return;
    if (!salesMatrix[name]) salesMatrix[name] = { name, total: 0, cells: [null, null, null] };
    const tgt = toNum(s.targetProfit || s.targetVal);
    const act = toNum(s.actualVal);
    const cell = salesMatrix[name].cells[yi] || { tgt: 0, act: 0, note: "" };
    cell.tgt += tgt;
    cell.act += act;
    const note = String(s.note || "").trim();
    if (note && !cell.note.includes(note)) cell.note = cell.note ? `${cell.note} · ${note}` : note;
    salesMatrix[name].cells[yi] = cell;
    salesMatrix[name].total += act;
  }));
  const salesRows = Object.values(salesMatrix).sort((a, b) => b.total - a.total);

  /* ---------------- matriks Produk (baris = item group, kolom = tahun) ---------------- */
  const prodMatrix = {};
  yearData.forEach((d, yi) => d.products.forEach(p => {
    if (!prodMatrix[p.productName]) prodMatrix[p.productName] = { name: p.productName, total: 0, cells: [null, null, null] };
    const cell = prodMatrix[p.productName].cells[yi] || { cur: 0, prev: 0 };
    cell.cur += p.currentVal;
    cell.prev += p.prevValInput;
    prodMatrix[p.productName].cells[yi] = cell;
    prodMatrix[p.productName].total += p.currentVal;
  }));
  const prodRows = Object.values(prodMatrix).sort((a, b) => b.total - a.total);

  /* ---------------- outlook & catatan ---------------- */
  const report2027 = getReportForYear(2027);
  const outlook2027 =
    report2027?.metricsJson?.strategicOutlook2027 ||
    report2027?.strategicOutlook2027 ||
    mJson.strategicOutlook2027 ||
    yearData.slice().reverse().map(d => pickText(d.rep, "strategicOutlook2027")).find(Boolean) ||
    "";

  return (
    <div className="relative w-full bg-[#0E2536] border border-[#12324A] rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden font-sans text-slate-900 tabular-nums">

      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#12324A] z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#A3C400] text-[#1B2A02] px-3.5 py-1.5 rounded-full font-bold tracking-wide flex items-center gap-1.5">
            <ArrowUpRight size={15} /> Strategi Komersial: {salesType === "OMZET" ? "Omzet oriented" : "Profit oriented"}
          </span>
          <span className="text-sm text-slate-300 font-medium hidden sm:inline-block">
            {report?.plant?.name || "Unit Komersial"} · <b className="text-white">Executive Master Deck (2024–2026)</b>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300 font-semibold">
            Slide <span className="text-[#A3C400] font-bold text-base">{currentSlide + 1}</span> / {totalSlides}
          </span>
          <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/15">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/15 rounded-lg text-slate-200 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause size={16} className="text-[#A3C400]" /> : <Play size={16} />}
            </button>
            <button onClick={() => setCurrentSlide(0)} className="p-2 hover:bg-white/15 rounded-lg text-slate-200 hover:text-white transition cursor-pointer">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Slide Viewport */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-3 z-10 w-full">
        <div
          ref={stageRef}
          className="w-full rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10"
          style={{ maxWidth: "100%", height: STAGE_H * scale }}
        >
          <div
            className="relative bg-[#EEF3F0] overflow-hidden"
            style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}
          >

            {/* ============ SLIDE 1: MASTER DASHBOARD ============ */}
            {currentSlide === 0 && (
              <div className="absolute inset-0 p-5 flex flex-col gap-4 animate-fadeIn">

                <div className="grid grid-cols-4 gap-4 h-[250px] shrink-0">
                  <div className="bg-[#2B6285] text-white rounded-2xl shadow-md p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0"><Target size={22} /></div>
                      <div>
                        <div className="text-[28px] font-black leading-none">{activeSalesNames.size} <span className="text-sm font-medium text-sky-100">Personel</span></div>
                        <div className="text-[13px] text-sky-100 mt-1">Total sales aktif</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0"><TrendingUp size={22} /></div>
                      <div>
                        <div className="text-[28px] font-black leading-none">{formatRupiah(totalAllActual)}</div>
                        <div className="text-[13px] text-sky-100 mt-1">Total revenue (2024-2026)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0"><BarChart3 size={22} /></div>
                      <div>
                        <div className="text-[28px] font-black leading-none">{formatRupiah(totalAllTarget)}</div>
                        <div className="text-[13px] text-sky-100 mt-1">Total target (2024-2026)</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#6A9A1E] to-[#356B1B] text-white rounded-2xl shadow-md p-5 flex flex-col items-center justify-between">
                    <div className="relative w-[136px] h-[136px]">
                      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                        <circle cx="70" cy="70" r={RING_R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="14" />
                        <circle
                          cx="70" cy="70" r={RING_R} fill="none" stroke="#E4F28A" strokeWidth="14" strokeLinecap="round"
                          strokeDasharray={`${(Math.min(totalAch, 100) / 100) * RING_C} ${RING_C}`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[34px] font-black">{fmtAch(totalAch)}</span>
                    </div>
                    <div className="text-center">
                      <div className="text-[22px] font-black leading-tight">{formatRupiah(totalAllActual)}</div>
                      <div className="text-[13px] text-lime-100 mt-0.5">Pencapaian vs target 2024-2026</div>
                    </div>
                  </div>

                  <div className="col-span-2 bg-gradient-to-br from-[#A3C400] to-[#7FA800] text-[#1B2A02] rounded-2xl shadow-md p-5 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[30px] font-black leading-none">{formatRupiah(totalAllActual)}</div>
                        <div className="text-[13px] font-medium text-[#2E4A00] mt-1">Revenue vs target per tahun</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-[#2E4A00]">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white/70"></span>Target</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#1B3A00]"></span>Aktual</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-end justify-around gap-6 pt-3 min-h-0">
                      {yearData.map((d) => (
                        <div key={d.yr} className="flex flex-col items-center justify-end h-full flex-1">
                          <div className="text-xs font-bold mb-1">{formatRupiah(d.actual)}</div>
                          <div className="flex items-end gap-2 w-full justify-center" style={{ height: 96 }}>
                            <div className="w-9 rounded-t-md bg-white/70" style={{ height: `${Math.max((d.target / maxYearVal) * 100, 2)}%` }} />
                            <div className="w-9 rounded-t-md bg-[#1B3A00]" style={{ height: `${Math.max((d.actual / maxYearVal) * 100, 2)}%` }} />
                          </div>
                          <div className="text-sm font-black mt-1.5">{d.yr}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 flex-1 min-h-0">
                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col min-h-0">
                    <div className="text-base font-bold text-[#12324A] mb-2">Performa per tahun</div>
                    <div className="flex-1 flex flex-col justify-between min-h-0">
                      {yearData.map((d, i) => (
                        <div key={d.yr} className={`flex items-center gap-5 py-2 ${i > 0 ? "border-t border-slate-200" : ""}`}>
                          <div className="w-[190px] shrink-0">
                            <div className="text-[30px] font-black leading-none text-[#2F7A45]">{d.rep ? formatRupiah(d.actual) : "-"}</div>
                            <div className="text-[13px] text-slate-600 mt-1">Revenue aktual {d.yr}</div>
                          </div>
                          {d.rep ? (
                            <>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-12 text-xs text-slate-500">Target</span>
                                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-[#2B6285]" style={{ width: `${(d.target / maxYearVal) * 100}%` }} />
                                  </div>
                                  <span className="w-[84px] text-right text-xs font-bold text-[#2B6285]">{formatRupiah(d.target)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-12 text-xs text-slate-500">Aktual</span>
                                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-[#7FA800]" style={{ width: `${(d.actual / maxYearVal) * 100}%` }} />
                                  </div>
                                  <span className="w-[84px] text-right text-xs font-bold text-[#2F7A45]">{formatRupiah(d.actual)}</span>
                                </div>
                              </div>
                              <span className={`shrink-0 px-3 py-1.5 rounded-lg text-base font-black ${d.ach >= 100 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                {fmtAch(d.ach)}
                              </span>
                            </>
                          ) : (
                            <div className="flex-1 text-sm italic text-slate-400">Belum ada data laporan.</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col min-h-0">
                    <div className="text-base font-bold text-[#12324A]">Pencapaian sales</div>
                    <div className="text-xs text-slate-500 mb-2">Gabungan 2024-2026, urut revenue</div>
                    <div className="flex-1 flex flex-col justify-between min-h-0">
                      {topSales.length > 0 ? topSales.map((s) => (
                        <div key={s.name}>
                          <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                            <span className="truncate max-w-[130px]" title={s.name}>{s.name}</span>
                            <span className={s.ach >= 100 ? "text-[#2F7A45]" : "text-amber-600"}>{fmtAch(s.ach)}</span>
                          </div>
                          <div className="h-2 mt-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${s.ach >= 100 ? "bg-[#7FA800]" : "bg-amber-500"}`} style={{ width: `${Math.min(s.ach, 100)}%` }} />
                          </div>
                        </div>
                      )) : (
                        <div className="text-sm italic text-slate-400">Belum ada data sales.</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col min-h-0">
                    <div className="text-base font-bold text-[#12324A]">Komposisi produk</div>
                    <div className="text-xs text-slate-500 mb-2">Gabungan 2024-2026</div>
                    <div className="flex justify-center mb-3">
                      <div className="w-[120px] h-[120px] rounded-full" style={{ background: pieBg }} />
                    </div>
                    <div className="flex-1 space-y-1.5 min-h-0 overflow-hidden">
                      {topProd.length > 0 ? topProd.map((p, i) => (
                        <div key={p.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="truncate max-w-[90px] text-slate-700" title={p.name}>{p.name}</span>
                          </span>
                          <span className="font-bold text-slate-800">{formatRupiah(p.val)}</span>
                        </div>
                      )) : (
                        <div className="text-sm italic text-slate-400 text-center">Belum ada data produk.</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ============ SLIDE 2: TIMELINE 2024-2026 ============ */}
            {currentSlide === 1 && (
              <div className="absolute inset-0 p-5 flex flex-col gap-3 animate-fadeIn">
                <SlideHeader
                  icon={<Calendar size={22} />}
                  title="Perjalanan Kinerja 2024 – 2026"
                  subtitle="Realisasi per tahun, panah = naik / turun vs tahun sebelumnya, rincian input di bawahnya"
                />
                <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-md border border-slate-200 py-3 flex flex-col">
                  <YearTimeline yearData={yearData} />
                </div>
              </div>
            )}

            {/* ============ SLIDE 3: TIM SALES ============ */}
            {currentSlide === 2 && (
              <div className="absolute inset-0 p-5 flex flex-col gap-3 animate-fadeIn">
                <SlideHeader
                  icon={<User size={22} />}
                  title="Tim Sales"
                  subtitle={`Pencapaian per personel / brand · ${salesRows.length} personel · ${salesType === "OMZET" ? "Omzet" : "Profit"} oriented`}
                />
                <YearColHeaders yearData={yearData} label="Sales / Brand" sub="urut total revenue" />
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1">
                  {salesRows.length > 0 ? salesRows.map((row, ri) => (
                    <div
                      key={row.name}
                      className="grid grid-cols-[230px_1fr_1fr_1fr] gap-3 bg-white rounded-2xl shadow-md border border-slate-200 p-3 items-stretch"
                      style={{ flex: "1 1 0", minHeight: 108, maxHeight: 190 }}
                    >
                      <RowIdentity name={row.name} rank={ri} total={row.total} />
                      {row.cells.map((cell, yi) => {
                        if (!cell) return <EmptyCell key={yi} />;
                        const ach = cell.tgt > 0 ? (cell.act / cell.tgt) * 100 : 0;
                        const prevCell = yi > 0 ? row.cells[yi - 1] : null;
                        const ok = ach >= 100;
                        return (
                          <div key={yi} className="rounded-xl bg-slate-50 border border-slate-200 px-3 flex items-center gap-3 min-w-0" style={{ borderLeft: `4px solid ${YEAR_COLORS[yi]}` }}>
                            <MiniRing pct={ach} color={ok ? "#2F7A45" : "#D97706"} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[19px] font-black text-[#12324A] truncate">{formatRupiah(cell.act)}</span>
                                <DeltaChip cur={cell.act} prev={prevCell ? prevCell.act : 0} />
                              </div>
                              <div className="text-[12px] text-slate-500">Target {formatRupiah(cell.tgt)}</div>
                              <div className="mt-0.5">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                  {ok ? "Tercapai" : "Belum tercapai"}
                                </span>
                              </div>
                              {cell.note && <div className="text-[12px] italic text-slate-500 truncate mt-0.5" title={cell.note}>“{cell.note}”</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )) : (
                    <div className="py-10 text-center"><Empty text="Belum ada data sales." /></div>
                  )}
                </div>
              </div>
            )}

            {/* ============ SLIDE 4: PRODUK ============ */}
            {currentSlide === 3 && (
              <div className="absolute inset-0 p-5 flex flex-col gap-3 animate-fadeIn">
                <SlideHeader
                  icon={<Package size={22} />}
                  title="Top Produk / Item Group"
                  subtitle={`Penjualan berjalan vs tahun lalu · ${prodRows.length} item group`}
                />
                <YearColHeaders yearData={yearData} label="Item group" sub="urut total penjualan" />
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1">
                  {prodRows.length > 0 ? prodRows.map((row, ri) => {
                    const grand = prodRows.reduce((a, r) => a + r.total, 0);
                    const share = grand > 0 ? (row.total / grand) * 100 : 0;
                    return (
                      <div
                        key={row.name}
                        className="grid grid-cols-[230px_1fr_1fr_1fr] gap-3 bg-white rounded-2xl shadow-md border border-slate-200 p-3 items-stretch"
                        style={{ flex: "1 1 0", minHeight: 108, maxHeight: 190 }}
                      >
                        <RowIdentity
                          name={row.name}
                          rank={ri}
                          total={row.total}
                          extra={
                            <div className="mt-1 flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div className="h-full rounded-full bg-[#7FA800]" style={{ width: `${Math.min(share, 100)}%` }} />
                              </div>
                              <span className="text-[11px] font-bold text-slate-500">{share.toFixed(0)}%</span>
                            </div>
                          }
                        />
                        {row.cells.map((cell, yi) => {
                          if (!cell) return <EmptyCell key={yi} />;
                          const c = YEAR_COLORS[yi];
                          const mx = Math.max(cell.cur, cell.prev, 1);
                          return (
                            <div key={yi} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 flex flex-col justify-center gap-1.5 min-w-0" style={{ borderLeft: `4px solid ${c}` }}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[20px] font-black truncate" style={{ color: c }}>{formatRupiah(cell.cur)}</span>
                                <DeltaChip cur={cell.cur} prev={cell.prev} labelBase="Baseline 🚀" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-[54px] text-[11px] text-slate-500">Berjalan</span>
                                <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${(cell.cur / mx) * 100}%`, background: c }} />
                                </div>
                                <span className="w-[62px]" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-[54px] text-[11px] text-slate-500">Lalu</span>
                                <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                  <div className="h-full rounded-full bg-slate-400" style={{ width: `${(cell.prev / mx) * 100}%` }} />
                                </div>
                                <span className="w-[62px] text-right text-[11px] font-bold text-slate-600">{formatRupiah(cell.prev)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }) : (
                    <div className="py-10 text-center"><Empty text="Belum ada data produk." /></div>
                  )}
                </div>
              </div>
            )}

            {/* ============ SLIDE 5: INOVASI ============ */}
            {currentSlide === 4 && (
              <div className="absolute inset-0 p-5 flex flex-col gap-3 animate-fadeIn">
                <SlideHeader
                  icon={<Zap size={22} />}
                  title="Inovasi & Terobosan Komersial"
                  subtitle="Program baru, efisiensi, dan rencana aksi dari tahun ke tahun"
                />
                <div className="flex-1 min-h-0 grid grid-cols-3 gap-5">
                  {yearData.map((d, i) => {
                    const c = YEAR_COLORS[i % YEAR_COLORS.length];
                    const prev = i > 0 ? yearData[i - 1] : null;
                    return (
                      <div key={d.yr} className="relative bg-white rounded-3xl shadow-lg border border-slate-200 flex flex-col min-h-0 overflow-hidden">
                        <div className="px-6 py-4 text-white flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${c}, ${c}B3)` }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Zap size={20} /></div>
                            <span className="text-[34px] font-black leading-none">{d.yr}</span>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20">{d.rep ? "Logged" : "Kosong"}</span>
                        </div>
                        <span className="absolute right-4 top-16 text-[130px] font-black leading-none pointer-events-none select-none" style={{ color: c, opacity: 0.06 }}>
                          {String(d.yr).slice(2)}
                        </span>
                        <div className="relative flex-1 overflow-y-auto custom-scrollbar p-6 min-h-0">
                          {d.innovations ? (
                            <>
                              <div className="text-[44px] leading-none font-black -mb-1" style={{ color: c }}>“</div>
                              <p className="text-[19px] text-slate-700 leading-relaxed whitespace-pre-line">{d.innovations}</p>
                            </>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300"><Zap size={26} /></div>
                              <Empty text={d.rep ? "Belum diisi" : "Belum ada data laporan"} />
                            </div>
                          )}
                        </div>
                        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-slate-500">Revenue {d.yr}</div>
                            <div className="text-[19px] font-black leading-tight" style={{ color: c }}>{d.rep ? formatRupiah(d.actual) : "-"}</div>
                          </div>
                          {d.rep && <DeltaChip cur={d.actual} prev={prev ? prev.actual : 0} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============ SLIDE 6: SALES SUPPORT ============ */}
            {currentSlide === 5 && (
              <div className="absolute inset-0 p-5 flex flex-col gap-3 animate-fadeIn">
                <SlideHeader
                  icon={<ShieldCheck size={22} />}
                  title="Sales Support & Operasional Pendukung"
                  subtitle="Administrasi PO, koordinasi DO & piutang, serta evaluasi kendala"
                />
                <YearColHeaders yearData={yearData} label="Aspek" sub="per tahun" />
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  {[
                    { key: "supportPo", title: "Input & Verifikasi PO Masuk", sub: "Target max 1 hari", icon: <FileText size={22} />, g: "linear-gradient(135deg,#12324A,#2B6285)" },
                    { key: "supportCoord", title: "Koordinasi DO & Piutang", sub: "Sinkronisasi tim AR & shipment", icon: <BarChart3 size={22} />, g: "linear-gradient(135deg,#1F5A34,#2F7A45)" },
                    { key: "supportEval", title: "Evaluasi Kendala", sub: "Internal / eksternal", icon: <Flag size={22} />, g: "linear-gradient(135deg,#7A5600,#C98A00)" },
                  ].map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-[230px_1fr_1fr_1fr] gap-3 bg-white rounded-2xl shadow-md border border-slate-200 p-3 overflow-hidden"
                      style={{ flex: "1 1 0", minHeight: 0, gridTemplateRows: "minmax(0,1fr)" }}
                    >
                      <div className="flex items-center gap-3 pl-1 pr-2 min-w-0">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0" style={{ background: row.g }}>{row.icon}</div>
                        <div className="min-w-0">
                          <div className="text-[16px] font-black text-[#12324A] leading-tight">{row.title}</div>
                          <div className="text-[12px] text-slate-500 leading-tight mt-0.5">{row.sub}</div>
                        </div>
                      </div>
                      {yearData.map((d, yi) => {
                        const txt = d[row.key];
                        if (!txt) {
                          return (
                            <div key={d.yr} className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 flex items-center justify-center">
                              <span className="text-[13px] italic text-slate-400">{d.rep ? "Belum diisi" : "Belum ada laporan"}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={d.yr} className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 overflow-y-auto custom-scrollbar min-h-0" style={{ borderLeft: `4px solid ${YEAR_COLORS[yi]}` }}>
                            <p className="text-[15px] text-slate-700 leading-snug whitespace-pre-line">{txt}</p>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============ SLIDE 7: OUTLOOK 2027 + CATATAN ============ */}
            {currentSlide === 6 && (
              <div className="absolute inset-0 p-6 flex flex-col gap-3 animate-fadeIn">
                <div className="flex-1 min-h-0 grid grid-cols-[1.4fr_1fr] gap-5">
                  <div className="bg-[#12324A] text-white border border-[#2B6285] p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col min-h-0">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2B6285] via-[#A3C400] to-[#2F7A45]"></div>
                    <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(163,196,0,0.22), transparent 70%)" }} />
                    <span className="absolute right-6 bottom-20 text-[150px] font-black leading-none pointer-events-none select-none text-white" style={{ opacity: 0.04 }}>2027</span>
                    <div className="relative inline-flex self-start items-center gap-2 bg-[#A3C400] text-[#1B2A02] px-4 py-2 rounded-full text-sm font-bold">
                      <Sparkles size={16} /> Final stage: Strategic Outlook 2027
                    </div>
                    <h2 className="relative text-[32px] font-black tracking-tight leading-tight mt-4">
                      Proyeksi Masa Depan & Fokus Inovasi 2027
                    </h2>
                    <div className="relative flex-1 min-h-0 mt-4 bg-white/[0.07] border border-white/15 p-5 rounded-2xl overflow-y-auto custom-scrollbar">
                      <span className="text-sm text-[#A3C400] font-bold flex items-center gap-2 mb-2">
                        <Flag size={16} /> Catatan Isu & Fokus Perbaikan 2027
                      </span>
                      {outlook2027 ? (
                        <p className="whitespace-pre-line text-xl text-slate-100 leading-relaxed">{outlook2027}</p>
                      ) : (
                        <p className="text-lg italic text-slate-400">Belum ada strategic outlook atau isu 2027 yang di-input.</p>
                      )}
                    </div>
                    <div className="relative pt-4 mt-4 border-t border-white/15 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-[#A3C400] flex items-center gap-2">
                          <CheckCircle2 size={20} /> Siap Melangkah ke Tahun 2027!
                        </h4>
                        <p className="text-sm text-slate-300">Komitmen pertumbuhan berkelanjutan & pencapaian target komersial.</p>
                      </div>
                      <button
                        onClick={() => setCurrentSlide(0)}
                        className="px-5 py-3 rounded-xl bg-[#A3C400] text-[#1B2A02] font-black text-sm shadow-lg hover:brightness-110 transition cursor-pointer flex items-center gap-2 shrink-0"
                      >
                        <RotateCcw size={16} /> Restart
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 flex flex-col min-h-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#12324A] text-[#A3C400] flex items-center justify-center"><FileText size={20} /></div>
                      <div>
                        <div className="text-lg font-black text-[#12324A] leading-none">Catatan & Evaluasi Bebas</div>
                        <div className="text-xs text-slate-500 mt-1">Dari departemen per tahun</div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-2.5 min-h-0">
                      {yearData.map((d, i) => (
                        <div key={d.yr} className="flex-1 min-h-0 rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col" style={{ borderLeft: `4px solid ${YEAR_COLORS[i]}` }}>
                          <div className="mb-1.5"><YearTag yr={d.yr} idx={i} /></div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            {d.notes ? (
                              <p className="text-[15px] text-slate-700 leading-snug whitespace-pre-line">{d.notes}</p>
                            ) : (
                              <Empty text={d.rep ? "Belum diisi" : "Belum ada data laporan"} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 3. Footer Navigation Controls */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#12324A] z-10">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white transition cursor-pointer"
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {slideLabels.map((label, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentSlide === idx
                  ? "bg-[#A3C400] text-[#1B2A02] shadow-md"
                  : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-xl bg-[#A3C400] hover:brightness-110 text-[#1B2A02] font-bold disabled:opacity-30 transition cursor-pointer"
        >
          Selanjutnya <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
