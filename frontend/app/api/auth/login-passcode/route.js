import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { plantId, departmentId, accessCode } = body;

    if (!plantId || !departmentId || !accessCode) {
      return NextResponse.json(
        { success: false, error: "Plant, Divisi, dan Passcode wajib diisi" },
        { status: 400 }
      );
    }

    // Cari kecocokan di tabel PlantDepartmentAccess sesuai struktur Prisma-mu
    const accessRecord = await prisma.plantDepartmentAccess.findFirst({
      where: {
        plantId: plantId,
        departmentId: departmentId,
        accessCode: accessCode,
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
      { success: false, error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}