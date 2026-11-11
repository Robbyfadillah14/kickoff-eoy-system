import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const departments = await prisma.department.findMany({
      where: { plantId: id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("Gagal mengambil data departemen:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data departemen" },
      { status: 500 }
    );
  }
}