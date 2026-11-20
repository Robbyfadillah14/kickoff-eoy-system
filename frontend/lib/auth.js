// frontend/lib/auth.js — SERVER ONLY (dipakai route handler /api/*). Tanpa dependensi tambahan: hanya node:crypto.
import crypto from "node:crypto";
import { isDirector, canViewCluster } from "./presentation/access.js";
import { clusterOfDepartment } from "./presentation/registry.js";

/* ---------------------------------------------------------------- password */

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** "scrypt$<salt>$<hash>" — hash lambat + salt acak, aman bila database bocor */
export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(plain), salt, SCRYPT.keylen, SCRYPT).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export const isHashed = (stored) => typeof stored === "string" && stored.startsWith("scrypt$");

/**
 * Cocokkan password. Password lama yang masih polos di database tetap diterima SEKALI,
 * dan `needsUpgrade` = true agar pemanggil langsung menyimpannya ulang dalam bentuk hash.
 */
export function verifyPassword(plain, stored) {
  if (typeof stored !== "string" || !stored) return { ok: false, needsUpgrade: false };
  if (isHashed(stored)) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return { ok: false, needsUpgrade: false };
    const test = crypto.scryptSync(String(plain), salt, SCRYPT.keylen, SCRYPT).toString("hex");
    return { ok: safeEqual(test, hash), needsUpgrade: false };
  }
  return { ok: safeEqual(plain, stored), needsUpgrade: true };
}

/* ------------------------------------------------------------------- token */

const b64u = (b) => Buffer.from(b).toString("base64url");
const fromB64u = (s) => Buffer.from(s, "base64url").toString("utf8");

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET belum diatur di environment (minimal 32 karakter)");
  return "dev-only-secret-dev-only-secret-dev!"; // hanya untuk lokal
}
const sign = (data) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export const ACCESS_TTL = 60 * 60 * 12;        // 12 jam
export const REFRESH_TTL = 60 * 60 * 24 * 7;   // 7 hari

/** token bertanda tangan HMAC-SHA256: "<payload>.<signature>" — isi tidak bisa diubah tanpa AUTH_SECRET */
export function signToken(claims, ttlSec = ACCESS_TTL, now = Date.now()) {
  const payload = b64u(JSON.stringify({ ...claims, iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + ttlSec }));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token, now = Date.now()) {
  if (typeof token !== "string") return null;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  let expected;
  try { expected = sign(payload); } catch { return null; }
  if (!safeEqual(sig, expected)) return null;
  try {
    const claims = JSON.parse(fromB64u(payload));
    if (!claims?.exp || claims.exp * 1000 < now) return null;
    return claims;
  } catch { return null; }
}

/* ---------------------------------------------------- dipakai tiap route API */

/** klaim pengguna dari header Authorization: Bearer … (atau null) */
export function getAuth(request) {
  const h = request?.headers?.get?.("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  const c = m ? verifyToken(m[1].trim()) : null;
  return c && c.typ === "access" ? c : null;
}

const json = (body, status) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/**
 * const { auth, error } = requireAuth(request, { roles: ["SUPER_ADMIN"] });
 * if (error) return error;
 */
export function requireAuth(request, { roles } = {}) {
  const auth = getAuth(request);
  if (!auth) return { error: json({ success: false, error: "Sesi tidak valid atau sudah habis. Silakan login ulang." }, 401) };
  if (roles && !roles.includes(auth.role)) return { error: json({ success: false, error: "Anda tidak punya akses ke data ini." }, 403) };
  return { auth };
}

/**
 * BACA. superadmin bebas; pengguna lain hanya plant & divisinya sendiri.
 * Direktur: plant-nya sendiri, divisinya sendiri + semua divisi di klaster FINANCIAL & OPERATIONAL_HOSPITALITY (bukan Sales).
 * Untuk direktur, route WAJIB mengirim `departmentName` (nama divisi yang dibaca) agar klasternya bisa dicek.
 */
export function canAccess(auth, { plantId, departmentId, departmentName } = {}) {
  if (!auth) return false;
  if (auth.role === "SUPER_ADMIN") return true;
  if (plantId && auth.plantId && String(plantId) !== String(auth.plantId)) return false;
  if (!auth.plantId) return false;
  if (!departmentId) return true;
  if (!auth.departmentId || String(departmentId) === String(auth.departmentId)) return true;
  if (isDirector(auth)) {
    const cluster = clusterOfDepartment(departmentName);
    return !!cluster && canViewCluster(auth, cluster);
  }
  return false;
}

/** TULIS (simpan/ubah laporan): superadmin bebas; lainnya hanya plant & divisinya sendiri — direktur pun hanya laporannya sendiri */
export function canWrite(auth, { plantId, departmentId } = {}) {
  if (!auth) return false;
  if (auth.role === "SUPER_ADMIN") return true;
  if (!auth.plantId || (plantId && String(plantId) !== String(auth.plantId))) return false;
  if (departmentId && auth.departmentId && String(departmentId) !== String(auth.departmentId)) return false;
  return true;
}