"use client";
import React from "react";
import { resolveDepartment } from "../../lib/presentation/index.js";
import CommercialDeck from "./CommercialDeck.jsx";
import { DigitalMarketingDeck, ProductDevelopmentDeck } from "./ClusterDeck.jsx";
import KpiDeck from "./KpiDeck.jsx";

/**
 * Deck pegangan SATU divisi: isinya hanya data divisi itu (2024–2027), persis tampilan presentasi klaster.
 * Sales / Digital Marketing / Product Development memang satu divisi = satu klaster, jadi memakai deck klasternya.
 * Divisi lain memakai KpiDeck mode satu divisi.
 */
export default function DeptDeck({ dept, reports, plantId = null, plantName = "", mode = "OMZET", active = true, onClose }) {
  const d = resolveDepartment(dept);
  if (!d) return null;
  const common = { reports, plantId, plantName, active, onClose };
  if (d.code === "SALES") return <CommercialDeck {...common} mode={mode} />;
  if (d.code === "DIG_MKT") return <DigitalMarketingDeck {...common} />;
  if (d.code === "PROD_DEV") return <ProductDevelopmentDeck {...common} />;
  return <KpiDeck deptCode={d.code} {...common} />;
}