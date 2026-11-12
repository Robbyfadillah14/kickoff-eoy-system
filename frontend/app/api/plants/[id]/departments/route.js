import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });

    // Mengembalikan array langsung karena frontend admin/dashboard memanggilnya langsung
    return NextResponse.json(departments, { status: 200 });
  } catch (error) {
    console.error("Error fetching departments API:", error);
    return NextResponse.json([], { status: 500 });
  }
}