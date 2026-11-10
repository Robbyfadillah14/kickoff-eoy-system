const cron = require("node-cron");
const prisma = require("../config/db");
const { logAudit } = require("../middleware/audit");

// Job otomatis: jalan tiap jam, kunci semua report yang deadline-nya sudah lewat
// dan statusnya belum APPROVED — jadi Super Admin tidak perlu trigger manual lagi.
function startLockScheduler(io) {
  cron.schedule("0 * * * *", async () => {
    const now = new Date();
    const expired = await prisma.report.findMany({
      where: { deadlineAt: { lt: now }, lockedAt: null, status: { notIn: ["APPROVED"] } },
    });
    if (!expired.length) return;

    await prisma.report.updateMany({
      where: { id: { in: expired.map((r) => r.id) } },
      data: { status: "LOCKED", lockedAt: now },
    });

    for (const r of expired) {
      await logAudit({ action: "REPORT_AUTO_LOCKED", entity: "Report", entityId: r.id, metadata: { deadlineAt: r.deadlineAt } });
    }
    io.emit("report_updated", { autoLocked: expired.map((r) => r.id) });
    console.log(`[lockScheduler] Mengunci ${expired.length} laporan yang lewat deadline`);
  });
  console.log("[lockScheduler] Aktif — cek deadline setiap jam");
}

module.exports = { startLockScheduler };
