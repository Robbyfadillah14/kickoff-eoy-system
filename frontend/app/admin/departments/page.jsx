"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Load daftar departemen
  const loadDepartments = async () => {
    try {
      const data = await apiFetch("/api/departments");
      const list = Array.isArray(data) ? data : (data?.data || data?.departments || data?.list || []);
      setDepartments(list);
    } catch (err) {
      console.error("Error loading departments:", err);
      setMsg("Gagal memuat daftar departemen.");
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // Fungsi Tambah Departemen
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg("Nama departemen tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      await apiFetch("/api/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      setName("");
      setMsg("Departemen berhasil ditambahkan!");
      await loadDepartments();
    } catch (err) {
      console.error("Network or script error:", err);
      setMsg(err.message || "Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Hapus Departemen
  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus departemen ini?")) return;
    try {
      await apiFetch(`/api/departments/${id}`, {
        method: "DELETE",
      });
      setMsg("Departemen berhasil dihapus.");
      loadDepartments();
    } catch (err) {
      console.error("Error deleting department:", err);
      setMsg("Gagal menghapus departemen.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 max-w-4xl mx-auto text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Kelola Departemen (Super Admin)</h1>
        <a 
          href="/admin/audit-logs" 
          className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-cyan-500 transition-colors"
        >
          Lihat Audit Log
        </a>
      </div>

      {/* FORM TAMBAH DEPARTEMEN */}
      <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 flex gap-3 items-center shadow-lg">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama departemen baru"
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-500 text-slate-950 px-5 py-2 rounded-lg text-sm font-bold hover:bg-cyan-400 transition-opacity disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20"
        >
          {loading ? "Menyimpan..." : "Tambah"}
        </button>
      </form>

      {/* PESAN STATUS / ERROR */}
      {msg && (
        <p className={`text-xs mb-4 font-medium ${msg.includes("berhasil") ? "text-green-400" : "text-red-400"}`}>
          {msg}
        </p>
      )}

      {/* DAFTAR DEPARTEMEN */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="divide-y divide-slate-800">
          {departments.length === 0 ? (
            <p className="p-6 text-xs text-slate-400 text-center">Belum ada departemen tersimpan.</p>
          ) : (
            departments.map((dept, index) => (
              <div key={dept.id || index} className="p-3.5 flex justify-between items-center text-sm hover:bg-slate-800/40 transition">
                <span className="font-medium text-white">{dept.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(dept.id)}
                    className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}