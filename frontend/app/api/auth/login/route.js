import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { hashPassword, verifyPassword, signToken, ACCESS_TTL, REFRESH_TTL } from "../../../../lib/auth.js";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const fail = () => NextResponse.json({ success: false, error: "Email atau password salah" }, { status: 401 });

function issue(user) {
  const claims = { sub: user.id, role: user.role, plantId: user.plantId ?? null, departmentId: user.departmentId ?? null, departmentName: user.department?.name ?? null };
  return {
    accessToken: signToken({ ...claims, typ: "access" }, ACCESS_TTL),
    refreshToken: signToken({ sub: user.id, typ: "refresh" }, REFRESH_TTL),
  };
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ success: false, error: "Email dan password wajib diisi" }, { status: 400 });
    const mail = String(email).trim().toLowerCase();

    // 1. Superadmin dari environment (BUKAN dari kode): SUPERADMIN_EMAIL + SUPERADMIN_PASSWORD
    const sEmail = (process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();
    const sPass = process.env.SUPERADMIN_PASSWORD || "";
    if (sEmail && sPass && same(mail, sEmail)) {
      if (!same(password, sPass)) return fail();
      const user = { id: "super-admin-id", name: "Super Administrator", email: mail, role: "SUPER_ADMIN", plantId: null, departmentId: null };
      return NextResponse.json({ success: true, ...issue(user), user });
    }

    // 2. Pengguna biasa dari database
    const user = await prisma.user.findFirst({ where: { email: { equals: String(email).trim(), mode: "insensitive" } }, include: { plant: true, departments: { include: { department: true } } } });
    const check = user ? verifyPassword(password, user.passwordHash) : { ok: false };
    if (!user || !check.ok) return fail();

    // password lama yang masih polos -> otomatis disimpan sebagai hash saat login berhasil
    if (check.needsUpgrade) {
      try { await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(password) } }); }
      catch (e) { console.error("Gagal meng-hash password lama:", e.message); }
    }

    const department = user.departments?.[0]?.department ?? null;
    const role = user.role || "USER";
    return NextResponse.json({
      success: true,
      ...issue({ ...user, role, departmentId: department?.id ?? null, department }),
      user: { id: user.id, name: user.name, email: user.email, role, plantId: user.plantId, departmentId: department?.id ?? null, departmentName: department?.name ?? null, plant: user.plant, department },
    });
  } catch (error) {
    console.error("Error login:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}