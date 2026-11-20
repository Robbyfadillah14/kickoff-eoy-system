// lib/presentation/access.js — aturan siapa boleh LIHAT klaster mana. Murni (tanpa React/Node) agar dipakai client & server.
import { CLUSTERS, resolveDepartment } from "./registry.js";

/** peran yang bisa "melihat" klaster di luar divisinya (selain SUPER_ADMIN) */
export const VIEW_CLUSTERS_BY_ROLE = {
  DIRECTOR: ["FINANCIAL", "OPERATIONAL_HOSPITALITY"], // tanpa COMMERCIAL (Sales), DM, PD
};

const roleKey = (role) => {
  const r = String(role || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (r === "DIRECTOR" || r === "DIREKTUR" || r === "DIREKTUR_OPERASIONAL" || r === "OPERATIONAL_DIRECTOR") return "DIRECTOR";
  return r;
};

/** user (client, dari localStorage) atau claims (server) -> direktur? Peran ATAU divisi OPS_DIR */
export function isDirector(user, deptName) {
  if (roleKey(user?.role) === "DIRECTOR") return true;
  const n = deptName || user?.departmentName || user?.department?.name || (typeof user?.department === "string" ? user.department : "");
  return resolveDepartment(n)?.code === "OPS_DIR";
}

/** daftar id klaster yang boleh dilihat; null = semua (superadmin) */
export function viewableClusters(user, deptName) {
  if (user?.role === "SUPER_ADMIN") return null;
  if (isDirector(user, deptName)) return VIEW_CLUSTERS_BY_ROLE.DIRECTOR;
  return [];
}

/** boleh melihat klaster ini? (non-direktur diatur halaman lama: hanya divisinya sendiri) */
export function canViewCluster(user, clusterId, deptName) {
  const v = viewableClusters(user, deptName);
  return v === null ? true : v.includes(clusterId);
}

export const allowedClusterIds = (user, deptName) => {
  const v = viewableClusters(user, deptName);
  return v === null ? Object.keys(CLUSTERS) : v;
};