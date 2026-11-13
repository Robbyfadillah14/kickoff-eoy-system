"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud, FileSpreadsheet, Trash2 } from "lucide-react";

// Import 14 Komponen Form Departemen yang Terpisah + Direktur Operasional
import SalesForm from "./SalesForm";
import FinanceAPForm from "./FinanceAPForm";
import FinanceARForm from "./FinanceARForm";
import FinanceDepartmentForm from "./FinanceDepartmentForm";
import AccountingTaxForm from "./AccountingTaxForm";
import PurchasingForm from "./PurchasingForm";
import EximForm from "./EximForm";
import LogisticWarehouseForm from "./LogisticWarehouseForm";
import AdminLogisticForm from "./AdminLogisticForm";
import AdminTfForm from "./AdminTfForm";
import HrMrForm from "./HrMrForm";
import DigitalMarketingForm from "./DigitalMarketingForm";
import ProductDevelopmentForm from "./ProductDevelopmentForm";
import OperationalDirectorForm from "./OperationalDirectorForm";

export default function ReportFormPage() {
  const [user, setUser] = useState(null);
  
  // Tangkap tahun dari URL jika ada, fallback ke 2026
  const [year, setYear] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const y = params.get("year");
      return y ? Number(y) : 2026;
    }
    return 2026;
  });

  const [reportId, setReportId] = useState(null);
  const [status, setStatus] = useState("DRAFT");
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState("");
  
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  
  // State untuk menyimpan daftar file attachment yang pernah di-upload
  const [attachments, setAttachments] = useState([]);

  const [form, setForm] = useState({
    salesType: "OMZET",
    achievementSummary: "", 
    branchInnovations: "",
    challenges: [{ title: "" }], 
    opportunities: [{ title: "" }],
    kpiList: [], 
    salesPerformances: [{ 
      id: 1, 
      salesName: "", 
      targetVal: "", 
      actualVal: "", 
      targetProfit: "", 
      note: "",
      topProducts: [{ id: 1, productName: "", totalQty: "", category: "" }] 
    }],
    salesSupportPerformances: [{ id: 1, supportName: "", taskDesc: "", statusOrAchieve: "", note: "" }],
    weeklyRevenue: ["", "", "", "", "", ""], 
    targetAchievedPct: "",
  });

  // LOAD UTAMA: AMBIL MASTER DEPARTEMEN DAN FETCH LAPORAN BERDASARKAN PARAMETER URL ATAU ID
  useEffect(() => {
    const fallback = JSON.parse(localStorage.getItem("user") || "null");
    if (fallback) {
      setUser(fallback);
    } else {
      window.location.href = "/login";
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("id");
    const urlYear = params.get("year");
    const urlPlantId = params.get("plantId");
    const urlDeptId = params.get("departmentId");

    if (urlYear) setYear(Number(urlYear));

    fetch("/api/departments")
      .then(async (res) => res.json())
      .then(async (data) => {
        const list = Array.isArray(data) ? data : data?.data || data?.departments || [];
        setDepartments(list);

        let targetDeptId = urlDeptId;
        if (!targetDeptId && list.length > 0) {
          if (fallback?.role !== "SUPER_ADMIN") {
            // Mapping akurat berdasarkan ID atau kecocokan Nama Departemen user yang login
            const userDeptName = (fallback?.departmentName || fallback?.department?.name || fallback?.department || "").toLowerCase();
            const matchedDept = list.find(d => 
              String(d.id) === String(fallback?.departmentId || fallback?.department?.id) ||
              (userDeptName && d.name?.toLowerCase().includes(userDeptName))
            );
            targetDeptId = matchedDept ? matchedDept.id : (fallback?.departmentId || fallback?.department?.id || list[0].id);
          } else {
            targetDeptId = list[0].id;
          }
        }
        setSelectedDeptId(targetDeptId);

        let targetPlantId = urlPlantId || fallback?.plantId || fallback?.plant?.id;

        if (editId || (urlYear && targetPlantId && targetDeptId)) {
          try {
            let fetchUrl = editId ? `/api/reports/${editId}` : `/api/reports?year=${urlYear}&plantId=${targetPlantId}&departmentId=${targetDeptId}`;
            const resRep = await fetch(fetchUrl);
            const targetRepData = await resRep.json();
            
            if (targetRepData) {
              const targetRep = Array.isArray(targetRepData) ? targetRepData[0] : (targetRepData.data || targetRepData);
              
              if (targetRep) {
                if (targetRep.year) setYear(Number(targetRep.year));
                setReportId(targetRep.id);
                setSelectedDeptId(targetRep.departmentId);
                setStatus(targetRep.status);
                setLocked((targetRep.status === "LOCKED" || targetRep.status === "APPROVED") && fallback?.role !== "SUPER_ADMIN");
                
                // Set attachment history jika ada dari database
                if (targetRep.attachments && Array.isArray(targetRep.attachments)) {
                  setAttachments(targetRep.attachments);
                }

                const mJson = targetRep.metricsJson || {};
                let loadedKpis = mJson.kpiList || [];

                setForm((f) => ({
                  ...f,
                  ...mJson, 
                  salesType: targetRep.salesType || mJson.salesType || "OMZET",
                  achievementSummary: targetRep.achievementSummary || "",
                  branchInnovations: mJson.branchInnovations || targetRep.branchInnovations || "",
                  challenges: targetRep.challenges?.length ? targetRep.challenges : (mJson.challenges || f.challenges),
                  opportunities: targetRep.opportunities?.length ? targetRep.opportunities : (mJson.opportunities || f.opportunities),
                  kpiList: loadedKpis.length ? loadedKpis : f.kpiList,
                  salesPerformances: targetRep.salesPerformances?.length ? targetRep.salesPerformances : (mJson.salesPerformances || f.salesPerformances),
                  salesSupportPerformances: mJson.salesSupportPerformances || f.salesSupportPerformances,
                  weeklyRevenue: mJson.weeklyRevenue || f.weeklyRevenue,
                  targetAchievedPct: mJson.targetAchievedPct || "",
                }));
                return; 
              }
            }
          } catch (err) {
            console.error("Gagal memuat detail laporan:", err);
          }
        }
      })
      .catch((err) => console.error("Gagal memuat master departemen:", err));
  }, []);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  // Deteksi ID Departemen user login dengan fallback komprehensif
  const userDeptId = user?.departmentId || user?.department?.id || user?.departments?.[0]?.departmentId || user?.departments?.[0] || "";
  const activeDeptId = isSuperAdmin ? selectedDeptId : (selectedDeptId || userDeptId);

  // PENCARIAN DEPARTEMEN YANG SANGAT AKURAT
  const currentDept = departments.find(d => 
    String(d.id) === String(activeDeptId) || 
    String(d.departmentId) === String(activeDeptId) ||
    (user?.departmentName && d.name?.toLowerCase().includes(user.departmentName.toLowerCase())) ||
    (user?.department?.name && d.name?.toLowerCase().includes(user.department.name.toLowerCase()))
  ) || departments[0] || { name: user?.departmentName || user?.department?.name || "Divisi Operasional" };
  
  const currentDeptName = (currentDept.name || "").toLowerCase();
  
  const isSalesDept = currentDeptName.includes("sales") || currentDeptName.includes("support") || currentDeptName.includes("operasional");

  // MAPPING KOMPONEN FORM BERDASARKAN NAMA DEPARTEMEN (FLEKSIBEL) + ATTACHMENTS PROPS
  const renderDepartmentSpecificForm = () => {
    if (currentDeptName.includes("operasional") || currentDeptName.includes("operational")) {
      return <SalesForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("operational director") || currentDeptName.includes("direktur operasional")) {
      return <OperationalDirectorForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("sales") || currentDeptName.includes("support")) {
      return <SalesForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("finance ap") || (currentDeptName.includes("finance") && currentDeptName.includes("ap"))) {
      return <FinanceAPForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("finance ar") || (currentDeptName.includes("finance") && currentDeptName.includes("ar"))) {
      return <FinanceARForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("finance department") || currentDeptName.includes("finance")) {
      return <FinanceDepartmentForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("accounting") || currentDeptName.includes("tax")) {
      return <AccountingTaxForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("purchasing")) {
      return <PurchasingForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("export") || currentDeptName.includes("import") || currentDeptName.includes("exim")) {
      return <EximForm form={form} setForm={setForm} attachments={attachments} />;
    } else if ((currentDeptName.includes("logistic") || currentDeptName.includes("logistik")) && currentDeptName.includes("warehouse")) {
      return <LogisticWarehouseForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("admin logistic") || currentDeptName.includes("admin logistik")) {
      return <AdminLogisticForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("admin tf") || currentDeptName.includes("tukar faktur")) {
      return <AdminTfForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("hr") || currentDeptName.includes("mr") || currentDeptName.includes("human resource")) {
      return <HrMrForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("digital marketing") || currentDeptName.includes("marketing")) {
      return <DigitalMarketingForm form={form} setForm={setForm} attachments={attachments} />;
    } else if (currentDeptName.includes("product development") || currentDeptName.includes("development")) {
      return <ProductDevelopmentForm form={form} setForm={setForm} attachments={attachments} />;
    }

    return (
      <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-center text-slate-400 space-y-2">
        <p className="text-cyan-400 font-bold">Form untuk departemen ini belum dikonfigurasi.</p>
        <p className="text-xs text-slate-500">Nama departemen terdeteksi: <code className="text-white bg-slate-950 px-2 py-1 rounded">{currentDept.name || "Tidak diketahui"}</code> (ID: {activeDeptId})</p>
      </div>
    );
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const currentPlantId = user?.plantId || user?.plant?.id;
    // Gunakan ID dari currentDept yang sudah ditemukan secara akurat, fallback ke activeDeptId
    const currentDeptId = currentDept?.id || activeDeptId || user?.departmentId || user?.department?.id;

    if (!user || !currentPlantId || !currentDeptId) {
      setMsg("Data user, plantId, atau departmentId tidak lengkap.");
      return;
    }
    setMsg("");
    
    const foundText = 
      form.executiveSummary ||
      form.achievementSummary ||
      form.branchInnovations ||
      form.logisticEvaluation ||
      form.hrEvaluation ||
      form.financeEvaluation ||
      form.accountingEvaluation ||
      form.purchasingEvaluation ||
      form.eximEvaluation ||
      form.digitalMarketingEvaluation ||
      form.productDevEvaluation ||
      form.apEvaluation ||
      form.arEvaluation ||
      form.adminTfEvaluation ||
      form.taxEvaluation ||
      form.generalNotes ||
      Object.entries(form).find(([k, v]) => typeof v === "string" && v.trim().length > 15 && k !== "salesType")?.[1];

    const autoSummary = foundText || `Laporan operasional dan performa ${currentDept.name || "Divisi"} tahun ${year} telah diperbarui.`;

    const body = {
      id: reportId, 
      year: Number(year), 
      plantId: String(currentPlantId), 
      departmentId: String(currentDeptId),
      salesType: isSalesDept ? form.salesType : "OMZET",
      achievementSummary: autoSummary, 
      
      salesPerformances: form.salesPerformances || [],

      challenges: (form.challenges || []).filter((c) => c.title && c.title.trim()),
      opportunities: (form.opportunities || []).filter((o) => o.title && o.title.trim()),
      metricsJson: { 
        ...form,
        salesType: isSalesDept ? form.salesType : "OMZET",
        kpiList: form.kpiList || [],
        salesPerformances: form.salesPerformances || [],
        salesSupportPerformances: form.salesSupportPerformances || [],
        branchInnovations: form.branchInnovations || "",
        metrics: (form.kpiList || []).map(k => ({ val: k.val, note: k.note, unit: k.unit, period: k.period, pic: k.pic })),
        weeklyRevenue: form.weeklyRevenue || [], 
        targetAchievedPct: form.targetAchievedPct || "", 
      },
    };
    
    try {
      const res = await fetch("/api/reports", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body) 
      });
      
      const resData = await res.json();
      
      if (res.ok) {
        const saved = resData?.data || resData?.report || resData;
        const generatedId = saved?.id || reportId || "saved";
        
        setReportId(generatedId); 
        setStatus(saved?.status || "DRAFT");
        setLocked(false);
        
        if (saved?.attachments && Array.isArray(saved.attachments)) {
          setAttachments(saved.attachments);
        }

        setMsg("Laporan berhasil diperbarui & disimpan. Mengalihkan ke dashboard...");

        setTimeout(() => {
          window.location.href = `/dashboard?year=${year}`;
        }, 1000);
      } else {
        setMsg(resData?.error || resData?.message || "Gagal menyimpan laporan");
      }
    } catch (err) {
      console.error("Error submit:", err);
      setMsg("Gagal menyimpan laporan ke server.");
    }
  }

  if (!user) return <div className="min-h-screen bg-slate-950 p-6 text-slate-400 text-sm">Memuat sesi pengguna...</div>;
  const userPlantName = user?.plant?.name || "Cabang Perusahaan";

  return (
    <div className="min-h-screen bg-slate-950 p-6 max-w-3xl mx-auto text-white">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Form Laporan — {userPlantName}</h1>
            <p className="text-xs text-slate-400 mt-0.5">PIC Akun: <span className="text-white font-medium">{user.name}</span> — Divisi: <span className="text-cyan-400 font-medium">{currentDept.name}</span></p>
          </div>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))} 
            disabled={!!reportId} 
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        {isSuperAdmin ? (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-3 rounded-xl">
            <span className="text-xs text-slate-300 font-medium">Kontrol Divisi:</span>
            <select value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white flex-1 font-mono">
              {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs text-slate-300">
            Divisi Terikat: <b className="text-white">{currentDept.name || "Divisi"}</b> (Terkunci otomatis)
          </div>
        )}
      </div>

      {/* BANNER PANDUAN PENGUNGGAHAN EXCEL MULTI-YEAR OTONOM */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-2 mb-6">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          <span>Panduan Pengunggahan Data Laporan (Multi-Year Otonom)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Silakan unggah file Excel laporan kerja Anda. Jika file Anda sudah mencakup data lengkap dari <b>2024 sampai 2027</b>, Anda cukup mengunggahnya <b>sekali saja</b>. Sistem otonom kami akan secara otomatis memetakan (<i>mapping</i>) dan mendistribusikan poin-poin kinerja ke dalam tahun masing-masing secara akurat.
        </p>
      </div>

      {/* RIWAYAT / DAFTAR FILE EXCEL YANG PERNAH DI-UPLOAD */}
      {attachments.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
              <FileSpreadsheet size={16} /> Riwayat File Excel Terunggah ({attachments.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Tersimpan di Server</span>
          </div>
          <div className="space-y-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-cyan-400 font-mono text-sm">📊</span>
                  <span className="text-slate-200 font-medium truncate">{att.fileName}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(att.createdAt || Date.now()).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <p className="text-xs text-slate-400">Status saat ini: <b className="text-cyan-400 font-mono">{status}</b></p>
        <a href={`/dashboard?year=${year}`} className="text-xs text-cyan-400 hover:underline">← Kembali ke Dashboard</a>
      </div>

      {/* RENDER KOMPONEN DIVISI KHUSUS SECARA DINAMIS */}
      {renderDepartmentSpecificForm()}

      {/* TOMBOL SIMPAN UTAMA UNTUK SEMUA DIVISI */}
      <div className="mt-8 pt-4 border-t border-slate-800">
        <button 
          type="button" 
          onClick={handleSubmit}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl transition duration-200 shadow-lg shadow-cyan-500/20 text-base cursor-pointer"
        >
          Simpan Laporan
        </button>
        {msg && <p className="text-center text-xs text-cyan-400 mt-3 font-medium">{msg}</p>}
      </div>
    </div>
  );
}