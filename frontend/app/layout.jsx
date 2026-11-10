"use client";
import Link from "next/navigation"; // Catatan: pastikan Link tetap dari "next/link"
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "./globals.css";

// Fix import Link yang benar untuk Next.js
import NextLink from "next/link";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUserRole(parsed.role || "");
        } catch (e) {
          console.error("Gagal parse user role:", e);
        }
      }
    }
  }, [pathname]);

  const isAdmin = userRole === "SUPER_ADMIN";
  const isManager = userRole === "DEPARTMENT_MANAGER";
  const canAccessPresentation = isAdmin || isManager;

  return (
    <html lang="id">
      <body className="bg-bg text-white antialiased min-h-screen flex flex-col font-sans">
        
        {/* HEADER NAVBAR (HANYA MUNCUL JIKA BUKAN HALAMAN LOGIN) */}
        {!isLoginPage && (
          <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-line px-4 lg:px-8 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              
              {/* BRAND / LOGO PERUSAHAAN */}
              <NextLink href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center font-bold text-accent text-sm group-hover:bg-accent group-hover:text-bg transition-all">
                  EII
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white tracking-wide leading-tight">
                    Ekasurya Group
                  </span>
                  <span className="text-[10px] text-sub leading-tight">
                    EOY & Kickoff System
                  </span>
                </div>
              </NextLink>

              {/* NAVIGASI MENU UTAMA */}
              <nav className="hidden md:flex items-center gap-1 bg-bg2/80 border border-line p-1 rounded-xl text-xs font-medium">
                <NextLink 
                  href="/dashboard" 
                  className="px-3 py-1.5 rounded-lg text-sub hover:text-white hover:bg-card transition-colors"
                >
                  Dashboard
                </NextLink>

                {/* MENU PRESENTASI HANYA UNTUK SUPER ADMIN & MANAGER */}
                {canAccessPresentation && (
                  <NextLink 
                    href="/presentation" 
                    className="px-3 py-1.5 rounded-lg text-sub hover:text-white hover:bg-card transition-colors"
                  >
                    Presentasi
                  </NextLink>
                )}

                {/* MENU KHUSUS SUPER ADMIN */}
                {isAdmin && (
                  <>
                    <NextLink 
                      href="/admin/departments" 
                      className="px-3 py-1.5 rounded-lg text-sub hover:text-white hover:bg-card transition-colors"
                    >
                      Departemen
                    </NextLink>
                    <NextLink 
                      href="/admin/audit-logs" 
                      className="px-3 py-1.5 rounded-lg text-sub hover:text-white hover:bg-card transition-colors"
                    >
                      Audit Logs
                    </NextLink>
                  </>
                )}
              </nav>

              {/* AREA AKUN & PROFIL PIC */}
              <div className="flex items-center gap-3">
                <NextLink
                  href="/login"
                  onClick={() => {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                  }}
                  className="text-xs bg-bg2 border border-line text-sub hover:text-white px-3 py-1.5 rounded-lg hover:border-accent transition-all"
                >
                  Keluar
                </NextLink>
              </div>

            </div>
          </header>
        )}

        {/* CONTAINER UTAMA HALAMAN (CHILDREN) */}
        <main className={`flex-1 w-full ${isLoginPage ? "p-0" : "max-w-7xl mx-auto p-4 lg:p-6"}`}>
          {children}
        </main>

        {/* FOOTER RINGKAS (HANYA MUNCUL JIKA BUKAN HALAMAN LOGIN) */}
        {!isLoginPage && (
          <footer className="border-t border-line/60 py-4 text-center text-[11px] text-sub bg-card/30">
            © {new Date().getFullYear()} PT Ekasurya Inout Indonesia — Kickoff & EOY System
          </footer>
        )}
      </body>
    </html>
  );
}