const router = require("express").Router();
const ctrl = require("../controllers/authController");

router.post("/login", ctrl.login);
router.post("/login-passcode", ctrl.loginPasscode); // <-- Endpoint baru untuk login pakai PIN/Passcode per Plant & Divisi
router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.post("/password-reset/request", ctrl.requestPasswordReset);
router.post("/password-reset/confirm", ctrl.resetPassword);

module.exports = router;