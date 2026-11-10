"use client";

import React from "react";

// Konfigurasi branding holding dengan sentuhan tema Run, Grow, Transform
export const BRAND = {
  name: "Ekasurya Group",
  tagline: "RUN • GROW • TRANSFORM",
  primary: "#06b6d4", // Cyan-500 modern
  secondary: "#10b981", // Emerald accent
  accentGlow: "rgba(6, 182, 212, 0.15)",
};

export function BrandLogo({ size = 36, showName = true, className = "" }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative flex items-center justify-center transition-transform hover:scale-105 duration-200">
        {/* Glow Background Effect */}
        <div 
          className="absolute inset-0 rounded-xl blur-sm opacity-60 pointer-events-none"
          style={{ backgroundColor: BRAND.accentGlow }}
        />
        
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 48 48" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 shadow-lg rounded-xl border border-slate-700/50"
        >
          {/* Latar Belakang Kotak Gelap */}
          <rect width="48" height="48" rx="12" fill="#090d16" />
          
          {/* Garis Aksen Geometris Grafik Naik (Cyan) */}
          <path 
            d="M10 33 L22 15 L38 33" 
            stroke={BRAND.primary} 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          
          {/* Titik Inti Node */}
          <circle cx="22" cy="24" r="4" fill={BRAND.primary} />
          <circle cx="38" cy="33" r="2.5" fill={BRAND.secondary} />
        </svg>
      </div>

      {showName && (
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-sm tracking-wide text-white leading-tight">
            {BRAND.name}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono font-bold tracking-wider leading-tight pt-0.5">
            {BRAND.tagline}
          </span>
        </div>
      )}
    </div>
  );
}