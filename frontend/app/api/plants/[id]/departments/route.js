import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    // Ambil semua data departemen langsung tanpa filter isActive
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: departments,
      departments: departments,
      list: departments,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Nama departemen wajib diisi" },
        { status: 400 }
      );
    }

    const newDepartment = await prisma.department.create({
      data: { name },
    });

    return NextResponse.json(
      { success: true, data: newDepartment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambah departemen" },
      { status: 500 }
    );
  }
}