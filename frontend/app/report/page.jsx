"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud, FileSpreadsheet, Trash2, Building2, User, Calendar, ShieldCheck, Lock, FileText } from "lucide-react";

// Import 14 Komponen Form Departemen
import SalesForm from "./SalesForm";
import FinanceAPForm from "./FinanceAPForm";
import FinanceARForm from "./FinanceARForm";
import FinanceDepartmentForm from "./FinanceDepartmentForm";
import AccountingTaxForm from "./AccountingTaxForm";
import PurchasingForm from "./PurchasingForm";
import EximForm from "./EximForm";
import LogisticWarehouseForm from "./LogisticWarehouseForm";
import AdminLogisticForm from "./AdminLogisticForm";
import AdminTfForm from "./AdminTfForm"; // <-- Admin Tukar Faktur, noted!
import HrMrForm from "./HrMrForm";
import DigitalMarketingForm from "./DigitalMarketingForm";
import ProductDevelopmentForm from "./ProductDevelopmentForm";
import OperationalDirectorForm from "./OperationalDirectorForm";

export default function ReportFormPage() {
  const [user, setUser] = useState(null);
  const [year, setYear] = useState(2026);
  const [reportId, setReportId] = useState(null);
  const [status, setStatus] = useState("DRAFT");
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState("");
  
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State form default (tetap dipertahankan agar sub-form tidak error)
  const [form, setForm] = useState({
    salesType: "OMZET",
    achievementSummary: "", 
    branchInnovations: "",
    challenges: [{ title: "" }], 
    opportunities: [{ title: "" }],
    kpiList: [], 
    salesPerformances: [{ id: 1, salesName: "", targetVal: "", actualVal: "", targetProfit: "", note: "", topProducts: [{ id: 1, productName: "", totalQty: "", category: "" }] }],
    salesSupportPerformances: [{ id: 1, supportName: "", taskDesc: "", statusOrAchieve: "", note: "" }],
    weeklyRevenue: ["", "", "", "", "", ""], 
    targetAchievedPct: "",
  });

  // 1. INITIALIZATION & DATA FETCHING
  useEffect(() => {
    const fallback = JSON.parse(localStorage.getItem("user") || "null");
    if (!fallback) {
      window.location.href = "/login";
      return;
    }
    setUser(fallback);

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("id");
    const urlYear = params.get("year");
    const urlPlantId = params.get("plantId");
    const urlDeptId = params.get("departmentId");

    if (urlYear) setYear(Number(urlYear));

    Promise.all([
      fetch("/api/departments").then(res => res.json()),
      // Jika ada ID laporan, fetch langsung. Jika tidak, fetch by filter
      (editId || (urlYear && urlPlantId && urlDeptId)) 
        ? fetch(editId ? `/api/reports/${editId}` : `/api/reports?year=${urlYear}&plantId=${urlPlantId}&departmentId=${urlDeptId}`).then(res => res.json())
        : Promise.resolve(null)
    ])
    .then(async ([deptData, repData]) => {
      const list = Array.isArray(deptData) ? deptData : deptData?.data || deptData?.departments || [];
      setDepartments(list);

      // Logic penentuan Departemen
      let targetDeptId = urlDeptId;
      if (!targetDeptId && list.length > 0) {
        if (fallback?.role !== "SUPER_ADMIN") {
          const matchedDept = list.find(d => 
            String(d.id) === String(fallback?.departmentId || fallback?.department?.id)
          );
          targetDeptId = matchedDept ? matchedDept.id : (fallback?.departmentId || list[0].id);
        } else {
          targetDeptId = list[0].id;
        }
      }
      setSelectedDeptId(targetDeptId);

      // Logic penentuan Data Laporan
      if (repData) {
        const targetRep = Array.isArray(repData) ? repData[0] : (repData.data || repData);
        if (targetRep) {
          if (targetRep.year) setYear(Number(targetRep.year));
          setReportId(targetRep.id);
          setSelectedDeptId(targetRep.departmentId);
          setStatus(targetRep.status);
          setLocked((targetRep.status === "LOCKED" || targetRep.status === "APPROVED") && fallback?.role !== "SUPER_ADMIN");
          if (targetRep.attachments) setAttachments(targetRep.attachments);

          const mJson = targetRep.metricsJson || {};
          setForm((f) => ({
            ...f,
            ...mJson, 
            salesType: targetRep.salesType || mJson.salesType || "OMZET",
            achievementSummary: targetRep.achievementSummary || "",
            branchInnovations: mJson.branchInnovations || targetRep.branchInnovations || "",
            challenges: targetRep.challenges?.length ? targetRep.challenges : (mJson.challenges || f.challenges),
            opportunities: targetRep.opportunities?.length ? targetRep.opportunities : (mJson.opportunities || f.opportunities),
            kpiList: mJson.kpiList || f.kpiList,
            salesPerformances: targetRep.salesPerformances?.length ? targetRep.salesPerformances : (mJson.salesPerformances || f.salesPerformances),
            salesSupportPerformances: mJson.salesSupportPerformances || f.salesSupportPerformances,
            weeklyRevenue: mJson.weeklyRevenue || f.weeklyRevenue,
            targetAchievedPct: mJson.targetAchievedPct || "",
          }));
        }
      }
      setIsLoading(false);
    })
    .catch((err) => {
      console.error("Gagal memuat data:", err);
      setIsLoading(false);
    });
  }, []);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const activeDeptId = isSuperAdmin ? selectedDeptId : (user?.departmentId || user?.department?.id);
  
  // Cari departemen berdasarkan ID (lebih aman daripada string matching nama)
  const currentDept = departments.find(d => String(d.id) === String(activeDeptId)) || departments[0] || { name: "Divisi Operasional", id: "default" };
  const currentDeptName = (currentDept.name || "").toLowerCase();

  // 2. DYNAMIC FORM RENDERER
  const renderDepartmentSpecificForm = () => {
    const props = { form, setForm, attachments, setAttachments, locked }; // Tambah setAttachments & locked ke props
    
    if (currentDeptName.includes("operasional") || currentDeptName.includes("sales") || currentDeptName.includes("support")) return <SalesForm {...props} />;
    if (currentDeptName.includes("operational director") || currentDeptName.includes("direktur operasional")) return <OperationalDirectorForm {...props} />;
    if (currentDeptName.includes("finance ap")) return <FinanceAPForm {...props} />;
    if (currentDeptName.includes("finance ar")) return <FinanceARForm {...props} />;
    if (currentDeptName.includes("finance")) return <FinanceDepartmentForm {...props} />;
    if (currentDeptName.includes("accounting") || currentDeptName.includes("tax")) return <AccountingTaxForm {...props} />;
    if (currentDeptName.includes("purchasing")) return <PurchasingForm {...props} />;
    if (currentDeptName.includes("export") || currentDeptName.includes("import") || currentDeptName.includes("exim")) return <EximForm {...props} />;
    if (currentDeptName.includes("logistic") && currentDeptName.includes("warehouse")) return <LogisticWarehouseForm {...props} />;
    if (currentDeptName.includes("admin logistic")) return <AdminLogisticForm {...props} />;
    if (currentDeptName.includes("admin tf") || currentDeptName.includes("tukar faktur")) return <AdminTfForm {...props} />;
    if (currentDeptName.includes("hr") || currentDeptName.includes("mr") || currentDeptName.includes("human resource")) return <HrMrForm {...props} />;
    if (currentDeptName.includes("digital marketing") || currentDeptName.includes("marketing")) return <DigitalMarketingForm {...props} />;
    if (currentDeptName.includes("product development") || currentDeptName.includes("development")) return <ProductDevelopmentForm {...props} />;

    return (
      <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center text-slate-400 space-y-3">
        <FileText className="w-10 h-10 mx-auto text-slate-600" />
        <p className="text-cyan-400 font-bold">Form untuk departemen ini belum dikonfigurasi.</p>
        <p className="text-xs text-slate-500">Terdeteksi: <code className="text-white bg-slate-950 px-2 py-1 rounded">{currentDept.name}</code></p>
      </div>
    );
  };

  // 3. SUBMIT HANDLER
  async function handleSubmit(e) {
    e.preventDefault();
    if (locked) return;
    
    const currentPlantId = user?.plantId || user?.plant?.id;
    const currentDeptId = currentDept?.id || activeDeptId;

    if (!user || !currentPlantId || !currentDeptId) {
      setMsg("Data user, plantId, atau departmentId tidak lengkap.");
      return;
    }
    setMsg("Menyimpan...");
    
    const foundText = form.achievementSummary || form.executiveSummary || form.branchInnovations || form.generalNotes || Object.values(form).find(val => typeof val === "string" && val.trim().length > 10);
    const autoSummary = foundText || `Laporan ${currentDept.name} tahun ${year} telah disinkronkan.`;

    const body = {
      id: reportId, 
      year: Number(year), 
      plantId: String(currentPlantId), 
      departmentId: String(currentDeptId),
      salesType: form.salesType || "OMZET",
      achievementSummary: String(autoSummary), 
      salesPerformances: form.salesPerformances || [],
      challenges: (form.challenges || []).filter((c) => c.title && c.title.trim()),
      opportunities: (form.opportunities || []).filter((o) => o.title && o.title.trim()),
      metricsJson: { ...form }, // Simpan semua state form ke metricsJson agar tidak hilang
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
        setReportId(saved?.id || reportId); 
        setStatus(saved?.status || "DRAFT");
        if (saved?.attachments) setAttachments(saved.attachments);
        setMsg("✅ Laporan berhasil disimpan. Mengalihkan ke dashboard...");
        setTimeout(() => { window.location.href = `/dashboard`; }, 1500);
      } else {
        setMsg(`❌ Gagal: ${resData?.error || resData?.message}`);
      }
    } catch (err) {
      console.error("Error submit:", err);
      setMsg("❌ Gagal menyimpan laporan ke server.");
    }
  }

  if (isLoading || !user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-mono">Memuat sesi & data departemen...</p>
      </div>
    </div>
  );

  // Helper untuk warna status
  const getStatusColor = (s) => {
    if (s === "APPROVED") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (s === "LOCKED") return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ── HEADER CARD ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Form Laporan Tahunan</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><User size={12} /> {user.name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Building2 size={12} /> {user?.plant?.name || "Cabang"}</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-medium">{currentDept.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(status)}`}>
                {status === "LOCKED" ? <Lock size={12} /> : <ShieldCheck size={12} />}
                {status}
              </span>
              <select 
                value={year} 
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  setReportId(null);
                  // Trigger reload data untuk tahun baru (bisa di-refactor ke fungsi terpisah jika perlu)
                  window.location.search = `?year=${e.target.value}&plantId=${user?.plantId}&departmentId=${activeDeptId}`;
                }} 
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono cursor-pointer hover:border-cyan-500 transition flex items-center gap-2"
              >
                <option value={2024}>FY 2024</option>
                <option value={2025}>FY 2025</option>
                <option value={2026}>FY 2026</option>
                <option value={2027}>FY 2027</option>
              </select>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Override Divisi:</span>
              <select value={selectedDeptId} onChange={(e) => { setSelectedDeptId(e.target.value); setReportId(null); }} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white flex-1 font-mono">
                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
          )}
        </div>

        {/* ── UPLOAD & ATTACHMENT SECTION ── */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
            <UploadCloud className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-cyan-400 mb-1">Sinkronisasi Data Multi-Tahun</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unggah file Excel laporan kerja Anda. Jika file mencakup data <b>2024–2027</b>, sistem akan otomatis memetakan (<i>mapping</i>) data ke tahun masing-masing.
              </p>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet size={14} /> File Terlampir ({attachments.length})
              </p>
              <div className="grid gap-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl group hover:border-slate-700 transition">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <FileSpreadsheet size={16} className="text-emerald-400" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-200 truncate">{att.fileName}</p>
                        <p className="text-[10px] text-slate-500">{(att.fileSize / 1024).toFixed(1)} KB • {new Date(att.createdAt || Date.now()).toLocaleDateString("id-ID")}</p>
                      </div>
                    </div>
                    {/* Tombol hapus bisa ditambahkan di sini jika diizinkan */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── DYNAMIC FORM RENDERER ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-xl">
          {renderDepartmentSpecificForm()}
        </div>

        {/* ── ACTION FOOTER ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition flex items-center gap-2">
            ← Kembali ke Dashboard
          </Link>
          
          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            {msg && (
              <p className={`text-xs font-medium ${msg.includes("✅") ? "text-emerald-400" : "text-rose-400"}`}>
                {msg}
              </p>
            )}
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={locked}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer
                ${locked 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20"
                }`}
            >
              {locked ? <><Lock size={16} /> Laporan Terkunci</> : <>Simpan Laporan</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}