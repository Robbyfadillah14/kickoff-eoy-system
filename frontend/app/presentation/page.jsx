"use client";
// frontend/app/presentation/page.jsx — hub presentasi
// Akun divisi: langsung ke presentasi divisinya sendiri. Superadmin: seluruh divisi, dikelompokkan per klaster.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { CLUSTERS, DEPARTMENTS, resolveDepartment } from "../../lib/presentation";
import { asList, pickUserDept } from "../../lib/reportForm";

const TONE = {
  COMMERCIAL: { icon: "📈", text: "text-cyan-400", border: "hover:border-cyan-500" },
  DIGITAL_MARKETING: { icon: "🎯", text: "text-blue-400", border: "hover:border-blue-500" },
  PRODUCT_DEVELOPMENT: { icon: "🚀", text: "text-cyan-300", border: "hover:border-cyan-400" },
  FINANCIAL: { icon: "💰", text: "text-emerald-400", border: "hover:border-emerald-500" },
  OPERATIONAL_HOSPITALITY: { icon: "⚙️", text: "text-blue-300", border: "hover:border-blue-400" },
};
const NOTE = {
  COMMERCIAL: "Omzet vs profit, customer, dan roadmap Run → Grow → Transform.",
  DIGITAL_MARKETING: "Campaign, lead generation, dan pertumbuhan digital.",
  PRODUCT_DEVELOPMENT: "Riset, launching produk baru, dan pengujian sampel.",
  FINANCIAL: "Uang: AR/AP, akuntansi, pajak, dan admin tukar faktur.",
  OPERATIONAL_HOSPITALITY: "Non-uang: pengadaan, ekspor-impor, logistik, dokumen, dan SDM.",
};

export default function PresentationIndexPage() {
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let u = null;
    try { u = JSON.parse(localStorage.getItem("user") || "null"); } catch {}
    if (!u) { window.location.href = "/login"; return; }
    setUser(u);
    apiFetch("/api/departments").then((d) => setDepartments(asList(d))).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const isSuper = user?.role === "SUPER_ADMIN";
  const plantQ = !isSuper && user?.plantId ? `&plantId=${user.plantId}` : "";
  const deckHref = (d) => `/presentation/dept?deptId=${d.id}${plantQ}`;

  const known = useMemo(() => departments.filter((d) => resolveDepartment(d.name)), [departments]);
  const own = useMemo(() => (user && !isSuper ? pickUserDept(user, departments) : null), [user, isSuper, departments]);
  const groups = useMemo(() => Object.keys(CLUSTERS).map((c) => ({
    id: c,
    depts: DEPARTMENTS.filter((r) => r.cluster === c).map((r) => known.find((d) => resolveDepartment(d.name)?.code === r.code)).filter(Boolean),
  })).filter((g) => g.depts.length), [known]);

  if (!user) return <div className="min-h-screen bg-slate-950 p-6 text-slate-400 text-sm">Memuat presentasi…</div>;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center space-y-6 max-w-5xl mx-auto px-4 py-8">
      <div className="space-y-2">
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">PT Ekasurya Inout Indonesia — Presentation Mode</span>
        <h1 className="text-3xl font-black text-white tracking-wide">{isSuper ? "Pilih Presentasi" : "Presentasi Divisi Kamu"}</h1>
        <p className="text-xs text-slate-400 font-mono max-w-xl mx-auto">RUN 2024 • GROW 2025 • TRANSFORM 2026 • FUTURE 2027 — dari data yang sudah tersimpan di form.</p>
      </div>

      {!isSuper && (
        <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/50 p-5 rounded-2xl text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
          {own ? (
            <>
              <div className="space-y-1">
                <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/20 px-2 py-0.5 rounded">Divisi Kamu</span>
                <h3 className="text-base font-bold text-white">{own.name}</h3>
                <p className="text-xs text-slate-300">Slide berisi isian divisi ini untuk 2024–2027. Bisa diunduh sebagai PDF dari dalam presentasi.</p>
              </div>
              <Link href={deckHref(own)} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition-all whitespace-nowrap shadow-lg shadow-cyan-500/20">Buka Presentasi Divisi →</Link>
            </>
          ) : (
            <p className="text-xs text-slate-300">{loaded ? "Divisi akun ini tidak terdeteksi, jadi presentasi divisi belum bisa dibuka. Hubungi admin untuk menautkan akun ke divisi." : "Memuat divisi…"}</p>
          )}
        </div>
      )}

      {isSuper && (
        <div className="w-full space-y-4 text-left">
          {groups.map((g) => { const t = TONE[g.id]; return (
            <div key={g.id} className={`bg-slate-900/80 border border-slate-800 ${t.border} p-4 rounded-2xl transition-all shadow-xl`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-base">{t.icon}</div>
                  <div>
                    <h2 className={`text-sm font-bold ${t.text}`}>{CLUSTERS[g.id].label}</h2>
                    <p className="text-[11px] text-slate-400">{NOTE[g.id]}</p>
                  </div>
                </div>
                {g.depts.length > 1 && <Link href={`/presentation/live?cluster=${g.id}`} className="text-[11px] font-mono font-bold text-slate-300 hover:text-white px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl">Deck gabungan klaster →</Link>}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {g.depts.map((d) => <Link key={d.id} href={deckHref(d)} className="text-xs text-slate-200 px-3 py-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 rounded-xl transition">{d.name}</Link>)}
              </div>
            </div>); })}
          {loaded && !groups.length && <p className="text-xs text-slate-400 text-center">Daftar divisi belum termuat.</p>}
        </div>
      )}
    </div>
  );
}