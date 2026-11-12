"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { getSocket } from "../../../lib/socket";

// Halaman Audit Log untuk Super Admin: siapa mengubah/menyetujui/mengembalikan apa & kapan
export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("");

  function load() {
    apiFetch("/api/audit-logs")
      .then((data) => {
        // Handle jika data dibungkus objek atau berupa array langsung
        const list = Array.isArray(data) ? data : (data?.data || data?.logs || []);
        setLogs(list);
      })
      .catch((err) => {
        console.error("Gagal memuat audit logs:", err);
        setLogs([]);
      });
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    // event report/department berubah -> kemungkinan besar ada audit log baru, refresh list
    socket.on("report_updated", load);
    socket.on("department_updated", load);
    return () => { 
      socket.off("report_updated", load); 
      socket.off("department_updated", load); 
    };
  }, []);

  const actions = Array.from(new Set(logs.map((l) => l.action)));
  const filtered = filterAction ? logs.filter((l) => l.action === filterAction) : logs;

  return (
    <div className="min-h-screen bg-bg p-6 text-slate-100">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-lg font-bold">Audit Log</h1>
        <select 
          value={filterAction} 
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">Semua aksi</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} entri</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 text-slate-400 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Waktu</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Aksi</th>
              <th className="text-left px-4 py-3">Entitas</th>
              <th className="text-left px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("id-ID")}</td>
                <td className="px-4 py-2.5 text-slate-200">{l.user?.name || "—"}</td>
                <td className="px-4 py-2.5"><span className="text-xs bg-slate-950 border border-slate-800 text-cyan-400 rounded px-2 py-0.5 font-mono">{l.action}</span></td>
                <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{l.entity}{l.entityId ? ` #${l.entityId.slice(0, 8)}` : ""}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{l.metadata ? JSON.stringify(l.metadata) : "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">Belum ada aktivitas tercatat.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}