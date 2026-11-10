const prisma = require("../config/db");

async function logAudit({ userId, action, entity, entityId, metadata }) {
  try {
    await prisma.auditLog.create({ data: { userId, action, entity, entityId, metadata } });
  } catch (e) {
    console.error("Gagal mencatat audit log:", e.message);
  }
}

module.exports = { logAudit };
