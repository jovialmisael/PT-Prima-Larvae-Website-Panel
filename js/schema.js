/* ===========================================================================
   schema.js — SUMBER TUNGGAL definisi parameter hatchery.
   Semua formulir, tabel, grafik, dan mesin peringatan dibangun dari sini.

   Setiap kategori (mengacu ke 13 bagian panduan) berisi daftar field.
   Field bertipe angka dapat memiliki `threshold` (batas) yang dipakai
   mesin alert: aman / waspada / bahaya.

   Model threshold:
     { safeMin, safeMax, dangerMin, dangerMax }
       - aman   : nilai di dalam [safeMin..safeMax]
       - bahaya : nilai < dangerMin  atau  > dangerMax
       - waspada: di antara batas aman dan batas bahaya
     Batas satu sisi cukup mengisi sisi yang relevan (mis. hanya safeMax+dangerMax).

   Tipe field: text | number | date | time | textarea | select | pcr | ref | computed
   =========================================================================== */

export const STAGES = ['N1','N2','N3','N4','N5','N6','Z1','Z2','Z3','M1','M2','M3','PL1','PL2','PL3','PL≥4'];

// Opsi hasil PCR (dipakai untuk penyakit — Positif memicu peringatan bahaya)
export const PCR_OPTIONS = ['Belum diuji', 'Negatif', 'Positif'];

// Field PCR standar (dipakai di beberapa kategori)
const pcrFields = (targets) =>
  targets.map((t) => ({
    key: 'pcr' + t.replace(/[^A-Za-z0-9]/g, ''),
    label: 'PCR ' + t,
    type: 'pcr',
    group: 'PCR',
  }));

// Set defect per stadia (kategori 07) — dicatat sebagai % dari sampel
const defectFields = (keys) =>
  keys.map((k) => ({ key: k.key, label: k.label, type: 'number', unit: '%', group: 'Defect', threshold: { safeMax: 5, dangerMax: 15 } }));

/* --------------------------------------------------------------------------
   Definisi kategori. `section` mengelompokkan item di sidebar.
   `collection` = key penyimpanan di localStorage.
   `chart` = daftar field numerik yang ditampilkan sebagai tren.
   `traceKey` = true → baris terikat tank (menampilkan rantai traceability).
   -------------------------------------------------------------------------- */
