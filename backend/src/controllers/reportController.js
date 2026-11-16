const prisma = require("../config/db");
const { logAudit } = require("../middleware/audit");

// GET /api/reports?year=&plantId=&departmentId=
async function list(req, res) {
  try {
    const { year, plantId, departmentId } = req.query;
    const where = {};
    
    // 1. Filter Tahun
    if (year && year !== "ALL" && year !== "semua" && year !== "null" && year !== "undefined") {
      where.year = Number(year);
    }

    // 2. Filter Plant (Mendukung UUID langsung maupun pencarian nama teks dari session PIC)
    if (plantId && plantId !== "ALL" && plantId !== "semua" && plantId !== "null" && plantId !== "undefined" && plantId !== "") {
      // Cek apakah plantId yang dikirim adalah UUID valid atau Nama Plant
      const plantCheck = await prisma.plant.findFirst({
        where: {
          OR: [
            { id: String(plantId) },
            { name: { contains: String(plantId), mode: "insensitive" } },
            { code: { contains: String(plantId), mode: "insensitive" } }
          ]
        }
      });
      where.plantId = plantCheck ? plantCheck.id : String(plantId);
    }

    // 3. Filter Department (Mendukung UUID langsung maupun pencarian nama teks)
    if (departmentId && departmentId !== "ALL" && departmentId !== "semua" && departmentId !== "null" && departmentId !== "undefined" && departmentId !== "") {
      const deptCheck = await prisma.department.findFirst({
        where: {
          OR: [
            { id: String(departmentId) },
            { name: { contains: String(departmentId), mode: "insensitive" } }
          ]
        }
      });
      where.departmentId = deptCheck ? deptCheck.id : String(departmentId);
    }

    console.log("=== FINAL PRISMA QUERY WHERE ===", where);

    const reports = await prisma.report.findMany({
      where, 
      include: { plant: true, department: true, attachments: true },
      orderBy: [{ year: "desc" }],
    });

    console.log(`=== BERHASIL TARIK ${reports.length} LAPORAN DARI NEON ===`);

    return res.json({
      success: true,
      data: reports,
      reports: reports,
      count: reports.length
    });
  } catch (error) {
    console.error("Gagal mengambil list laporan:", error);
    return res.status(500).json({ error: "Gagal mengambil data laporan" });
  }
}

// GET /api/reports/:id (MENGAMBIL DETAIL LAPORAN SAAT EDIT)
async function getById(req, res) {
  try {
    const { id } = req.params;
    const report = await prisma.report.findUnique({
      where: { id },
      include: { plant: true, department: true, attachments: true, comments: true },
    });

    if (!report) {
      return res.status(404).json({ error: "Laporan tidak ditemukan" });
    }

    return res.json({ success: true, data: report });
  } catch (error) {
    console.error("Gagal mengambil detail laporan:", error);
    return res.status(500).json({ error: "Gagal mengambil detail laporan" });
  }
}

async function upsert(req, res) {
  try {
    let { id, year, plantId, departmentId, achievementSummary, metricsJson, challenges, opportunities, rgtRun, rgtGrow, rgtTransform, deadlineAt } = req.body;

    if (!plantId && req.user?.plantId) plantId = req.user.plantId;
    if (!departmentId && req.user?.departmentId) departmentId = req.user.departmentId;

    if (!year || !plantId || !departmentId) {
      return res.status(400).json({ error: "year, plantId, dan departmentId wajib diisi!" });
    }

    const yearNum = Number(year);
    const parsedDeadline = deadlineAt ? new Date(deadlineAt) : null;
    
    let report;
    const isValidId = id && id !== "null" && id !== "undefined" && String(id).trim() !== "";

    const data = { 
      year: yearNum,
      plantId: String(plantId),
      departmentId: String(departmentId),
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

    if (isValidId) {
      report = await prisma.report.update({
        where: { id: String(id) },
        data,
      });
    } else {
      report = await prisma.report.upsert({
        where: { year_plantId_departmentId: { year: yearNum, plantId: String(plantId), departmentId: String(departmentId) } },
        update: data,
        create: data,
      });
    }

    await logAudit({ userId: req.user?.sub, action: isValidId ? "REPORT_UPDATE" : "REPORT_CREATE", entity: "Report", entityId: report.id });
    
    const io = req.app.get("io");
    if (io) {
      io.emit("report_updated", { reportId: report.id, year: yearNum, plantId, departmentId, status: report.status });
    }

    const completeReport = await prisma.report.findUnique({
      where: { id: report.id },
      include: { plant: true, department: true, attachments: true }
    });

    return res.json({ success: true, data: completeReport, report: completeReport });
  } catch (error) {
    console.error("Gagal menyimpan laporan:", error);
    return res.status(500).json({ error: error.message || "Gagal menyimpan laporan" });
  }
}

async function reviewStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const report = await prisma.report.update({ where: { id }, data: { status } });

    if (note) {
      await prisma.comment.create({ data: { reportId: id, authorId: req.user.sub, body: note } });
    }

    await logAudit({ userId: req.user?.sub, action: `REPORT_${status}`, entity: "Report", entityId: id, metadata: { note } });
    
    const io = req.app.get("io");
    if (io) {
      io.emit("report_updated", { reportId: id, status });
    }

    return res.json(report);
  } catch (error) {
    console.error("Gagal review status:", error);
    return res.status(500).json({ error: "Gagal memproses review status" });
  }
}

async function lockExpired(req, res) {
  try {
    const now = new Date();
    const result = await prisma.report.updateMany({
      where: { deadlineAt: { lt: now }, lockedAt: null, status: { notIn: ["APPROVED"] } },
      data: { status: "LOCKED", lockedAt: now },
    });
    return res.json({ lockedCount: result.count });
  } catch (error) {
    console.error("Gagal lock expired:", error);
    return res.status(500).json({ error: "Gagal mengunci laporan kadaluarsa" });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const reportId = String(id);

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({ where: { entityId: reportId } }).catch(() => {});
      await tx.comment.deleteMany({ where: { reportId } }).catch(() => {});
      await tx.attachment.deleteMany({ where: { reportId } }).catch(() => {});
      await tx.report.delete({ where: { id: reportId } });
    });

    return res.status(200).json({ message: "Laporan beserta seluruh relasinya berhasil dihapus permanen" });
  } catch (error) {
    console.error("Gagal menghapus laporan:", error);
    return res.status(500).json({ error: error.message || "Gagal menghapus laporan dari database" });
  }
}

module.exports = { list, getById, upsert, reviewStatus, lockExpired, remove };