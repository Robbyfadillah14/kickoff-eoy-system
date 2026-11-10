const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

  // Gabungkan API_URL secara aman (menghindari path yang terpotong/undefined)
  const fullUrl = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;

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