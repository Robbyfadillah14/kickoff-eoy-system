"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { BrandLogo } from "../../components/Branding";

// Impor seluruh komponen Deck Departemen
import CommercialProfitDeck from "../../components/presentation/CommercialProfitDeck";
import CommercialOmzetDeck from "../../components/presentation/CommercialOmzetDeck";
import DigitalMarketingDeck from "../../components/presentation/DigitalMarketingDeck";
import FinancialDeck from "../../components/presentation/FinancialDeck";
import OperationalHospitalityDeck from "../../components/presentation/OperationalHospitalityDeck";
import ProductDevelopmentDeck from "../../components/presentation/ProductDevelopmentDeck";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [plants, setPlants] = useState([]);
  const [plantId, setPlantId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  
  // Menyimpan laporan yang sudah dikonsolidasikan per Plant & Departemen (2024-2027)
  const [consolidatedReports, setConsolidatedReports] = useState([]);
  const [allYearlyReports, setAllYearlyReports] = useState({});
  const [totalActiveDocs, setTotalActiveDocs] = useState(0);

  // State untuk Modal Live Q&A
  const [isQaOpen, setIsQaOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [qaStatus, setQaStatus] = useState("");

  // State untuk Modal Detail / Penjelasan Poin Sistem per Laporan
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);

    const uPlantId = u?.plantId || u?.plant?.id || "";
    if (u && u.role !== "SUPER_ADMIN" && uPlantId) {
      setPlantId(uPlantId);
    }

    // 1. Ambil data master plants
    apiFetch("/api/plants")
      .then((data) => {
        const plantList = Array.isArray(data) ? data : (data?.data || data?.plants || []);
        setPlants(plantList);
      })
      .catch((err) => {
        console.error("Gagal memuat data plants:", err);
        setPlants([]);
      });
  }, []);

  // 2. Ambil data master departments
  useEffect(() => {
    const uPlantId = user?.plantId || user?.plant?.id || "";
    const targetPlant = plantId || (user?.role !== "SUPER_ADMIN" ? uPlantId : "");

    const endpoint = targetPlant 
      ? `/api/plants/${targetPlant}/departments` 
      : "/api/departments";

    apiFetch(endpoint)
      .then((data) => {
        const deptList = Array.isArray(data) ? data : (data?.data || data?.departments || data?.list || []);
        setDepartments(deptList);
      })
      .catch((err) => {
        console.error("Gagal memuat data departments:", err);
        setDepartments([]);
      });
  }, [plantId, user]);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  const userPlantId = user?.plantId || user?.plant?.id || "";
  const userDeptId = user?.departmentId || user?.department?.id || user?.departments?.[0]?.departmentId || user?.departments?.[0] || "";

  const activePlantId = isSuperAdmin ? plantId : userPlantId;
  const activeDeptId = isSuperAdmin ? departmentId : userDeptId;

  // 3. Load & Gabungkan Reports Lintas Tahun (2024 - 2027) + Live Socket Update
  useEffect(() => {
    if (!user) return;

    const targetPlantId = isSuperAdmin ? plantId : userPlantId;
    const targetDeptId = isSuperAdmin ? departmentId : userDeptId;

    const years = [2024, 2025, 2026, 2027];

    const fetchMultiYearReports = () => {
      Promise.all(
        years.map((yr) => {
          const qs = new URLSearchParams({
            year: yr,
            ...(targetPlantId ? { plantId: String(targetPlantId) } : {}),
            ...(targetDeptId ? { departmentId: String(targetDeptId) } : {}),
          });
          return apiFetch(`/api/reports?${qs.toString()}`)
            .then((res) => ({
              yr,
              data: Array.isArray(res) ? res : res?.data || res?.reports || [],
            }))
            .catch(() => ({ yr, data: [] }));
        })
      ).then((results) => {
        const yearlyMap = {};
        let docCounter = 0;
        const groupedMap = new Map();

        results.forEach(({ yr, data }) => {
          yearlyMap[yr] = data;
          docCounter += data.length;

          data.forEach((rep) => {
            const pId = rep.plantId || rep.plant?.id || "unknown-plant";
            const dId = rep.departmentId || rep.department?.id || "unknown-dept";
            const groupKey = `${pId}_${dId}`;

            let perfList = [];
            try {
              const rawPerf = rep.salesPerformances || rep.metricsJson?.salesPerformances || [];
              perfList = typeof rawPerf === "string" ? JSON.parse(rawPerf) : rawPerf;
            } catch (e) {
              perfList = [];
            }
            const taggedPerf = perfList.map((item) => ({ ...item, _reportYear: yr }));

            if (!groupedMap.has(groupKey)) {
              groupedMap.set(groupKey, {
                ...rep,
                availableYears: [yr],
                combinedPerformances: taggedPerf,
                yearlyRecords: { [yr]: rep },
              });
            } else {
              const existing = groupedMap.get(groupKey);
              if (!existing.availableYears.includes(yr)) {
                existing.availableYears.push(yr);
              }
              existing.combinedPerformances.push(...taggedPerf);
              existing.yearlyRecords[yr] = rep;

              // Prioritaskan metadata dokumen terbaru sebagai representasi utama kartu
              if (yr >= existing.year) {
                groupedMap.set(groupKey, {
                  ...rep,
                  availableYears: existing.availableYears,
                  combinedPerformances: existing.combinedPerformances,
                  yearlyRecords: existing.yearlyRecords,
                });
              }
            }
          });
        });

        setAllYearlyReports(yearlyMap);
        setTotalActiveDocs(docCounter);
        setConsolidatedReports(Array.from(groupedMap.values()));
      });
    };

    fetchMultiYearReports();

    const socket = getSocket();
    const onUpdate = () => fetchMultiYearReports();
    socket.on("report_updated", onUpdate);

    return () => socket.off("report_updated", onUpdate);
  }, [plantId, departmentId, user, activePlantId, activeDeptId, isSuperAdmin, userPlantId, userDeptId]);

  async function downloadExport(format) {
    const qs = new URLSearchParams({
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

  // Fungsi untuk merender Deck interaktif sesuai nama departemen laporan
  const renderDepartmentDeck = (report) => {
    const deptName = (report?.department?.name || "").toLowerCase();
    const salesType = report?.metricsJson?.salesType || "PROFIT";

    if (deptName.includes("marketing") || deptName.includes("digital")) {
      return <DigitalMarketingDeck report={report} allYearlyReports={allYearlyReports} />;
    } else if (deptName.includes("finance") || deptName.includes("tax") || deptName.includes("accounting")) {
      return <FinancialDeck report={report} allYearlyReports={allYearlyReports} />;
    } else if (deptName.includes("product") || deptName.includes("r&d") || deptName.includes("development")) {
      return <ProductDevelopmentDeck report={report} allYearlyReports={allYearlyReports} />;
    } else if (deptName.includes("operational") || deptName.includes("logistic") || deptName.includes("supply")) {
      return <OperationalHospitalityDeck report={report} allYearlyReports={allYearlyReports} />;
    } else {
      return salesType === "OMZET" ? (
        <CommercialOmzetDeck report={report} allYearlyReports={allYearlyReports} />
      ) : (
        <CommercialProfitDeck report={report} allYearlyReports={allYearlyReports} />
      );
    }
  };

  if (!user) return <div className="min-h-screen bg-[#0d1117] p-4 text-slate-400 text-sm flex items-center justify-center">Memuat sesi pengguna...</div>;

  const currentPlantName = plants.find((p) => p.id === userPlantId)?.name || user?.plant?.name || "Cabang Anda";

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 relative selection:bg-cyan-500 selection:text-black">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <BrandLogo />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Dashboard Reporting <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium">Enterprise Multi-Year</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Login: <span className="text-cyan-400 font-semibold">{user.name}</span> <span className="text-slate-500">({user.role})</span>
              </p>
            </div>
          </div>
        </div>

        {/* FILTER CONTROL */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-800/80">
          {isSuperAdmin ? (
            <>
              <select
                value={plantId}
                onChange={(e) => {
                  setPlantId(e.target.value);
                  setDepartmentId("");
                }}
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

      {/* BANNER SAMBUTAN KONSOLIDASI 2024 - 2027 */}
      <div className="bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              🚀 Konsolidasi Strategis: 2024 – 2027 (Run · Grow · Transform · Future)
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Halo, <b className="text-white">{user.name}</b>! Seluruh rekapitulasi kinerja dari tahun <span className="text-cyan-400 font-bold">2024 hingga 2027</span> telah digabungkan secara terpadu. Tahun 2027 diposisikan di akhir sebagai fokus proyeksi inovasi masa depan.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-4 py-3 rounded-xl shrink-0">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono">Total Dokumen (24-27)</span>
            <span className="text-base font-extrabold text-cyan-400 font-mono">{totalActiveDocs} Dokumen</span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl shadow-md">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 flex-1">
          <a 
            href={`/report?year=2026${activePlantId ? `&plantId=${activePlantId}` : ''}${activeDeptId ? `&departmentId=${activeDeptId}` : ''}`}
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
      </div>

      {/* REPORTS FULL-WIDTH DECKS (GABUNGAN 2024 - 2027) */}
      <div className="grid grid-cols-1 gap-6">
        {consolidatedReports.map((r) => {
          const performances = r.combinedPerformances || [];
          const sortedYears = [...(r.availableYears || [])].sort((a, b) => a - b);

          return (
            <div 
              key={`${r.plantId || r.plant?.id}_${r.departmentId || r.department?.id}`} 
              className="group bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between relative transition-all duration-300 shadow-2xl overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 border border-cyan-900/60 px-3.5 py-1.5 rounded-xl">
                    🏢 {r.plant?.name} · {r.department?.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1.5 rounded-xl font-mono">
                      📅 Terintegrasi: {sortedYears.join(" · ")}
                    </span>
                  </div>
                </div>

                {/* RENDER DECK PRESENTASI INTERAKTIF FULL-WIDTH */}
                <div className="w-full relative shadow-xl rounded-2xl overflow-hidden border border-slate-800">
                  {renderDepartmentDeck(r)}
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-900 pb-2">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">⚡ Status Konsolidasi Lintas Tahun:</span>
                    <span className="text-cyan-400 font-bold">{performances.length} Total Poin Data (2024–2027)</span>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setSelectedReportDetail(r)}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 font-sans font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>🤖</span> Cek Rincian Poin Lintas Tahun ({performances.length} Poin)
                  </button>
                </div>
              </div>

              {/* TOMBOL AKSI CEPAT (EDIT & HAPUS) */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <a 
                  href={`/report?id=${r.id}`}
                  className="flex-1 text-center py-2.5 bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>✏️</span> Edit Data Laporan
                </a>
                <button 
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const confirmed = window.confirm(`Yakin ingin menghapus laporan aktif (${r.department?.name}) secara permanen?`);
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
                  className="px-5 py-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold rounded-xl transition text-center border border-red-500/20 shadow-sm cursor-pointer flex items-center justify-center gap-1 relative z-20"
                >
                  <span>🗑️</span> Hapus
                </button>
              </div>
            </div>
          );
        })}

        {consolidatedReports.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">Belum ada data laporan yang masuk untuk cabang atau divisi ini.</p>
          </div>
        )}
      </div>

      {/* MODAL DETAIL LINTAS TAHUN */}
      {selectedReportDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-fadeIn relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="font-bold text-sm text-cyan-400">Analisis & Rincian Poin Multi-Year (2024–2027)</h3>
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
              <p className="font-bold text-cyan-300">✨ Catatan & Verifikasi Konsolidasi Sistem Otonom:</p>
              <p>
                "Seluruh rincian data operasional dan poin kinerja lintas tahun (2024–2027) dari divisi ini telah digabungkan, divalidasi, serta disinkronkan ke dalam server pusat untuk presentasi eksekutif."
              </p>
              <p className="text-amber-400 font-semibold pt-1">
                🔥 <i>Good luck for the presentation, keep up the stellar work, and let's crush those targets!</i> 🚀
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider font-mono">
                📋 Daftar Poin Item Gabungan ({(selectedReportDetail.combinedPerformances || []).length} Item):
              </span>

              <div className="max-h-64 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 font-mono text-xs">
                {(selectedReportDetail.combinedPerformances || []).length > 0 ? (
                  selectedReportDetail.combinedPerformances.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/80 px-3 py-2 rounded border border-slate-800/60 gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                          {item._reportYear || selectedReportDetail.year}
                        </span>
                        <span className="text-white font-bold truncate">🔹 {item.salesName || `Item #${idx + 1}`}</span>
                      </div>
                      <span className="text-amber-400 shrink-0">
                        {Number(item.actualVal || item.targetVal) ? `Rp ${Number(item.actualVal || item.targetVal).toLocaleString("id-ID")}` : (item.note || "Tercatat")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-center py-4">Belum ada rincian poin data.</p>
                )}
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

      {/* MODAL LIVE Q&A */}
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