const prisma = require("../config/db");

async function list(req, res) {
  const plants = await prisma.plant.findMany({ orderBy: { name: "asc" } });
  // Sesuaikan response format agar konsisten membungkus data di dalam objek { success: true, data: ... }
  res.json({ success: true, data: plants });
}

async function create(req, res) {
  const { name, code, isHolding } = req.body;
  const plant = await prisma.plant.create({ data: { name, code, isHolding: !!isHolding } });
  res.status(201).json({ success: true, data: plant });
}

// Tambahan fungsi untuk dropdown login passcode
async function listDepartmentsByPlant(req, res) {
  try {
    const { plantId } = req.params;

    const allowedAccess = await prisma.plantDepartmentAccess.findMany({
      where: { plantId: plantId },
      include: { department: true }
    });

    const departments = allowedAccess.map(access => access.department);

    res.json({ success: true, data: departments });
  } catch (error) {
    console.error("Error fetching departments by plant:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil data departemen" });
  }
}

module.exports = { list, create, listDepartmentsByPlant };