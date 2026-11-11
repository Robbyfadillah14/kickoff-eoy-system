import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const plants = await prisma.plant.findMany({
      orderBy: { name: "asc" },
    });
    // Dibungkus agar cocok dengan 'data.success' dan 'data.data' di frontend
    return NextResponse.json({ success: true, data: plants });
  } catch (error) {
    console.error("Gagal mengambil data plant:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data plant" },
      { status: 500 }
    );
  }
}