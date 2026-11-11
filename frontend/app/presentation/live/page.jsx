"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Monitor, Calendar } from "lucide-react";

// Import komponen deck modular yang sudah ada di folder
import CommercialProfitDeck from "../../../components/presentation/CommercialProfitDeck";
import CommercialOmzetDeck from "../../../components/presentation/CommercialOmzetDeck";
import FinancialDeck from "../../../components/presentation/FinancialDeck";
import OperationalHospitalityDeck from "../../../components/presentation/OperationalHospitalityDeck";
import DigitalMarketingDeck from "../../../components/presentation/DigitalMarketingDeck";
import ProductDevelopmentDeck from "../../../components/presentation/ProductDevelopmentDeck";

function LivePresentationContent({ searchParams }) {
  const routerSearchParams = useSearchParams();
  
  // Ambil parameter cluster dan tahun dari URL secara aman
  const clusterParam = searchParams?.cluster || routerSearchParams.get("cluster") || "COMMERCIAL";
  const yearParam = searchParams?.year || routerSearchParams.get("year") || "2026";

  const [user, setUser] = useState(null);
  const [plants, setPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [reports, setReports] = useState([]);
  const [allYearlyReports, setAllYearlyReports] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fallback = JSON.parse(localStorage.getItem("user") || "null");
    if (fallback) {
      setUser(fallback);
      if (fallback.plantId) setSelectedPlantId(fallback.plantId);
    } else {
      window.location.href = "/login";
    }

    fetch("/api/plants")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || data?.plants || [];
        setPlants(list);
      })
      .catch((err) => console.log("Gagal memuat master plant", err));
  }, []);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const activePlantId = selectedPlantId || user?.plantId;

  // Fetch seluruh report data lintas tahun & plant dengan filter klaster yang tangguh
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const paramsObj = {};
    if (user.role === "SUPER_ADMIN") {
      if (selectedPlantId && selectedPlantId !== "ALL" && selectedPlantId !== "semua") {
        paramsObj.plantId = selectedPlantId;
      }
    } else {
      if (activePlantId) {
        paramsObj.plantId = activePlantId;
      }
    }

    const qs = new URLSearchParams(paramsObj);
    fetch(`/api/reports?${qs}`)
      .then((res) => res.json())
      .then((data) => {
        const allReports = Array.isArray(data) ? data : data?.data || data?.reports || [];
        
        // Filter laporan berdasarkan klaster divisi secara fleksibel
        const filtered = allReports.filter((rep) => {
          const deptName = (rep.department?.name || rep.departmentName || "").toLowerCase();
          
          if (clusterParam === "COMMERCIAL") {
            return deptName.includes("sales") || deptName.includes("marketing") || deptName.includes("commercial") || deptName.includes("product") || deptName.includes("komersial");
          }
          if (clusterParam === "FINANCIAL") {
            return deptName.includes("finance") || deptName.includes("accounting") || deptName.includes("tax") || deptName.includes("akuntansi") || deptName.includes("keuangan") || deptName.includes("pajak") || deptName.includes("audit");
          }
          if (clusterParam === "OPERATIONAL_HOSPITALITY" || clusterParam === "OPERATIONAL") {
            return deptName.includes("logistic") || deptName.includes("purchasing") || deptName.includes("hr") || deptName.includes("export") || deptName.includes("admin") || deptName.includes("operational") || deptName.includes("gudang");
          }
          if (clusterParam === "DIGITAL_MARKETING" || clusterParam === "DIGITAL") {
            return deptName.includes("digital") || deptName.includes("marketing") || clusterParam === "DIGITAL_MARKETING";
          }
          if (clusterParam === "PRODUCT_DEVELOPMENT" || clusterParam === "DEVELOPMENT") {
            return deptName.includes("product development") || deptName.includes("development") || clusterParam === "PRODUCT_DEVELOPMENT";
          }
          return true;
        });

        // Fallback pengaman: jika hasil filter kosong, gunakan seluruh data agar slide tidak 0 parameter
        const finalReports = filtered.length > 0 ? filtered : allReports;
        setReports(finalReports);

        // Susun mapping allYearlyReports berdasarkan tahun (2024, 2025, 2026, 2027) untuk matriks komparasi
        const yearlyMap = {};
        [2024, 2025, 2026, 2027].forEach((yr) => {
          yearlyMap[yr] = finalReports.filter((rep) => Number(rep.year) === Number(yr));
        });
        setAllYearlyReports(yearlyMap);

        setLoading(false);
      })
      .catch((err) => {
        console.log("Gagal memuat data laporan", err);
        setLoading(false);
      });
  }, [user, activePlantId, selectedPlantId, clusterParam]);

  if (!user) return <div className="min-h-screen bg-slate-950 p-6 text-slate-400 text-sm flex items-center justify-center">Memuat Live Deck Presentation...</div>;

  const currentPlantObj = plants.find((p) => p.id === activePlantId);
  const currentPlantName = isSuperAdmin && !selectedPlantId ? "Semua Cabang (Global)" : (currentPlantObj?.name || currentPlantObj?.code || "Cabang Utama");

  // Ambil laporan tahun aktif (berdasarkan yearParam) sebagai props utama deck
  const activeReport = reports.find((r) => Number(r.year) === Number(yearParam)) || reports[0] || {
    plant: currentPlantObj,
    department: { name: clusterParam },
    metricsJson: {},
    salesPerformances: []
  };

  // Tentukan deck komponen mana yang akan dirender berdasarkan klaster
  const renderSelectedDeck = () => {
    const deptName = (activeReport?.department?.name || "").toLowerCase();

    if (clusterParam === "DIGITAL_MARKETING" || deptName.includes("digital marketing")) {
      return <DigitalMarketingDeck report={activeReport} allYearlyReports={allYearlyReports} />;
    }
    if (clusterParam === "PRODUCT_DEVELOPMENT" || deptName.includes("product development")) {
      return <ProductDevelopmentDeck report={activeReport} allYearlyReports={allYearlyReports} />;
    }
    if (clusterParam === "COMMERCIAL") {
      const salesType = activeReport?.metricsJson?.salesType || "PROFIT";
      if (salesType === "OMZET") {
        return <CommercialOmzetDeck report={activeReport} allYearlyReports={allYearlyReports} />;
      }
      return <CommercialProfitDeck report={activeReport} allYearlyReports={allYearlyReports} />;
    }
    if (clusterParam === "FINANCIAL") {
      return <FinancialDeck report={activeReport} allYearlyReports={allYearlyReports} />;
    }
    if (clusterParam === "OPERATIONAL_HOSPITALITY" || clusterParam === "OPERATIONAL") {
      return <OperationalHospitalityDeck report={activeReport} allYearlyReports={allYearlyReports} />;
    }
    return <CommercialProfitDeck report={activeReport} allYearlyReports={allYearlyReports} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 max-w-6xl mx-auto text-white flex flex-col justify-between space-y-4 font-sans select-none">
      
      {/* Top Navbar Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/presentation" className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-cyan-400 rounded-xl transition font-medium">
            ← Kembali ke Hub
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            <Monitor size={14} className="animate-pulse text-cyan-400" />
            <span>EXECUTIVE PRESENTATION HUB ({clusterParam})</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <select 
              value={selectedPlantId || ""} 
              onChange={(e) => setSelectedPlantId(e.target.value)} 
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-400 font-mono focus:outline-none cursor-pointer"
            >
              <option value="">Semua Plant (Global)</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name || p.code || p.id}</option>)}
            </select>
          )}

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-300 font-mono">
            <Calendar size={14} className="text-cyan-400" />
            <span>Tahun Aktif: <b className="text-white">{yearParam}</b> (Matrix 2024–2027)</span>
          </div>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400 text-sm shadow-2xl">
            Menyelaraskan data presentasi lintas tahun (2024–2027) divisi {clusterParam} untuk cabang {currentPlantName}...
          </div>
        ) : (
          renderSelectedDeck()
        )}
      </div>

      <div className="text-center text-[11px] text-slate-500 font-mono">
        Multi-Year Comparative Matrix Aktif — Data ditarik dari database untuk seluruh rentang 2024–2027 di lingkup <span className="text-cyan-400 font-bold">{currentPlantName}</span>.
      </div>
    </div>
  );
}

export default function LivePresentationPage({ searchParams }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 p-6 text-slate-400 text-sm flex items-center justify-center">Memuat Presentation Engine...</div>}>
      <LivePresentationContent searchParams={searchParams} />
    </Suspense>
  );
}