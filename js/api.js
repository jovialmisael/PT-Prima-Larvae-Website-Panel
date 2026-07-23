/* ===========================================================================
   api.js — LAPISAN DATA (satu-satunya seam ke backend).

   Saat ini: baca/tulis ke localStorage.
   Nanti (Laravel): ganti isi tiap fungsi menjadi panggilan fetch() REST.
   Kontrak endpoint yang diharapkan backend:

     GET    /api/{collection}          -> list()
     GET    /api/{collection}/{id}     -> get()
     POST   /api/{collection}          -> create()
     PUT    /api/{collection}/{id}     -> update()
     DELETE /api/{collection}/{id}     -> remove()
     GET/PUT/api/thresholds            -> override batas
     POST   /api/assistant             -> askAssistant() (proxy AI, key di server)

   Karena semua view hanya memanggil fungsi di file ini, migrasi ke Laravel
   tidak menyentuh kode view.
   =========================================================================== */

import { SEED } from './seed.js';

const PREFIX = 'pl_hatchery_';
const THRESHOLD_KEY = PREFIX + '_thresholds';
const SEEDED_KEY = PREFIX + '_seeded';

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function read(collection) {
  try {
    const raw = localStorage.getItem(PREFIX + collection);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(collection, arr) {
  localStorage.setItem(PREFIX + collection, JSON.stringify(arr));
}

// Urutkan terbaru dulu (tanggal → createdAt)
function sortRecords(arr) {
  return arr.slice().sort((a, b) => {
    const da = String(a.tanggal || '');
    const db = String(b.tanggal || '');
    if (da !== db) return db.localeCompare(da);
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

// ---- CRUD generik ----
export function list(collection) {
  return sortRecords(read(collection));
}

export function get(collection, id) {
  return read(collection).find((r) => r.id === id) || null;
}

export function create(collection, obj) {
  const now = new Date().toISOString();
  const record = { ...obj, id: uid(), createdAt: now, updatedAt: now };
  const arr = read(collection);
  arr.push(record);
  write(collection, arr);
  return record;
}

export function update(collection, id, patch) {
  const arr = read(collection);
  const i = arr.findIndex((r) => r.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch, id, updatedAt: new Date().toISOString() };
  write(collection, arr);
  return arr[i];
}

export function remove(collection, id) {
  write(collection, read(collection).filter((r) => r.id !== id));
}

/* Transisi status pengesahan berjenjang (alur form fisik):
   Draft → Diparaf Ka.Sie → Diparaf QC → Disahkan (MPM).
   `stamp` = { name, role, at } dari auth.userStamp(user).
   Di Laravel nanti: divalidasi server (policy) sebelum menyimpan. */
export function verify(collection, id, step, stamp) {
  const map = {
    parafKasie: { status: 'Diparaf Ka.Sie', diparafKasie: stamp },
    parafQc:    { status: 'Diparaf QC',      diparafQc: stamp },
    sahkanMpm:  { status: 'Disahkan',        disahkanMpm: stamp },
  };
  return update(collection, id, map[step] || {});
}

// Cari label sebuah record referensi (mis. nama tank dari id)
export function refLabel(collection, id, labelKey) {
  if (!id) return '';
  const rec = get(collection, id);
  if (!rec) return id;
  return rec[labelKey] || rec.namaTank || rec.kodeBatch || id;
}

/* ---- Standar parameter (batas + tindakan + kontak + sumber) ------------------
   Disimpan per fieldKey sebagai override atas default schema. Objek dapat memuat
   { safeMin, safeMax, dangerMin, dangerMax, tindakan, kontakRole, sumber, sumberTgl }.
   Kontrak backend: GET/PUT /api/thresholds. */
export function getThresholdOverrides() {
  try {
    return JSON.parse(localStorage.getItem(THRESHOLD_KEY) || '{}');
  } catch {
    return {};
  }
}
export function getThresholdOverride(fieldKey) {
  return getThresholdOverrides()[fieldKey] || null;
}
// Gabung patch ke override; key kosong (''/null) dihapus agar default schema dipakai kembali.
export function patchStandard(fieldKey, patch) {
  const all = getThresholdOverrides();
  const next = { ...(all[fieldKey] || {}), ...patch };
  for (const k of Object.keys(next)) { if (next[k] === '' || next[k] == null) delete next[k]; }
  if (Object.keys(next).length === 0) delete all[fieldKey]; else all[fieldKey] = next;
  localStorage.setItem(THRESHOLD_KEY, JSON.stringify(all));
}
export function clearStandard(fieldKey) {
  const all = getThresholdOverrides();
  delete all[fieldKey];
  localStorage.setItem(THRESHOLD_KEY, JSON.stringify(all));
}

// ---- Seed data contoh (sekali) ----
export function ensureSeeded() {
  if (localStorage.getItem(SEEDED_KEY)) return;
  for (const [collection, records] of Object.entries(SEED)) {
    write(collection, records);
  }
  localStorage.setItem(SEEDED_KEY, '1');
}

export function resetData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
  ensureSeeded();
}

/* ---- Asisten AI (PLACEHOLDER) --------------------------------------------
   Interface tetap: askAssistant(context, question) -> Promise<string>.
   Kini menjawab berbasis aturan atas ringkasan alert (dari context).
   Nanti: ganti isi menjadi
     const res = await fetch('/api/assistant', { method:'POST',
       headers:{'Content-Type':'application/json'},
       body: JSON.stringify({ context, question }) });
     return (await res.json()).answer;
   sehingga API key AI aman di server Laravel, bukan di klien.
   -------------------------------------------------------------------------- */
const GUIDANCE = {
  nh3: 'NH3 (amonia tak terionisasi) adalah satu-satunya bentuk amonia yang beracun bagi larva, dan proporsinya naik tajam seiring pH. Bila NH3 melewati batas: tingkatkan pergantian air, kurangi pakan, dan periksa penyiponan. Pantau NH3, bukan hanya TAN.',
  vibrio: 'Perhatikan komposisi TCBS, bukan hanya total. Koloni hijau dan luminescent yang paling berbahaya. Kehadiran luminescent perlu tindakan segera: cek sumber (pakan hidup, air), pertimbangkan pergantian air & probiotik.',
  survival: 'Survival yang menurun sering didahului perkembangan stadia yang tertinggal jadwal. Periksa kualitas air (NH3, nitrit, DO), mikrobiologi, dan sinkronisasi molting (stadia tidak seragam memicu kanibalisme).',
  stadia: 'Tertinggal dari jadwal normal adalah peringatan dini meski larva masih terlihat baik. Bandingkan distribusi stadia dengan jadwal dan cek beban organik (selisih pH pagi–sore).',
  cv: 'CV yang melebar dari hari ke hari lebih penting daripada nilai CV di satu hari — ini sinyal awal EHP dan pertumbuhan tidak merata.',
};

export function askAssistant(context = {}, question = '') {
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildPlaceholderAnswer(context, question)), 350);
  });
}

