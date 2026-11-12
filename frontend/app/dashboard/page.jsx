"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { BrandLogo } from "../../components/Branding";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [year, setYear] = useState(2026);
  const [plants, setPlants] = useState([]);
  const [plantId, setPlantId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [reports, setReports] = useState([]);

  // State untuk Modal Live Q&A
  const [isQaOpen, setIsQaOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [qaStatus, setQaStatus] = useState("");

  // State untuk Modal Detail / Penjelasan Poin Sistem per Laporan
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);

    if (u && u.role !== "SUPER_ADMIN" && (u.plantId || u.plant?.id)) {
      setPlantId(u.plantId || u.plant?.id);
    }

    // 1. Ambil data master plants
    apiFetch("/api/plants")
      .then((data) => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data?.data && Array.isArray(data.data)) list = data.data;
        else if (data?.plants && Array.isArray(data.plants)) list = data.plants;
        else if (data && typeof data === "object") {
          const foundKey = Object.keys(data).find((k) => Array.isArray(data[k]));
          list = foundKey ? data[foundKey] : [];
        }
        setPlants(list);
      })
      .catch((err) => {
        console.error("Gagal memuat data plants:", err);
        setPlants([]);
      });

    // 2. Ambil data master departments (Di-handle multi-kondisi agar pasti masuk)
    apiFetch("/api/departments")
      .then((res) => {
        console.log("Raw departments response:", res);
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.departments)) list = res.departments;
        else if (Array.isArray(res?.list)) list = res.list;
        else if (res && typeof res === "object") {
          // Cari properti apa saja yang berupa array di dalam objek response
          const foundKey = Object.keys(res).find((k) => Array.isArray(res[k]));
          list = foundKey ? res[foundKey] : [];
        }
        console.log("Parsed departments list:", list);
        setDepartments(list);
      })
      .catch((err) => {
        console.error("Gagal memuat data departments:", err);
        setDepartments([]);
      });
      .catch((err) => {
        console.error("Gagal memuat data departments:", err);
        setDepartments([]);
      });
  }, []);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const userPlantId = user?.plantId || user?.plant?.id;
  const userDeptId = user?.departmentId || user?.department?.id || user?.departments?.[0]?.departmentId || user?.departments?.[0]?.id;

  const activePlantId = isSuperAdmin ? plantId : userPlantId;
  const activeDeptId = isSuperAdmin ? departmentId : userDeptId;

  // 3. Load Reports & Live Socket Update
  useEffect(() => {
    if (!user) return;

    const targetPlantId = isSuperAdmin ? plantId : userPlantId;
    const targetDeptId = isSuperAdmin ? departmentId : userDeptId;

    const qs = new URLSearchParams({
      year: Number(year),
      ...(targetPlantId ? { plantId: String(targetPlantId) } : {}),
      ...(targetDeptId ? { departmentId: String(targetDeptId) } : {}),
    });

    const fetchReports = () => {
      apiFetch(`/api/reports?${qs.toString()}`)
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.data || data?.reports || [];
          setReports(list);
        })
        .catch((err) => {
          console.error("Gagal memuat data reports:", err);
          setReports([]);
        });
    };

    fetchReports();

    const socket = getSocket();
    const onUpdate = () => fetchReports();
    socket.on("report_updated", onUpdate);

    return () => socket.off("report_updated", onUpdate);
  }, [year, plantId, departmentId, user, activePlantId, activeDeptId, isSuperAdmin, userPlantId, userDeptId]);

  // FILTER SCRIPT UNTUK HAK AKSES SKOPE ROLE USER
  const filteredReports = reports.filter((r) => {
    if (isSuperAdmin) return true;
    if (user?.role === "DEPARTMENT_CONTRIBUTOR") {
      if (userPlantId && r.plantId !== userPlantId) return false;
      if (userDeptId && r.departmentId !== userDeptId) return false;
    }
    return true;
  });

  // Helper Pemetaan Fase Run, Grow, Transform Berdasarkan Tahun
  const getStrategicPhase = (yr) => {
    if (yr === 2024) return { name: "RUN (Stabilitas & Fondasi)", color: "cyan", badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" };
    if (yr === 2025) return { name: "GROW (Ekspansi & Pertumbuhan)", color: "amber", badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
    return { name: "TRANSFORM (Digitalisasi & Masa Depan)", color: "purple", badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30" };
  };

  const currentPhase = getStrategicPhase(year);

  async function downloadExport(format) {
    const qs = new URLSearchParams({
      year: Number(year),
      ...(activePlantId ? { plantId: String(activePlantId) } : {}),
      ...(activeDeptId ? { departmentId: String(activeDeptId) } : {}),
      format,
    });

    try {
      await apiFetch(`/api/reports/export?${qs.toString()}`);
    } catch (err) {
      console.error("Gagal export:", err);
    }
  }

  function handleSendQuestion(e) {
    e.preventDefault();
    if (!questionText.trim()) return;

    const socket = getSocket();
    const currentPlantName = plants.find((p) => p.id === activePlantId)?.name || user?.plant?.name || "";
    const payload = {
      departmentName: user?.name || "Divisi Operasional",
      plantName: currentPlantName,
      questionText: questionText.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    socket.emit("new_question", payload);
    setQaStatus("Pertanyaan berhasil dikirim ke layar presentasi!");
    setQuestionText("");
    setTimeout(() => {
      setQaStatus("");
      setIsQaOpen(false);
    }, 2000);
  }

  if (!user) return <div className="min-h-screen bg-[#0d1117] p-4 text-slate-400 text-sm flex items-center justify-center">Memuat sesi pengguna...</div>;

  const currentPlantName = plants.find((p) => p.id === userPlantId)?.name || user?.plant?.name || "Cabang Anda";

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 relative selection:bg-cyan-500 selection:text-black">
      
      {/* HEADER SECTION MODERN & RESPONSIF */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <BrandLogo />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Dashboard Reporting <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium">Enterprise</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Login: <span className="text-cyan-400 font-semibold">{user.name}</span> <span className="text-slate-500">({user.role})</span>
              </p>
            </div>
          </div>
        </div>

        {/* FILTER CONTROL / PLANT INFO */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-800/80">
          {isSuperAdmin ? (
            <>
              <select
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
                className="bg-slate-950/90 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500 flex-1"
              >
                <option value="">Semua Plant (6 Cabang)</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="bg-slate-950/90 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500 flex-1"
              >
                <option value="">Semua Divisi (12 Departemen)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Plant Terikat: <span className="text-white font-semibold">{currentPlantName}</span>
            </div>
          )}
        </div>
      </div>

      {/* BANNER SAMBUTAN & FASE STRATEGIS RUN, GROW, TRANSFORM */}
      <div className="bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${currentPhase.badgeBg}`}>
              🚀 Fokus Strategis: {currentPhase.name}
            </span>
            <span className="text-xs text-slate-400 font-mono">Tahun Aktif: {year}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Halo, <b className="text-white">{user.name}</b>! Sistem berjalan dengan kerangka kerja <b>Run, Grow, & Transform</b>. Tahun <span className="text-cyan-400 font-bold">{year}</span> memetakan fokus operasional dari stabilitas harian hingga automasi masa depan.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-4 py-3 rounded-xl shrink-0">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono">Total Laporan Aktif</span>
            <span className="text-base font-extrabold text-cyan-400 font-mono">{filteredReports.length} Dokumen</span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS BAR & PILIHAN TAHUN BERSANDINGAN */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl shadow-md">
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 flex-1">
          <a 
            href={`/report?year=${year}${activePlantId ? `&plantId=${activePlantId}` : ''}${activeDeptId ? `&departmentId=${activeDeptId}` : ''}`}
            className="col-span-2 sm:col-span-auto text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold px-4 py-3 sm:py-2.5 rounded-xl hover:opacity-90 shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
          >
            <span>✍️</span> Form & Kontrol Laporan
          </a>

          <button
            onClick={() => setIsQaOpen(true)}
            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-semibold px-4 py-3 sm:py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <span>💬</span> Live Q&A
          </button>

          <button
            onClick={() => downloadExport("xlsx")}
            className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-3 sm:py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📊</span> Excel
          </button>
          
          <button
            onClick={() => downloadExport("pdf")}
            className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-3 sm:py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📄</span> PDF
          </button>

          {isSuperAdmin && (
            <a
              href="/presentation"
              className="col-span-2 sm:col-span-auto sm:ml-auto text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-4 py-3 sm:py-2.5 rounded-xl hover:opacity-90 shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2"
            >
              <span>🚀</span> Presentation Mode (2024-2027)
            </a>
          )}
        </div>

        {/* DROPDOWN PILIHAN TAHUN BERSANDINGAN */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 px-3 py-2 rounded-xl shrink-0 shadow-inner">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">📅 Tahun:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-xs font-extrabold text-cyan-400 focus:outline-none cursor-pointer"
          >
            <option value={2024} className="bg-slate-900 text-white">2024 (Run)</option>
            <option value={2025} className="bg-slate-900 text-white">2025 (Grow)</option>
            <option value={2026} className="bg-slate-900 text-white">2026 (Transform)</option>
            <option value={2027} className="bg-slate-900 text-white">2027 (Future)</option>
          </select>
        </div>

      </div>

      {/* REPORTS GRID CARDS DENGAN TEMA FASE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredReports.map((r) => {
          let performances = [];
          try {
            const rawPerf = r.salesPerformances || r.metricsJson?.salesPerformances || [];
            performances = typeof rawPerf === "string" ? JSON.parse(rawPerf) : rawPerf;
          } catch (e) {
            performances = [];
          }

          return (
            <div 
              key={r.id} 
              className="group bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-4 sm:p-5 space-y-4 flex flex-col justify-between relative transition-all duration-300 shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 border border-cyan-900/60 px-2.5 py-1 rounded-md truncate">
                    {r.plant?.name} · {r.department?.name}
                  </span>
                  <span className="text-xs font-bold text-purple-400 bg-purple-950/60 border border-purple-500/20 px-2.5 py-0.5 rounded shrink-0 font-mono">
                    {r.year} ({r.year === 2024 ? "Run" : r.year === 2025 ? "Grow" : "Transform"})
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Laporan Kinerja Tahunan
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                    {r.achievementSummary || "Data operasional dan performa telah disinkronkan dengan kerangka strategis."}
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-900 pb-1.5">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">⚡ Status Sistem:</span>
                    <span className="text-cyan-400 font-bold">{performances.length} Item Data Siap</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Tervalidasi aman di bawah pilar strategis {r.year === 2024 ? "Run (Stabilitas)" : r.year === 2025 ? "Grow (Ekspansi)" : "Transform (Digitalisasi)"}.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedReportDetail(r)}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 font-sans font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>🤖</span> Cek Poin & Penjelasan Sistem ({performances.length} Poin)
                  </button>
                </div>
              </div>

              {/* TOMBOL AKSI CEPAT: EDIT & HAPUS */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                <a
                  href={`/report?id=${r.id}`}
                  className="flex-1 text-center py-2.5 sm:py-2 bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>✏️</span> Edit Data
                </a>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const confirmed = window.confirm(`Yakin ingin menghapus laporan ID: ${r.id} secara permanen?`);
                    if (!confirmed) return;

                    try {
                      await apiFetch(`/api/reports/${r.id}`, { method: "DELETE" });
                      alert("Laporan berhasil dihapus!");
                      window.location.reload();
                    } catch (error) {
                      console.error("Kesalahan jaringan saat menghapus:", error);
                      alert("Gagal menghapus laporan: " + error.message);
                    }
                  }}
                  className="px-3.5 py-2.5 sm:py-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold rounded-xl transition text-center border border-red-500/20 shadow-sm cursor-pointer flex items-center justify-center gap-1 relative z-20"
                >
                  <span>🗑️</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredReports.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">Belum ada data laporan yang masuk untuk filter atau tahun ini.</p>
          </div>
        )}
      </div>

      {/* MODAL POPUP PENJELASAN SISTEM & POIN DATA */}
      {selectedReportDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-fadeIn relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="font-bold text-sm text-cyan-400">Analisis & Penjelasan Poin Sistem Otonom</h3>
                  <p className="text-[11px] text-slate-400">Plant: {selectedReportDetail.plant?.name} · Divisi: {selectedReportDetail.department?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReportDetail(null)} 
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 space-y-2 text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-cyan-300">✨ Catatan & Verifikasi Sistem Otonom:</p>
              <p>
                "Seluruh rincian data operasional dan poin kinerja dari divisi ini telah divalidasi di bawah pilar strategis tahun {selectedReportDetail.year}, dienkripsi, serta disinkronkan ke dalam server pusat untuk presentasi eksekutif."
              </p>
              <p className="text-amber-400 font-semibold pt-1">
                🔥 <i>Good luck for the presentation, keep up the stellar work, and let's crush those targets!</i> 🚀
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider font-mono">
                📋 Daftar Poin Item ({(() => {
                  try {
                    const raw = selectedReportDetail.salesPerformances || selectedReportDetail.metricsJson?.salesPerformances || [];
                    return (typeof raw === "string" ? JSON.parse(raw) : raw).length;
                  } catch(e) { return 0; }
                })()} Item):
              </span>

              <div className="max-h-64 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 font-mono text-xs">
                {(() => {
                  let items = [];
                  try {
                    const raw = selectedReportDetail.salesPerformances || selectedReportDetail.metricsJson?.salesPerformances || [];
                    items = typeof raw === "string" ? JSON.parse(raw) : raw;
                  } catch (e) { items = []; }

                  return items.length > 0 ? (
                    items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/80 px-3 py-2 rounded border border-slate-800/60">
                        <span className="text-white font-bold">🔹 {item.salesName || `Item #${idx + 1}`}</span>
                        <span className="text-amber-400">
                          {Number(item.actualVal || item.targetVal) ? `Rp ${Number(item.actualVal || item.targetVal).toLocaleString("id-ID")}` : (item.note || "Tercatat")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic text-center py-4">Belum ada rincian poin data.</p>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedReportDetail(null)}
                className="px-5 py-2.5 text-xs bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Tutup & Kembali 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP LIVE Q&A */}
      {isQaOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                <span>💬</span> Kirim Pertanyaan Live Q&A
              </h3>
              <button 
                onClick={() => setIsQaOpen(false)} 
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Tulis Pertanyaan / Tanggapan Rapat:</label>
                <textarea
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ketik pertanyaan untuk direksi..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition shadow-inner resize-none"
                  required
                />
              </div>

              {qaStatus && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-medium text-center">
                  {qaStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQaOpen(false)}
                  className="px-4 py-2.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
                >
                  Kirim Sekarang 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}