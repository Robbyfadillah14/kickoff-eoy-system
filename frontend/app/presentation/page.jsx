"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { analyzePresentationContext } from "../../lib/presentationEngine";

export default function PresentationIndexPage() {
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [userDeptName, setUserDeptName] = useState("");

  useEffect(() => {
    const fallback = JSON.parse(localStorage.getItem("user") || "null");
    if (fallback) {
      setUser(fallback);
    } else {
      window.location.href = "/login";
    }

    apiFetch("/api/departments")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || data?.departments || [];
        setDepartments(list);
        
        const uDeptId = fallback?.departmentId || fallback?.departments?.[0]?.departmentId || fallback?.department?.id;
        const found = list.find((d) => d.id === uDeptId);
        if (found) {
          setUserDeptName(found.name);
        } else {
          setUserDeptName(fallback?.department || "General Operational");
        }
      })
      .catch((err) => console.error("Gagal memuat master departemen:", err));
  }, []);

  if (!user) return <div className="min-h-screen bg-slate-950 p-6 text-slate-400 text-sm">Memuat Command Center...</div>;

  // Analisis Smart Engine untuk Divisi User Aktif
  const activeContext = analyzePresentationContext({}, userDeptName);
  const userDeptId = user?.departmentId || user?.departments?.[0]?.departmentId || user?.department?.id || "";

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center space-y-6 max-w-5xl mx-auto px-4 py-8">
      {/* BADGE HEADER */}
      <div className="space-y-2">
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
          PT Ekasurya Inout Indonesia — Smart Presentation Command Center
        </span>
        <h1 className="text-3xl font-black text-white tracking-wide">
          Pilih Mode Presentation Deck
        </h1>
        <p className="text-xs text-slate-400 font-mono max-w-xl mx-auto">
          Sistem otomatis mendeteksi profil divisi kamu (<span className="text-cyan-400 font-semibold">{userDeptName}</span>) dan mengelompokkan bentuk slide secara cerdas.
        </p>
      </div>

      {/* AUTO-DETECTED RECOMMENDED DECK CARD */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/50 p-5 rounded-2xl text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/20 px-2 py-0.5 rounded">
              🎯 Rekomendasi Otomatis (Smart Detected)
            </span>
            <span className="text-xs font-mono text-slate-400">
              Klaster: {activeContext.clusterName}
            </span>
          </div>
          <h3 className="text-base font-bold text-white">
            Presentasi Live — {userDeptName}
          </h3>
          <p className="text-xs text-slate-300">
            {activeContext.insight}
          </p>
        </div>

        <Link
          href={`/presentation/live?deptId=${userDeptId}`}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition-all whitespace-nowrap shadow-lg shadow-cyan-500/20 hover:scale-105"
        >
          Buka Slide Divisi Kamu →
        </Link>
      </div>

      <div className="w-full border-t border-slate-800 my-2" />

      {/* KLASTER UTAMA PRESENTASI (KLASTERING PINTAR) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
        {/* KLASTER 1: COMMERCIAL / SALES */}
        <Link 
          href="/presentation/live?cluster=COMMERCIAL"
          className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500 p-4 rounded-2xl text-left space-y-3 transition-all group shadow-xl flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-base">
              📈
            </div>
            <h2 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
              Commercial / Sales
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Omzet vs Profit, pipeline customer, & RGT Roadmap.
            </p>
          </div>
          <span className="inline-block text-[11px] font-mono text-cyan-400 font-bold pt-2">
            Buka Deck →
          </span>
        </Link>

        {/* KLASTER 2: DIGITAL MARKETING */}
        <Link 
          href="/presentation/live?cluster=DIGITAL_MARKETING"
          className="bg-slate-900/80 border border-slate-800 hover:border-blue-500 p-4 rounded-2xl text-left space-y-3 transition-all group shadow-xl flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-base">
              🎯
            </div>
            <h2 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              Digital Marketing
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Campaign reach, lead generation, & digital footprint.
            </p>
          </div>
          <span className="inline-block text-[11px] font-mono text-blue-400 font-bold pt-2">
            Buka Deck →
          </span>
        </Link>

        {/* KLASTER 3: PRODUCT DEVELOPMENT */}
        <Link 
          href="/presentation/live?cluster=PRODUCT_DEVELOPMENT"
          className="bg-slate-900/80 border border-slate-800 hover:border-cyan-400 p-4 rounded-2xl text-left space-y-3 transition-all group shadow-xl flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-400/20 text-cyan-300 font-bold flex items-center justify-center text-base">
              🚀
            </div>
            <h2 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Product Development
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              R&D pipeline, product lifecycle, & innovation metrics.
            </p>
          </div>
          <span className="inline-block text-[11px] font-mono text-cyan-300 font-bold pt-2">
            Buka Deck →
          </span>
        </Link>

        {/* KLASTER 4: FINANCIAL & TAX */}
        <Link 
          href="/presentation/live?cluster=FINANCIAL"
          className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500 p-4 rounded-2xl text-left space-y-3 transition-all group shadow-xl flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-base">
              💰
            </div>
            <h2 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              Financial & Tax
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cash flow, AP/AR, Coretax, & anggaran operasional.
            </p>
          </div>
          <span className="inline-block text-[11px] font-mono text-emerald-400 font-bold pt-2">
            Buka Deck →
          </span>
        </Link>

        {/* KLASTER 5: OPERATIONAL & HOSPITALITY */}
        <Link 
          href="/presentation/live?cluster=OPERATIONAL_HOSPITALITY"
          className="bg-slate-900/80 border border-slate-800 hover:border-blue-400 p-4 rounded-2xl text-left space-y-3 transition-all group shadow-xl flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-400/20 text-blue-300 font-bold flex items-center justify-center text-base">
              ⚙️
            </div>
            <h2 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
              Operational & Logistics
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              SLA, OTD, efisiensi gudang, & kepatuhan SOP cabang.
            </p>
          </div>
          <span className="inline-block text-[11px] font-mono text-blue-300 font-bold pt-2">
            Buka Deck →
          </span>
        </Link>
      </div>
    </div>
  );
}