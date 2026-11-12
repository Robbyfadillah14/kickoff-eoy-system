import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Departemen berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus departemen (mungkin sedang digunakan)" },
      { status: 500 }
    );
  }
}