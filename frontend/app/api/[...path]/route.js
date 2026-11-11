import { NextResponse } from 'next/server';

// Contoh jika kamu ingin menghubungkan langsung menggunakan Prisma Client di serverless Vercel:
// (Pastikan Prisma sudah di-setup di project frontend atau shared package)

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname; // contoh: /api/plants

    // Contoh penanganan endpoint /api/plants langsung di serverless
    if (pathname.includes('/api/plants')) {
      // Ambil data plant dari database menggunakan Prisma atau logika kamu
      // const plants = await prisma.plant.findMany();
      // return NextResponse.json(plants);
    }

    return NextResponse.json({ message: "API Catch-all active", path: pathname });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle endpoint login atau POST lainnya di sini
    if (pathname.includes('/api/auth/login')) {
      // Logika login serverless
    }

    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  return NextResponse.json({ success: true, message: "Deleted successfully" });
}