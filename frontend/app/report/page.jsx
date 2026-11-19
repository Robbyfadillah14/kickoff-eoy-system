"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { YEARS, resolveDepartment } from "../../lib/presentation";
import {
  asList, blankForm, snapshot, stripMeta, reportToForm, pickReport, buildSummary,
  cleanPerformances, cleanSupport, cleanTitles, formKeyFor, pickUserDept,
} from "../../lib/reportForm";

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

/** nama di sini = field `form` di lib/presentation/departments.js (+ OperationalDirectorForm untuk akun eksekutif) */
const FORMS = {
  SalesForm, FinanceAPForm, FinanceARForm, FinanceDepartmentForm, AccountingTaxForm, PurchasingForm, EximForm,
  LogisticWarehouseForm, AdminLogisticForm, AdminTfForm, HrMrForm, DigitalMarketingForm, ProductDevelopmentForm, OperationalDirectorForm,
};

/** true = laporan berstatus LOCKED/APPROVED tidak bisa disimpan oleh non-superadmin. Dimatikan dulu karena seluruh data saat ini berstatus "Disetujui". */
const ENFORCE_LOCK = false;

const msgIsNotFound = (e) => /not found|tidak ditemukan|404/i.test(e?.message || "");

export default function ReportFormPage() {
  const [user, setUser] = useState(null);
  const [year, setYear] = useState(2026);
  const [plantId, setPlantId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [plants, setPlants] = useState([]);

  const [reportId, setReportId] = useState(null);
  const [status, setStatus] = useState("DRAFT");
  const [attachments, setAttachments] = useState([]);
  const [form, setForm] = useState(blankForm);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "ok" | "err", text }

  const baseline = useRef(snapshot(blankForm())); // isi form saat terakhir dimuat/disimpan -> deteksi perubahan belum tersimpan
  const seq = useRef(0); // hanya respons permintaan TERBARU yang dipakai
  const lockedDept = useRef(""); // non-superadmin: laporan yang dimuat harus milik divisinya

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const resetEmpty = useCallback(() => {
    const f = blankForm();
    setForm(f); baseline.current = snapshot(f);
    setReportId(null); setStatus("DRAFT"); setAttachments([]);
  }, []);

  const applyReport = useCallback((rep) => {
    const f = reportToForm(rep);
    setForm(f); baseline.current = snapshot(f);
    setReportId(rep.id); setStatus(rep.status || "DRAFT");
    setAttachments(Array.isArray(rep.attachments) ? rep.attachments : []);
  }, []);

  /** muat laporan (tahun × plant × divisi) atau satu laporan lewat id */
  const load = useCallback(async ({ id, y, p, d }) => {
    const mine = ++seq.current;
    setLoading(true); setLoadError(""); setNotice(null);
    try {
      const path = id ? `/api/reports/${id}` : `/api/reports?${new URLSearchParams({ year: String(y), plantId: String(p), departmentId: String(d) })}`;
      const raw = await apiFetch(path);
      if (mine !== seq.current) return;
      const rep = pickReport(raw, id ? {} : { year: y, plantId: p, deptId: d });
      if (!rep) { resetEmpty(); return; }

      const repDept = String(rep.departmentId ?? rep.department?.id ?? "");
      if (lockedDept.current && repDept && repDept !== lockedDept.current) {
        resetEmpty();
        setLoadError("Laporan ini bukan milik divisi akun Anda.");
        return;
      }
      applyReport(rep);
      if (id) { // dibuka dari tombol Edit: tahun/plant/divisi ikut laporan
        if (rep.year) setYear(Number(rep.year));
        setPlantId(String(rep.plantId ?? rep.plant?.id ?? ""));
        setSelectedDeptId(repDept);
      }
    } catch (e) {
      if (mine !== seq.current) return;
      if (!id && msgIsNotFound(e)) { resetEmpty(); return; }
      // gagal memuat != laporan kosong: simpan dinonaktifkan agar data lama tidak tertimpa form kosong
      setLoadError(`Gagal memuat laporan: ${e.message || "kesalahan server"}`);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [applyReport, resetEmpty]);

  // ---- muat awal -------------------------------------------------------------------------------------------
  useEffect(() => {
    let u = null;
    try { u = JSON.parse(localStorage.getItem("user") || "null"); } catch {}
    if (!u) { window.location.href = "/login"; return; }
    setUser(u);

    const sp = new URLSearchParams(window.location.search);
    const editId = sp.get("id");
    const urlYear = Number(sp.get("year")) || 2026;
    const isSuper = u.role === "SUPER_ADMIN";

    (async () => {
      try {
        const [dRaw, pRaw] = await Promise.all([
          apiFetch("/api/departments"),
          isSuper ? apiFetch("/api/plants").catch(() => []) : Promise.resolve([]),
        ]);
        const dList = asList(dRaw);
        const pList = asList(pRaw);
        setDepartments(dList); setPlants(pList);

        const ownPlant = u.plantId || u.plant?.id || "";
        let p = isSuper ? sp.get("plantId") || ownPlant : ownPlant; // non-superadmin selalu terkunci ke plant sendiri
        if (isSuper && !p && pList.length) p = (pList.find((x) => x.isHolding) || pList[0]).id;

        let d = "";
        if (isSuper) d = sp.get("departmentId") || (dList[0]?.id ?? "");
        else { const mine = pickUserDept(u, dList); d = mine?.id ?? ""; lockedDept.current = d ? String(d) : ""; } // terkunci ke divisi sendiri, URL diabaikan

        p = p ? String(p) : ""; d = d ? String(d) : "";
        setYear(urlYear); setPlantId(p); setSelectedDeptId(d);

        if (editId) await load({ id: editId });
        else if (p && d) await load({ y: urlYear, p, d });
      } catch (e) {
        setLoadError(`Gagal memuat data awal: ${e.message || "kesalahan server"}`);
      } finally {
        setReady(true);
      }
    })();
  }, [load]);

  // ---- ganti tahun / plant / divisi -> SELALU muat ulang laporan untuk kombinasi baru -----------------------
  const confirmDiscard = () => snapshot(form) === baseline.current || window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?");
  const switchTo = (next) => {
    const y = next.year ?? year, p = next.plantId ?? plantId, d = next.deptId ?? selectedDeptId;
    if (!confirmDiscard()) return;
    setYear(y); setPlantId(p); setSelectedDeptId(d);
    if (p && d) load({ y, p, d }); else { resetEmpty(); setLoadError(""); }
  };

  // ---- turunan ---------------------------------------------------------------------------------------------
  const currentDept = useMemo(() => departments.find((x) => String(x.id) === String(selectedDeptId)) || null, [departments, selectedDeptId]);
  const deptName = currentDept?.name || "";
  const formKey = formKeyFor(deptName);
  const FormComponent = formKey ? FORMS[formKey] : null;
  const isSalesDept = formKey === "SalesForm";
  const plantName = (isSuperAdmin ? plants.find((x) => String(x.id) === String(plantId))?.name : user?.plant?.name) || user?.plant?.name || "Cabang Perusahaan";
  const statusLocked = ["LOCKED", "APPROVED"].includes(String(status).toUpperCase()) && !isSuperAdmin;
  const blocked = (ENFORCE_LOCK && statusLocked) || !!loadError || (!isSuperAdmin && !selectedDeptId) || !plantId || !currentDept;

  // form anak membaca form.year (label tahun) & form.id (upload lampiran) -> disuntikkan saat render
  const formView = useMemo(() => ({ ...form, year, id: reportId }), [form, year, reportId]);

  async function handleSubmit() {
    if (saving || blocked) return;
    setNotice(null); setSaving(true);

    const perf = cleanPerformances(form.salesPerformances);
    const challenges = cleanTitles(form.challenges);
    const opportunities = cleanTitles(form.opportunities);
    const salesType = isSalesDept ? form.salesType : "OMZET";
    const body = {
      id: reportId,
      year: Number(year),
      plantId: String(plantId),
      departmentId: String(selectedDeptId),
      salesType,
      achievementSummary: buildSummary(form, deptName, year),
      salesPerformances: perf,
      challenges,
      opportunities,
      metricsJson: {
        ...stripMeta(form),
        salesType,
        challenges, opportunities,
        kpiList: form.kpiList || [],
        salesPerformances: perf,
        salesSupportPerformances: cleanSupport(form.salesSupportPerformances),
        branchInnovations: form.branchInnovations || "",
        metrics: (form.kpiList || []).map((k) => ({ val: k.val, note: k.note, unit: k.unit, period: k.period, pic: k.pic })),
        weeklyRevenue: form.weeklyRevenue || [],
        targetAchievedPct: form.targetAchievedPct || "",
      },
    };

    try {
      const res = await apiFetch("/api/reports", { method: "POST", body: JSON.stringify(body) });
      const saved = res?.data || res?.report || res;
      if (saved?.id) setReportId(saved.id);
      if (saved?.status) setStatus(saved.status);
      if (Array.isArray(saved?.attachments)) setAttachments(saved.attachments);
      baseline.current = snapshot(form);
      setNotice({ type: "ok", text: `Laporan ${year} tersimpan.` });
    } catch (e) {
      setNotice({ type: "err", text: e.message || "Gagal menyimpan laporan" });
    } finally {
      setSaving(false);
    }
  }

  // ---- tampilan --------------------------------------------------------------------------------------------
  if (!user || !ready) return <div className="min-h-screen bg-slate-950 p-6 text-slate-400 text-sm">Memuat sesi pengguna...</div>;

  const phase = YEARS.find((y) => y.year === Number(year));

  return (
    <div className="min-h-screen bg-slate-950 p-6 max-w-3xl mx-auto text-white">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Form Laporan — {plantName}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              PIC Akun: <span className="text-white font-medium">{user.name}</span> — Divisi: <span className="text-cyan-400 font-medium">{deptName || "—"}</span>
            </p>
          </div>
          <select
            value={year}
            onChange={(e) => switchTo({ year: Number(e.target.value) })}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white font-mono cursor-pointer hover:border-cyan-500 transition"
          >
            {YEARS.map((y) => <option key={y.year} value={y.year}>{y.year} ({y.label})</option>)}
          </select>
        </div>

        {isSuperAdmin ? (
          <div className="grid gap-2 bg-slate-900 border border-slate-700 p-3 rounded-xl sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              Plant:
              <select value={plantId} onChange={(e) => switchTo({ plantId: e.target.value })} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white flex-1 font-mono">
                {!plantId && <option value="">— pilih plant —</option>}
                {plants.map((p) => <option key={p.id} value={p.id}>{p.name || p.code}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              Divisi:
              <select value={selectedDeptId} onChange={(e) => switchTo({ deptId: e.target.value })} className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white flex-1 font-mono">
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs text-slate-300">
            Divisi Terikat: <b className="text-white">{deptName || "tidak terdeteksi"}</b> (Terkunci otomatis)
          </div>
        )}
      </div>

      {!isSuperAdmin && !selectedDeptId && (
        <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">
          Divisi akun ini tidak terdeteksi, jadi penyimpanan dinonaktifkan agar laporan tidak masuk ke divisi yang salah. Hubungi admin untuk menautkan akun ke divisi.
        </div>
      )}
      {loadError && <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">{loadError}{" "}<span className="text-rose-300/70">Penyimpanan dinonaktifkan agar data lama tidak tertimpa.</span></div>}
      {statusLocked && <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">Laporan ini berstatus <b>{status}</b>.{ENFORCE_LOCK ? " Hanya superadmin yang dapat mengubahnya." : " Perubahan yang Anda simpan akan menimpa versi yang sudah disetujui."}</div>}

      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-2 mb-6">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          <span>Panduan Pengisian — Tahun {year}{phase ? ` · ${phase.label}` : ""}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Isian dan file Excel yang Anda unggah <b>disimpan untuk tahun yang sedang dipilih ({year})</b>. Untuk mengisi tahun lain, ganti tahun di kanan atas lalu isi atau unggah lagi — tiap tahun adalah laporan terpisah dan akan tampil pada slide Run (2024), Grow (2025), Transform (2026) dan Future (2027).
        </p>
      </div>

      {currentDept && plantId && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3 sm:p-4">
          <div className="text-xs text-slate-300 flex-1 min-w-[200px]">Lihat hasil isian <b>{currentDept.name}</b> sebagai presentasi (2024–2027) dan unduh sebagai PDF. Simpan laporan dulu agar isian terbaru ikut tampil.</div>
          <a href={`/presentation/dept?deptId=${currentDept.id}&plantId=${plantId}`} className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl hover:opacity-90">🎞️ Lihat Presentasi Divisi</a>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-2"><FileSpreadsheet size={16} /> Riwayat File Excel Terunggah ({attachments.length})</span>
            <span className="text-[10px] text-slate-400 font-mono">Tersimpan di Server</span>
          </div>
          <div className="space-y-2">
            {attachments.map((att, idx) => (
              <div key={att.id ?? idx} className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs">
                <div className="flex items-center gap-2.5 truncate"><span className="text-cyan-400 font-mono text-sm">📊</span><span className="text-slate-200 font-medium truncate">{att.fileName}</span></div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{new Date(att.createdAt || Date.now()).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <p className="text-xs text-slate-400">
          Status saat ini: <b className="text-cyan-400 font-mono">{status}</b>
          {reportId ? <span className="text-slate-500"> · laporan {year} sudah ada</span> : <span className="text-slate-500"> · belum ada laporan {year}</span>}
        </p>
        <a href="/dashboard" className="text-xs text-cyan-400 hover:underline">← Kembali ke Dashboard</a>
      </div>

      {loading ? (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400">Memuat laporan {year}…</div>
      ) : FormComponent ? (
        <FormComponent form={formView} setForm={setForm} year={year} reportId={reportId} attachments={attachments} />
      ) : (
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-center text-slate-400 space-y-2">
          <p className="text-cyan-400 font-bold">Form untuk departemen ini belum dikonfigurasi.</p>
          <p className="text-xs text-slate-500">Nama departemen terdeteksi: <code className="text-white bg-slate-950 px-2 py-1 rounded">{deptName || "Tidak diketahui"}</code>
            {deptName && !resolveDepartment(deptName) ? " — nama ini belum ada di lib/presentation/departments.js" : ""}</p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || loading || blocked}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl transition duration-200 shadow-lg shadow-cyan-500/20 text-base cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Menyimpan…" : `Simpan Laporan ${year}`}
        </button>
        {notice && (
          <div className={`text-center text-xs mt-3 font-medium ${notice.type === "ok" ? "text-emerald-400" : "text-rose-400"}`}>
            {notice.text}{notice.type === "ok" && <> <a href="/dashboard" className="underline ml-1">Ke dashboard →</a></>}
          </div>
        )}
      </div>
    </div>
  );
}