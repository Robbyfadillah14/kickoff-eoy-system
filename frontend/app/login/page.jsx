"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../../lib/api";
import { BrandLogo } from "../../components/Branding";

export default function LoginPage() {
  const router = useRouter();
  
  // State Mode Login: "email" (Super Admin) atau "passcode" (Divisi Plant)
  const [loginMode, setLoginMode] = useState("passcode");

  // State Form Email Login
  const [email, setEmail] = useState("superadmin@ekasurya.local");
  const [password, setPassword] = useState("password123");

  // State Form Passcode Login
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load daftar Plant saat mode passcode aktif
  useEffect(() => {
    if (loginMode === "passcode") {
      fetch(`${API_URL}/api/plants`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setPlants(data.data);
        })
        .catch(err => console.error("Gagal load plant:", err));
    }
  }, [loginMode]);

  // Load daftar Departemen otomatis saat Plant dipilih
  useEffect(() => {
    if (!selectedPlant) {
      setDepartments([]);
      setSelectedDept("");
      return;
    }

    fetch(`${API_URL}/api/plants/${selectedPlant}/departments`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setDepartments(data.data);
      })
      .catch(err => console.error("Gagal load departemen:", err));
  }, [selectedPlant]);

  // Handler Login Email (Super Admin)
  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Login gagal, cek email/password");
        setLoading(false);
        return;
      }

      const data = await res.json();
      saveSessionAndRedirect(data);
    } catch (err) {
      setError("Gagal terhubung ke server.");
      setLoading(false);
    }
  }

  // Handler Login Passcode (Plant & Divisi)
  async function handlePasscodeLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login-passcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantId: selectedPlant,
          departmentId: selectedDept,
          accessCode: accessCode
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal login dengan passcode");

      saveSessionAndRedirect(data);
    } catch (err) {
      setError(err.message || "Kode Akses atau Plant/Divisi salah");
      setLoading(false);
    }
  }

  // Helper Simpan Sesi & Redirect
  function saveSessionAndRedirect(data) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    
    const loggedUser = data.user || data;
    localStorage.setItem("user", JSON.stringify({
      ...loggedUser,
      departmentId: loggedUser.departmentId || loggedUser.departments?.[0]?.departmentId || loggedUser.department?.id
    }));

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="bg-card border border-line rounded-2xl p-8 w-full max-w-md space-y-5">
        <div className="flex justify-center mb-1"><BrandLogo size={44} /></div>
        <h1 className="text-lg font-bold text-center text-white">Masuk — Kickoff & EOY Reporting</h1>

        {/* Tab Switcher Mode Login */}
        <div className="flex bg-bg2 p-1 rounded-lg border border-line text-xs font-medium">
          <button
            type="button"
            onClick={() => { setLoginMode("passcode"); setError(""); }}
            className={`flex-1 py-2 rounded-md transition ${loginMode === "passcode" ? "bg-accent text-bg font-bold" : "text-sub hover:text-white"}`}
          >
            PIN Divisi / Plant
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode("email"); setError(""); }}
            className={`flex-1 py-2 rounded-md transition ${loginMode === "email" ? "bg-accent text-bg font-bold" : "text-sub hover:text-white"}`}
          >
            Super Admin (Email)
          </button>
        </div>

        {error && <p className="text-red-400 text-xs bg-red-500/10 p-2.5 rounded border border-red-500/20">{error}</p>}

        {/* FORM 1: LOGIN PASSCODE / PIN DIVISI */}
        {loginMode === "passcode" ? (
          <form onSubmit={handlePasscodeLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs text-sub mb-1">Pilih Plant / Cabang</label>
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="w-full bg-bg2 border border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                required
                autoComplete="off"
              >
                <option value="">-- Pilih Plant --</option>
                {plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name} ({plant.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-sub mb-1">Pilih Divisi / Departemen</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-bg2 border border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                required
                disabled={!selectedPlant}
                autoComplete="off"
              >
                <option value="">-- Pilih Divisi --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-sub mb-1">Passcode / PIN Akses</label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Contoh: CKR-LOGIS-2026"
                className="w-full bg-bg2 border border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                required
                autoComplete="new-password"
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-accent text-bg font-semibold rounded-lg py-2.5 text-sm transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
            >
              {loading ? "Memproses..." : "Masuk Sesi Divisi"}
            </button>
          </form>
        ) : (
          /* FORM 2: LOGIN EMAIL (SUPER ADMIN) */
          <form onSubmit={handleEmailLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs text-sub mb-1">Email Administrator</label>
              <input 
                className="w-full bg-bg2 border border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email" 
                required 
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs text-sub mb-1">Password</label>
              <input 
                className="w-full bg-bg2 border border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password" 
                required 
                autoComplete="new-password"
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-accent text-bg font-semibold rounded-lg py-2.5 text-sm transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
            >
              {loading ? "Sedang masuk..." : "Login Admin"}
            </button>
            <a href="#" className="block text-xs text-sub text-center hover:text-white pt-1">Lupa password?</a>
          </form>
        )}
      </div>
    </div>
  );
}