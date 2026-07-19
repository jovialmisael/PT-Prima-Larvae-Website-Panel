/* ===========================================================================
   seed.js — data contoh untuk struktur 3 divisi. Disuntik sekali oleh
   api.ensureSeeded(). Relatif terhadap hari ini agar peringatan tampil.
   =========================================================================== */

const iso = (d) => d.toISOString();
const dateStr = (o) => { const d = new Date(); d.setDate(d.getDate() - o); return d.toISOString().slice(0, 10); };
const stamp = (o) => { const d = new Date(); d.setDate(d.getDate() - o); return iso(d); };
const jitter = (b, a) => Math.round((b + (Math.random() - 0.5) * a) * 100) / 100;
const person = (name, role, o) => ({ name, role, at: stamp(o) });

// ---------- Master tank ----------
const tank = [
  { id: 'tank-1', namaTank: 'Tank A1', batchInduk: 'IND-2601', umurInduk: 380, tanggalTebar: dateStr(9), stadiaSekarang: 'Z3', tambakTujuan: 'Tambak Sukamaju', status: 'Aktif', createdAt: stamp(9), updatedAt: stamp(1) },
  { id: 'tank-2', namaTank: 'Tank A2', batchInduk: 'IND-2601', umurInduk: 380, tanggalTebar: dateStr(9), stadiaSekarang: 'M1', tambakTujuan: 'Tambak Sukamaju', status: 'Aktif', createdAt: stamp(9), updatedAt: stamp(1) },
  { id: 'tank-3', namaTank: 'Tank B1', batchInduk: 'IND-2602', umurInduk: 350, tanggalTebar: dateStr(8), stadiaSekarang: 'Z2', tambakTujuan: 'Tambak Harapan', status: 'Aktif', createdAt: stamp(8), updatedAt: stamp(1) },
];

// ---------- Produksi: air harian larva (7 hari × 3 tank) ----------
const profiles = {
  'tank-1': { suhuP: 29, suhuS: 30, do: 6.1, phP: 8.0, phS: 8.1, sal: 31, tan: 0.25, nitrit: 0.3, alk: 122 },
  'tank-2': { suhuP: 29.5, suhuS: 31.2, do: 4.8, phP: 8.1, phS: 8.35, sal: 31, tan: 0.7, nitrit: 1.6, alk: 108 },
  'tank-3': { suhuP: 30, suhuS: 32.4, do: 3.7, phP: 8.2, phS: 8.55, sal: 30, tan: 1.9, nitrit: 5.2, alk: 95 },
};
function prodVerif(tankId, off) {
  const d = person('Petugas Produksi', 'petugasProd', off);
  const s = person('Kepala Produksi', 'kepalaProd', off);
  const p = person('Kepala MPM', 'kepalaMpm', off);
  if (off !== 0) return { status: 'Diperiksa', dibuatOleh: d, disahkanOleh: s, diperiksaOleh: p };
  if (tankId === 'tank-1') return { status: 'Diperiksa', dibuatOleh: d, disahkanOleh: s, diperiksaOleh: p };
  if (tankId === 'tank-2') return { status: 'Disahkan', dibuatOleh: d, disahkanOleh: s };
  return { status: 'Draft', dibuatOleh: d };
}
const prodLarvae = [];
for (const tankId of Object.keys(profiles)) {
  const p = profiles[tankId];
  for (let off = 6; off >= 0; off--) {
    const drift = (6 - off) * 0.04;
    prodLarvae.push({
      id: `pl-${tankId}-${off}`, tanggal: dateStr(off), tankId,
      suhuPagi: jitter(p.suhuP, 0.4), suhuSore: jitter(p.suhuS, 0.5), do: jitter(p.do, 0.3),
      phPagi: jitter(p.phP, 0.06), phSore: jitter(p.phS, 0.06), salinitas: jitter(p.sal, 0.6),
      tan: Math.round((p.tan + drift * p.tan) * 100) / 100,
      nitrit: Math.round((p.nitrit + drift * p.nitrit) * 100) / 100,
      alkalinitas: Math.round(jitter(p.alk, 4)), pergantianAir: tankId === 'tank-3' ? 40 : 20, pakan: 'Artemia + pelet',
      ...prodVerif(tankId, off), catatan: '', createdAt: stamp(off), updatedAt: stamp(off),
    });
  }
}

