"use client";
// frontend/app/presentation/live/page.jsx — VERSI BARU
import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { CLUSTERS, resolveDepartment, clusterOfDepartment, allowedClusterIds } from "../../../lib/presentation";

import CommercialDeck from "../../../components/presentation/CommercialDeck";
import { DigitalMarketingDeck, ProductDevelopmentDeck } from "../../../components/presentation/ClusterDeck";
import FinancialDeck from "../../../components/presentation/FinancialDeck";
import OperationalHospitalityDeck from "../../../components/presentation/OperationalHospitalityDeck";

const asList = (d) => (Array.isArray(d) ? d : d?.data || d?.reports || d?.plants || d?.departments || []);
const CLUSTER_IDS = Object.keys(CLUSTERS);

function Screen({ children }) {
  return <div className="fixed inset-0 z-[60] bg-slate-950 text-slate-400 text-sm flex items-center justify-center p-6 text-center">{children}</div>;
}

function LiveContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const clusterQ = (sp.get("cluster") || "").toUpperCase();
  const deptIdQ = sp.get("deptId") || "";
  const plantQ = sp.get("plantId") || "";

  const [user, setUser] = useState(null);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  const [plantId, setPlantId] = useState(plantQ);
  const [mode, setMode] = useState(null); // OMZET | PROFIT (null = ikuti data)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let u = null;
    try { u = JSON.parse(localStorage.getItem("user") || "null"); } catch {}
    if (!u) { window.location.href = "/login"; return; }
    setUser(u);
    if (u.role !== "SUPER_ADMIN" && u.plantId) setPlantId(u.plantId); // non-superadmin dikunci ke plant-nya
    apiFetch("/api/plants").then((d) => setPlants(asList(d))).catch(() => {});
    apiFetch("/api/departments").then((d) => setDepartments(asList(d))).catch(() => {});
  }, []);

  const isSuper = user?.role === "SUPER_ADMIN";

  // superadmin tanpa plant terpilih -> pilih plant pertama (data antar-plant TIDAK boleh dicampur)
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

  const deptById = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);

  // klaster yang boleh dibuka: superadmin semua; direktur Financial + Operational; lainnya hanya klaster divisinya
  const ownDeptName = (user?.departmentId && deptById.get(user.departmentId)) || user?.departmentName || user?.department?.name || "";
  const allowed = useMemo(() => {
    if (!user) return CLUSTER_IDS;
    if (isSuper) return CLUSTER_IDS;
    const a = allowedClusterIds(user, ownDeptName);
    if (a.length) return a;
    const own = ownDeptName && clusterOfDepartment(ownDeptName);
    return own ? [own] : CLUSTER_IDS;
  }, [user, isSuper, ownDeptName]);

  // klaster: ?deptId= (departemen) > ?cluster= > departemen milik user > klaster pertama yang boleh; hasil selalu dipaksa ke yang diizinkan
  const cluster = useMemo(() => {
    let c = null;
    if (deptIdQ && deptById.get(deptIdQ)) c = clusterOfDepartment(deptById.get(deptIdQ));
    if (!c && CLUSTER_IDS.includes(clusterQ)) c = clusterQ;
    if (!c && clusterQ === "OPERATIONAL") c = "OPERATIONAL_HOSPITALITY";
    if (!c) c = (ownDeptName && clusterOfDepartment(ownDeptName)) || "COMMERCIAL";
    return allowed.includes(c) ? c : allowed[0];
  }, [deptIdQ, clusterQ, deptById, ownDeptName, allowed]);

  const normalized = useMemo(
    () => reports.map((r) => (r.department?.name ? r : { ...r, department: { name: r.departmentName || deptById.get(r.departmentId) || "" } })),
    [reports, deptById]
  );
  const plant = plants.find((p) => p.id === plantId);
  const plantName = plant?.name || plant?.code || "";

  // OMZET/PROFIT: dari field salesType laporan Sales terbaru, bukan dari kata di teks
  const detectedMode = useMemo(() => {
    if (cluster !== "COMMERCIAL") return "OMZET";
    const sales = normalized
      .filter((r) => (!plantId || (r.plantId || r.plant?.id) === plantId) && resolveDepartment(r.department)?.cluster === "COMMERCIAL")
      .sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0) || Number(b.year) - Number(a.year));
    const t = sales.map((r) => r.metricsJson?.salesType || r.salesType).find(Boolean);
    return String(t || "OMZET").toUpperCase() === "PROFIT" ? "PROFIT" : "OMZET";
  }, [normalized, cluster, plantId, plantName]);
  const deckMode = mode || detectedMode;

  const setCluster = (c) => router.replace(`/presentation/live?cluster=${c}`);

  if (!user) return <Screen>Memuat presentasi…</Screen>;

  const renderDeck = () => {
    const common = { reports: normalized, plantId, plantName };
    if (cluster === "COMMERCIAL") return <CommercialDeck {...common} mode={deckMode} onClose={() => router.push("/presentation")} />;
    if (cluster === "DIGITAL_MARKETING") return <DigitalMarketingDeck {...common} onClose={() => router.push("/presentation")} />;
    if (cluster === "PRODUCT_DEVELOPMENT") return <ProductDevelopmentDeck {...common} onClose={() => router.push("/presentation")} />;
    const Deck = cluster === "FINANCIAL" ? FinancialDeck : OperationalHospitalityDeck;
    return <Deck {...common} onClose={() => router.push("/presentation")} />;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 text-white flex flex-col font-sans">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900/90">
        <Link href="/presentation" className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-cyan-400 rounded-xl transition">← Hub</Link>

        <div className="flex flex-wrap gap-1">
          {allowed.map((c) => (
            <button key={c} onClick={() => setCluster(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${c === cluster ? "bg-cyan-500 text-slate-950 border-cyan-400" : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"}`}>
              {CLUSTERS[c].label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {cluster === "COMMERCIAL" && (
            <div className="flex rounded-xl overflow-hidden border border-slate-700 text-xs">
              {["OMZET", "PROFIT"].map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 ${deckMode === m ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300"}`}>{m === "OMZET" ? "Omzet" : "Profit"}</button>
              ))}
            </div>
          )}
          {isSuper ? (
            <select value={plantId} onChange={(e) => setPlantId(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-400 focus:outline-none">
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name || p.code}</option>)}
            </select>
          ) : (
            <span className="text-xs text-slate-400 px-2">{plantName}</span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {error ? <Screen>{error}</Screen>
          : loading || !plantId ? <Screen>Menyiapkan data {CLUSTERS[cluster].label} {plantName && `· ${plantName}`}…</Screen>
          : renderDeck()}
      </div>
    </div>
  );
}

export default function LivePresentationPage() {
  return (
    <Suspense fallback={<Screen>Memuat presentasi…</Screen>}>
      <LiveContent />
    </Suspense>
  );
}