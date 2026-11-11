import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Pastikan path prisma client-mu sesuai

export async function GET() {
  try {
    const plants = await prisma.plant.findMany({
      orderBy: { name: "asc" },
    });
    // Kembalikan langsung array atau format yang aman untuk frontend
    return NextResponse.json({ success: true, data: plants });
  } catch (error) {
    console.error("Gagal mengambil data plant:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat plant" }, { status: 500 });
  }
}