// ---------- Produksi: persiapan water ----------
const prodPersiapanWater = [
  { id: 'pw-1', tanggal: dateStr(1), klorin: 30, ph: 8.0, orpIn: 540, orpOn: 180, resirkulasi: 14, usiaKarbon: 30, suhuTandon: 30, salinitas: 31, status: 'Diperiksa', dibuatOleh: person('Petugas Produksi', 'petugasProd', 1), disahkanOleh: person('Kepala Produksi', 'kepalaProd', 1), diperiksaOleh: person('Kepala MPM', 'kepalaMpm', 1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'pw-2', tanggal: dateStr(0), klorin: 30, ph: 8.1, orpIn: 565, orpOn: 130, resirkulasi: 9, usiaKarbon: 55, suhuTandon: 32.5, salinitas: 30, catatan: 'ORP in mendekati maks, karbon lewat batas.', status: 'Draft', dibuatOleh: person('Petugas Produksi', 'petugasProd', 0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Produksi: induk / maturasi ----------
const prodInduk = [
  { id: 'pi-1', tanggal: dateStr(1), kodeBatch: 'IND-2601', umurInduk: 380, suhuAir: 28.5, salinitas: 32, do: 5.4, ph: 8.1, insang: 'Baik', orange: 'Ada', plankton: 'Tidak ada', jumlahTelur: 250000, fertil: 88, hatching: 82, jumlahNauplii: 180000, abnormalNauplii: 3, status: 'Diperiksa', dibuatOleh: person('Petugas Produksi', 'petugasProd', 1), disahkanOleh: person('Kepala Produksi', 'kepalaProd', 1), diperiksaOleh: person('Kepala MPM', 'kepalaMpm', 1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'pi-2', tanggal: dateStr(0), kodeBatch: 'IND-2602', umurInduk: 350, suhuAir: 29, salinitas: 32, do: 5.1, ph: 8.2, insang: 'Bermasalah', orange: 'Tidak ada', plankton: 'Ada', jumlahTelur: 210000, fertil: 72, hatching: 58, jumlahNauplii: 120000, abnormalNauplii: 9, status: 'Draft', dibuatOleh: person('Petugas Produksi', 'petugasProd', 0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: mikrobiologi ----------
const labMikro = [
  { id: 'lm-1', tanggal: dateStr(1), tankId: 'tank-1', titik: 'Air tank larva', stadia: 'Z3', vibrio: 'Tidak ada', tvc: 640, tbc: 6400, tcbsHijau: 6, tcbsKuning: 34, tcbsLuminescent: 0, status: 'Diperiksa', dibuatOleh: person('Analis Lab', 'analisLab', 1), disahkanOleh: person('Kepala Lab', 'kepalaLab', 1), diperiksaOleh: person('Kepala MPM', 'kepalaMpm', 1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'lm-2', tanggal: dateStr(1), tankId: 'tank-2', titik: 'Air tank larva', stadia: 'M1', vibrio: 'Ada', tvc: 3200, tbc: 32000, tcbsHijau: 40, tcbsKuning: 180, tcbsLuminescent: 0, status: 'Disahkan', dibuatOleh: person('Analis Lab', 'analisLab', 1), disahkanOleh: person('Kepala Lab', 'kepalaLab', 1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'lm-3', tanggal: dateStr(0), tankId: 'tank-3', titik: 'Air tank larva', stadia: 'Z2', vibrio: 'Ada', tvc: 6400, tbc: 86000, tcbsHijau: 120, tcbsKuning: 400, tcbsLuminescent: 120, status: 'Draft', dibuatOleh: person('Analis Lab', 'analisLab', 0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: cek harian larva ----------
const labCekLarva = [
  { id: 'cl-1', tanggal: dateStr(1), tankId: 'tank-1', stadiaDominan: 'Z3', doc: 9, mortalitas: 3, abnormal: 2, nekrosis: 0, kanibalisme: 1, problemMolting: 3, protozoa: 'Tidak ada', zoothamnium: 'Tidak ada', vorticella: 'Tidak ada', filamen: 'Tidak ada', sr: 96, ususKosong: 8, count: 9303, hasilMikro: 'Tidak ada', status: 'Diperiksa', dibuatOleh: person('Analis Lab', 'analisLab', 1), disahkanOleh: person('Kepala Lab', 'kepalaLab', 1), diperiksaOleh: person('Kepala MPM', 'kepalaMpm', 1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'cl-2', tanggal: dateStr(0), tankId: 'tank-3', stadiaDominan: 'Z2', doc: 8, mortalitas: 12, abnormal: 8, nekrosis: 5, kanibalisme: 4, problemMolting: 16, protozoa: 'Banyak', zoothamnium: 'Sedikit', vorticella: 'Sedikit', filamen: 'Sedikit', penvort: 4, sr: 72, ususKosong: 55, count: 6400, hasilMikro: 'Ada', status: 'Draft', dibuatOleh: person('Analis Lab', 'analisLab', 0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: kualitas algae ----------
const labAlgae = [
  { id: 'la-1', tanggal: dateStr(1), jenis: 'Chaetoceros', hasilMikro: 'Tidak ada', density: 1800000, grade: 'A', nitrit: 0.4, status: 'Diperiksa', dibuatOleh: person('Analis Lab', 'analisLab', 1), disahkanOleh: person('Kepala Lab', 'kepalaLab', 1), diperiksaOleh: person('Kepala MPM', 'kepalaMpm', 1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'la-2', tanggal: dateStr(0), jenis: 'Thalassiosira', hasilMikro: 'Tidak ada', density: 950000, grade: 'B', nitrit: 1.4, status: 'Draft', dibuatOleh: person('Analis Lab', 'analisLab', 0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: PCR & kimia ----------
const labPcrKimia = [
  { id: 'pk-1', tanggal: dateStr(2), sampel: 'Induk', kode: 'IND-2602', pcrWSSV: 'Negatif', pcrIMNV: 'Negatif', pcrEHP: 'Positif', pcrAHPND: 'Negatif', pcrIHHNV: 'Negatif', nitrit: 0.6, status: 'Diperiksa', dibuatOleh: person('Analis Lab', 'analisLab', 2), disahkanOleh: person('Kepala Lab', 'kepalaLab', 2), diperiksaOleh: person('Kepala MPM', 'kepalaMpm', 2), createdAt: stamp(2), updatedAt: stamp(2) },
];

// ---------- Lab: temuan & rekomendasi ----------
const temuanLab = [
  { id: 'tm-1', tanggal: dateStr(1), area: 'Water', parameter: 'pH air', temuan: 'pH sore cenderung tinggi (>8.4) berkorelasi dengan NH3 naik di Tank B1.', rekomendasi: 'Turunkan target pH sore ke 8.1–8.2 dan tambah pergantian air.', status: 'Baru', dibuatOleh: person('Kepala Lab', 'kepalaLab', 1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'tm-2', tanggal: dateStr(3), area: 'Algae', parameter: 'Grade algae', temuan: 'Grade algae turun ke B saat density < 1 juta sel/mL.', rekomendasi: 'Pertahankan density > 1,2 juta sel/mL sebelum pakan diberikan.', status: 'Diterapkan', dibuatOleh: person('Kepala Lab', 'kepalaLab', 3), diterapkanOleh: person('Kepala Produksi', 'kepalaProd', 2), createdAt: stamp(3), updatedAt: stamp(2) },
];

export const SEED = {
  tank, prodLarvae, prodPersiapanWater, prodInduk,
  labMikro, labCekLarva, labAlgae, labPcrKimia, temuanLab,
};
