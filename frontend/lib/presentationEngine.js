// lib/presentationEngine.js
import { resolveDepartment, CLUSTERS, YEARS } from "./presentation/registry.js";
import { BRAND } from "./presentation/theme.js";

const CLUSTER_INFO = {
  COMMERCIAL: {
    themeColor: "cyan",
    focusMetrics: { OMZET: ["Total Omzet", "Sales Volume", "Client Pipeline"], PROFIT: ["Gross Profit Margin", "Net Profit", "Cost Efficiency"] },
    insight: {
      OMZET: "Fokus utama divisi Sales diarahkan pada pencapaian volume penjualan, penetrasi pasar, dan pertumbuhan omzet.",
      PROFIT: "Fokus utama divisi Sales diarahkan pada optimasi margin keuntungan, efisiensi HPP, dan produk high-margin.",
    },
  },
  DIGITAL_MARKETING: {
    themeColor: "emerald",
    focusMetrics: ["Lead Generation", "Social Media Growth", "Campaign Performance"],
    insight: "Fokus pada performa campaign, pertumbuhan audiens, dan konversi leads dari kanal digital.",
  },
  PRODUCT_DEVELOPMENT: {
    themeColor: "cyan",
    focusMetrics: ["Produk Baru", "Pengujian Sampel & Kepatuhan", "Evaluasi Pengembangan"],
    insight: "Fokus pada riset dan peluncuran produk baru, kepatuhan standar, serta evaluasi kualitas portofolio.",
  },
  FINANCIAL: {
    themeColor: "amber",
    focusMetrics: ["Cash Flow Health", "Tax Risk & Compliance", "Reconciliation & Bad Debt"],
    insight: "Analisis difokuskan pada kesehatan arus kas, kepatuhan pajak & mitigasi risiko Coretax, serta akurasi buku besar.",
  },
  OPERATIONAL_HOSPITALITY: {
    themeColor: "indigo",
    focusMetrics: ["Service Level Agreement (SLA)", "On-Time Delivery (OTD)", "Process & Compliance Efficiency"],
    insight: "Analisis difokuskan pada kepatuhan SLA, efisiensi rantai pasok/pengadaan, dan kelancaran operasional harian.",
  },
};

const asObject = (m) => {
  if (m && typeof m === "object" && !Array.isArray(m)) return m;
  if (typeof m === "string") { try { const p = JSON.parse(m); return p && typeof p === "object" ? p : {}; } catch { return {}; } }
  return {};
};

export function analyzePresentationContext(report, departmentName = "") {
  const name = departmentName || report?.department?.name || report?.departmentName || "";
  const dept = resolveDepartment(name);
  const cluster = dept?.cluster || "OPERATIONAL_HOSPITALITY";
  const info = CLUSTER_INFO[cluster];

  const metrics = asObject(report?.metricsJson);
  const salesType = cluster === "COMMERCIAL" ? (String(metrics.salesType || "").toUpperCase() === "PROFIT" ? "PROFIT" : "OMZET") : undefined;

  const base = {
    cluster,
    department: dept ? { code: dept.code, name: dept.name } : null,
    matched: !!dept,
    clusterName: CLUSTERS[cluster].label,
    themeColor: info.themeColor,
    brand: BRAND.tagline,
    years: YEARS,
  };
  if (cluster === "COMMERCIAL") {
    return {
      ...base, salesType,
      clusterName: `Commercial Sales (${salesType === "PROFIT" ? "Profit" : "Omzet"} Orientation)`,
      focusMetrics: info.focusMetrics[salesType],
      insight: info.insight[salesType],
    };
  }
  return { ...base, focusMetrics: info.focusMetrics, insight: info.insight };
}