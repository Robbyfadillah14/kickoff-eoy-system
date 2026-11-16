import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolvePlantId(plantId) {
  if (!plantId || plantId === 'ALL' || plantId === 'semua' || plantId === 'null') return null;
  if (uuidRegex.test(plantId)) return plantId;
  const match = await prisma.plant.findFirst({
    where: {
      OR: [
        { name: { contains: String(plantId), mode: 'insensitive' } },
        { code: { contains: String(plantId), mode: 'insensitive' } }
      ]
    }
  });
  return match ? match.id : plantId;
}

async function resolveDeptId(departmentId) {
  if (!departmentId || departmentId === 'ALL' || departmentId === 'semua' || departmentId === 'null') return null;
  if (uuidRegex.test(departmentId)) return departmentId;
  const match = await prisma.department.findFirst({
    where: { name: { contains: String(departmentId), mode: 'insensitive' } }
  });
  return match ? match.id : departmentId;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams;
    const segments = pathname.split('/').filter(Boolean); 
    // Contoh segments: ['api', 'plants'] atau ['api', 'reports', 'id-123']

    // 1. ENDPOINT: /api/plants
    if (segments[1] === 'plants') {
      if (segments.length >= 4 && segments[3] === 'departments') {
        const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
        return NextResponse.json(departments);
      }
      const plants = await prisma.plant.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json(plants);
    }

    // 2. ENDPOINT: /api/departments
    if (segments[1] === 'departments') {
      const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json(departments);
    }

    // 3. ENDPOINT: /api/reports/:id (Detail Laporan)
    if (segments[1] === 'reports' && segments[2] && segments[2] !== 'export') {
      const reportId = segments[2];
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { plant: true, department: true, attachments: true, comments: true }
      });
      if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
      return NextResponse.json({ success: true, data: report });
    }

    // 4. ENDPOINT: /api/reports (List & Filter)
    if (segments[1] === 'reports') {
      const year = searchParams.get('year');
      const plantIdQuery = searchParams.get('plantId');
      const deptIdQuery = searchParams.get('departmentId');

      const where = {};
      if (year && year !== 'ALL' && year !== 'semua' && year !== 'null') {
        where.year = Number(year);
      }

      const resolvedPlant = await resolvePlantId(plantIdQuery);
      if (resolvedPlant) where.plantId = resolvedPlant;

      const resolvedDept = await resolveDeptId(deptIdQuery);
      if (resolvedDept) where.departmentId = resolvedDept;

      const reports = await prisma.report.findMany({
        where,
        include: { plant: true, department: true, attachments: true },
        orderBy: [{ year: 'desc' }],
      });

      return NextResponse.json({
        success: true,
        data: reports,
        reports: reports,
        count: reports.length
      });
    }

    return NextResponse.json({ message: "API Catch-all active", path: pathname });
  } catch (error) {
    console.error("Catch-all GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const pathname = url.pathname;
    const segments = pathname.split('/').filter(Boolean);

    if (segments[1] === 'reports') {
      const { id, year, plantId, departmentId, achievementSummary, metricsJson, challenges, opportunities, rgtRun, rgtGrow, rgtTransform, deadlineAt } = body;

      const resolvedPlant = await resolvePlantId(plantId);
      const resolvedDept = await resolveDeptId(departmentId);

      if (!year || !resolvedPlant || !resolvedDept) {
        return NextResponse.json({ error: "year, plantId, dan departmentId wajib diisi dan valid!" }, { status: 400 });
      }

      const yearNum = Number(year);
      const parsedDeadline = deadlineAt ? new Date(deadlineAt) : null;
      const isValidId = id && id !== "null" && id !== "undefined" && String(id).trim() !== "";

      const data = {
        year: yearNum,
        plantId: String(resolvedPlant),
        departmentId: String(resolvedDept),
        achievementSummary,
        metricsJson,
        challenges,
        opportunities,
        rgtRun,
        rgtGrow,
        rgtTransform,
        deadlineAt: parsedDeadline,
        status: "SUBMITTED"
      };

      let report;
      if (isValidId) {
        report = await prisma.report.update({
          where: { id: String(id) },
          data,
        });
      } else {
        report = await prisma.report.upsert({
          where: { year_plantId_departmentId: { year: yearNum, plantId: String(resolvedPlant), departmentId: String(resolvedDept) } },
          update: data,
          create: data,
        });
      }

      const completeReport = await prisma.report.findUnique({
        where: { id: report.id },
        include: { plant: true, department: true, attachments: true }
      });

      return NextResponse.json({ success: true, data: completeReport, report: completeReport });
    }

    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    console.error("Catch-all POST Error:", error);
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
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const reportId = segments[segments.length - 1];

    if (reportId && reportId !== 'reports') {
      await prisma.$transaction(async (tx) => {
        await tx.auditLog.deleteMany({ where: { entityId: reportId } }).catch(() => {});
        await tx.comment.deleteMany({ where: { reportId } }).catch(() => {});
        await tx.attachment.deleteMany({ where: { reportId } }).catch(() => {});
        await tx.report.delete({ where: { id: reportId } });
      });

      return NextResponse.json({ success: true, message: "Laporan berhasil dihapus permanen" });
    }

    return NextResponse.json({ success: false, error: "ID laporan tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Catch-all DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}