const { verifyAccessToken } = require("../utils/jwt");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token tidak ditemukan" });
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token tidak valid atau kedaluwarsa" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Akses ditolak untuk role ini" });
    }
    next();
  };
}

function scopeToOwnPlantDept(req, res, next) {
  if (req.user.role === "DEPARTMENT_CONTRIBUTOR") {
    req.scopedPlantId = req.user.plantId;
    req.scopedDepartmentId = req.user.departmentId;
  }
  next();
}

module.exports = { authenticate, requireRole, scopeToOwnPlantDept };
