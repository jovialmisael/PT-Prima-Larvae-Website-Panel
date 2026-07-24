/* ===========================================================================
   seed.js — data contoh untuk struktur 3 divisi. Disuntik sekali oleh
   api.ensureSeeded(). Relatif terhadap hari ini agar peringatan tampil.
   =========================================================================== */

const iso = (d) => d.toISOString();
const dateStr = (o) => { const d = new Date(); d.setDate(d.getDate() - o); return d.toISOString().slice(0, 10); };
const stamp = (o) => { const d = new Date(); d.setDate(d.getDate() - o); return iso(d); };
const jitter = (b, a) => Math.round((b + (Math.random() - 0.5) * a) * 100) / 100;
const person = (name, role, o) => ({ name, role, at: stamp(o) });

// Stempel peran (rantai: Petugas → Ka.Sie → QC → Kabag MPM)
const sPetugasProd = (o) => person('Petugas Produksi', 'petugasProd', o);
const sKasieProd   = (o) => person('Ka.Sie Produksi', 'kasieProd', o);
const sPetugasLab  = (o) => person('Petugas Lab', 'petugasLab', o);
const sKasieLab    = (o) => person('Ka.Sie Lab', 'kasieLab', o);
const sQc          = (o) => person('Petugas QC', 'qc', o);
const sMpm         = (o) => person('Kabag MPM', 'kabagMpm', o);

// Rantai pengesahan penuh (status Disahkan) untuk data lampau
const doneProd = (o) => ({ status: 'Disahkan', dibuatOleh: sPetugasProd(o), diparafKasie: sKasieProd(o), diparafQc: sQc(o), disahkanMpm: sMpm(o) });
const doneLab  = (o) => ({ status: 'Disahkan', dibuatOleh: sPetugasLab(o),  diparafKasie: sKasieLab(o),  diparafQc: sQc(o), disahkanMpm: sMpm(o) });

// ---------- Master tank ----------
const tank = [
  { id: 'tank-1', namaTank: 'Tank A1', batchInduk: 'IND-2601', umurInduk: 380, tanggalTebar: dateStr(9), stadiaSekarang: 'Z3', tambakTujuan: 'Tambak Sukamaju', status: 'Aktif', hasilSiklus: 'Berhasil', srFinal: 84, createdAt: stamp(9), updatedAt: stamp(1) },
  { id: 'tank-2', namaTank: 'Tank A2', batchInduk: 'IND-2601', umurInduk: 380, tanggalTebar: dateStr(9), stadiaSekarang: 'M1', tambakTujuan: 'Tambak Sukamaju', status: 'Aktif', hasilSiklus: 'Berjalan', createdAt: stamp(9), updatedAt: stamp(1) },
  { id: 'tank-3', namaTank: 'Tank B1', batchInduk: 'IND-2602', umurInduk: 350, tanggalTebar: dateStr(8), stadiaSekarang: 'Z2', tambakTujuan: 'Tambak Harapan', status: 'Aktif', hasilSiklus: 'Gagal', srFinal: 41, createdAt: stamp(8), updatedAt: stamp(1) },
];

