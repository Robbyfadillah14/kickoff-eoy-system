import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Inisialisasi Prisma Client langsung agar tidak terkendala alias path error di Vercel
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const plantId = resolvedParams.id; // Menyesuaikan nama parameter folder [id]

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