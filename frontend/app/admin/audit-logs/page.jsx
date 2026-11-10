"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { getSocket } from "../../../lib/socket";

// Halaman Audit Log untuk Super Admin: siapa mengubah/menyetujui/mengembalikan apa & kapan
export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("");

  function load() {
    apiFetch("/api/audit-logs").then((r) => r.json()).then(setLogs);
  }
  useEffect(() => {
    load();
    const socket = getSocket();
    // event report/department berubah -> kemungkinan besar ada audit log baru, refresh list
    socket.on("report_updated", load);
    socket.on("department_updated", load);
    return () => { socket.off("report_updated", load); socket.off("department_updated", load); };
  }, []);

  const actions = Array.from(new Set(logs.map((l) => l.action)));
  const filtered = filterAction ? logs.filter((l) => l.action === filterAction) : logs;

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-lg font-bold">Audit Log</h1>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
          className="bg-card border border-line rounded-lg px-3 py-1.5 text-sm">
          <option value="">Semua aksi</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-xs text-sub">{filtered.length} entri</span>
      </div>

      <div className="bg-card border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg2 text-sub text-xs">
            <tr>
              <th className="text-left px-4 py-2">Waktu</th>
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Aksi</th>
              <th className="text-left px-4 py-2">Entitas</th>
              <th className="text-left px-4 py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className="px-4 py-2 text-xs text-sub whitespace-nowrap">{new Date(l.createdAt).toLocaleString("id-ID")}</td>
                <td className="px-4 py-2">{l.user?.name || "—"}</td>
                <td className="px-4 py-2"><span className="text-xs bg-bg2 border border-line rounded px-2 py-0.5">{l.action}</span></td>
                <td className="px-4 py-2 text-xs text-sub">{l.entity}{l.entityId ? ` #${l.entityId.slice(0, 8)}` : ""}</td>
                <td className="px-4 py-2 text-xs text-sub">{l.metadata ? JSON.stringify(l.metadata) : "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sub text-sm">Belum ada aktivitas tercatat.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
