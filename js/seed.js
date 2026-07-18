/* ===========================================================================
   seed.js — data contoh untuk prototype.
   Disuntik sekali oleh api.ensureSeeded(). Dibuat relatif terhadap hari ini
   agar peringatan (rentang 10 hari terakhir) selalu tampil saat demo.
   Sengaja memuat tank sehat, waspada, dan bahaya.
   =========================================================================== */

const iso = (d) => d.toISOString();
const dateStr = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
};
const stamp = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return iso(d);
};
const jitter = (base, amp) => Math.round((base + (Math.random() - 0.5) * amp) * 100) / 100;

// Jejak verifikasi contoh (alur form: Draft → Disahkan → Diperiksa)
const person = (name, role, off) => ({ name, role, at: stamp(off) });
function dailyVerif(tankId, off) {
  const dibuat = person('Petugas Larva', 'petugas', off);
  const sahkan = person('Ka.Sie Larva', 'kasie', off);
  const periksa = person('Tri Bayu Winarko', 'mpm', off);
  if (off !== 0) return { status: 'Diperiksa', dibuatOleh: dibuat, disahkanOleh: sahkan, diperiksaOleh: periksa };
  if (tankId === 'tank-1') return { status: 'Diperiksa', dibuatOleh: dibuat, disahkanOleh: sahkan, diperiksaOleh: periksa };
  if (tankId === 'tank-2') return { status: 'Disahkan', dibuatOleh: dibuat, disahkanOleh: sahkan };
  return { status: 'Draft', dibuatOleh: dibuat };
}

// ---------- Master induk ----------
const indukBatch = [
  {
    id: 'induk-1', kodeBatch: 'IND-2601', tanggalDatang: dateStr(40), sumber: 'Situbondo',
    umurHari: 380, beratRata: 42, jumlah: 60,
    pcrWSSV: 'Negatif', pcrIMNV: 'Negatif', pcrEHP: 'Negatif', pcrAHPNDPirAB: 'Negatif', pcrIHHNV: 'Negatif',
    catatan: 'Induk kondisi baik saat kedatangan.', createdAt: stamp(40), updatedAt: stamp(40),
  },
  {
    id: 'induk-2', kodeBatch: 'IND-2602', tanggalDatang: dateStr(25), sumber: 'Bali',
    umurHari: 350, beratRata: 45, jumlah: 48,
    pcrWSSV: 'Negatif', pcrIMNV: 'Negatif', pcrEHP: 'Positif', pcrAHPNDPirAB: 'Negatif', pcrIHHNV: 'Negatif',
    catatan: 'EHP positif — pisahkan jalur, awasi ketat.', createdAt: stamp(25), updatedAt: stamp(25),
  },
];

// ---------- Master tank ----------
const tank = [
  { id: 'tank-1', namaTank: 'Tank A1', batchInduk: 'induk-1', umurInduk: 380, tanggalTebar: dateStr(9), stadiaSekarang: 'Z3', tambakTujuan: 'Tambak Sukamaju', status: 'Aktif', createdAt: stamp(9), updatedAt: stamp(1) },
  { id: 'tank-2', namaTank: 'Tank A2', batchInduk: 'induk-1', umurInduk: 380, tanggalTebar: dateStr(9), stadiaSekarang: 'M1', tambakTujuan: 'Tambak Sukamaju', status: 'Aktif', createdAt: stamp(9), updatedAt: stamp(1) },
  { id: 'tank-3', namaTank: 'Tank B1', batchInduk: 'induk-2', umurInduk: 350, tanggalTebar: dateStr(8), stadiaSekarang: 'Z2', tambakTujuan: 'Tambak Harapan', status: 'Aktif', createdAt: stamp(8), updatedAt: stamp(1) },
];