// ---------- Produksi: air harian larva (14 hari × 3 tank) ----------
const profiles = {
  'tank-1': { suhuP: 29, suhuS: 30, do: 6.1, phP: 8.0, phS: 8.1, sal: 31, tan: 0.25, nitrit: 0.3, alk: 122 },
  'tank-2': { suhuP: 29.5, suhuS: 31.2, do: 4.8, phP: 8.1, phS: 8.35, sal: 31, tan: 0.7, nitrit: 1.6, alk: 108 },
  'tank-3': { suhuP: 30, suhuS: 32.4, do: 3.7, phP: 8.2, phS: 8.55, sal: 30, tan: 1.9, nitrit: 5.2, alk: 95 },
};
function prodVerif(tankId, off) {
  if (off !== 0) return doneProd(off);
  if (tankId === 'tank-1') return doneProd(off);
  // tank-2 hari ini: sudah diparaf Ka.Sie, menunggu Petugas QC
  if (tankId === 'tank-2') return { status: 'Diparaf Ka.Sie', dibuatOleh: sPetugasProd(off), diparafKasie: sKasieProd(off) };
  return { status: 'Draft', dibuatOleh: sPetugasProd(off) };
}
const prodLarvae = [];
for (const tankId of Object.keys(profiles)) {
  const p = profiles[tankId];
  for (let off = 13; off >= 0; off--) {
    const drift = (13 - off) * 0.04;
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
  { id: 'pw-1', tanggal: dateStr(1), klorin: 30, ph: 8.0, orpIn: 540, orpOn: 180, resirkulasi: 14, usiaKarbon: 30, suhuTandon: 30, salinitas: 31, ...doneProd(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'pw-2', tanggal: dateStr(0), klorin: 30, ph: 8.1, orpIn: 565, orpOn: 130, resirkulasi: 9, usiaKarbon: 55, suhuTandon: 32.5, salinitas: 30, catatan: 'ORP in mendekati maks, karbon lewat batas.', status: 'Draft', dibuatOleh: sPetugasProd(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Produksi: induk / maturasi ----------
const prodInduk = [
  { id: 'pi-1', tanggal: dateStr(1), kodeBatch: 'IND-2601', umurInduk: 380, suhuAir: 28.5, salinitas: 32, do: 5.4, ph: 8.1, insang: 'Baik', orange: 'Ada', plankton: 'Tidak ada', jumlahTelur: 250000, fertil: 88, hatching: 82, jumlahNauplii: 180000, abnormalNauplii: 3, ...doneProd(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'pi-2', tanggal: dateStr(0), kodeBatch: 'IND-2602', umurInduk: 350, suhuAir: 29, salinitas: 32, do: 5.1, ph: 8.2, insang: 'Bermasalah', orange: 'Tidak ada', plankton: 'Ada', jumlahTelur: 210000, fertil: 72, hatching: 58, jumlahNauplii: 120000, abnormalNauplii: 9, status: 'Draft', dibuatOleh: sPetugasProd(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: mikrobiologi ----------
const labMikro = [
  { id: 'lm-1', tanggal: dateStr(1), tankId: 'tank-1', titik: 'Air tank larva', stadia: 'Z3', vibrio: 'Tidak ada', tvc: 640, tbc: 6400, tcbsHijau: 6, tcbsKuning: 34, tcbsLuminescent: 0, ...doneLab(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'lm-2', tanggal: dateStr(1), tankId: 'tank-2', titik: 'Air tank larva', stadia: 'M1', vibrio: 'Ada', tvc: 3200, tbc: 32000, tcbsHijau: 40, tcbsKuning: 180, tcbsLuminescent: 0, status: 'Diparaf QC', dibuatOleh: sPetugasLab(1), diparafKasie: sKasieLab(1), diparafQc: sQc(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'lm-3', tanggal: dateStr(0), tankId: 'tank-3', titik: 'Air tank larva', stadia: 'Z2', vibrio: 'Ada', tvc: 6400, tbc: 86000, tcbsHijau: 120, tcbsKuning: 400, tcbsLuminescent: 120, status: 'Draft', dibuatOleh: sPetugasLab(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: cek harian larva ----------
const labCekLarva = [
  { id: 'cl-1', tanggal: dateStr(1), tankId: 'tank-1', stadiaDominan: 'Z3', doc: 9, mortalitas: 3, abnormal: 2, nekrosis: 0, kanibalisme: 1, problemMolting: 3, protozoa: 'Tidak ada', zoothamnium: 'Tidak ada', vorticella: 'Tidak ada', filamen: 'Tidak ada', sr: 96, ususKosong: 8, count: 9303, hasilMikro: 'Tidak ada', ...doneLab(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'cl-2', tanggal: dateStr(0), tankId: 'tank-3', stadiaDominan: 'Z2', doc: 8, mortalitas: 12, abnormal: 8, nekrosis: 5, kanibalisme: 4, problemMolting: 16, protozoa: 'Banyak', zoothamnium: 'Sedikit', vorticella: 'Sedikit', filamen: 'Sedikit', penvort: 4, sr: 72, ususKosong: 55, count: 6400, hasilMikro: 'Ada', status: 'Draft', dibuatOleh: sPetugasLab(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: kualitas algae ----------
const labAlgae = [
  { id: 'la-1', tanggal: dateStr(1), jenis: 'Chaetoceros', hasilMikro: 'Tidak ada', density: 1800000, grade: 'A', nitrit: 0.4, ...doneLab(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'la-2', tanggal: dateStr(0), jenis: 'Thalassiosira', hasilMikro: 'Tidak ada', density: 950000, grade: 'B', nitrit: 1.4, status: 'Draft', dibuatOleh: sPetugasLab(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: PCR & kimia ----------
const labPcrKimia = [
  { id: 'pk-1', tanggal: dateStr(2), sampel: 'Induk', kode: 'IND-2602', pcrWSSV: 'Negatif', pcrIMNV: 'Negatif', pcrEHP: 'Positif', pcrAHPND: 'Negatif', pcrIHHNV: 'Negatif', nitrit: 0.6, ...doneLab(2), createdAt: stamp(2), updatedAt: stamp(2) },
];

// ---------- Lab: temuan & rekomendasi ----------
const temuanLab = [
  { id: 'tm-1', tanggal: dateStr(1), area: 'Water', parameter: 'pH air', temuan: 'pH sore cenderung tinggi (>8.4) berkorelasi dengan NH3 naik di Tank B1.', rekomendasi: 'Turunkan target pH sore ke 8.1–8.2 dan tambah pergantian air.', status: 'Baru', dibuatOleh: person('Kabag Lab & Algae', 'kabagLab', 1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'tm-2', tanggal: dateStr(3), area: 'Algae', parameter: 'Grade algae', temuan: 'Grade algae turun ke B saat density < 1 juta sel/mL.', rekomendasi: 'Pertahankan density > 1,2 juta sel/mL sebelum pakan diberikan.', status: 'Diterapkan', dibuatOleh: person('Kabag Lab & Algae', 'kabagLab', 3), diterapkanOleh: person('Petugas Produksi', 'petugasProd', 2), createdAt: stamp(3), updatedAt: stamp(2) },
];

// ---------- Produksi: Post-Larvae & panen (tank-1 = siklus berhasil, tahap PL) ----------
const prodPostLarvae = [
  { id: 'ppl-1', tanggal: dateStr(2), tankId: 'tank-1', stadia: 'PL3', count: 8200000, estPanen: 7500000, sr: 82, def: 4, sizeManual: 7.2, cv: 9, ekorPerGram: 450, stressSurvival: 94, ...doneProd(2), createdAt: stamp(2), updatedAt: stamp(2) },
  { id: 'ppl-2', tanggal: dateStr(1), tankId: 'tank-1', stadia: 'PL4', count: 8000000, estPanen: 7400000, sr: 80, def: 5, sizeManual: 8.1, cv: 11, ekorPerGram: 420, stressSurvival: 92, ...doneProd(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'ppl-3', tanggal: dateStr(0), tankId: 'tank-1', stadia: 'PL5', count: 7800000, estPanen: 7300000, sr: 79, def: 6, sizeManual: 8.8, cv: 12, ekorPerGram: 400, stressSurvival: 90, totalPanen: 7300000, srPanen: 78, plPerKantong: 2000, jumlahKantong: 3650, doaSurvival: 96, tambakTujuan: 'Tambak Sukamaju', status: 'Draft', dibuatOleh: sPetugasProd(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: mikro Post-Larvae (Form 16, tank-1) ----------
const labMikroPl = [
  { id: 'lmp-1', tanggal: dateStr(1), tankId: 'tank-1', stadia: 'PL4', vibrio: 'Tidak ada', tvc: 900, tcbsLuminescent: 0, ...doneLab(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'lmp-2', tanggal: dateStr(0), tankId: 'tank-1', stadia: 'PL5', vibrio: 'Ada', tvc: 3400, tcbsLuminescent: 0, status: 'Draft', dibuatOleh: sPetugasLab(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Produksi: kultur algae ----------
const prodAlgae = [
  { id: 'pa-1', tanggal: dateStr(1), jenis: 'Chaetoceros', density: 1600000, kondisi: 'Baik', volume: 2000, ...doneProd(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'pa-2', tanggal: dateStr(0), jenis: 'Thalassiosira', density: 900000, kondisi: 'Sedang', volume: 1500, status: 'Draft', dibuatOleh: sPetugasProd(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Produksi: artemia ----------
const prodArtemia = [
  { id: 'par-1', tanggal: dateStr(1), nomorBatch: 'ART-06', hatchingRate: 88, kepadatan: 250, dekapsulasi: 'Ya', ...doneProd(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'par-2', tanggal: dateStr(0), nomorBatch: 'ART-07', hatchingRate: 72, kepadatan: 200, dekapsulasi: 'Tidak', catatan: 'Hatching rate rendah, cek kista.', status: 'Draft', dibuatOleh: sPetugasProd(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Produksi: log tindakan (tank-scoped) ----------
const prodTindakan = [
  { id: 'pt-1', tanggal: dateStr(1), jam: '08:00', tankId: 'tank-3', jenis: 'Pergantian air', dosis: '40%', alasan: 'Nitrit & NH3 tinggi, kualitas air menurun.', ...doneProd(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'pt-2', tanggal: dateStr(0), jam: '15:00', tankId: 'tank-2', jenis: 'Pemberian probiotik', dosis: '5 ppm', alasan: 'Pencegahan Vibrio pasca hasil mikro.', status: 'Draft', dibuatOleh: sPetugasProd(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Produksi: kontrol suhu spawner (Form 06.A) ----------
const spawnerKontrol = [
  { id: 'sk-1', tanggal: dateStr(1), bak: 'Spawner A', waktu: '20:00', suhu: 28.5, ...doneProd(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'sk-2', tanggal: dateStr(0), bak: 'Spawner B', waktu: '22:00', suhu: 31.5, catatan: 'Suhu palam agak tinggi.', status: 'Draft', dibuatOleh: sPetugasProd(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Lab: sampel nauplii abnormal (Form 06.A) ----------
const spawnerNauplii = [
  { id: 'sn-1', tanggal: dateStr(1), spawner: 'SP-12', waktu: 'Pagi', bagus: 480, abnormalCount: 20, telur: 15, abnormal: 4, ...doneLab(1), createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'sn-2', tanggal: dateStr(0), spawner: 'SP-15', waktu: 'Sore', bagus: 430, abnormalCount: 70, telur: 25, abnormal: 14, status: 'Draft', dibuatOleh: sPetugasLab(0), createdAt: stamp(0), updatedAt: stamp(0) },
];

export const SEED = {
  tank, prodLarvae, prodPersiapanWater, prodInduk,
  labMikro, labCekLarva, labAlgae, labPcrKimia, temuanLab,
  prodPostLarvae, labMikroPl, prodAlgae, prodArtemia, prodTindakan,
  spawnerKontrol, spawnerNauplii,
};
