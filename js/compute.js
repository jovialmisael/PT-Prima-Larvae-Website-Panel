/* ===========================================================================
   compute.js — nilai yang dihitung, bukan diukur.
   Dipakai oleh form (auto-hitung saat input) dan tabel/grafik (saat baca).
   =========================================================================== */

export function num(v) {
  if (v === '' || v === null || v === undefined) return NaN;
  const n = Number(v);
  return Number.isNaN(n) ? NaN : n;
}

function round(n, d = 2) {
  if (Number.isNaN(n) || n === null) return null;
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

/* --- NH3 (amonia tak terionisasi) --------------------------------------------
   Hanya NH3 yang beracun bagi larva; proporsinya naik tajam seiring pH.
   Fraksi tak terionisasi: f = 1 / (1 + 10^(pKa - pH))

   pKa bergantung suhu (Emerson et al. 1975) dengan koreksi salinitas untuk
   air laut (pendekatan Bower & Bidwell 1978). Konstanta bersifat perkiraan
   untuk prototype dan sebaiknya dikalibrasi dari data siklus sendiri.
   -------------------------------------------------------------------------- */
export function nh3Fraction(tempC, pH, salinity) {
  const T = tempC + 273.15;
  let pKa = 0.09018 + 2729.92 / T;            // basis air tawar (Emerson 1975)
  const S = Number.isNaN(salinity) ? 0 : salinity;
  pKa += 0.000135 * S;                        // koreksi salinitas (perkiraan air laut)
  return 1 / (1 + Math.pow(10, pKa - pH));
}

export function computeNH3(tan, pH, tempC, salinity) {
  if ([tan, pH, tempC].some((x) => Number.isNaN(x))) return null;
  return round(tan * nh3Fraction(tempC, pH, salinity), 4);
}

/* --- Peta fungsi terhitung: key `compute` di schema → fungsi(record) --------- */
export const COMPUTED = {
  // NH3 dari TAN + pH (pakai pH & suhu sore bila ada, jika tidak pakai pagi) + salinitas
  nh3: (r) => {
    const pH = num(r.phSore) || num(r.phPagi);
    const suhu = num(r.suhuSore) || num(r.suhuPagi);
    return computeNH3(num(r.tan), pH, suhu, num(r.salinitas));
  },
  suhuDelta: (r) => {
    const a = num(r.suhuPagi), b = num(r.suhuSore);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return round(Math.abs(b - a), 2);
  },
  phDelta: (r) => {
    const a = num(r.phPagi), b = num(r.phSore);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return round(Math.abs(b - a), 2);
  },
};

// Hitung nilai sebuah field computed pada sebuah record
export function computeField(field, record) {
  const fn = COMPUTED[field.compute];
  return fn ? fn(record) : null;
}

/* --- Statistik sebaran (untuk kalibrasi batas dari data siklus) --- */
export function stats(values) {
  const arr = values.map(num).filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
  const n = arr.length;
  if (!n) return { n: 0 };
  const mean = arr.reduce((s, v) => s + v, 0) / n;
  const variance = n > 1 ? arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
  const pct = (p) => {
    if (n === 1) return arr[0];
    const idx = (n - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
    return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
  };
  return {
    n, mean: round(mean, 3), sd: round(Math.sqrt(variance), 3), min: arr[0], max: arr[n - 1],
    p05: round(pct(0.05), 3), p10: round(pct(0.10), 3), p50: round(pct(0.50), 3),
    p90: round(pct(0.90), 3), p95: round(pct(0.95), 3),
  };
}

/* Usulkan batas dari sebaran, mengikuti orientasi field:
   - hanya batas atas (mis. NH3, TVC): aman = p90, bahaya = p95
   - hanya batas bawah (mis. DO, SR):  aman = p10, bahaya = p05
   - rentang (mis. pH, suhu):          aman = p10..p90, bahaya = p05..p95 */
export function suggestBounds(values, field) {
  const s = stats(values);
  if (!s.n) return null;
  const base = field.threshold || {};
  const hasMax = base.safeMax != null || base.dangerMax != null;
  const hasMin = base.safeMin != null || base.dangerMin != null;
  const bounds = {};
  if (hasMax) { bounds.safeMax = s.p90; bounds.dangerMax = s.p95; }
  if (hasMin) { bounds.safeMin = s.p10; bounds.dangerMin = s.p05; }
  if (!hasMax && !hasMin) { bounds.safeMin = s.p10; bounds.safeMax = s.p90; bounds.dangerMin = s.p05; bounds.dangerMax = s.p95; }
  return { bounds, stats: s };
}
