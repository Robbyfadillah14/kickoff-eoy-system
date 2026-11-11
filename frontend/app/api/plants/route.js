import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export async function GET() {
  try {
    const plants = await prisma.plant.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: plants });
  } catch (error) {
    console.error("Gagal mengambil data plant:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat plant" }, { status: 500 });
  }
}