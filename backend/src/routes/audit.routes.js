const router = require("express").Router();
const ctrl = require("../controllers/auditController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/", authenticate, requireRole("SUPER_ADMIN"), ctrl.list);

module.exports = router;
