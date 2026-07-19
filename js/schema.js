/* ===========================================================================
   schema.js — SUMBER TUNGGAL: divisi (Lab/Produksi/MPM), kategori, parameter,
   batas (threshold), dan frekuensi pengecekan. Form/kartu/tabel/grafik & mesin
   alert dibangun dari sini.

   Model threshold: { safeMin, safeMax, dangerMin, dangerMax } untuk numerik,
   atau { badValues:[...], warnValues:[...] } untuk pilihan (select/pcr).
   Tipe field: text|number|date|time|textarea|select|pcr|ref|computed
   =========================================================================== */

export const STAGES = ['N1','N2','N3','N4','N5','N6','Z1','Z2','Z3','M1','M2','M3','PL1','PL2','PL3','PL≥4'];
export const PCR_OPTIONS = ['Belum diuji', 'Negatif', 'Positif'];
const ADA = ['Tidak ada', 'Ada'];

const pcrFields = (targets) =>
  targets.map((t) => ({ key: 'pcr' + t.replace(/[^A-Za-z0-9]/g, ''), label: 'PCR ' + t, type: 'pcr', group: 'PCR' }));

/* ============================ KATEGORI ============================ */
export const CATEGORIES = [
  /* ---------------- DIVISI LAB (analisis mutu) ---------------- */
  {
    id: 'labMikro', code: 'LAB', division: 'lab', collection: 'labMikro', traceKey: true,
    title: 'Analisis Mikrobiologi', frekuensi: 'Harian, setiap plating',
    desc: 'Hasil uji mikrobiologi air & tubuh larva. Perhatikan komposisi TCBS — koloni hijau & luminescent paling berbahaya.',
    chart: ['tvc', 'tcbsLuminescent'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank' },
      { key: 'titik', label: 'Titik Sampel', type: 'select', options: ['Air tandon', 'Sebelum treatment', 'Setelah UV 1', 'Setelah UV 2', 'Setelah ozon', 'Air tank larva', 'Tubuh larva'] },
      { key: 'stadia', label: 'Stadia', type: 'select', options: STAGES },
      { key: 'vibrio', label: 'Hasil Mikro (Vibrio)', type: 'select', options: ADA, threshold: { badValues: ['Ada'] }, help: 'Ada = perlu tindakan' },
      { key: 'tvc', label: 'TVC', type: 'number', unit: 'CFU/mL', threshold: { safeMax: 2300, dangerMax: 10000 }, help: 'Batas ≤ 2,3×10³' },
      { key: 'tbc', label: 'TBC', type: 'number', unit: 'CFU/mL', threshold: { safeMax: 10000, dangerMax: 100000 } },
      { key: 'tcbsHijau', label: 'TCBS Koloni Hijau', type: 'number', unit: 'CFU/mL', group: 'Komposisi TCBS', threshold: { safeMax: 10, dangerMax: 100 } },
      { key: 'tcbsKuning', label: 'TCBS Koloni Kuning', type: 'number', unit: 'CFU/mL', group: 'Komposisi TCBS' },
      { key: 'tcbsLuminescent', label: 'TCBS Luminescent', type: 'number', unit: 'CFU/mL', group: 'Komposisi TCBS', threshold: { safeMax: 0, dangerMax: 0 } },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'labPcrKimia', code: 'LAB', division: 'lab', collection: 'labPcrKimia',
    title: 'PCR & Kimia', frekuensi: 'Setiap batch / berkala',
    desc: 'Deteksi penyakit (PCR) dan uji kimia. PCR positif menandakan penyakit terdeteksi.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'sampel', label: 'Jenis Sampel', type: 'select', options: ['Induk', 'PL', 'Air', 'Pakan segar'] },
      { key: 'kode', label: 'Kode Sampel / Batch', type: 'text' },
      ...pcrFields(['WSSV', 'IMNV', 'EHP', 'AHPND', 'IHHNV']),
      { key: 'nitrit', label: 'Nitrit', type: 'number', unit: 'ppm', group: 'Kimia', threshold: { safeMax: 1, dangerMax: 3 } },
      { key: 'amonia', label: 'Amonia (TAN)', type: 'number', unit: 'mg/L', group: 'Kimia' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'labCekLarva', code: 'LAB', division: 'lab', collection: 'labCekLarva', traceKey: true,
    title: 'Cek Harian Larva', frekuensi: '2× sehari (AM & PM), per tank',
    desc: 'Observasi mutu larva harian sesuai SOP: perkembangan stadia (AM/PM), bacterial count before/after, % SR, deformitas, parasit, dan transfer PL.',
    chart: ['sr', 'mortalitas'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank (TK#)', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank' },
      { key: 'doc', label: 'Day (DOC)', type: 'number', unit: 'hari' },
      { key: 'count', label: 'Count (populasi)', type: 'number', unit: 'ekor' },
      { key: 'stadiaDominan', label: 'Stage', type: 'select', options: STAGES },
      { key: 'nPriority', label: 'N. Priority (MB)', type: 'text', help: 'Mengikuti form, mis. "MB: 100%"' },
      { key: 'realStageAM', label: 'Real Stage AM', type: 'text', group: 'Real Stage', help: 'Distribusi % stadia pagi, mis. "M1 20% M2 53% M3 27%"' },
      { key: 'realStagePM', label: 'Real Stage PM', type: 'text', group: 'Real Stage', help: 'Distribusi % stadia sore' },
      { key: 'bacterialBefore', label: 'Bacterial Count Before', type: 'text', group: 'Bacterial Count', help: 'Koloni (y=kuning); TNTC bila terlalu banyak' },
      { key: 'bacterialAfter', label: 'Bacterial Count After', type: 'text', group: 'Bacterial Count' },
      { key: 'sr', label: '% SR (Survival Rate)', type: 'number', unit: '%', threshold: { safeMin: 70, dangerMin: 50 } },
      { key: 'defmt', label: 'Defmt (Deformitas)', type: 'number', unit: '%', threshold: { safeMax: 5, dangerMax: 15 } },
      { key: 'mortalitas', label: 'Mortalitas (mati)', type: 'number', unit: '%', group: 'Observasi', threshold: { safeMax: 5, dangerMax: 15 } },
      { key: 'nekrosis', label: 'Nekrosis (nec)', type: 'number', unit: '%', group: 'Observasi', threshold: { safeMax: 3, dangerMax: 10 } },
      { key: 'kanibalisme', label: 'Kanibalisme (can)', type: 'number', unit: '%', group: 'Observasi', threshold: { safeMax: 3, dangerMax: 10 } },
      { key: 'problemMolting', label: 'Problem Molting (PM)', type: 'number', unit: '%', group: 'Observasi', threshold: { safeMax: 5, dangerMax: 15 } },
      { key: 'protozoa', label: 'Protozoa (pro)', type: 'select', options: ['Tidak ada', 'Sedikit', 'Banyak'], group: 'Observasi', threshold: { badValues: ['Banyak'], warnValues: ['Sedikit'] } },
      { key: 'vorticella', label: 'Vorticella (vort)', type: 'select', options: ['Tidak ada', 'Sedikit', 'Banyak'], group: 'Observasi', threshold: { badValues: ['Banyak'], warnValues: ['Sedikit'] } },
      { key: 'penvort', label: 'Penempelan Vorticella (penvort)', type: 'number', unit: '%', group: 'Observasi' },
      { key: 'filamen', label: 'Filamen (fil)', type: 'select', options: ['Tidak ada', 'Sedikit', 'Banyak'], group: 'Observasi' },
      { key: 'ususKosong', label: 'Usus Kosong (0=)', type: 'number', unit: '%', group: 'Observasi', threshold: { safeMax: 5, dangerMax: 20 } },
      { key: 'hasilMikro', label: 'Hasil Mikro (Vibrio)', type: 'select', options: ADA, threshold: { badValues: ['Ada'] } },
      { key: 'transferSR', label: 'Transfer SR', type: 'number', unit: '%', group: 'Transfer PL', threshold: { safeMin: 80, dangerMin: 60 } },
      { key: 'transferSize', label: 'Transfer Size', type: 'number', unit: 'mm', group: 'Transfer PL' },
      { key: 'remarks', label: 'REMARKS', type: 'textarea', help: 'Kode SOP lain (mis. kec, art, AK, jel, foul, gumpal) ditulis di sini' },
    ],
  },
  {
    id: 'labAlgae', code: 'LAB', division: 'lab', collection: 'labAlgae',
    title: 'Kualitas Algae', frekuensi: 'Harian, per tank massal',
    desc: 'Penilaian mutu kultur algae: mikrobiologi, kepadatan, grade, dan nitrit.',
    chart: ['density', 'nitrit'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'jenis', label: 'Jenis Algae', type: 'select', options: ['Thalassiosira', 'Chaetoceros', 'Amphora', 'Nannochloropsis'] },
      { key: 'hasilMikro', label: 'Hasil Mikro (Vibrio)', type: 'select', options: ADA, threshold: { badValues: ['Ada'] } },
      { key: 'density', label: 'Density', type: 'number', unit: 'sel/mL' },
      { key: 'grade', label: 'Kualitas (Grade)', type: 'select', options: ['A', 'B', 'C'], threshold: { badValues: ['C'], warnValues: ['B'] } },
      { key: 'nitrit', label: 'Nitrit Test', type: 'number', unit: 'ppm', threshold: { safeMax: 1, dangerMax: 3 } },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'temuanLab', code: 'LAB', division: 'lab', collection: 'temuanLab',
    title: 'Temuan & Rekomendasi', frekuensi: 'Sesuai kebutuhan',
    desc: 'Temuan mutu dari Lab beserta rekomendasi penyesuaian parameter untuk Produksi.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'area', label: 'Area / Tahap', type: 'select', options: ['Water', 'Algae', 'Artemia', 'Induk', 'Larvae', 'Post Larvae', 'Umum'] },
      { key: 'parameter', label: 'Parameter Terkait', type: 'text', help: 'mis. pH air, ORP, nitrit' },
      { key: 'temuan', label: 'Temuan', type: 'textarea', required: true },
      { key: 'rekomendasi', label: 'Rekomendasi', type: 'textarea', required: true, help: 'mis. "Naikkan pH target menjadi 8.1"' },
      { key: 'status', label: 'Status Tindak Lanjut', type: 'select', options: ['Baru', 'Diterapkan'] },
    ],
  },

  /* ---------------- DIVISI PRODUKSI (operasi SOP) ---------------- */
  {
    id: 'prodPersiapanWater', code: 'PRD', division: 'produksi', collection: 'prodPersiapanWater',
    title: 'Persiapan Water', frekuensi: 'Setiap batch air',
    desc: 'Persiapan & treatment air sebelum dipakai: klorinasi, ozonasi (ORP), resirkulasi, dan kondisi karbon.',
    chart: ['orpIn', 'suhuTandon'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'klorin', label: 'Klorin', type: 'number', unit: 'ppm', group: 'Persiapan' },
      { key: 'ph', label: 'pH', type: 'number', group: 'Persiapan', threshold: { safeMin: 7.8, safeMax: 8.4, dangerMin: 7.5, dangerMax: 8.7 } },
      { key: 'orpIn', label: 'ORP In', type: 'number', unit: 'mV', group: 'Ozon', threshold: { safeMin: 530, safeMax: 550, dangerMin: 500, dangerMax: 570 }, help: 'Ideal 530–550, maks 570' },
      { key: 'orpOn', label: 'ORP On', type: 'number', unit: 'mV', group: 'Ozon', threshold: { safeMin: 150, safeMax: 200, dangerMin: 120, dangerMax: 250 } },
      { key: 'resirkulasi', label: 'Waktu Resirkulasi', type: 'number', unit: 'jam', group: 'Ozon', threshold: { safeMin: 12, dangerMin: 8 }, help: 'Harus > 12 jam' },
      { key: 'usiaKarbon', label: 'Usia Karbon', type: 'number', unit: 'hari', group: 'Karbon', threshold: { safeMax: 50, dangerMax: 60 }, help: 'Ganti sebelum 50 hari' },
      { key: 'suhuTandon', label: 'Suhu Air Tandon', type: 'number', unit: '°C', threshold: { safeMin: 29, safeMax: 31, dangerMin: 27, dangerMax: 33 } },
      { key: 'salinitas', label: 'Salinitas', type: 'number', unit: 'ppt', threshold: { safeMin: 28, safeMax: 34, dangerMin: 25, dangerMax: 37 } },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'prodAlgae', code: 'PRD', division: 'produksi', collection: 'prodAlgae',
    title: 'Kultur Algae', frekuensi: 'Harian, per tank massal',
    desc: 'Operasional kultur algae massal.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'jenis', label: 'Jenis Algae', type: 'select', options: ['Thalassiosira', 'Chaetoceros', 'Amphora', 'Nannochloropsis'] },
      { key: 'density', label: 'Density', type: 'number', unit: 'sel/mL' },
      { key: 'kondisi', label: 'Kondisi/Warna', type: 'select', options: ['Baik', 'Sedang', 'Buruk'], threshold: { badValues: ['Buruk'], warnValues: ['Sedang'] } },
      { key: 'volume', label: 'Volume', type: 'number', unit: 'L' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'prodArtemia', code: 'PRD', division: 'produksi', collection: 'prodArtemia',
    title: 'Artemia', frekuensi: 'Setiap penetasan',
    desc: 'Penetasan & penyiapan artemia.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'nomorBatch', label: 'Nomor Batch Kista', type: 'text' },
      { key: 'hatchingRate', label: 'Hatching Rate', type: 'number', unit: '%', threshold: { safeMin: 80, dangerMin: 60 } },
      { key: 'kepadatan', label: 'Kepadatan', type: 'number', unit: 'ekor/mL' },
      { key: 'dekapsulasi', label: 'Dekapsulasi', type: 'select', options: ['Ya', 'Tidak'] },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'prodInduk', code: 'PRD', division: 'produksi', collection: 'prodInduk',
    title: 'Induk / Maturasi', frekuensi: 'Harian & setiap pemijahan',
    desc: 'Operasional maturasi induk & pemijahan. Induk berhubungan erat dengan kualitas water.',
    chart: ['hatching', 'fertil'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'kodeBatch', label: 'Kode Batch Induk', type: 'text' },
      { key: 'umurInduk', label: 'Umur Induk', type: 'number', unit: 'hari' },
      { key: 'suhuAir', label: 'Suhu Air Maturasi', type: 'number', unit: '°C', group: 'Air Maturasi', threshold: { safeMin: 27, safeMax: 30, dangerMin: 25, dangerMax: 32 } },
      { key: 'salinitas', label: 'Salinitas', type: 'number', unit: 'ppt', group: 'Air Maturasi' },
      { key: 'do', label: 'DO', type: 'number', unit: 'mg/L', group: 'Air Maturasi', threshold: { safeMin: 5, dangerMin: 4 } },
      { key: 'ph', label: 'pH', type: 'number', group: 'Air Maturasi', threshold: { safeMin: 7.8, safeMax: 8.4, dangerMin: 7.5, dangerMax: 8.7 } },
      { key: 'insang', label: 'Cek Insang', type: 'select', options: ['Baik', 'Bermasalah'], group: 'Kondisi Induk', threshold: { badValues: ['Bermasalah'] } },
      { key: 'orange', label: 'Orange', type: 'select', options: ADA, group: 'Kondisi Induk' },
      { key: 'plankton', label: 'Plankton', type: 'select', options: ADA, group: 'Kondisi Induk' },
      { key: 'femalesSourced', label: '# Females Sourced', type: 'number', unit: 'ekor', group: 'Pemijahan' },
      { key: 'jumlahTelur', label: 'Σ Telur', type: 'number', unit: 'butir', group: 'Pemijahan' },
      { key: 'eggsPerFem', label: 'Eggs/Fem', type: 'number', unit: 'butir', group: 'Pemijahan' },
      { key: 'fertil', label: 'Fertile', type: 'number', unit: '%', group: 'Pemijahan', threshold: { safeMin: 80, dangerMin: 60 } },
      { key: 'hatching', label: '% Hatch', type: 'number', unit: '%', group: 'Pemijahan', threshold: { safeMin: 70, dangerMin: 50 } },
      { key: 'naupsPerFem', label: 'Naups/Fem', type: 'number', unit: 'ekor', group: 'Pemijahan' },
      { key: 'jumlahNauplii', label: 'Σ Nauplii', type: 'number', unit: 'ekor', group: 'Pemijahan' },
      { key: 'abnormalNauplii', label: 'Nauplii Abnormal', type: 'number', unit: '%', group: 'Pemijahan', threshold: { safeMax: 5, dangerMax: 15 } },
      { key: 'harvestLarvae', label: 'Harvest Larvae', type: 'number', unit: 'ekor', group: 'Panen Nauplii' },
      { key: 'flushing', label: 'Flushing', type: 'number', unit: 'ekor', group: 'Panen Nauplii' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'prodLarvae', code: 'PRD', division: 'produksi', collection: 'prodLarvae', traceKey: true,
    title: 'Larvae — Air Harian', frekuensi: '2× sehari (pagi & sore), per tank',
    desc: 'Kualitas air harian tank larva. NH3 dihitung otomatis dari TAN, pH, suhu, salinitas.',
    chart: ['nh3', 'nitrit', 'do'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank', required: true },
      { key: 'suhuPagi', label: 'Suhu Pagi', type: 'number', unit: '°C', group: 'Suhu', threshold: { safeMin: 28, safeMax: 31, dangerMin: 26, dangerMax: 33 } },
      { key: 'suhuSore', label: 'Suhu Sore', type: 'number', unit: '°C', group: 'Suhu', threshold: { safeMin: 28, safeMax: 31, dangerMin: 26, dangerMax: 33 } },
      { key: 'suhuDelta', label: 'Selisih Suhu', type: 'computed', compute: 'suhuDelta', unit: '°C', threshold: { safeMax: 1.5, dangerMax: 3 } },
      { key: 'do', label: 'DO', type: 'number', unit: 'mg/L', threshold: { safeMin: 5, dangerMin: 4 } },
      { key: 'phPagi', label: 'pH Pagi', type: 'number', group: 'pH', threshold: { safeMin: 7.8, safeMax: 8.4, dangerMin: 7.5, dangerMax: 8.7 } },
      { key: 'phSore', label: 'pH Sore', type: 'number', group: 'pH', threshold: { safeMin: 7.8, safeMax: 8.4, dangerMin: 7.5, dangerMax: 8.7 } },
      { key: 'phDelta', label: 'Selisih pH', type: 'computed', compute: 'phDelta', threshold: { safeMax: 0.5, dangerMax: 0.8 } },
      { key: 'salinitas', label: 'Salinitas', type: 'number', unit: 'ppt', threshold: { safeMin: 28, safeMax: 34, dangerMin: 25, dangerMax: 37 } },
      { key: 'tan', label: 'Amonia Total (TAN)', type: 'number', unit: 'mg/L' },
      { key: 'nh3', label: 'NH3 (tak terionisasi)', type: 'computed', compute: 'nh3', unit: 'mg/L', threshold: { safeMax: 0.05, dangerMax: 0.1 }, help: 'Dihitung dari TAN, pH, suhu, salinitas' },
      { key: 'nitrit', label: 'Nitrit', type: 'number', unit: 'mg/L', threshold: { safeMax: 1, dangerMax: 4 } },
      { key: 'alkalinitas', label: 'Alkalinitas', type: 'number', unit: 'mg/L', threshold: { safeMin: 100, safeMax: 150, dangerMin: 80 } },
      { key: 'pergantianAir', label: 'Pergantian Air', type: 'number', unit: '%' },
      { key: 'algaeTransfer', label: 'Algae Transfer', type: 'text', group: 'Pakan & Treatment' },
      { key: 'pakan', label: 'Pakan', type: 'text', group: 'Pakan & Treatment' },
      { key: 'chloramint', label: 'Chloramint', type: 'number', unit: 'ppm', group: 'Pakan & Treatment' },
      { key: 'formalin', label: 'Formalin', type: 'number', unit: 'ppm', group: 'Pakan & Treatment' },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
  {
    id: 'prodPostLarvae', code: 'PRD', division: 'produksi', collection: 'prodPostLarvae', traceKey: true,
    title: 'Post Larvae & Panen', frekuensi: 'Harian dari PL3 / setiap panen',
    desc: 'Mutu & ukuran PL sesuai SOP: Count, Est. Panen, % SR, Def, Size/CV, hingga panen & pengiriman.',
    chart: ['cv', 'sizeManual'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'tankId', label: 'Tank (TK#)', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank' },
      { key: 'stadia', label: 'Stage', type: 'select', options: STAGES },
      { key: 'count', label: 'Count', type: 'number', unit: 'ekor', group: 'Populasi' },
      { key: 'estPanen', label: 'Est. Panen', type: 'number', unit: 'ekor', group: 'Populasi' },
      { key: 'sr', label: '% SR', type: 'number', unit: '%', group: 'Mutu', threshold: { safeMin: 60, dangerMin: 40 } },
      { key: 'def', label: 'Def (Deformitas)', type: 'number', unit: '%', group: 'Mutu', threshold: { safeMax: 5, dangerMax: 15 } },
      { key: 'sizeManual', label: 'Size Manual', type: 'number', unit: 'mm', group: 'Ukuran' },
      { key: 'cv', label: 'CV Manual', type: 'number', unit: '%', group: 'Ukuran', threshold: { safeMax: 10, dangerMax: 20 } },
      { key: 'ekorPerGram', label: 'Ekor per Gram', type: 'number', unit: 'ekor/g', group: 'Ukuran' },
      { key: 'stressSurvival', label: 'Stress Test Survival', type: 'number', unit: '%', group: 'Mutu', threshold: { safeMin: 90, dangerMin: 80 } },
      { key: 'totalPanen', label: 'Total Panen', type: 'number', unit: 'ekor', group: 'Panen' },
      { key: 'srPanen', label: 'SR Panen', type: 'number', unit: '%', group: 'Panen', threshold: { safeMin: 70, dangerMin: 50 } },
      { key: 'plPerKantong', label: 'PL per Kantong', type: 'number', unit: 'ekor', group: 'Panen' },
      { key: 'jumlahKantong', label: 'Jumlah Kantong', type: 'number', unit: 'kantong', group: 'Panen' },
      { key: 'doaSurvival', label: 'Survival saat Tiba', type: 'number', unit: '%', group: 'Panen', threshold: { safeMin: 95, dangerMin: 85 } },
      { key: 'tambakTujuan', label: 'Tambak Tujuan', type: 'text', group: 'Panen' },
      { key: 'remarks', label: 'REMARKS', type: 'textarea' },
    ],
  },
  {
    id: 'prodTindakan', code: 'PRD', division: 'produksi', collection: 'prodTindakan', traceKey: true,
    title: 'Log Tindakan', frekuensi: 'Setiap tindakan',
    desc: 'Catatan tindakan & perlakuan: pergantian air, probiotik, kimia, penyiponan, dll.',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'jam', label: 'Jam', type: 'time' },
      { key: 'tankId', label: 'Tank', type: 'ref', refCollection: 'tank', refLabelKey: 'namaTank' },
      { key: 'jenis', label: 'Jenis Tindakan', type: 'select', required: true, options: ['Pergantian air', 'Pemberian probiotik', 'Bahan kimia / desinfektan', 'Penyesuaian suhu/salinitas', 'Penyiponan', 'Lainnya'] },
      { key: 'dosis', label: 'Dosis', type: 'text' },
      { key: 'alasan', label: 'Alasan', type: 'textarea', required: true },
    ],
  },

  /* ---------------- MASTER (Admin) ---------------- */
  {
    id: 'tank', code: 'MST', division: 'sistem', collection: 'tank', labelKey: 'namaTank',
    title: 'Master Tank', frekuensi: 'Saat perubahan',
    desc: 'Data tank & penelusuran: batch induk → umur → tank → tambak tujuan.',
    fields: [
      { key: 'namaTank', label: 'ID / Nama Tank', type: 'text', required: true },
      { key: 'batchInduk', label: 'Batch Induk Asal', type: 'text' },
      { key: 'umurInduk', label: 'Umur Induk', type: 'number', unit: 'hari' },
      { key: 'tanggalTebar', label: 'Tanggal Tebar', type: 'date' },
      { key: 'stadiaSekarang', label: 'Stadia Sekarang', type: 'select', options: STAGES },
      { key: 'tambakTujuan', label: 'Tambak Tujuan', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Panen', 'Selesai'] },
      { key: 'catatan', label: 'Catatan', type: 'textarea' },
    ],
  },
];

// ---- Helper kategori ----
export function getCategory(id) { return CATEGORIES.find((c) => c.id === id) || null; }
export function thresholdFields(category) { return category.fields.filter((f) => f.threshold); }

/* ============================ HUBS (per divisi) ============================ */
export const HUBS = [
  { id: 'beranda', title: 'Beranda', subtitle: 'Ringkasan & peringatan', icon: 'home', kind: 'dashboard' },
  {
    id: 'lab', division: 'lab', title: 'Divisi Lab', subtitle: 'Mutu · analisis · standar', icon: 'flask',
    tabs: [
      { kind: 'view', ref: 'standar', label: 'Standar Parameter' },
      { kind: 'category', ref: 'labMikro' },
      { kind: 'category', ref: 'labPcrKimia' },
      { kind: 'category', ref: 'labCekLarva' },
      { kind: 'category', ref: 'labAlgae' },
      { kind: 'category', ref: 'temuanLab' },
    ],
  },
  {
    id: 'produksi', division: 'produksi', title: 'Divisi Produksi', subtitle: 'Pencatatan SOP operasional', icon: 'gears',
    tabs: [
      { kind: 'category', ref: 'prodPersiapanWater' },
      { kind: 'category', ref: 'prodAlgae' },
      { kind: 'category', ref: 'prodArtemia' },
      { kind: 'category', ref: 'prodInduk' },
      { kind: 'category', ref: 'prodLarvae' },
      { kind: 'category', ref: 'prodPostLarvae' },
      { kind: 'category', ref: 'prodTindakan' },
      { kind: 'category', ref: 'temuanLab', label: 'Rekomendasi Lab' },
      { kind: 'view', ref: 'standar', label: 'Standar (baca)' },
    ],
  },
  {
    id: 'mpm', division: 'mpm', title: 'Divisi MPM', subtitle: 'QA & verifikasi', icon: 'shield',
    tabs: [
      { kind: 'view', ref: 'verifikasi', label: 'Verifikasi' },
      { kind: 'view', ref: 'standar', label: 'Standar (baca)' },
    ],
  },
  {
    id: 'sistem', division: 'sistem', title: 'Sistem', subtitle: 'Asisten & pengaturan', icon: 'gear',
    tabs: [
      { kind: 'view', ref: 'assistant', label: 'Asisten AI' },
      { kind: 'category', ref: 'tank', label: 'Master Tank' },
    ],
  },
];

export function getHubs() { return HUBS; }
export function getHub(id) { return HUBS.find((h) => h.id === id) || null; }
export function tabLabel(tab) {
  if (tab.label) return tab.label;
  if (tab.kind === 'category') { const c = getCategory(tab.ref); return c ? c.title : tab.ref; }
  return tab.ref;
}
export function hubForCategory(catId) {
  return HUBS.find((h) => h.tabs && h.tabs.some((t) => t.kind === 'category' && t.ref === catId)) || null;
}
export function routeForCategory(catId) {
  const h = hubForCategory(catId);
  return h ? `#/h/${h.id}/${catId}` : '#/beranda';
}

/* ============================ GLOSARIUM ============================ */
export const GLOSSARY = {
  'NH3': 'Amonia beracun (tak terionisasi). Hanya bentuk ini yang meracuni larva; proporsinya naik tajam saat pH tinggi.',
  'TAN': 'Total amonia (amonium + amonia). Dipakai menghitung NH3 yang beracun.',
  'DO': 'Oksigen terlarut. Terlalu rendah membuat larva stres hingga mati.',
  'ORP In': 'Daya oksidasi air masuk sistem ozon (mV). Ideal 530–550, maksimal 570.',
  'ORP On': 'Daya oksidasi saat ozon aktif (mV), target 150–200.',
  'ORP': 'Daya oksidasi air (mV) — indikator dosis ozon.',
  'TVC': 'Total Vibrio Count — jumlah bakteri Vibrio. Batas air ≤ 2,3×10³.',
  'TBC': 'Total Bacterial Count — jumlah total bakteri.',
  'TCBS': 'Media biakan Vibrio. Koloni hijau & luminescent paling berbahaya.',
  'luminescent': 'Vibrio pemancar cahaya — sangat berbahaya; kehadiran sekecil apa pun diwaspadai.',
  'Vibrio': 'Bakteri penyebab penyakit utama pada larva udang.',
  'klorin': 'Desinfektan air pada persiapan (ppm).',
  'resirkulasi': 'Waktu memutar air setelah ozonasi agar ozon hilang sebelum kontak larva (>12 jam).',
  'karbon': 'Filter karbon aktif; diganti sebelum usia 50 hari.',
  'grade': 'Mutu kultur algae: A terbaik, B cukup, C buruk.',
  'density': 'Kepadatan sel algae (sel/mL).',
  'PCR': 'Uji laboratorium pendeteksi penyakit. Positif = penyakit terdeteksi.',
  'CV': 'Koefisien variasi ukuran (%). Pelebaran = pertumbuhan tidak merata (sinyal awal EHP).',
  'DOC': 'Day of Culture — umur pemeliharaan (hari).',
  'SR': 'Survival Rate — persentase yang bertahan hidup.',
  'Defmt': 'Deformitas — persentase larva cacat bentuk.',
  'Def': 'Deformitas (%) pada PL.',
  'Bacterial Count': 'Hitungan koloni bakteri (akhiran y = koloni kuning). TNTC = terlalu banyak.',
  'TNTC': 'Too Numerous To Count — koloni terlalu banyak untuk dihitung.',
  'Real Stage': 'Distribusi persentase stadia larva pada waktu tertentu (AM pagi / PM sore).',
  'Chloramint': 'Bahan treatment/desinfektan air larva (ppm).',
  'Formalin': 'Bahan treatment antiparasit (ppm).',
  'penvort': 'Penempelan Vorticella pada tubuh larva (%).',
  'Usus Kosong': 'Persentase larva yang ususnya kosong (tidak makan).',
  'Est. Panen': 'Estimasi jumlah PL saat panen.',
  'Naups': 'Nauplii — stadia larva paling awal.',
  'molting': 'Proses ganti kulit larva; bila tidak serempak memicu kanibalisme.',
  'insang': 'Cek insang induk sebagai indikator kesehatan.',
  'plankton': 'Kehadiran plankton pada pemeriksaan induk/air.',
  'nitrit': 'Senyawa beracun; batas algae/air < 1 ppm.',
  'alkalinitas': 'Kemampuan air menahan perubahan pH (penyangga).',
  'salinitas': 'Kadar garam air (ppt).',
  'vorticella': 'Protozoa penempel pada larva — tanda kualitas air/tank menurun.',
  'zoothamnium': 'Protozoa penempel koloni — indikator kualitas menurun.',
  'kondisi usus': 'Skor keterisian usus larva; % usus penuh menandakan larva makan cukup.',
};
