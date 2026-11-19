import { DEPARTMENTS } from "./departments.js";

/** Peta tahun -> fase cerita (Run · Grow · Transform · Future) */
export const YEARS = [
  { year: 2024, phase: "RUN", label: "Run" },
  { year: 2025, phase: "GROW", label: "Grow" },
  { year: 2026, phase: "TRANSFORM", label: "Transform" },
  { year: 2027, phase: "FUTURE", label: "Future" },
];
export const YEAR_LIST = YEARS.map((y) => y.year);
export const phaseOf = (year) => YEARS.find((y) => y.year === Number(year)) || null;

/** Klaster = satu deck presentasi. Id sama dengan parameter ?cluster= yang sudah dipakai live page. */
export const CLUSTERS = {
  COMMERCIAL:              { id: "COMMERCIAL",              label: "Commercial / Sales",       deck: "CommercialDeck" },
  DIGITAL_MARKETING:       { id: "DIGITAL_MARKETING",       label: "Digital Marketing",        deck: "DigitalMarketingDeck" },
  PRODUCT_DEVELOPMENT:     { id: "PRODUCT_DEVELOPMENT",     label: "Product Development",      deck: "ProductDevelopmentDeck" },
  FINANCIAL:               { id: "FINANCIAL",               label: "Financial & Tax",          deck: "FinancialDeck" },
  OPERATIONAL_HOSPITALITY: { id: "OPERATIONAL_HOSPITALITY", label: "Operational & Logistics",  deck: "OperationalHospitalityDeck" },
};

const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const byName = new Map(DEPARTMENTS.map((d) => [norm(d.name), d]));
const byCode = new Map(DEPARTMENTS.map((d) => [d.code, d]));

/**
 * Cocokkan departemen dengan registry. Menerima string nama, atau objek { code?, name }.
 * Pencocokan EXACT (bukan substring) -> tidak ada lagi "Warehouse" nyasar ke Financial karena mengandung "ar".
 * Mengembalikan null bila belum dipetakan: pemanggil wajib menampilkan pesan yang jelas, jangan menebak.
 */
export function resolveDepartment(input) {
  if (!input) return null;
  if (typeof input === "object") {
    if (input.code && byCode.has(input.code)) return byCode.get(input.code);
    return byName.get(norm(input.name)) || null;
  }
  return byName.get(norm(input)) || byCode.get(String(input)) || null;
}

export const clusterOfDepartment = (input) => resolveDepartment(input)?.cluster ?? null;
export const formKeyOfDepartment = (input) => resolveDepartment(input)?.form ?? null;
/** departemen yang datanya dipakai deck klaster ini (urutan = prioritas merge) */
export const feedersOf = (clusterId) => DEPARTMENTS.filter((d) => d.feeds.includes(clusterId));
/** departemen yang "memiliki" klaster (untuk menghitung kelengkapan pengisian) */
export const ownersOf = (clusterId) => DEPARTMENTS.filter((d) => d.cluster === clusterId);
export { DEPARTMENTS };