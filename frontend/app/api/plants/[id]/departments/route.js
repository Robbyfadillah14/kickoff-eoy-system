import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const plantId = resolvedParams.id;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive");

    // Mengambil data melalui tabel relasi yang benar: plantDepartmentAccesses
    const accesses = await prisma.plantDepartmentAccess.findMany({
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

    // Ekstrak data departemen dari hasil relasi akses plant
    const departments = accesses.map(item => item.department).filter(Boolean);

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("Gagal mengambil data departemen:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat departemen" }, { status: 500 });
  }
}