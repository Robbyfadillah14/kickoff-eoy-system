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
      const res = await apiFetch("/api/departments");
      if (!res.ok) throw new Error("Gagal mengambil data departemen");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data || data?.departments || [];
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
    console.log("Tombol Tambah diklik. Input nama:", name);

    if (!name.trim()) {
      setMsg("Nama departemen tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await apiFetch("/api/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      console.log("Response status:", res.status);

      if (res.ok) {
        setName("");
        setMsg("Departemen berhasil ditambahkan!");
        await loadDepartments();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Error response:", errData);
        setMsg(errData.message || errData.error || `Gagal menambah (Status: ${res.status})`);
      }
    } catch (err) {
      console.error("Network or script error:", err);
      setMsg("Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Hapus Departemen
  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus departemen ini?")) return;
    try {
      const res = await apiFetch(`/api/departments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMsg("Departemen berhasil dihapus.");
        loadDepartments();
      } else {
        setMsg("Gagal menghapus departemen.");
      }
    } catch (err) {
      console.error("Error deleting department:", err);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-6 max-w-4xl mx-auto text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Kelola Departemen (Super Admin)</h1>
        <a 
          href="/admin/audit-logs" 
          className="text-xs bg-bg2 border border-line px-3 py-1.5 rounded-lg hover:border-accent transition-colors"
        >
          Lihat Audit Log
        </a>
      </div>

      {/* FORM TAMBAH DEPARTEMEN */}
      <form onSubmit={handleAdd} className="bg-card border border-line p-4 rounded-xl mb-6 flex gap-3 items-center">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama departemen baru"
          disabled={loading}
          className="flex-1 bg-bg2 border border-line rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-bg px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
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
      <div className="bg-card border border-line rounded-xl overflow-hidden">
        <div className="divide-y divide-line">
          {departments.length === 0 ? (
            <p className="p-4 text-xs text-sub text-center">Belum ada departemen tersimpan.</p>
          ) : (
            departments.map((dept, index) => (
              <div key={dept.id || index} className="p-3.5 flex justify-between items-center text-sm">
                <span className="font-medium text-white">{dept.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(dept.id)}
                    className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md hover:bg-red-500/20 transition-colors"
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