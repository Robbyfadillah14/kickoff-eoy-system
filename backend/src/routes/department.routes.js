const router = require("express").Router();
const ctrl = require("../controllers/departmentController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/", authenticate, ctrl.list); // semua role boleh lihat daftar aktif
router.post("/", authenticate, requireRole("SUPER_ADMIN"), ctrl.create);
router.patch("/:id/toggle", authenticate, requireRole("SUPER_ADMIN"), ctrl.toggleActive);
router.delete("/:id", authenticate, requireRole("SUPER_ADMIN"), ctrl.remove);

module.exports = router;
