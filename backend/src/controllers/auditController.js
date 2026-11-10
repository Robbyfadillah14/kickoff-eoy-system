const prisma = require("../config/db");

async function list(req, res) {
  const logs = await prisma.auditLog.findMany({
    include: { user: true }, orderBy: { createdAt: "desc" }, take: 200,
  });
  res.json(logs);
}

module.exports = { list };
