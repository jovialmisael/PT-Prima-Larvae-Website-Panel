/* ===========================================================================
   auth.js — pemisahan role & level (simulasi prototype).
   Diturunkan dari form fisik: Petugas → Ka.Sie → Kabag Produksi → MPM → Admin.
   CATATAN: ini hanya simulasi UX di klien (menyembunyikan menu/tombol).
   Penegakan sesungguhnya ada di backend Laravel (middleware/policy + tabel users).
   =========================================================================== */

import { getHubs, hubForCategory } from './schema.js';

// Seksi/Bagian (dimensi pelingkupan)
export const SECTIONS = { maturasi: 'Maturasi', larva: 'Larva', panen: 'Panen/PL' };

// Definisi peran (level)
export const ROLES = {
  petugas: { label: 'Petugas / Piket', level: 1, scoped: true },
  kasie:   { label: 'Ka.Sie / PJ',      level: 2, scoped: true },
  kabag:   { label: 'Kabag Produksi',   level: 3, scoped: false },
  mpm:     { label: 'MPM / QA',          level: 4, scoped: false },
  admin:   { label: 'Admin Sistem',      level: 0, scoped: false },
};

// Akun pengguna (nama Kabag/MPM sesuai form). Password demo untuk prototype.
export const USERS = [
  { id: 'u-pet-mat',   name: 'Petugas Maturasi', username: 'petugas.maturasi', password: 'prima123', role: 'petugas', section: 'maturasi' },
  { id: 'u-pet-lar',   name: 'Petugas Larva',    username: 'petugas.larva',    password: 'prima123', role: 'petugas', section: 'larva' },
  { id: 'u-kasie-mat', name: 'Ka.Sie Maturasi',  username: 'kasie.maturasi',   password: 'prima123', role: 'kasie',   section: 'maturasi' },
  { id: 'u-kasie-lar', name: 'Ka.Sie Larva',     username: 'kasie.larva',      password: 'prima123', role: 'kasie',   section: 'larva' },
  { id: 'u-kabag',     name: 'Dwi Purwanto',     username: 'dwi',              password: 'prima123', role: 'kabag',   section: null },
  { id: 'u-mpm',       name: 'Tri Bayu Winarko', username: 'bayu',             password: 'prima123', role: 'mpm',     section: null },
  { id: 'u-admin',     name: 'Admin Sistem',     username: 'admin',            password: 'prima123', role: 'admin',   section: null },
];

const SESSION_KEY = 'pl_hatchery__session';

// Sesi pengguna aktif (null bila belum login). Override dev opsional: ?as=<userId>.
export function session() {
  try {
    const q = new URLSearchParams(location.search).get('as');
    if (q && USERS.some((u) => u.id === q)) localStorage.setItem(SESSION_KEY, q);
  } catch { /* abaikan */ }
  const id = localStorage.getItem(SESSION_KEY);
  return id ? (USERS.find((u) => u.id === id) || null) : null;
}
export function isLoggedIn() { return !!session(); }
export function currentUser() { return session(); }

/* Login/logout — simulasi prototype.
   Di Laravel nanti: login() → POST /api/login (Sanctum), simpan token; password
   diverifikasi & di-hash di server, tidak pernah ada di klien. */
export function login(username, password) {
  const u = USERS.find((x) => x.username === (username || '').trim().toLowerCase() && x.password === password);
  if (!u) return { ok: false, error: 'Username atau kata sandi salah.' };
  localStorage.setItem(SESSION_KEY, u.id);
  return { ok: true, user: u };
}
export function logout() { localStorage.removeItem(SESSION_KEY); }

export function roleLabel(user) { return ROLES[user.role]?.label || user.role; }
export function userStamp(user) { return { name: user.name, role: user.role, at: new Date().toISOString() }; }

const isProdHub = (id) => ['hulu', 'larva', 'panen'].includes(id);
export function sectionOfCategory(catId) { const h = hubForCategory(catId); return h ? h.section : null; }

/* --- Visibilitas hub/tab di sidebar --- */
export function hubAllowed(user, hub) {
  if (hub.kind === 'dashboard') return true;          // Beranda: semua
  if (hub.id === 'sistem') return true;               // minimal Asisten AI untuk semua
  if (hub.id === 'hasil') return ['kabag', 'mpm', 'admin'].includes(user.role);
  if (isProdHub(hub.id)) {
    if (['kabag', 'mpm'].includes(user.role)) return true;      // lintas seksi
    if (['petugas', 'kasie'].includes(user.role)) return hub.section === user.section;
    return false;                                               // admin: bukan produksi harian
  }
  return false;
}

export function tabAllowed(user, hub, tab) {
  if (hub.id === 'sistem') {
    if (tab.ref === 'assistant') return true;
    if (tab.ref === 'thresholds') return ['kabag', 'mpm', 'admin'].includes(user.role);
    return false;
  }
  if (hub.id === 'hasil') {
    if (tab.ref === 'tank') return ['admin', 'kabag'].includes(user.role);  // master data
    return ['kabag', 'mpm', 'admin'].includes(user.role);
  }
  return hubAllowed(user, hub); // tab produksi mengikuti akses hub
}

export function visibleHubs(user) { return getHubs().filter((h) => hubAllowed(user, h)); }
export function visibleTabs(user, hub) { return (hub.tabs || []).filter((t) => tabAllowed(user, hub, t)); }

/* --- Izin aksi pada kategori --- */
export function canInput(user, catId) {
  if (catId === 'tank') return user.role === 'admin';          // master tank: admin
  const sec = sectionOfCategory(catId);
  if (user.role === 'kabag') return sec !== 'sistem';           // semua produksi
  if (user.role === 'petugas' || user.role === 'kasie') return sec != null && sec === user.section;
  return false;                                                // mpm/admin: tak input produksi
}
export function canSahkan(user, catId) {
  const sec = sectionOfCategory(catId);
  if (user.role === 'kabag') return sec !== 'sistem' && catId !== 'tank';
  if (user.role === 'kasie') return sec === user.section;
  return false;
}
export function canPeriksa(user /*, catId */) { return user.role === 'mpm'; }
export function canManageBatas(user) { return ['kabag', 'mpm', 'admin'].includes(user.role); }
