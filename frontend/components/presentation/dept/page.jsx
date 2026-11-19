"use client";
// frontend/app/presentation/dept/page.jsx — deck pegangan SATU divisi (pratinjau + unduh PDF)
import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { resolveDepartment } from "../../../lib/presentation";
import { asList, pickUserDept } from "../../../lib/reportForm";
import DeptDeck from "../../../components/presentation/DeptDeck";

function Screen({ children }) {
  return <div className="h-screen bg-slate-950 text-slate-400 text-sm flex items-center justify-center p-6 text-center">{children}</div>;
}

function DeptContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const deptQ = sp.get("deptId") || "";
  const plantQ = sp.get("plantId") || "";

  const [user, setUser] = useState(null);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  const [plantId, setPlantId] = useState(plantQ);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let u = null;
    try { u = JSON.parse(localStorage.getItem("user") || "null"); } catch {}
    if (!u) { window.location.href = "/login"; return; }
    setUser(u);
    if (u.role !== "SUPER_ADMIN" && u.plantId) setPlantId(u.plantId);
    apiFetch("/api/plants").then((d) => setPlants(asList(d))).catch(() => {});
    apiFetch("/api/departments").then((d) => setDepartments(asList(d))).catch(() => {});
  }, []);

  const isSuper = user?.role === "SUPER_ADMIN";
  useEffect(() => {
    if (isSuper && !plantId && plants.length) setPlantId((plants.find((p) => p.isHolding) || plants[0]).id);
  }, [isSuper, plantId, plants]);

  useEffect(() => {
    if (!user || !plantId) return;
    setLoading(true); setError("");
    apiFetch(`/api/reports?${new URLSearchParams({ plantId })}`)
      .then((d) => setReports(asList(d)))
      .catch((e) => setError(e.message || "Gagal memuat laporan"))
      .finally(() => setLoading(false));
  }, [user, plantId]);

  const deptById = useMemo(() => new Map(departments.map((d) => [String(d.id), d])), [departments]);
  const known = useMemo(() => departments.filter((d) => resolveDepartment(d.name)), [departments]);

  // non-superadmin dikunci ke divisinya sendiri; superadmin bebas memilih
  const dept = useMemo(() => {
    if (!user || !departments.length) return null;
    if (!isSuper) return pickUserDept(user, departments);
    return deptById.get(deptQ) || known[0] || null;
  }, [user, departments, isSuper, deptQ, deptById, known]);

  const reg = dept ? resolveDepartment(dept.name) : null;
  const normalized = useMemo(
    () => reports.map((r) => (r.department?.name ? r : { ...r, department: { name: r.departmentName || deptById.get(String(r.departmentId))?.name || "" } })),
    [reports, deptById]
  );
  const mode = useMemo(() => {
    const t = normalized.filter((r) => resolveDepartment(r.department)?.code === "SALES").sort((a, b) => Number(b.year) - Number(a.year)).map((r) => r.metricsJson?.salesType).find(Boolean);
    return String(t || "OMZET").toUpperCase() === "PROFIT" ? "PROFIT" : "OMZET";
  }, [normalized]);
  const plantName = plants.find((p) => String(p.id) === String(plantId))?.name || "";

  if (!user) return <Screen>Memuat presentasi…</Screen>;

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-sans">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900/90">
        <Link href="/dashboard" className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-cyan-400 rounded-xl transition">← Dashboard</Link>
        {dept && (
          <Link href={`/report?year=2026&plantId=${plantId}&departmentId=${dept.id}`} className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-xs text-slate-300 hover:text-emerald-400 rounded-xl transition">✏️ Ubah isian divisi</Link>
        )}
        <span className="text-xs text-slate-500 hidden md:inline">Berisi data yang sudah <b>tersimpan</b>. Habis mengubah isian, simpan dulu lalu muat ulang halaman ini.</span>
        <div className="ml-auto flex items-center gap-2">
          {isSuper ? (
            <>
              <select value={dept?.id || ""} onChange={(e) => router.replace(`/presentation/dept?deptId=${e.target.value}&plantId=${plantId}`)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 focus:outline-none">
                {known.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={plantId} onChange={(e) => setPlantId(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-400 focus:outline-none">
                {plants.map((p) => <option key={p.id} value={p.id}>{p.name || p.code}</option>)}
              </select>
            </>
          ) : (
            <span className="text-xs text-slate-400 px-2">{dept?.name} · {plantName}</span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {error ? <Screen>{error}</Screen>
          : !isSuper && departments.length && !dept ? <Screen>Divisi akun ini tidak terdeteksi, jadi presentasi divisi tidak bisa ditampilkan. Hubungi admin untuk mengisi divisi pada akun Anda.</Screen>
          : loading || !plantId || !reg ? <Screen>Menyiapkan presentasi divisi {plantName && `· ${plantName}`}…</Screen>
          : <DeptDeck key={`${reg.code}-${plantId}`} dept={reg.code} reports={normalized} plantId={plantId} plantName={plantName} mode={mode} onClose={() => router.push("/dashboard")} />}
      </div>
    </div>
  );
}

export default function DeptPresentationPage() {
  return (
    <Suspense fallback={<Screen>Memuat presentasi…</Screen>}>
      <DeptContent />
    </Suspense>
  );
}