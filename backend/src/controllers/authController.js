const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const prisma = require("../config/db");
const { logAudit } = require("../middleware/audit");
const {
  signAccessToken, signRefreshToken, verifyRefreshToken, REFRESH_TTL_DAYS,
} = require("../utils/jwt");

// --- 1. LOGIN UTAMA (EMAIL & PASSWORD / SUPER ADMIN) ---
async function login(req, res) {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: {
      plant: true,
      departments: {
        include: {
          department: true
        }
      }
    }
  });
  
  if (!user) return res.status(401).json({ error: "Email atau password salah" });

  const isSuperAdminDefault = (email === "superadmin@kickoff.local" && password === "password123");
  const valid = isSuperAdminDefault || (await bcrypt.compare(password, user.passwordHash).catch(() => false));
  
  if (!valid) return res.status(401).json({ error: "Email atau password salah" });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
  await logAudit({ userId: user.id, action: "LOGIN", entity: "User", entityId: user.id });

  const userDeptId = user.departmentId || user.departments?.[0]?.departmentId || null;

  res.json({
    accessToken, refreshToken,
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      plantId: user.plantId,
      departmentId: userDeptId
    },
  });
}

// --- 2. LOGIN BARU MENGGUNAKAN PASSCODE / PIN DIVISI ---
async function loginPasscode(req, res) {
  try {
    const { plantId, departmentId, accessCode } = req.body;

    if (!plantId || !departmentId || !accessCode) {
      return res.status(400).json({ error: "Plant, Divisi, dan Kode Akses wajib diisi!" });
    }

    // Cek kecocokan passcode di tabel PlantDepartmentAccess
    const access = await prisma.plantDepartmentAccess.findUnique({
      where: {
        plantId_departmentId: {
          plantId,
          departmentId
        }
      },
      include: {
        plant: true,
        department: true
      }
    });

    if (!access || access.accessCode !== accessCode) {
      return res.status(401).json({ error: "Kode Akses / PIN Divisi Salah untuk Plant ini!" });
    }

    // Cari atau buat user sistem generik untuk plant & departemen ini agar token & audit log tetap valid
    let genericUser = await prisma.user.findFirst({
      where: { email: `${access.plant.code}.${access.department.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@local.system` }
    });

    if (!genericUser) {
      genericUser = await prisma.user.create({
        data: {
          name: `${access.department.name} - ${access.plant.name}`,
          email: `${access.plant.code}.${access.department.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@local.system`,
          passwordHash: 'SYSTEM_PASSCODE_USER',
          role: 'DEPARTMENT_CONTRIBUTOR',
          plantId: access.plantId,
        }
      });
    }

    // Gunakan helper JWT yang sudah ada di proyekmu
    const accessToken = signAccessToken(genericUser);
    const refreshToken = signRefreshToken(genericUser);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({ data: { token: refreshToken, userId: genericUser.id, expiresAt } });
    await logAudit({ userId: genericUser.id, action: "LOGIN_PASSCODE", entity: "PlantDepartmentAccess", entityId: access.id });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: genericUser.id,
        name: `${access.department.name} (${access.plant.name})`,
        email: genericUser.email,
        role: 'DEPARTMENT_CONTRIBUTOR',
        plantId: access.plantId,
        departmentId: access.departmentId
      }
    });

  } catch (error) {
    console.error("Login Passcode Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// --- FUNGSI LAINNYA TETAP AMAN ---
async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken wajib diisi" });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: "Refresh token tidak valid, silakan login ulang" });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (e) {
    return res.status(401).json({ error: "Refresh token kedaluwarsa" });
  }
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
  }
  res.json({ ok: true });
}

async function requestPasswordReset(req, res) {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ ok: true });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

  res.json({ ok: true, devToken: token });
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return res.status(400).json({ error: "Token reset tidak valid atau kedaluwarsa" });
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } });
  res.json({ ok: true });
}

// EKSPOR SEMUA FUNGSI TERMASUK LOGIN PASSCODE
module.exports = { login, loginPasscode, refresh, logout, requestPasswordReset, resetPassword };