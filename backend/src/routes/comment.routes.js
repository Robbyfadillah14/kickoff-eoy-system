const router = require("express").Router();
const ctrl = require("../controllers/commentController");
const { authenticate } = require("../middleware/auth");

router.get("/report/:reportId", authenticate, ctrl.listByReport);
router.post("/", authenticate, ctrl.create);

module.exports = router;