export const CATEGORIES = [
  /* ====================== 01 · INDUK & PEMIJAHAN ====================== */
  {
    id: 'indukBatch', code: '01', section: '01 · Induk & Pemijahan',
    title: 'Batch Induk', collection: 'indukBatch',
    desc: 'Identitas induk yang bisa ditelusuri sampai ke PL yang dihasilkan. Kualitas induk menentukan batas atas seluruh siklus.',
    labelKey: 'kodeBatch',
    fields: [
      { key: 'kodeBatch', label: 'Kode Batch Induk', type: 'text', required: true },
      { key: 'tanggalDatang', label: 'Tanggal Kedatangan', type: 'date' },
      { key: 'sumber', label: 'Sumber / Asal', type: 'text' },
      { key: 'umurHari', label: 'Umur Induk', type: 'number', unit: 'hari' },
      { key: 'beratRata', label: 'Berat Rata-rata', type: 'number', unit: 'g' },
      { key: 'jumlah', label: 'Jumlah Ekor', type: 'number', unit: 'ekor' },
      ...pcrFields(['WSSV', 'IMNV', 'EHP', 'AHPND (PirAB)', 'IHHNV']),
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'pemijahan', code: '01', section: '01 · Induk & Pemijahan',
    title: 'Performa Pemijahan', collection: 'pemijahan',
    desc: 'Fekunditas hingga nauplii per spawn. Hatching rate yang menurun adalah salah satu sinyal paling awal bahwa ada yang tidak beres.',
    fields: [
      { key: 'tanggal', label: 'Tanggal Pemijahan', type: 'date', required: true },
      { key: 'batchInduk', label: 'Batch Induk', type: 'ref', refCollection: 'indukBatch', refLabelKey: 'kodeBatch' },
      { key: 'fekunditas', label: 'Fekunditas', type: 'number', unit: 'telur' },
      { key: 'fertilizationRate', label: 'Fertilization Rate', type: 'number', unit: '%', threshold: { safeMin: 80, dangerMin: 60 } },
      { key: 'hatchingRate', label: 'Hatching Rate', type: 'number', unit: '%', threshold: { safeMin: 70, dangerMin: 50 } },
      { key: 'naupliiPerSpawn', label: 'Nauplii per Spawn', type: 'number', unit: 'ekor' },
      { key: 'naupliiKeaktifan', label: 'Keaktifan Nauplii', type: 'select', options: ['Baik', 'Sedang', 'Buruk'] },
      { key: 'fototaksis', label: 'Respon Fototaksis', type: 'select', options: ['Kuat', 'Sedang', 'Lemah'] },
      { key: 'keseragaman', label: 'Keseragaman', type: 'select', options: ['Seragam', 'Cukup', 'Tidak seragam'] },
      { key: 'sesi', label: 'Sesi Panen', type: 'select', options: ['Pagi', 'Sore'] },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'pakanSegarInduk', code: '01', section: '01 · Induk & Pemijahan',
    title: 'Pakan Segar & Air Maturasi', collection: 'pakanSegarInduk',
    desc: 'Pakan segar (cumi, cacing laut, artemia biomassa) adalah salah satu jalur masuk penyakit ke induk. Termasuk kualitas air maturasi harian.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'jenisPakan', label: 'Jenis Pakan Segar', type: 'select', options: ['Cumi', 'Cacing laut', 'Artemia biomassa', 'Lainnya'] },
      { key: 'sumber', label: 'Sumber Pakan', type: 'text' },
      { key: 'pcrPakan', label: 'PCR Pakan Segar', type: 'pcr' },
      { key: 'suhu', label: 'Suhu Air Maturasi', type: 'number', unit: '°C', threshold: { safeMin: 27, safeMax: 30, dangerMin: 25, dangerMax: 32 } },
      { key: 'salinitas', label: 'Salinitas', type: 'number', unit: 'ppt', threshold: { safeMin: 30, safeMax: 34, dangerMin: 28, dangerMax: 36 } },
      { key: 'do', label: 'DO', type: 'number', unit: 'mg/L', threshold: { safeMin: 5, dangerMin: 4 } },
      { key: 'ph', label: 'pH', type: 'number', threshold: { safeMin: 7.8, safeMax: 8.4, dangerMin: 7.5, dangerMax: 8.7 } },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 02 · AIR & TREATMENT ====================== */
  {
    id: 'airTreatment', code: '02', section: '02 · Air & Treatment',
    title: 'Air Baku & Sistem Treatment', collection: 'airTreatment',
    desc: 'Sistem treatment adalah benteng utama hatchery. TVC yang naik di air setelah ozon menandakan sistem mulai gagal — terlihat sebelum larva terkena dampaknya.',
    chart: ['orp', 'tvcSetelahOzon'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'salinitasSumber', label: 'Salinitas Air Sumber', type: 'number', unit: 'ppt', group: 'Air Sumber' },
      { key: 'suhuSumber', label: 'Suhu Air Sumber', type: 'number', unit: '°C', group: 'Air Sumber' },
      { key: 'tbcSebelum', label: 'TBC Sebelum Treatment', type: 'number', unit: 'CFU/mL', group: 'Mikrobiologi per titik' },
      { key: 'tbcUV1', label: 'TBC Setelah UV 1', type: 'number', unit: 'CFU/mL', group: 'Mikrobiologi per titik' },
      { key: 'tbcUV2', label: 'TBC Setelah UV 2', type: 'number', unit: 'CFU/mL', group: 'Mikrobiologi per titik' },
      { key: 'tbcSetelahOzon', label: 'TBC Setelah Ozon', type: 'number', unit: 'CFU/mL', group: 'Mikrobiologi per titik', threshold: { safeMax: 100, dangerMax: 1000 } },
      { key: 'tvcSetelahOzon', label: 'TVC Setelah Ozon', type: 'number', unit: 'CFU/mL', group: 'Mikrobiologi per titik', threshold: { safeMax: 10, dangerMax: 100 } },
      { key: 'orp', label: 'ORP Sistem Ozon', type: 'number', unit: 'mV', group: 'Ozon', threshold: { safeMin: 250, safeMax: 350, dangerMin: 200, dangerMax: 450 } },
      { key: 'waktuResirkulasi', label: 'Waktu Resirkulasi Setelah Ozonasi', type: 'number', unit: 'jam', group: 'Ozon' },
      { key: 'carbonTest', label: 'Carbon Test (kualitas filter)', type: 'select', options: ['Baik', 'Perlu ganti', 'Belum diuji'], group: 'Perawatan' },
      { key: 'perawatan', label: 'Tindakan Perawatan', type: 'select', options: ['—', 'Ganti lampu UV', 'Ganti karbon', 'Servis generator ozon'], group: 'Perawatan' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 03 · PAKAN HIDUP & PROBIOTIK ====================== */
  {
    id: 'pakanHidup', code: '03', section: '03 · Pakan Hidup & Probiotik',
    title: 'Pakan Hidup & Probiotik', collection: 'pakanHidup',
    desc: 'Pakan hidup adalah salah satu jalur masuk bakteri ke tank larva. Memastikan probiotik yang dimasukkan bukan justru sumber kontaminasi.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'jenis', label: 'Jenis', type: 'select', options: ['Algae', 'Artemia', 'Probiotik'], required: true },
      { key: 'spesiesProduk', label: 'Spesies / Kode Produk', type: 'text', help: 'Thalassiosira / Chaetoceros / Amphora / batch kista / kode probiotik' },
      { key: 'nomorBatch', label: 'Nomor Batch', type: 'text' },
      { key: 'kepadatanSel', label: 'Kepadatan Sel / Kepadatan', type: 'number', unit: 'sel/mL' },
      { key: 'hatchingRate', label: 'Hatching Rate (Artemia)', type: 'number', unit: '%' },
      { key: 'kemurnian', label: 'Kemurnian / Kondisi', type: 'select', options: ['Murni', 'Sedikit kontaminan', 'Terkontaminasi'] },
      { key: 'tbc', label: 'TBC', type: 'number', unit: 'CFU/mL', threshold: { safeMax: 1000, dangerMax: 10000 } },
      { key: 'tvc', label: 'TVC', type: 'number', unit: 'CFU/mL', threshold: { safeMax: 100, dangerMax: 1000 } },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 04 · KUALITAS AIR TANK (BARIS INTI) ====================== */
  {
    id: 'dailyLog', code: '04', section: '04 · Kualitas Air Tank',
    title: 'Input Harian Kualitas Air', collection: 'dailyLog', traceKey: true,
    desc: 'Baris inti sistem: satu tank pada satu hari. Di tank padat, amonia & nitrit bisa naik dalam hitungan jam. NH3 dihitung otomatis dari TAN, pH, suhu, dan salinitas.',
    chart: ['nh3', 'nitrit', 'do'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank', required: true },
      { key: 'suhuPagi', label: 'Suhu Pagi', type: 'number', unit: '°C', group: 'Suhu', threshold: { safeMin: 28, safeMax: 31, dangerMin: 26, dangerMax: 33 } },
      { key: 'suhuSore', label: 'Suhu Sore', type: 'number', unit: '°C', group: 'Suhu', threshold: { safeMin: 28, safeMax: 31, dangerMin: 26, dangerMax: 33 } },
      { key: 'suhuDelta', label: 'Selisih Suhu Pagi–Sore', type: 'computed', compute: 'suhuDelta', unit: '°C', threshold: { safeMax: 1.5, dangerMax: 3 } },
      { key: 'do', label: 'DO', type: 'number', unit: 'mg/L', threshold: { safeMin: 5, dangerMin: 4 } },
      { key: 'phPagi', label: 'pH Pagi', type: 'number', group: 'pH', threshold: { safeMin: 7.8, safeMax: 8.4, dangerMin: 7.5, dangerMax: 8.7 } },
      { key: 'phSore', label: 'pH Sore', type: 'number', group: 'pH', threshold: { safeMin: 7.8, safeMax: 8.4, dangerMin: 7.5, dangerMax: 8.7 } },
      { key: 'phDelta', label: 'Selisih pH Pagi–Sore', type: 'computed', compute: 'phDelta', threshold: { safeMax: 0.5, dangerMax: 0.8 } },
      { key: 'salinitas', label: 'Salinitas', type: 'number', unit: 'ppt', threshold: { safeMin: 28, safeMax: 34, dangerMin: 25, dangerMax: 37 } },
      { key: 'tan', label: 'Amonia Total (TAN)', type: 'number', unit: 'mg/L', help: 'Dipakai untuk menghitung NH3' },
      { key: 'nh3', label: 'NH3 (tak terionisasi)', type: 'computed', compute: 'nh3', unit: 'mg/L', help: 'Dihitung dari TAN, pH, suhu, salinitas. Batas peringatan dipasang di sini, bukan di TAN.', threshold: { safeMax: 0.05, dangerMax: 0.1 } },
      { key: 'nitrit', label: 'Nitrit', type: 'number', unit: 'mg/L', threshold: { safeMax: 1, dangerMax: 4 } },
      { key: 'alkalinitas', label: 'Alkalinitas', type: 'number', unit: 'mg/L', threshold: { safeMin: 100, safeMax: 150, dangerMin: 80 } },
      { key: 'volumeAir', label: 'Volume Air', type: 'number', unit: 'L', group: 'Pergantian Air' },
      { key: 'pergantianAir', label: 'Pergantian Air', type: 'number', unit: '%', group: 'Pergantian Air' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 05 · MIKROBIOLOGI TANK LARVA ====================== */
  {
    id: 'mikrobiologiTank', code: '05', section: '05 · Mikrobiologi Tank',
    title: 'Mikrobiologi Tank Larva & PL', collection: 'mikrobiologiTank', traceKey: true,
    desc: 'Vibrio adalah indikator paling awal. Angka total bisa stabil sementara komposisinya bergeser ke jenis berbahaya — koloni hijau & luminescent yang paling perlu diwaspadai.',
    chart: ['tvc', 'tcbsLuminescent'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank', required: true },
      { key: 'stadia', label: 'Stadia', type: 'select', options: STAGES },
      { key: 'sampel', label: 'Jenis Sampel', type: 'select', options: ['Air tank', 'Tubuh (body) larva'] },
      { key: 'tbc', label: 'TBC (total bacterial count)', type: 'number', unit: 'CFU/mL', threshold: { safeMax: 1000, dangerMax: 10000 } },
      { key: 'tvc', label: 'TVC (total vibrio count)', type: 'number', unit: 'CFU/mL', threshold: { safeMax: 100, dangerMax: 1000 } },
      { key: 'tcbsHijau', label: 'TCBS Koloni Hijau', type: 'number', unit: 'CFU/mL', group: 'Komposisi TCBS', threshold: { safeMax: 10, dangerMax: 100 } },
      { key: 'tcbsKuning', label: 'TCBS Koloni Kuning', type: 'number', unit: 'CFU/mL', group: 'Komposisi TCBS' },
      { key: 'tcbsLuminescent', label: 'TCBS Luminescent', type: 'number', unit: 'CFU/mL', group: 'Komposisi TCBS', threshold: { safeMax: 0, dangerMax: 0 }, help: 'Vibrio luminescent — kehadiran sekecil apa pun perlu diwaspadai.' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 06 · PERKEMBANGAN STADIA & SURVIVAL ====================== */
  {
    id: 'stadiaLog', code: '06', section: '06 · Perkembangan Stadia',
    title: 'Perkembangan Stadia & Survival', collection: 'stadiaLog', traceKey: true,
    desc: 'Kecepatan perkembangan melemah lebih dulu — sebelum defect muncul, sebelum ada kematian. Tertinggal dari jadwal adalah peringatan dini. Stadia tidak seragam memicu kanibalisme.',
    chart: ['survivalHarian', 'populasi'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank', required: true },
      { key: 'stadiaDominan', label: 'Stadia Dominan', type: 'select', options: STAGES },
      { key: 'distribusiStadia', label: 'Distribusi Stadia', type: 'text', help: 'mis. Z2 60% / Z3 40%' },
      { key: 'sesuaiJadwal', label: 'Terhadap Jadwal Normal', type: 'select', options: ['Sesuai', 'Tertinggal 0.5 hari', 'Tertinggal ≥1 hari'], threshold: { badValues: ['Tertinggal ≥1 hari'], warnValues: ['Tertinggal 0.5 hari'] } },
      { key: 'kepadatan', label: 'Kepadatan', type: 'number', unit: 'ekor/L' },
      { key: 'populasi', label: 'Estimasi Populasi', type: 'number', unit: 'ekor' },
      { key: 'survivalHarian', label: 'Survival Rate Harian', type: 'number', unit: '%', threshold: { safeMin: 90, dangerMin: 75 } },
      { key: 'survivalAntarStadia', label: 'Survival Antar Stadia', type: 'number', unit: '%', help: 'N→Z, Z→M, M→PL — rekap di pergantian stadia' },
      { key: 'sinkronisasiMolting', label: 'Sinkronisasi Molting', type: 'select', options: ['Seragam', 'Cukup seragam', 'Tidak seragam'], threshold: { badValues: ['Tidak seragam'], warnValues: ['Cukup seragam'] } },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 07 · DEFECT & ABNORMALITAS ====================== */
  {
    id: 'defectLog', code: '07', section: '07 · Defect & Abnormalitas',
    title: 'Defect & Abnormalitas', collection: 'defectLog', traceKey: true,
    desc: 'Semua defect dicatat sebagai persentase dari jumlah sampel, supaya bisa dibuat grafik dan dibandingkan antar hari maupun antar siklus.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank', required: true },
      { key: 'kelompokStadia', label: 'Kelompok Stadia', type: 'select', options: ['Nauplii–Zoea 3', 'Mysis', 'PL'], required: true },
      { key: 'jumlahSampel', label: 'Jumlah Sampel', type: 'number', unit: 'ekor' },
      // Defect umum (Nauplii–Zoea)
      ...defectFields([
        { key: 'defTelson', label: 'Deformitas Telson' },
        { key: 'defSetae', label: 'Deformitas Setae' },
        { key: 'hpPucat', label: 'Hepatopankreas Pucat' },
        { key: 'hpHitam', label: 'Hepatopankreas Hitam' },
        { key: 'masalahMolting', label: 'Masalah Molting' },
        { key: 'penempelan', label: 'Penempelan' },
        { key: 'gumpalanAlgae', label: 'Gumpalan Algae' },
        { key: 'bolitas', label: 'Bolitas' },
      ]),
      // Defect Mysis / PL tambahan
      ...defectFields([
        { key: 'ususKosong', label: 'Usus Kosong' },
        { key: 'vorticella', label: 'Vorticella' },
        { key: 'protozoa', label: 'Protozoa' },
        { key: 'nekrosis', label: 'Nekrosis' },
        { key: 'kanibalisme', label: 'Kanibalisme' },
        { key: 'filamen', label: 'Filamen' },
        { key: 'bakteriLuminescent', label: 'Bakteri Luminescent' },
      ]),
      { key: 'keaktifan', label: 'Tingkat Keaktifan', type: 'select', options: ['Tinggi', 'Sedang', 'Rendah'] },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 08 · UKURAN & KESERAGAMAN PL ====================== */
  {
    id: 'ukuranPL', code: '08', section: '08 · Ukuran PL',
    title: 'Ukuran & Keseragaman PL', collection: 'ukuranPL', traceKey: true,
    desc: 'Ukuran rata-rata menyembunyikan masalah. Sebaran ukuran (CV) yang melebar dari hari ke hari adalah sinyal awal EHP dan pertumbuhan tidak merata.',
    chart: ['cv', 'panjangRata'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank', required: true },
      { key: 'stadia', label: 'Stadia', type: 'select', options: STAGES },
      { key: 'panjangRata', label: 'Panjang Rata-rata', type: 'number', unit: 'mm' },
      { key: 'ekorPerGram', label: 'Jumlah Ekor per Gram', type: 'number', unit: 'ekor/g' },
      { key: 'cv', label: 'CV (koefisien variasi)', type: 'number', unit: '%', threshold: { safeMax: 10, dangerMax: 20 } },
      { key: 'gutMuscle', label: 'Rasio Usus : Otot', type: 'number', help: 'Dari PL5, mis. 0.4', threshold: { safeMin: 0.4, dangerMin: 0.25 } },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 09 · KUALITAS PL PRA-PANEN ====================== */
  {
    id: 'kualitasPL', code: '09', section: '09 · Kualitas PL Pra-Panen',
    title: 'Kualitas PL Sebelum Panen', collection: 'kualitasPL', traceKey: true,
    desc: 'PL yang terlihat sehat belum tentu tahan. Stress test adalah prediktor terbaik performa PL di tambak — jauh lebih baik daripada penampilan.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank', required: true },
      { key: 'stressTestJenis', label: 'Jenis Stress Test', type: 'select', options: ['Penurunan salinitas', 'Formalin'] },
      { key: 'stressSurvival', label: 'Survival Stress Test', type: 'number', unit: '%', threshold: { safeMin: 90, dangerMin: 80 } },
      ...pcrFields(['EHP', 'AHPND', 'WSSV', 'IMNV', 'IHHNV']),
      { key: 'deformitas', label: 'Deformitas', type: 'number', unit: '%', threshold: { safeMax: 5, dangerMax: 10 } },
      { key: 'keaktifan', label: 'Keaktifan', type: 'select', options: ['Tinggi', 'Sedang', 'Rendah'] },
      { key: 'fototaksis', label: 'Respon Fototaksis', type: 'select', options: ['Kuat', 'Sedang', 'Lemah'] },
      { key: 'jumlahPLTotal', label: 'Jumlah PL Total', type: 'number', unit: 'ekor' },
      { key: 'stadiaPanen', label: 'Stadia saat Panen', type: 'select', options: STAGES },
      { key: 'docPanen', label: 'Umur (DOC) saat Panen', type: 'number', unit: 'hari' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 10 · PANEN & PENGIRIMAN ====================== */
  {
    id: 'panen', code: '10', section: '10 · Panen & Pengiriman',
    title: 'Panen, Packing & Pengiriman', collection: 'panen', traceKey: true,
    desc: 'Data pengiriman membedakan kematian akibat perjalanan dari kematian akibat kualitas PL. Juga dasar menghitung jadwal panen mundur dari jam tebar.',
    fields: [
      { key: 'tanggal', label: 'Tanggal Pengiriman', type: 'date', required: true },
      { key: 'tankId', label: 'Tank Asal', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank', required: true },
      { key: 'tambakTujuan', label: 'Tambak Tujuan', type: 'text' },
      { key: 'plPerKantong', label: 'PL per Kantong', type: 'number', unit: 'ekor', group: 'Packing' },
      { key: 'jumlahKantong', label: 'Jumlah Kantong', type: 'number', unit: 'kantong', group: 'Packing' },
      { key: 'suhuKantong', label: 'Suhu Air Kantong (packing)', type: 'number', unit: '°C', group: 'Packing' },
      { key: 'salinitasKantong', label: 'Salinitas Kantong', type: 'number', unit: 'ppt', group: 'Packing' },
      { key: 'jamPanen', label: 'Jam Panen', type: 'time', group: 'Waktu' },
      { key: 'jamPacking', label: 'Jam Packing', type: 'time', group: 'Waktu' },
      { key: 'jamBerangkat', label: 'Jam Berangkat', type: 'time', group: 'Waktu' },
      { key: 'jamTiba', label: 'Jam Tiba', type: 'time', group: 'Waktu' },
      { key: 'lamaTransport', label: 'Total Lama Transportasi', type: 'number', unit: 'jam', group: 'Waktu' },
      { key: 'suhuTiba', label: 'Suhu Kantong saat Tiba', type: 'number', unit: '°C', group: 'Kedatangan' },
      { key: 'doaSurvival', label: 'DOA / Survival saat Tiba', type: 'number', unit: '%', group: 'Kedatangan', threshold: { safeMin: 95, dangerMin: 85 } },
      { key: 'aklimatisasiSuhu', label: 'Suhu Aklimatisasi', type: 'number', unit: '°C', group: 'Aklimatisasi' },
      { key: 'aklimatisasiSalinitas', label: 'Salinitas Aklimatisasi', type: 'number', unit: 'ppt', group: 'Aklimatisasi' },
      { key: 'lamaAklimatisasi', label: 'Lama Aklimatisasi', type: 'number', unit: 'menit', group: 'Aklimatisasi' },
      { key: 'jamTebar', label: 'Jam Tebar', type: 'time', group: 'Aklimatisasi' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== 12 · LOG TINDAKAN ====================== */
  {
    id: 'tindakan', code: '12', section: '12 · Log Tindakan',
    title: 'Log Tindakan & Perlakuan', collection: 'tindakan', traceKey: true,
    desc: 'Kalau tindakan tidak dicatat, kita tidak akan tahu tindakan mana yang menolong. Untuk setiap tindakan: tanggal, jam, tank, jenis, dosis, dan alasan.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'jam', label: 'Jam', type: 'time' },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank' },
      { key: 'jenis', label: 'Jenis Tindakan', type: 'select', required: true, options: ['Pergantian air', 'Pemberian probiotik', 'Bahan kimia / desinfektan', 'Penyesuaian suhu/salinitas', 'Penyiponan', 'Mortalitas induk', 'Lainnya'] },
      { key: 'dosis', label: 'Dosis', type: 'text' },
      { key: 'alasan', label: 'Alasan Tindakan', type: 'textarea', required: true },
    ],
  },

  /* ====================== 13 · HASIL TAMBAK ====================== */
  {
    id: 'hasilTambak', code: '13', section: '13 · Hasil Tambak',
    title: 'Hasil di Tambak', collection: 'hasilTambak',
    desc: 'Ukuran keberhasilan hatchery yang sebenarnya: bagaimana PL tumbuh di tambak. Inilah yang memberi tahu parameter hatchery mana yang benar-benar meramalkan hasil.',
    chart: ['survivalTambak', 'adg'],
    fields: [
      { key: 'tanggal', label: 'Tanggal Update', type: 'date', required: true },
      { key: 'tankId', label: 'Tank Asal PL', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank' },
      { key: 'tambak', label: 'Tambak', type: 'text' },
      { key: 'survivalTambak', label: 'Survival di Tambak', type: 'number', unit: '%', threshold: { safeMin: 70, dangerMin: 50 } },
      { key: 'adg', label: 'Pertumbuhan (ADG)', type: 'number', unit: 'g/hari' },
      { key: 'fcr', label: 'FCR', type: 'number', threshold: { safeMax: 1.3, dangerMax: 1.6 } },
      { key: 'sizePanen', label: 'Size saat Panen', type: 'number', unit: 'ekor/kg' },
      { key: 'kejadianPenyakit', label: 'Kejadian Penyakit', type: 'text' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },

  /* ====================== MASTER · TANK (Traceability 11) ====================== */
  {
    id: 'tank', code: '11', section: 'Master & Traceability',
    title: 'Master Tank', collection: 'tank', labelKey: 'namaTank',
    desc: 'Rantai penelusuran: batch induk → umur induk → tank → tambak tujuan. Data ini ikut menempel di setiap baris data operasional tank.',
    fields: [
      { key: 'namaTank', label: 'ID / Nama Tank', type: 'text', required: true },
      { key: 'batchInduk', label: 'Batch Induk Asal', type: 'ref', refCollection: 'indukBatch', refLabelKey: 'kodeBatch' },
      { key: 'umurInduk', label: 'Umur Induk saat Pemijahan', type: 'number', unit: 'hari' },
      { key: 'tanggalTebar', label: 'Tanggal Tebar Nauplii', type: 'date' },
      { key: 'stadiaSekarang', label: 'Stadia Sekarang', type: 'select', options: STAGES },
      { key: 'tambakTujuan', label: 'Tambak Tujuan', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Panen', 'Selesai'] },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
];

// ---- Helper akses ----
export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export function getSections() {
  const order = [];
  const map = {};
  for (const c of CATEGORIES) {
    if (!map[c.section]) { map[c.section] = []; order.push(c.section); }
    map[c.section].push(c);
  }
  return order.map((s) => ({ section: s, items: map[s] }));
}

// Field yang punya batas (dipakai mesin alert)
export function thresholdFields(category) {
  return category.fields.filter((f) => f.threshold);
}

/* ===========================================================================
   HUBS — konsolidasi navigasi. Enam "judul utama" (per tahap alur hatchery);
   tiap hub memuat fitur/kategori di dalamnya sebagai tab.
   tab: { kind:'category', ref } | { kind:'view', ref, label }
   =========================================================================== */
export const HUBS = [
  { id: 'beranda', title: 'Beranda', subtitle: 'Ringkasan & peringatan', icon: 'home', kind: 'dashboard' },
  {
    id: 'hulu', section: 'maturasi', title: 'Hulu — Induk & Air', subtitle: 'Sumber kualitas seluruh siklus', icon: 'droplet',
    tabs: [
      { kind: 'category', ref: 'indukBatch' },
      { kind: 'category', ref: 'pemijahan' },
      { kind: 'category', ref: 'pakanSegarInduk' },
      { kind: 'category', ref: 'airTreatment' },
      { kind: 'category', ref: 'pakanHidup' },
    ],
  },
  {
    id: 'larva', section: 'larva', title: 'Larva Harian', subtitle: 'Pemantauan tank setiap hari', icon: 'wave',
    tabs: [
      { kind: 'category', ref: 'dailyLog' },
      { kind: 'category', ref: 'mikrobiologiTank' },
      { kind: 'category', ref: 'stadiaLog' },
      { kind: 'category', ref: 'defectLog' },
    ],
  },
  {
    id: 'panen', section: 'panen', title: 'Panen & PL', subtitle: 'Ukuran, kualitas & pengiriman', icon: 'box',
    tabs: [
      { kind: 'category', ref: 'ukuranPL' },
      { kind: 'category', ref: 'kualitasPL' },
      { kind: 'category', ref: 'panen' },
    ],
  },
  {
    id: 'hasil', section: 'lintas', title: 'Hasil & Telusur', subtitle: 'Umpan balik tambak & penelusuran', icon: 'chart',
    tabs: [
      { kind: 'category', ref: 'hasilTambak' },
      { kind: 'category', ref: 'tank' },
      { kind: 'category', ref: 'tindakan' },
    ],
  },
  {
    id: 'sistem', section: 'sistem', title: 'Sistem', subtitle: 'Batas peringatan & asisten', icon: 'gear',
    tabs: [
      { kind: 'view', ref: 'thresholds', label: 'Batas & Peringatan' },
      { kind: 'view', ref: 'assistant', label: 'Asisten AI' },
    ],
  },
];

export function getHubs() { return HUBS; }
export function getHub(id) { return HUBS.find((h) => h.id === id) || null; }

// Label sebuah tab (kategori memakai judul kategori; view memakai label eksplisit)
export function tabLabel(tab) {
  if (tab.kind === 'category') { const c = getCategory(tab.ref); return c ? c.title : tab.ref; }
  return tab.label || tab.ref;
}

// Hub yang memuat sebuah kategori, dan route lengkap ke tab tersebut
export function hubForCategory(catId) {
  return HUBS.find((h) => h.tabs && h.tabs.some((t) => t.kind === 'category' && t.ref === catId)) || null;
}
export function routeForCategory(catId) {
  const h = hubForCategory(catId);
  return h ? `#/h/${h.id}/${catId}` : '#/beranda';
}

/* ===========================================================================
   GLOSSARY — penjelasan bahasa awam untuk istilah teknis (ditampilkan lewat
   ikon ⓘ tooltip). Satu sumber untuk seluruh form & tabel.
   =========================================================================== */
export const GLOSSARY = {
  'NH3': 'Amonia beracun (bentuk tak terionisasi). Hanya bentuk ini yang meracuni larva; proporsinya naik tajam saat pH tinggi.',
  'TAN': 'Total amonia (amonium + amonia). Dipakai untuk menghitung NH3 yang beracun.',
  'DO': 'Oksigen terlarut dalam air. Terlalu rendah membuat larva stres hingga mati.',
  'ORP': 'Daya oksidasi air (mV) — menunjukkan dosis ozon, belum tentu airnya bersih.',
  'TVC': 'Total Vibrio Count — jumlah bakteri Vibrio. Naik berarti risiko penyakit meningkat.',
  'TBC': 'Total Bacterial Count — jumlah total bakteri pada air/sampel.',
  'TCBS': 'Media biakan Vibrio. Warna koloni dibedakan: hijau & luminescent paling berbahaya.',
  'luminescent': 'Vibrio pemancar cahaya — sangat berbahaya; kehadiran sekecil apa pun harus diwaspadai.',
  'CV': 'Koefisien variasi ukuran (%). Semakin melebar = pertumbuhan makin tidak merata (sinyal awal EHP).',
  'gut': 'Rasio usus : otot. Nilai sehat menandakan PL makan cukup dan berotot.',
  'ADG': 'Average Daily Gain — pertambahan berat udang per hari di tambak.',
  'FCR': 'Feed Conversion Ratio — pakan (kg) untuk menghasilkan 1 kg udang. Makin kecil makin efisien.',
  'PCR': 'Uji laboratorium pendeteksi penyakit. Hasil Positif berarti penyakit terdeteksi.',
  'DOC': 'Day of Culture — umur pemeliharaan dalam hari.',
  'fototaksis': 'Respon larva terhadap cahaya. Respon kuat menandakan larva sehat & aktif.',
  'molting': 'Proses ganti kulit larva. Bila tidak serempak, memicu kanibalisme.',
  'fekunditas': 'Jumlah telur yang dihasilkan induk pada satu pemijahan.',
  'alkalinitas': 'Kemampuan air menahan perubahan pH (efek penyangga).',
  'salinitas': 'Kadar garam air, diukur dalam ppt (part per thousand).',
  'fertilization': 'Persentase telur yang berhasil dibuahi.',
  'hatching': 'Persentase telur/kista yang berhasil menetas.',
  'stress test': 'Uji ketahanan PL (turunkan salinitas/beri formalin). Prediktor terbaik performa di tambak.',
  'survival': 'Persentase larva/udang yang bertahan hidup.',
  'stadia': 'Tahap perkembangan larva: Nauplii → Zoea → Mysis → PL.',
  'nauplii': 'Stadia larva paling awal setelah telur menetas.',
  'vorticella': 'Protozoa penempel pada larva — tanda kualitas air/tank menurun.',
  'resirkulasi': 'Waktu memutar air setelah ozonasi agar ozon hilang sebelum kontak larva.',
};
