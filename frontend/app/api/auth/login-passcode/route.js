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

    // Cari department yang cocok dengan plant dan accessCode (passcode)
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        plantId: plantId,
        passcode: accessCode,
      },
      include: {
        plant: true,
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: "Passcode salah atau kombinasi tidak valid" },
        { status: 401 }
      );
    }

    // Buat data sesi/token tiruan sederhana (atau payload sukses)
    const responseData = {
      success: true,
      accessToken: "mock-jwt-token-" + department.id,
      refreshToken: "mock-refresh-token-" + department.id,
      user: {
        id: department.id,
        name: department.name,
        role: "DEPARTMENT",
        plantId: department.plantId,
        plantName: department.plant?.name,
        departmentId: department.id,
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