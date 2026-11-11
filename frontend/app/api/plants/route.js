import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const plants = await prisma.plant.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: plants });
  } catch (error) {
    console.error("Error plants API:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}