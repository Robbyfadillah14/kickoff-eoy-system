const router = require("express").Router();
const ctrl = require("../controllers/plantController");
const { authenticate, requireRole } = require("../middleware/auth");

// Endpoint publik untuk dropdown login passcode (tidak perlu token)
router.get("/", ctrl.list);
router.get("/:plantId/departments", ctrl.listDepartmentsByPlant);

// Endpoint yang butuh akses Super Admin tetap diproteksi
router.post("/", authenticate, requireRole("SUPER_ADMIN"), ctrl.create);

module.exports = router;