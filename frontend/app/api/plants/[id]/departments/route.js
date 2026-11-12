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

    // Mengambil data melalui tabel relasi PlantDepartment yang menghubungkan Plant dan Department
    const relations = await prisma.plantDepartment.findMany({
      where: {
        plantId: plantId,
        ...(includeInactive === "true" ? {} : { department: { isActive: true } })
      },
      include: {
        department: true
      },
      orderBy: {
        department: { name: "asc" }
      }
    });

    // Ekstrak data departemennya saja dari hasil relasi
    const departments = relations.map(item => item.department);

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("Gagal mengambil data departemen:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat departemen" }, { status: 500 });
  }
}