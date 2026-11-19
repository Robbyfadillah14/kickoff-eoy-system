import { YEAR_LIST, CLUSTERS, feedersOf, ownersOf, phaseOf, resolveDepartment } from "./registry.js";
import { isEmptyValue } from "./numbers.js";

/** key meta yang selalu terisi default form -> tidak dihitung sebagai "departemen sudah mengisi" */
const META_KEYS = new Set(["salesType"]);

const asObject = (m) => {
  if (m && typeof m === "object" && !Array.isArray(m)) return m;
  if (typeof m === "string") { try { const p = JSON.parse(m); return p && typeof p === "object" ? p : {}; } catch { return {}; } }
  return {};
};
const newer = (a, b) => (!a || new Date(b.updatedAt || 0) > new Date(a.updatedAt || 0) ? b : a);

/**
 * Menggabungkan laporan antar-departemen untuk SATU klaster dan SATU plant.
 *
 * @param reports  hasil /api/reports (boleh campur plant/departemen/tahun; tiap item butuh year, plant/plantId, department.name, metricsJson)
 * @param opts.cluster  id klaster (lihat CLUSTERS)
 * @param opts.plantId  WAJIB bila reports berisi lebih dari satu plant -> kalau tidak, hasilnya needsPlant=true (tidak ada data yang dicampur)
 *
 * Aturan merge (flat `metrics`): hanya nilai TIDAK KOSONG yang masuk; bila dua departemen mengisi key yang sama, yang lebih awal di registry menang.
 * Nilai asli per departemen selalu tersedia di `byDept`, jadi tidak ada informasi yang hilang.
 */
export function buildClusterData(reports, { cluster, plantId = null, years = YEAR_LIST } = {}) {
  const list = Array.isArray(reports) ? reports : [];
  const feeders = feedersOf(cluster);
  const owners = ownersOf(cluster);
  const pid = (r) => r.plantId || r.plant?.id || null;

  const plantsSeen = new Set(list.map(pid).filter(Boolean));
  const needsPlant = !plantId && plantsSeen.size > 1;
  const wantedPlant = needsPlant ? null : plantId || [...plantsSeen][0] || null;

  // indeks (tahun|kode departemen) -> laporan terbaru
  const index = new Map();
  if (!needsPlant) {
    for (const r of list) {
      if (wantedPlant && pid(r) !== wantedPlant) continue;
      const dept = resolveDepartment(r.department ?? r.departmentName);
      if (!dept) continue;
      const key = `${Number(r.year)}|${dept.code}`;
      index.set(key, newer(index.get(key), r));
    }
  }

  const out = {};
  for (const year of years) {
    const b = {
      year, phase: phaseOf(year)?.phase ?? null,
      reports: [], byDept: {}, metrics: {}, sources: {},
      filled: [], missing: [], hasData: false,
    };
    for (const dept of feeders) {
      const rep = index.get(`${year}|${dept.code}`);
      const m = asObject(rep?.metricsJson);
      const content = Object.keys(m).filter((k) => !META_KEYS.has(k) && !isEmptyValue(m[k]));

      if (rep) {
        b.reports.push(rep);
        b.byDept[dept.code] = { dept, report: rep, metrics: m, filledKeys: content };
      }
      if (content.length) {
        b.hasData = true;
        for (const k of Object.keys(m)) {
          if (isEmptyValue(m[k]) || k in b.metrics) continue;
          b.metrics[k] = m[k];
          b.sources[k] = dept.code;
        }
      }
      if (dept.cluster === cluster) (content.length ? b.filled : b.missing).push(dept.code);
    }
    out[year] = b;
  }

  return {
    cluster, plantId: wantedPlant, needsPlant,
    years: out,
    availableYears: years.filter((y) => out[y].hasData),
    completeness: Object.fromEntries(years.map((y) => [y, { filled: out[y].filled.length, total: owners.length, missing: out[y].missing }])),
  };
}

/** Nilai teks per departemen untuk key tertentu, mis. outlook 2027 per departemen (bukan satu string campuran). */
export function collectByDept(bucket, keys) {
  const list = Array.isArray(keys) ? keys : [keys];
  const out = [];
  for (const [code, entry] of Object.entries(bucket?.byDept ?? {})) {
    for (const k of list) {
      const v = entry.metrics?.[k];
      if (!isEmptyValue(v)) { out.push({ code, name: entry.dept.name, key: k, value: v }); break; }
    }
  }
  return out;
}

/* ---------- Adapter agar deck lama langsung dapat data lengkap tanpa ditulis ulang ---------- */

/** satu "laporan semu" per tahun: metricsJson = hasil gabungan seluruh departemen klaster */
export function toLegacyReport(data, year) {
  const b = data?.years?.[year];
  if (!b || !b.hasData) return null;
  const first = b.reports[0] || {};
  return {
    ...first, year: Number(year),
    department: { name: CLUSTERS[data.cluster]?.label ?? data.cluster },
    metricsJson: b.metrics, _merged: true, _sources: b.sources, _byDept: b.byDept,
  };
}

/** bentuk yang dibaca deck lama: { 2024: [report], 2025: [report], ... } */
export function toLegacyYearlyMap(data) {
  const map = {};
  for (const y of Object.keys(data?.years ?? {})) {
    const r = toLegacyReport(data, Number(y));
    map[y] = r ? [r] : [];
  }
  return map;
}