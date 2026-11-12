const prisma = require("../config/db");
const { logAudit } = require("../middleware/audit");

// List semua departemen tanpa batasan isActive agar langsung tampil di frontend & dashboard
async function list(req, res) {
  try {
    const departments = await prisma.department.findMany({ 
      orderBy: { name: "asc" } 
    });
    res.json(departments);
  } catch (error) {
    console.error("Error listing departments:", error);
    res.status(500).json({ error: "Gagal memuat daftar departemen" });
  }
}

// Super Admin: tambah departemen baru tanpa perlu deploy ulang / hardcode
async function create(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nama departemen wajib diisi" });
    }

    const dept = await prisma.department.create({ 
      data: { name, isActive: true } 
    });
    
    await logAudit({ 
      userId: req.user?.sub || "system", 
      action: "DEPARTMENT_CREATE", 
      entity: "Department", 
      entityId: dept.id, 
      metadata: { name } 
    });
    
    const io = req.app.get("io");
    if (io) {
      io.emit("department_updated", { type: "created", department: dept });
    }
    
    res.status(201).json(dept);
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ error: "Gagal menambah departemen" });
  }
}

async function toggleActive(req, res) {
  try {
    const { id } = req.params;
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) return res.status(404).json({ error: "Departemen tidak ditemukan" });

    const updated = await prisma.department.update({ 
      where: { id }, 
      data: { isActive: !dept.isActive } 
    });
    
    await logAudit({
      userId: req.user?.sub || "system", 
      action: updated.isActive ? "DEPARTMENT_ACTIVATE" : "DEPARTMENT_DEACTIVATE",
      entity: "Department", 
      entityId: id,
    });
    
    const io = req.app.get("io");
    if (io) {
      io.emit("department_updated", { type: "toggled", department: updated });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error toggling department:", error);
    res.status(500).json({ error: "Gagal mengubah status departemen" });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    
    await logAudit({ 
      userId: req.user?.sub || "system", 
      action: "DEPARTMENT_DELETE", 
      entity: "Department", 
      entityId: id 
    });
    
    const io = req.app.get("io");
    if (io) {
      io.emit("department_updated", { type: "deleted", departmentId: id });
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ error: "Gagal menghapus departemen (mungkin sedang digunakan)" });
  }
}

module.exports = { list, create, toggleActive, remove };