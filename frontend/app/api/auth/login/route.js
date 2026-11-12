import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Hardcode pengecekan Super Admin default aplikasi
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

    return NextResponse.json(
      { success: false, error: "Email atau password salah" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Error login admin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}