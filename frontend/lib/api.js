// Paksa kosongkan API_URL agar menggunakan relative path domain Vercel saat ini (Monorepo)
const API_URL = "";

export async function apiFetch(path, options = {}) {
  const token = typeof window !== "undefined" 
    ? (localStorage.getItem("accessToken") || localStorage.getItem("token")) 
    : null;
    
  const headers = {
    ...(options.headers || {}),
  };
  
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = cleanPath;

  const res = await fetch(fullUrl, { ...options, headers, credentials: "include" });
  
  const contentType = res.headers.get("content-type");
  let resultData = null;

  if (contentType && contentType.includes("application/json")) {
    resultData = await res.json();
  } else {
    const textError = await res.text();
    try {
      resultData = JSON.parse(textError);
    } catch (e) {
      if (!res.ok) throw new Error(`Server Error (${res.status}): ${textError.slice(0, 100)}`);
      resultData = textError;
    }
  }

  if (!res.ok) {
    const errorMsg = (typeof resultData === "object" && resultData !== null) 
      ? (resultData.error || resultData.message || "Terjadi kesalahan pada server")
      : "Terjadi kesalahan pada server";
    throw new Error(errorMsg);
  }

  // AUTO-NORMALIZATION: Jika hasil fetch berupa objek yang punya properti array (seperti data, departments, list),
  // otomatis ekstrak array-nya agar komponen pemanggil tidak pernah error / kosong!
  if (resultData && typeof resultData === "object" && !Array.isArray(resultData)) {
    if (Array.isArray(resultData.data)) return resultData.data;
    if (Array.isArray(resultData.departments)) return resultData.departments;
    if (Array.isArray(resultData.list)) return resultData.list;
    
    // Cari properti apa saja yang berupa array di dalam objek response
    const foundArrayKey = Object.keys(resultData).find((k) => Array.isArray(resultData[k]));
    if (foundArrayKey) return resultData[foundArrayKey];
  }

  return resultData;
}

export { API_URL };