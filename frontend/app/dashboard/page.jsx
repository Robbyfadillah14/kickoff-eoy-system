"use client";
// frontend/app/dashboard/page.jsx — VERSI BARU
// Perubahan utama: TIDAK lagi me-mount deck di tiap kartu. Kartu = ringkasan + tombol "Presentasikan" ke /presentation/live.
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { BrandLogo } from "../../components/Branding";
import { CLUSTERS, DEPARTMENTS, resolveDepartment, phaseOf, isEmptyValue, YEAR_LIST } from "../../lib/presentation";

const asList = (d) => (Array.isArray(d) ? d : d?.data || d?.reports || d?.plants || d?.departments || d?.list || []);
const asObj = (m) => (m && typeof m === "object" && !Array.isArray(m) ? m : {});
const STATUS = {
  DRAFT: { label: "Draft", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  SUBMITTED: { label: "Terkirim", cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  REVISION_REQUESTED: { label: "Revisi", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  APPROVED: { label: "Disetujui", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  LOCKED: { label: "Terkunci", cls: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
};
const isFrozen = (r) => r?.status === "LOCKED" || r?.status === "APPROVED";
const filledKeys = (r) => Object.keys(asObj(r?.metricsJson)).filter((k) => k !== "salesType" && !isEmptyValue(asObj(r.metricsJson)[k])).length;
const orderOf = (dept) => { const i = DEPARTMENTS.findIndex((d) => d.code === dept?.code); return i < 0 ? 999 : i; };

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [plants, setPlants] = useState([]);
  const [plantId, setPlantId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const [isQaOpen, setIsQaOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [qaStatus, setQaStatus] = useState("");
  const [detail, setDetail] = useState(null); // { plantName, deptName, records: {year: report} }

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(""), 4000); };

  useEffect(() => {
    let u = null;
    try { u = JSON.parse(localStorage.getItem("user") || "null"); } catch {}
    setUser(u);
    const p = u?.plantId || u?.plant?.id || "";
    if (u && u.role !== "SUPER_ADMIN" && p) setPlantId(p);
    apiFetch("/api/plants").then((d) => setPlants(asList(d))).catch(() => setPlants([]));
  }, []);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const userPlantId = user?.plantId || user?.plant?.id || "";
  const userDeptId = user?.departmentId || user?.department?.id || user?.departments?.[0]?.departmentId || (typeof user?.departments?.[0] === "string" ? user.departments[0] : "") || "";
  const activePlantId = isSuperAdmin ? plantId : userPlantId;
  const activeDeptId = isSuperAdmin ? departmentId : userDeptId;

  useEffect(() => {
    if (!user) return;
    const endpoint = activePlantId ? `/api/plants/${activePlantId}/departments` : "/api/departments";
    apiFetch(endpoint).then((d) => setDepartments(asList(d))).catch(() => setDepartments([]));
  }, [user, activePlantId]);

  const deptById = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);
  const plantById = useMemo(() => new Map(plants.map((p) => [p.id, p.name])), [plants]);

  // satu request untuk semua tahun (bukan 4 request) + refresh saat ada update realtime
  const load = useCallback(() => {
    if (!user) return Promise.resolve();
    const qs = new URLSearchParams({
      ...(activePlantId ? { plantId: String(activePlantId) } : {}),
      ...(activeDeptId ? { departmentId: String(activeDeptId) } : {}),
    });
    return apiFetch(`/api/reports?${qs}`)
      .then((d) => setReports(asList(d)))
      .catch((e) => { setReports([]); flash("Gagal memuat laporan: " + e.message); })
      .finally(() => setLoading(false));
  }, [user, activePlantId, activeDeptId]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    load();
    let socket = null;
    try { socket = getSocket(); socket?.on("report_updated", load); } catch {}
    return () => { try { socket?.off("report_updated", load); } catch {} };
  }, [user, load]);

  // kartu = plant × departemen; tiap kartu memegang laporan per tahun
  const cards = useMemo(() => {
    const map = new Map();
    for (const r of reports) {
      const pid = r.plantId || r.plant?.id || "?";
      const did = r.departmentId || r.department?.id || "?";
      const deptName = r.department?.name || r.departmentName || deptById.get(did) || "";
      const key = `${pid}|${did}`;
      if (!map.has(key)) map.set(key, { key, plantId: pid, departmentId: did, plantName: r.plant?.name || plantById.get(pid) || "", deptName, dept: resolveDepartment(deptName), records: {} });
      map.get(key).records[Number(r.year)] = r;
    }
    return [...map.values()].sort((a, b) => a.plantName.localeCompare(b.plantName) || orderOf(a.dept) - orderOf(b.dept) || a.deptName.localeCompare(b.deptName));
  }, [reports, deptById, plantById]);

  async function downloadExport(format) {
    const qs = new URLSearchParams({ ...(activePlantId ? { plantId: String(activePlantId) } : {}), ...(activeDeptId ? { departmentId: String(activeDeptId) } : {}), format });
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const res = await fetch(`/api/reports/export?${qs}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || type.includes("json")) throw new Error("Export belum tersedia di server ini");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `laporan.${format}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      flash(err.message || "Gagal export");
    }
  }

  function handleSendQuestion(e) {
    e.preventDefault();
    if (!questionText.trim()) return;
    try {
      getSocket().emit("new_question", {
        departmentName: user?.name || "Divisi Operasional",
        plantName: plantById.get(activePlantId) || user?.plant?.name || "",
        questionText: questionText.trim(),
        timestamp: new Date().toLocaleTimeString(),
      });
      setQaStatus("Pertanyaan terkirim.");
    } catch { setQaStatus("Koneksi live tidak tersedia."); }
    setQuestionText("");
    setTimeout(() => { setQaStatus(""); setIsQaOpen(false); }, 1800);
  }

  async function deleteReport(r) {
    if (isFrozen(r)) return flash(`Laporan ${r.year} berstatus ${r.status}, tidak bisa dihapus.`);
    if (!window.confirm(`Hapus laporan ${r.year} (${detail?.deptName}) secara permanen?`)) return;
    try {
      await apiFetch(`/api/reports/${r.id}`, { method: "DELETE" });
      flash(`Laporan ${r.year} dihapus.`);
      setDetail(null);
      load();
    } catch (e) { flash("Gagal menghapus: " + e.message); }
  }

  if (!user) return <div className="min-h-screen bg-[#0d1117] p-4 text-slate-400 text-sm flex items-center justify-center">Memuat sesi pengguna...</div>;

  const myPlantName = plantById.get(userPlantId) || user?.plant?.name || "Cabang Anda";
  const liveHref = (c) => `/presentation/live?cluster=${c.dept.cluster}&plantId=${c.plantId}`;

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 selection:bg-cyan-500 selection:text-black">
      {notice && <div className="fixed top-4 right-4 z-[60] bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs px-4 py-3 rounded-xl shadow-2xl">{notice}</div>}

      {/* HEADER */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl"><BrandLogo /></div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Dashboard Reporting</h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Login: <span className="text-cyan-400 font-semibold">{user.name}</span> <span className="text-slate-500">({user.role})</span></p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-800/80">
          {isSuperAdmin ? (
            <>
              <select value={plantId} onChange={(e) => { setPlantId(e.target.value); setDepartmentId(""); }} className="bg-slate-950/90 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 flex-1">
                <option value="">Semua Plant ({plants.length})</option>
                {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="bg-slate-950/90 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 flex-1">
                <option value="">Semua Divisi ({departments.length})</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Plant terikat: <span className="text-white font-semibold">{myPlantName}</span>
            </div>
          )}
        </div>
      </div>

      {/* RINGKASAN + AKSI */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="flex-1 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl">
          <a href={`/report?year=2026${activePlantId ? `&plantId=${activePlantId}` : ""}${activeDeptId ? `&departmentId=${activeDeptId}` : ""}`} className="col-span-2 sm:col-span-1 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl hover:opacity-90 text-center">✍️ Form & Kontrol Laporan</a>
          <button onClick={() => setIsQaOpen(true)} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-semibold px-4 py-2.5 rounded-xl">💬 Live Q&A</button>
          <button onClick={() => downloadExport("xlsx")} className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-2.5 rounded-xl">📊 Excel</button>
          <button onClick={() => downloadExport("pdf")} className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-2.5 rounded-xl">📄 PDF</button>
          <a href="/presentation" className="col-span-2 sm:col-span-1 sm:ml-auto text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl hover:opacity-90 text-center">🚀 Presentation Mode</a>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 px-5 py-3 rounded-2xl text-center shrink-0">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono">Laporan 2024–2027</span>
          <span className="text-lg font-extrabold text-cyan-400 font-mono">{reports.length}</span>
          <span className="text-[10px] text-slate-500 block">{cards.length} kartu plant × divisi</span>
        </div>
      </div>

      {/* KARTU */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Memuat laporan…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((c) => {
            const years = YEAR_LIST.map((y) => ({ y, phase: phaseOf(y)?.phase, r: c.records[y] }));
            const latest = [...years].reverse().find((x) => x.r)?.r;
            const filled = years.filter((x) => x.r && (filledKeys(x.r) > 0 || x.r.achievementSummary)).length;
            return (
              <div key={c.key} className="bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition shadow-xl">
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] text-slate-500">🏢 {c.plantName || "Plant"}</div>
                    <div className="text-sm font-bold text-white">{c.deptName || "Departemen tidak dikenal"}</div>
                    <div className="text-[11px] text-cyan-400">{c.dept ? CLUSTERS[c.dept.cluster].label : <span className="text-rose-400">Belum dipetakan di registry</span>}</div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {years.map(({ y, phase, r }) => {
                      const st = r ? STATUS[r.status] || STATUS.DRAFT : null;
                      const has = r && (filledKeys(r) > 0 || r.achievementSummary);
                      return (
                        <div key={y} title={r ? `${y} · ${phase} · ${st.label}${has ? "" : " · belum ada isian"}` : `${y} · ${phase} · belum ada laporan`}
                          className={`rounded-lg border px-1.5 py-1.5 text-center ${r ? st.cls : "border-dashed border-slate-700 text-slate-600"}`}>
                          <div className="text-xs font-bold">{y}</div>
                          <div className="text-[9px] uppercase tracking-wider opacity-80">{phase}</div>
                          <div className="text-[9px] mt-0.5">{r ? (has ? st.label : "Kosong") : "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-slate-400">{filled}/4 tahun terisi{c.records[2027] ? "" : " · outlook 2027 belum ada"}</div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  {c.dept ? (
                    <a href={liveHref(c)} className="flex-1 text-center py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition">▶ Presentasikan</a>
                  ) : (
                    <span className="flex-1 text-center py-2 bg-slate-800 text-slate-500 text-xs rounded-xl cursor-not-allowed">Deck belum tersedia</span>
                  )}
                  <button onClick={() => setDetail({ plantName: c.plantName, deptName: c.deptName, records: c.records })} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl">Rincian</button>
                  {latest && <a href={`/report?id=${latest.id}`} className="px-3 py-2 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-xl">✏️</a>}
                </div>
              </div>
            );
          })}
          {cards.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-sm">Belum ada laporan untuk cabang atau divisi ini.</div>
          )}
        </div>
      )}

      {/* MODAL RINCIAN PER TAHUN */}
      {detail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-cyan-400">Rincian laporan per tahun</h3>
                <p className="text-[11px] text-slate-400">{detail.plantName} · {detail.deptName}</p>
              </div>
              <button onClick={() => setDetail(null)} className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {YEAR_LIST.map((y) => {
                const r = detail.records[y]; const st = r ? STATUS[r.status] || STATUS.DRAFT : null;
                const perf = r ? asObj(r.metricsJson).salesPerformances : null;
                return (
                  <div key={y} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-white">{y} <span className="text-slate-500 font-normal">· {phaseOf(y)?.phase}</span></div>
                      {r ? <span className={`px-2 py-0.5 rounded-full border text-[10px] ${st.cls}`}>{st.label}</span> : <span className="text-slate-600">belum ada laporan</span>}
                    </div>
                    {r && (
                      <>
                        <div className="text-slate-400">{filledKeys(r)} isian terisi{Array.isArray(perf) && perf.length ? ` · ${perf.length} baris target–aktual` : ""}</div>
                        {r.achievementSummary && <div className="text-slate-300 line-clamp-2">{r.achievementSummary}</div>}
                        <div className="flex gap-2 pt-1">
                          <a href={`/report?id=${r.id}`} className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 rounded-lg text-slate-200 font-semibold">Edit</a>
                          <button onClick={() => deleteReport(r)} disabled={isFrozen(r)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg font-semibold border border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed">Hapus</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL Q&A */}
      {isQaOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">💬 Kirim Pertanyaan Live Q&A</h3>
              <button onClick={() => setIsQaOpen(false)} className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSendQuestion} className="space-y-4">
              <textarea rows={4} value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Ketik pertanyaan untuk direksi..." required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 resize-none" />
              {qaStatus && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 text-center">{qaStatus}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsQaOpen(false)} className="px-4 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-300">Batal</button>
                <button type="submit" className="px-4 py-2.5 text-xs bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400">Kirim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}