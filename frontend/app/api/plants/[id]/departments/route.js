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

    // Cari plant beserta relasi departemennya secara langsung dari tabel plant
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        plantDepartments: {
          include: {
            department: true
          }
        }
      }
    });

    if (!plant) {
      return NextResponse.json({ success: false, error: "Plant tidak ditemukan" }, { status: 404 });
    }

    // Ambil array departemen dari relasi, lalu filter status aktifnya jika diperlukan
    let departments = plant.plantDepartments.map(pd => pd.department);
    
    if (includeInactive !== "true") {
      departments = departments.filter(d => d.isActive);
    }

    // Urutkan berdasarkan nama secara alfabetis
    departments.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("Gagal mengambil data departemen:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat departemen" }, { status: 500 });
  }
}