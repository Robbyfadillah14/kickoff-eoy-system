import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    // Wajib pakai await params untuk Next.js App Router terbaru di Vercel
    const resolvedParams = await params;
    const plantId = resolvedParams.plantId;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive");
    const whereClause = {
      plantId: plantId,
      ...(includeInactive === "true" ? {} : { isActive: true })
    };

    const departments = await prisma.department.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("Gagal mengambil data departemen:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat departemen" }, { status: 500 });
  }
}