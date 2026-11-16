import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    // 1. Hardcode pengecekan Super Admin default aplikasi
    if (email === "superadmin@ekasurya.local" && password === "password123") {
      return NextResponse.json({
        success: true,
        accessToken: "mock-superadmin-token-xyz",
        refreshToken: "mock-superadmin-refresh-xyz",
        user: {
          id: "super-admin-id",
          name: "Super Administrator",
          email: email,
          role: "SUPER_ADMIN", // Disamakan persis dengan RoleName SUPER_ADMIN di schema.prisma
        },
      });
    }

    // 2. Pengecekan User Regular langsung ke Neon Database via Prisma
    const user = await prisma.user.findFirst({
      where: { email },
      include: { plant: true, department: true }
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Berhasil login, kembalikan profil lengkap beserta relasi plant & department
    return NextResponse.json({
      success: true,
      accessToken: `token-${user.id}-${Date.now()}`,
      refreshToken: `refresh-${user.id}-${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "USER",
        plantId: user.plantId,
        departmentId: user.departmentId,
        plant: user.plant,
        department: user.department,
      },
    });

  } catch (error) {
    console.error("Error login admin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server: " + error.message },
      { status: 500 }
    );
  }
}