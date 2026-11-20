import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { signToken, ACCESS_TTL, REFRESH_TTL } from "../../../../lib/auth.js";

// Inisialisasi Prisma Client secara aman agar tidak error di serverless/Vercel
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = () => NextResponse.json({ success: false, error: "Passcode salah atau kombinasi tidak valid" }, { status: 401 });

export async function POST(request) {
  try {
    const { plantId, departmentId, accessCode } = await request.json();

    if (!plantId || !departmentId || !accessCode) {
      return NextResponse.json({ success: false, error: "Plant, Divisi, dan Passcode wajib diisi" }, { status: 400 });
    }

    // Smart Resolution: nama/kode -> UUID
    let resolvedPlantId = plantId;
    if (!uuidRegex.test(plantId)) {
      const m = await prisma.plant.findFirst({
        where: { OR: [{ name: { contains: String(plantId), mode: "insensitive" } }, { code: { contains: String(plantId), mode: "insensitive" } }] },
      });
      if (m) resolvedPlantId = m.id;
    }
    let resolvedDepartmentId = departmentId;
    if (!uuidRegex.test(departmentId)) {
      const m = await prisma.department.findFirst({ where: { name: { contains: String(departmentId), mode: "insensitive" } } });
      if (m) resolvedDepartmentId = m.id;
    }

    const accessRecord = await prisma.plantDepartmentAccess.findFirst({
      where: { plantId: resolvedPlantId, departmentId: resolvedDepartmentId, accessCode: String(accessCode).trim() },
      include: { plant: true, department: true },
    });
    if (!accessRecord) return fail();

    const { plant, department } = accessRecord;
    // token bertanda tangan (bukan lagi "mock-jwt-token"): membawa plant, divisi, dan nama divisi
    const claims = { sub: accessRecord.id, role: "DEPARTMENT", plantId: plant.id, departmentId: department.id, departmentName: department.name };

    return NextResponse.json({
      success: true,
      accessToken: signToken({ ...claims, typ: "access" }, ACCESS_TTL),
      refreshToken: signToken({ sub: accessRecord.id, typ: "refresh" }, REFRESH_TTL),
      user: {
        id: department.id,
        name: department.name,
        role: "DEPARTMENT",
        plantId: plant.id,
        plantName: plant.name,
        departmentId: department.id,
        departmentName: department.name,
        plant,
        department,
      },
    });
  } catch (error) {
    console.error("Error login passcode:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}