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

  // Gabungkan API_URL secara aman
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = cleanPath; // Karena API_URL = "", langsung gunakan path relatif (misal: "/api/plants")

  const res = await fetch(fullUrl, { ...options, headers, credentials: "include" });
  
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || "Terjadi kesalahan pada server");
    }
    return data;
  } else {
    const textError = await res.text();
    try {
      const jsonData = JSON.parse(textError);
      if (!res.ok) throw new Error(jsonData.error || `Server Error (${res.status})`);
      return jsonData;
    } catch (e) {
      throw new Error(`Server Error (${res.status}): ${textError.slice(0, 100)}`);
    }
  }
}

export { API_URL };