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

/* --- Survival antar stadia (dipakai bila diperlukan) --- */
export function survivalRate(awal, akhir) {
  const a = num(awal), b = num(akhir);
  if (Number.isNaN(a) || Number.isNaN(b) || a === 0) return null;
  return round((b / a) * 100, 1);
}

/* --- Koefisien variasi dari daftar sampel panjang --- */
export function coefVariation(values) {
  const arr = values.map(num).filter((v) => !Number.isNaN(v));
  if (arr.length < 2) return null;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  if (mean === 0) return null;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1);
  return round((Math.sqrt(variance) / mean) * 100, 1);
}