function buildPlaceholderAnswer(context, question) {
  const q = (question || '').toLowerCase();
  const lines = [];

  // Guidance berdasarkan kata kunci
  const topic = Object.keys(GUIDANCE).find((k) => q.includes(k));
  if (topic) lines.push(GUIDANCE[topic]);

  // Ringkasan alert dari context
  const alerts = context.alerts || [];
  const bahaya = alerts.filter((a) => a.status === 'bahaya');
  const waspada = alerts.filter((a) => a.status === 'waspada');

  if (!topic) {
    if (bahaya.length || waspada.length) {
      lines.push(`Saat ini ada ${bahaya.length} peringatan bahaya dan ${waspada.length} peringatan waspada dalam data.`);
    } else {
      lines.push('Tidak ada peringatan aktif dalam data saat ini — seluruh parameter terpantau dalam batas aman.');
    }
  }

  const top = [...bahaya, ...waspada].slice(0, 4);
  if (top.length) {
    lines.push('Yang paling perlu diperhatikan:');
    for (const a of top) {
      const tank = a.tankLabel ? ' (' + a.tankLabel + ')' : (a.tankId ? ' (' + a.tankId + ')' : '');
      lines.push(`• [${a.status.toUpperCase()}] ${a.field}${tank}: ${a.value ?? '-'} ${a.unit}`.trim());
      if (a.tindakan) lines.push(`   → Tindakan: ${a.tindakan}${a.kontakLabel ? ' · Hubungi: ' + a.kontakLabel : ''}`);
    }
  }

  lines.push('\n—\nCatatan: jawaban ini masih placeholder berbasis aturan. Integrasi AI penuh akan aktif setelah backend Laravel tersedia sebagai proxy yang aman.');
  return lines.join('\n');
}
