"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, TrendingUp, ArrowUpRight, 
  BarChart3, Target, Sparkles, CheckCircle2, Zap, 
  ShieldCheck, ArrowRightLeft, Flag, CheckCircle, Calendar, User, Package, AlertTriangle, TrendingDown
} from "lucide-react";

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

// [DESAIN] Diperbesar lebarnya supaya kanvas slide jauh lebih besar & memenuhi ruang kiri-kanan layar
const STAGE_W = 1360;
const STAGE_H = 720;
const RING_R = 58;
const RING_C = 2 * Math.PI * RING_R;
const PIE_COLORS = ["#2B6285", "#A3C400", "#2F7A45", "#5B8DB8", "#94A3B8"];

export default function CommercialProfitDeck({ report, allYearlyReports = {} }) {
  const historicalYears = [2024, 2025, 2026]; 
  const mJson = report?.metricsJson || {};
  const salesType = mJson.salesType || "PROFIT";

  const userSummary = report?.achievementSummary || mJson.achievementSummary || "Belum ada ringkasan pencapaian yang di-input.";

  const totalSlides = historicalYears.length + 2;
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

  // [DESAIN] scale otomatis dengan mengisi lebar kontainer secara maksimal
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

  let totalAllActual = 0;
  let totalAllTarget = 0;
  
  const activeSalesNames = new Set();
  historicalYears.forEach(yr => {
    const rep = getReportForYear(yr);
    if (rep) {
      const sList = rep?.metricsJson?.salesPerformances || rep?.salesPerformances || [];
      totalAllActual += sList.reduce((acc, s) => acc + Number(s.actualVal || 0), 0);
      totalAllTarget += sList.reduce((acc, s) => acc + Number(s.targetProfit || s.targetVal || 0), 0);
      sList.forEach(s => {
        if (s.salesName) activeSalesNames.add(s.salesName.trim());
      });
    }
  });

  const yearData = historicalYears.map((yr) => {
    const rep = getReportForYear(yr);
    const metrics = rep ? (rep?.metricsJson || rep || {}) : {};
    const sList = metrics.salesPerformances || [];

    const products = [];
    if (rep) {
      sList.forEach(sp => {
        if (sp.topProducts && Array.isArray(sp.topProducts)) {
          sp.topProducts.forEach(prod => {
            if (prod.productName && prod.productName.trim() !== "") {
              products.push({
                productName: prod.productName.trim(),
                currentVal: Number(prod.category || prod.actualVal || 0),
                prevValInput: Number(prod.prevCategory || prod.prevVal || 0)
              });
            }
          });
        }
      });
    }

    const innovations = rep ? (rep?.branchInnovations || metrics.branchInnovations || "Belum ada catatan inovasi.") : "Belum ada data laporan.";
    const actual = sList.reduce((acc, s) => acc + Number(s.actualVal || 0), 0);
    const target = sList.reduce((acc, s) => acc + Number(s.targetProfit || s.targetVal || 0), 0);
    return { yr, rep, sList, products, innovations, actual, target, ach: target > 0 ? (actual / target) * 100 : 0 };
  });

  const totalAch = totalAllTarget > 0 ? (totalAllActual / totalAllTarget) * 100 : 0;
  const maxYearVal = Math.max(...yearData.flatMap(d => [d.actual, d.target]), 1);

  const salesAgg = {};
  yearData.forEach(d => d.sList.forEach(s => {
    const name = (s.salesName || "").trim();
    if (!name) return;
    salesAgg[name] = salesAgg[name] || { name, actual: 0, target: 0 };
    salesAgg[name].actual += Number(s.actualVal || 0);
    salesAgg[name].target += Number(s.targetProfit || s.targetVal || 0);
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

  const activeYear = currentSlide >= 1 && currentSlide <= historicalYears.length ? yearData[currentSlide - 1] : null;
  const slideLabels = ["Master Dashboard", ...historicalYears.map(String), "Outlook 2027"];

  const report2027 = getReportForYear(2027);
  const outlook2027 = report2027?.metricsJson?.strategicOutlook2027 || report2027?.strategicOutlook2027 || mJson.strategicOutlook2027 || "Belum ada strategic outlook atau isu 2027 yang di-input.";

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

      {/* 2. Slide Viewport: Dibuat lebih lebar & mengisi penuh ruang */}
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

            {/* SLIDE 0: EXECUTIVE MASTER DASHBOARD */}
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
                      <span className="absolute inset-0 flex items-center justify-center text-[34px] font-black">{totalAch.toFixed(0)}%</span>
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
                                {d.ach.toFixed(0)}%
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
                            <span className={s.ach >= 100 ? "text-[#2F7A45]" : "text-amber-600"}>{s.ach.toFixed(0)}%</span>
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

            {/* SLIDE 1..3: DETAIL PER TAHUN */}
            {activeYear && (
              <div className="absolute inset-0 p-5 flex flex-col gap-4 animate-fadeIn">

                <div className="flex items-stretch gap-4 h-[104px] shrink-0">
                  <div className="bg-[#12324A] text-white rounded-2xl px-6 flex items-center gap-4 w-[330px] shrink-0">
                    <Calendar size={30} className="text-[#A3C400]" />
                    <div>
                      <div className="text-sm text-slate-300">Tahun operasional</div>
                      <div className="text-[44px] font-black leading-none">{activeYear.yr}</div>
                    </div>
                    <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-bold ${activeYear.rep ? "bg-[#A3C400] text-[#1B2A02]" : "bg-white/15 text-slate-300"}`}>
                      {activeYear.rep ? "Logged" : "Kosong"}
                    </span>
                  </div>
                  <div className="flex-1 bg-[#2B6285] text-white rounded-2xl px-6 flex flex-col justify-center">
                    <div className="text-[13px] text-sky-100">Target</div>
                    <div className="text-[30px] font-black leading-none mt-1">{formatRupiah(activeYear.target)}</div>
                  </div>
                  <div className="flex-1 bg-[#2F7A45] text-white rounded-2xl px-6 flex flex-col justify-center">
                    <div className="text-[13px] text-emerald-100">Revenue aktual</div>
                    <div className="text-[30px] font-black leading-none mt-1">{formatRupiah(activeYear.actual)}</div>
                  </div>
                  <div className="w-[200px] bg-[#A3C400] text-[#1B2A02] rounded-2xl px-6 flex flex-col justify-center">
                    <div className="text-[13px] font-semibold text-[#2E4A00]">Pencapaian</div>
                    <div className="text-[40px] font-black leading-none mt-1">{activeYear.ach.toFixed(0)}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 flex-1 min-h-0">
                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 flex flex-col min-h-0">
                    <span className="text-base font-bold text-[#2B6285] flex items-center gap-2 mb-3">
                      <User size={18} /> Tim Sales ({activeYear.sList.length})
                    </span>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                      {activeYear.sList.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2.5">
                          {activeYear.sList.map((sales, sIdx) => {
                            const tgt = Number(sales.targetProfit || sales.targetVal || 0);
                            const act = Number(sales.actualVal || 0);
                            const ach = tgt > 0 ? ((act / tgt) * 100) : 0;
                            const isAchieved = act >= tgt;

                            return (
                              <div key={sIdx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                                <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                                  <span className="truncate max-w-[150px]" title={sales.salesName}>{sales.salesName}</span>
                                  <span className={ach >= 100 ? "text-[#2F7A45]" : "text-amber-600"}>{ach.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                  <div className={`h-full rounded-full ${ach >= 100 ? "bg-[#7FA800]" : "bg-amber-500"}`} style={{ width: `${Math.min(ach, 100)}%` }} />
                                </div>
                                <div className="flex justify-between text-xs text-slate-600">
                                  <span>Tgt: <b className="text-[#2B6285]">{formatRupiah(tgt)}</b></span>
                                  <span>Akt: <b className="text-[#2F7A45]">{formatRupiah(act)}</b></span>
                                </div>
                                <div className={`px-2 py-0.5 rounded-md text-xs font-bold flex justify-between ${isAchieved ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                  <span>{isAchieved ? "Wah Naik Nih!" : "Wah Turun Nih!"}</span>
                                  <span>{isAchieved ? "Tercapai" : "Belum"}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-sm py-1">Belum ada data sales.</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 flex flex-col min-h-0">
                    <span className="text-base font-bold text-[#2F7A45] flex items-center gap-2 mb-3">
                      <Package size={18} /> Produk ({activeYear.products.length})
                    </span>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 min-h-0">
                      {activeYear.products.length > 0 ? (
                        activeYear.products.map((prod, pIdx) => {
                          const hasPrev = prod.prevValInput > 0;
                          const isIncreased = !hasPrev || prod.currentVal >= prod.prevValInput;

                          return (
                            <div key={pIdx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                              <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                                <span className="truncate max-w-[110px]" title={prod.productName}>{prod.productName}</span>
                                <span className="text-[#2F7A45]">{formatRupiah(prod.currentVal)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-slate-600">
                                <span>Lalu: {formatRupiah(prod.prevValInput)}</span>
                                <span className={`px-1.5 py-0.5 rounded-md font-bold ${!hasPrev ? "bg-slate-200 text-slate-700" : isIncreased ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                  {!hasPrev ? "Baseline 🚀" : isIncreased ? "Wah Naik Nih!" : "Wah Turun Nih!"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-slate-400 italic text-sm py-1">Belum ada data produk.</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 flex flex-col min-h-0">
                    <span className="text-base font-bold text-[#5B6B00] flex items-center gap-2 mb-3">
                      <Zap size={18} /> Inovasi
                    </span>
                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                      <p className="text-[15px] text-slate-700 bg-[#F4F8E4] p-3 rounded-xl border border-[#D7E39A] leading-relaxed whitespace-pre-line">
                        {activeYear.rep ? activeYear.innovations : "Belum ada catatan inovasi."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE TERAKHIR: STRATEGIC OUTLOOK 2027 */}
            {currentSlide === totalSlides - 1 && (
              <div className="absolute inset-0 p-8 flex items-center justify-center animate-fadeIn text-center">
                <div className="w-full max-w-[1120px] bg-[#12324A] text-white border border-[#2B6285] p-10 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2B6285] via-[#A3C400] to-[#2F7A45]"></div>

                  <div className="inline-flex items-center gap-2 bg-[#A3C400] text-[#1B2A02] px-4 py-2 rounded-full text-sm font-bold">
                    <Sparkles size={16} /> Final stage: Strategic Outlook 2027
                  </div>

                  <h2 className="text-[38px] font-black text-white tracking-tight leading-tight">
                    Proyeksi Masa Depan & Fokus Inovasi 2027
                  </h2>

                  <div className="bg-white/[0.06] border border-white/15 p-6 rounded-2xl text-left shadow-inner leading-relaxed">
                    <span className="text-sm text-[#A3C400] font-bold block mb-2 flex items-center gap-2">
                      <Zap size={17} /> Catatan Isu & Fokus Perbaikan 2027
                    </span>
                    <div className="max-h-[230px] overflow-y-auto custom-scrollbar">
                      <p className="whitespace-pre-line text-xl text-slate-100 leading-relaxed font-sans">{outlook2027}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/15 flex items-center justify-between gap-4">
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-[#A3C400] flex items-center gap-2">
                        <CheckCircle2 size={20} /> Siap Melangkah ke Tahun 2027!
                      </h4>
                      <p className="text-sm text-slate-300">Komitmen pertumbuhan berkelanjutan & pencapaian target komersial.</p>
                    </div>
                    
                    <button 
                      onClick={() => setCurrentSlide(0)}
                      className="px-6 py-3 rounded-xl bg-[#A3C400] text-[#1B2A02] font-black text-sm shadow-lg hover:brightness-110 transition cursor-pointer flex items-center gap-2"
                    >
                      <RotateCcw size={16} /> Restart Presentation
                    </button>
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

        <div className="flex items-center gap-2">
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