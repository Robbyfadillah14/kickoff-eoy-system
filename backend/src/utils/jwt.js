const jwt = require("jsonwebtoken");

const ACCESS_TTL = "15m";       // access token pendek
const REFRESH_TTL_DAYS = 7;     // refresh token panjang -> sesi tak putus saat acara molor

function signAccessToken(user) {
  // Ambil departmentId langsung atau dari relasi array departments
  const userDeptId = user.departmentId || user.departments?.[0]?.departmentId || null;
  
  return jwt.sign(
    { sub: user.id, role: user.role, plantId: user.plantId, departmentId: userDeptId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TTL_DAYS}d`,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, REFRESH_TTL_DAYS };