// ---------- Log harian kualitas air (7 hari, 3 tank) ----------
const profiles = {
  'tank-1': { suhuP: 29, suhuS: 30, do: 6.1, phP: 8.0, phS: 8.1, sal: 31, tan: 0.25, nitrit: 0.3, alk: 122 }, // sehat
  'tank-2': { suhuP: 29.5, suhuS: 31.2, do: 4.8, phP: 8.1, phS: 8.35, sal: 31, tan: 0.7, nitrit: 1.6, alk: 108 }, // waspada
  'tank-3': { suhuP: 30, suhuS: 32.4, do: 3.7, phP: 8.2, phS: 8.55, sal: 30, tan: 1.9, nitrit: 5.2, alk: 95 }, // bahaya
};
const dailyLog = [];
for (const tankId of Object.keys(profiles)) {
  const p = profiles[tankId];
  for (let off = 6; off >= 0; off--) {
    const drift = (6 - off) * 0.04; // memburuk perlahan menuju hari ini
    dailyLog.push({
      id: `dl-${tankId}-${off}`, tanggal: dateStr(off), tankId,
      suhuPagi: jitter(p.suhuP, 0.4), suhuSore: jitter(p.suhuS, 0.5),
      do: jitter(p.do, 0.3),
      phPagi: jitter(p.phP, 0.06), phSore: jitter(p.phS, 0.06),
      salinitas: jitter(p.sal, 0.6),
      tan: Math.round((p.tan + drift * p.tan) * 100) / 100,
      nitrit: Math.round((p.nitrit + drift * p.nitrit) * 100) / 100,
      alkalinitas: Math.round(jitter(p.alk, 4)),
      volumeAir: 8000, pergantianAir: tankId === 'tank-3' ? 40 : 20,
      ...dailyVerif(tankId, off),
      catatan: '', createdAt: stamp(off), updatedAt: stamp(off),
    });
  }
}

// ---------- Mikrobiologi tank ----------
const mikrobiologiTank = [
  { id: 'mb-1', tanggal: dateStr(1), tankId: 'tank-1', stadia: 'Z3', sampel: 'Air tank', tbc: 640, tvc: 40, tcbsHijau: 6, tcbsKuning: 34, tcbsLuminescent: 0, createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'mb-2', tanggal: dateStr(1), tankId: 'tank-2', stadia: 'M1', sampel: 'Air tank', tbc: 3200, tvc: 220, tcbsHijau: 40, tcbsKuning: 180, tcbsLuminescent: 0, createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'mb-3', tanggal: dateStr(0), tankId: 'tank-3', stadia: 'Z2', sampel: 'Air tank', tbc: 8600, tvc: 640, tcbsHijau: 120, tcbsKuning: 400, tcbsLuminescent: 120, createdAt: stamp(0), updatedAt: stamp(0) },
  { id: 'mb-4', tanggal: dateStr(3), tankId: 'tank-3', stadia: 'Z1', sampel: 'Air tank', tbc: 5200, tvc: 300, tcbsHijau: 60, tcbsKuning: 220, tcbsLuminescent: 20, createdAt: stamp(3), updatedAt: stamp(3) },
];

// ---------- Perkembangan stadia & survival (6 hari, 3 tank) ----------
const stadiaProfiles = {
  'tank-1': { surv: 97, pop: 1000000, dom: 'Z3', dist: 'Z3 80% / M1 20%', jadwal: 'Sesuai', sync: 'Seragam', kepadatan: 125, decline: 0.985 },
  'tank-2': { surv: 90, pop: 900000, dom: 'M1', dist: 'Z3 40% / M1 60%', jadwal: 'Tertinggal 0.5 hari', sync: 'Cukup seragam', kepadatan: 112, decline: 0.97 },
  'tank-3': { surv: 84, pop: 700000, dom: 'Z2', dist: 'Z1 30% / Z2 70%', jadwal: 'Tertinggal ≥1 hari', sync: 'Tidak seragam', kepadatan: 95, decline: 0.94 },
};
const stadiaLog = [];
for (const tankId of Object.keys(stadiaProfiles)) {
  const p = stadiaProfiles[tankId];
  let pop = p.pop;
  for (let off = 6; off >= 0; off--) {
    const dayIdx = 6 - off;
    let surv = p.surv;
    if (tankId === 'tank-3') surv = p.surv - dayIdx * 2.2; // menurun 84 → ~71
    surv = Math.round((surv + (Math.random() - 0.5) * 2) * 10) / 10;
    pop = Math.round(pop * p.decline);
    stadiaLog.push({
      id: `st-${tankId}-${off}`, tanggal: dateStr(off), tankId,
      stadiaDominan: p.dom, distribusiStadia: p.dist, sesuaiJadwal: p.jadwal,
      kepadatan: Math.round(jitter(p.kepadatan, 6)), populasi: pop,
      survivalHarian: surv, sinkronisasiMolting: p.sync,
      createdAt: stamp(off), updatedAt: stamp(off),
    });
  }
}

