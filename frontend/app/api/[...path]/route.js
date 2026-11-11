import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ message: "Kickoff EOY Serverless Backend Live on Vercel!" });
}

export async function POST(request) {
  try {
    const body = await request.json();
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