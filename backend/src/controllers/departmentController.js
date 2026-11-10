const prisma = require("../config/db");
const { logAudit } = require("../middleware/audit");

// List departemen aktif -> dipakai frontend utk generate tab/form secara dinamis
async function list(req, res) {
  const { includeInactive } = req.query;
  const where = includeInactive === "true" ? {} : { isActive: true };
  const departments = await prisma.department.findMany({ where, orderBy: { name: "asc" } });
  res.json(departments);
}

// Super Admin: tambah departemen baru tanpa perlu deploy ulang / hardcode
async function create(req, res) {
  const { name } = req.body;
  const dept = await prisma.department.create({ data: { name } });
  await logAudit({ userId: req.user.sub, action: "DEPARTMENT_CREATE", entity: "Department", entityId: dept.id, metadata: { name } });
  req.app.get("io").emit("department_updated", { type: "created", department: dept });
  res.status(201).json(dept);
}

async function toggleActive(req, res) {
  const { id } = req.params;
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) return res.status(404).json({ error: "Departemen tidak ditemukan" });

  const updated = await prisma.department.update({ where: { id }, data: { isActive: !dept.isActive } });
  await logAudit({
    userId: req.user.sub, action: updated.isActive ? "DEPARTMENT_ACTIVATE" : "DEPARTMENT_DEACTIVATE",
    entity: "Department", entityId: id,
  });
  req.app.get("io").emit("department_updated", { type: "toggled", department: updated });
  res.json(updated);
}

async function remove(req, res) {
  const { id } = req.params;
  await prisma.department.delete({ where: { id } });
  await logAudit({ userId: req.user.sub, action: "DEPARTMENT_DELETE", entity: "Department", entityId: id });
  req.app.get("io").emit("department_updated", { type: "deleted", departmentId: id });
  res.json({ ok: true });
}

module.exports = { list, create, toggleActive, remove };