// ---------- Air & treatment ----------
const airTreatment = [
  { id: 'at-1', tanggal: dateStr(1), salinitasSumber: 32, suhuSumber: 29, tbcSebelum: 12000, tbcUV1: 3000, tbcUV2: 400, tbcSetelahOzon: 60, tvcSetelahOzon: 4, orp: 300, waktuResirkulasi: 6, carbonTest: 'Baik', perawatan: '—', createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'at-2', tanggal: dateStr(0), salinitasSumber: 32, suhuSumber: 29, tbcSebelum: 15000, tbcUV1: 4000, tbcUV2: 900, tbcSetelahOzon: 220, tvcSetelahOzon: 45, orp: 235, waktuResirkulasi: 4, carbonTest: 'Perlu ganti', perawatan: '—', catatan: 'TVC setelah ozon naik — cek generator ozon.', createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Pakan hidup ----------
const pakanHidup = [
  { id: 'ph-1', tanggal: dateStr(1), jenis: 'Algae', spesiesProduk: 'Chaetoceros', nomorBatch: 'ALG-07', kepadatanSel: 1800000, kemurnian: 'Murni', tbc: 600, tvc: 20, createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'ph-2', tanggal: dateStr(1), jenis: 'Artemia', spesiesProduk: 'Batch kista AR-12', nomorBatch: 'AR-12', hatchingRate: 88, kepadatanSel: 250, kemurnian: 'Sedikit kontaminan', tbc: 4200, tvc: 260, createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'ph-3', tanggal: dateStr(2), jenis: 'Probiotik', spesiesProduk: 'PRO-Bacillus', nomorBatch: 'PB-03', tbc: 200, tvc: 0, kemurnian: 'Murni', createdAt: stamp(2), updatedAt: stamp(2) },
];

// ---------- Pemijahan ----------
const pemijahan = [
  { id: 'pm-1', tanggal: dateStr(10), batchInduk: 'induk-1', fekunditas: 250000, fertilizationRate: 88, hatchingRate: 82, naupliiPerSpawn: 180000, naupliiKeaktifan: 'Baik', fototaksis: 'Kuat', keseragaman: 'Seragam', sesi: 'Pagi', createdAt: stamp(10), updatedAt: stamp(10) },
  { id: 'pm-2', tanggal: dateStr(9), batchInduk: 'induk-2', fekunditas: 210000, fertilizationRate: 72, hatchingRate: 58, naupliiPerSpawn: 120000, naupliiKeaktifan: 'Sedang', fototaksis: 'Sedang', keseragaman: 'Cukup', sesi: 'Sore', createdAt: stamp(9), updatedAt: stamp(9) },
];

// ---------- Defect ----------
const defectLog = [
  { id: 'df-1', tanggal: dateStr(1), tankId: 'tank-2', kelompokStadia: 'Nauplii–Zoea 3', jumlahSampel: 100, defTelson: 3, defSetae: 2, hpPucat: 6, hpHitam: 1, masalahMolting: 4, penempelan: 8, gumpalanAlgae: 5, bolitas: 2, keaktifan: 'Sedang', createdAt: stamp(1), updatedAt: stamp(1) },
  { id: 'df-2', tanggal: dateStr(0), tankId: 'tank-3', kelompokStadia: 'Nauplii–Zoea 3', jumlahSampel: 100, defTelson: 8, defSetae: 6, hpPucat: 18, hpHitam: 4, masalahMolting: 16, penempelan: 12, gumpalanAlgae: 9, bolitas: 5, keaktifan: 'Rendah', createdAt: stamp(0), updatedAt: stamp(0) },
];

// ---------- Ukuran PL (contoh siklus lama untuk melihat CV) ----------
const ukuranPL = [
  { id: 'up-1', tanggal: dateStr(2), tankId: 'tank-1', stadia: 'PL3', panjangRata: 5.2, ekorPerGram: 320, cv: 8, gutMuscle: 0.45, createdAt: stamp(2), updatedAt: stamp(2) },
  { id: 'up-2', tanggal: dateStr(1), tankId: 'tank-1', stadia: 'PL≥4', panjangRata: 6.0, ekorPerGram: 260, cv: 12, gutMuscle: 0.42, createdAt: stamp(1), updatedAt: stamp(1) },
];

// ---------- Kualitas PL pra-panen ----------
const kualitasPL = [
  { id: 'kp-1', tanggal: dateStr(1), tankId: 'tank-1', stressTestJenis: 'Penurunan salinitas', stressSurvival: 94, pcrEHP: 'Negatif', pcrAHPND: 'Negatif', pcrWSSV: 'Negatif', pcrIMNV: 'Negatif', pcrIHHNV: 'Negatif', deformitas: 3, keaktifan: 'Tinggi', fototaksis: 'Kuat', jumlahPLTotal: 900000, stadiaPanen: 'PL≥4', docPanen: 11, createdAt: stamp(1), updatedAt: stamp(1) },
];

// ---------- Panen & pengiriman ----------
const panen = [
  { id: 'pn-1', tanggal: dateStr(1), tankId: 'tank-1', tambakTujuan: 'Tambak Sukamaju', plPerKantong: 2000, jumlahKantong: 450, suhuKantong: 24, salinitasKantong: 30, jamPanen: '04:00', jamPacking: '05:30', jamBerangkat: '06:00', jamTiba: '10:30', lamaTransport: 4.5, suhuTiba: 26, doaSurvival: 97, aklimatisasiSuhu: 28, aklimatisasiSalinitas: 25, lamaAklimatisasi: 45, jamTebar: '11:30', createdAt: stamp(1), updatedAt: stamp(1) },
];

// ---------- Log tindakan ----------
const tindakan = [
  { id: 'tk-1', tanggal: dateStr(0), jam: '08:00', tankId: 'tank-3', jenis: 'Pergantian air', dosis: '40%', alasan: 'NH3 & nitrit tinggi, DO rendah.', createdAt: stamp(0), updatedAt: stamp(0) },
  { id: 'tk-2', tanggal: dateStr(0), jam: '09:00', tankId: 'tank-3', jenis: 'Pemberian probiotik', dosis: '5 ppm', alasan: 'Vibrio luminescent terdeteksi.', createdAt: stamp(0), updatedAt: stamp(0) },
  { id: 'tk-3', tanggal: dateStr(1), jam: '07:30', tankId: 'tank-2', jenis: 'Penyiponan', dosis: '-', alasan: 'Sisa pakan & kotoran di dasar tank.', createdAt: stamp(1), updatedAt: stamp(1) },
];

// ---------- Hasil tambak (siklus sebelumnya) ----------
const hasilTambak = [
  { id: 'ht-1', tanggal: dateStr(5), tankId: 'tank-1', tambak: 'Tambak Sukamaju', survivalTambak: 78, adg: 0.25, fcr: 1.25, sizePanen: 60, kejadianPenyakit: 'Tidak ada', createdAt: stamp(5), updatedAt: stamp(5) },
];

export const SEED = {
  indukBatch, tank, dailyLog, mikrobiologiTank, stadiaLog, airTreatment,
  pakanHidup, pemijahan, defectLog, ukuranPL, kualitasPL, panen, tindakan, hasilTambak,
};
