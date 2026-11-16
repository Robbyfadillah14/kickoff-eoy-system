import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Inisialisasi Prisma Client secara aman agar tidak error di serverless/Vercel
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request) {
  try {
    const body = await request.json();
    let { plantId, departmentId, accessCode } = body;

    if (!plantId || !departmentId || !accessCode) {
      return NextResponse.json(
        { success: false, error: "Plant, Divisi, dan Passcode wajib diisi" },
        { status: 400 }
      );
    }

    // 1. Smart Resolution untuk Plant (Jika yang dikirim nama, otomatis ubah ke UUID)
    let resolvedPlantId = plantId;
    if (!uuidRegex.test(plantId)) {
      const plantMatch = await prisma.plant.findFirst({
        where: {
          OR: [
            { name: { contains: String(plantId), mode: "insensitive" } },
            { code: { contains: String(plantId), mode: "insensitive" } }
          ]
        }
      });
      if (plantMatch) resolvedPlantId = plantMatch.id;
    }

    // 2. Smart Resolution untuk Department (Jika yang dikirim nama, otomatis ubah ke UUID)
    let resolvedDepartmentId = departmentId;
    if (!uuidRegex.test(departmentId)) {
      const deptMatch = await prisma.department.findFirst({
        where: {
          name: { contains: String(departmentId), mode: "insensitive" }
        }
      });
      if (deptMatch) resolvedDepartmentId = deptMatch.id;
    }

    console.log("=== PASSCODE LOGIN ATTEMPT ===", { resolvedPlantId, resolvedDepartmentId });

    // 3. Cari kecocokan di tabel PlantDepartmentAccess dengan ID yang sudah dipastikan valid
    const accessRecord = await prisma.plantDepartmentAccess.findFirst({
      where: {
        plantId: resolvedPlantId,
        departmentId: resolvedDepartmentId,
        accessCode: String(accessCode).trim(),
      },
      include: {
        plant: true,
        department: true,
      },
    });

    if (!accessRecord) {
      return NextResponse.json(
        { success: false, error: "Passcode salah atau kombinasi tidak valid" },
        { status: 401 }
      );
    }

    // Format data sukses yang dikembalikan ke frontend
    const responseData = {
      success: true,
      accessToken: "mock-jwt-token-" + accessRecord.id,
      refreshToken: "mock-refresh-token-" + accessRecord.id,
      user: {
        id: accessRecord.department.id,
        name: accessRecord.department.name,
        role: "DEPARTMENT",
        plantId: accessRecord.plant.id,
        plantName: accessRecord.plant.name,
        departmentId: accessRecord.department.id,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error login passcode:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server: " + error.message },
      { status: 500 }
    );
  }
}