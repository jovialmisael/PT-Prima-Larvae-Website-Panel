/* ===========================================================================
   auth.js — 3 divisi (Lab / Produksi / MPM) + Admin. Simulasi klien prototype;
   penegakan sesungguhnya di backend Laravel (policy/middleware).

   Model: Produksi mencatat SOP operasional; MPM (QA) memverifikasi; Lab
   menetapkan standar & analisis mutu, lalu menyampaikan temuan ke Produksi.
   =========================================================================== */

import { getHubs, hubForCategory } from './schema.js';

export const DIVISIONS = { lab: 'Lab', produksi: 'Produksi', mpm: 'MPM' };

// Peran (dinamai per divisi). `division` = pelingkupan; `kepala` = boleh mengesahkan.
export const ROLES = {
  analisLab:   { label: 'Analis Lab',        division: 'lab',      kepala: false },
  kepalaLab:   { label: 'Kepala Lab',        division: 'lab',      kepala: true },
  petugasProd: { label: 'Petugas Produksi',  division: 'produksi', kepala: false },
  kepalaProd:  { label: 'Kepala Produksi',   division: 'produksi', kepala: true },
  kepalaMpm:   { label: 'Kepala MPM',        division: 'mpm',      kepala: true },
  admin:       { label: 'Admin Sistem',      division: null,       kepala: false },
};

// Akun demo (password prototype). Penamaan berdasarkan divisi/role, bukan nama orang.
export const USERS = [
  { id: 'u-analis-lab',  name: 'Analis Lab',      username: 'analis.lab',      password: 'prima123', role: 'analisLab' },
  { id: 'u-kepala-lab',  name: 'Kepala Lab',      username: 'kepala.lab',      password: 'prima123', role: 'kepalaLab' },
  { id: 'u-petugas-prod',name: 'Petugas Produksi',username: 'petugas.produksi',password: 'prima123', role: 'petugasProd' },
  { id: 'u-kepala-prod', name: 'Kepala Produksi', username: 'kepala.produksi', password: 'prima123', role: 'kepalaProd' },
  { id: 'u-kepala-mpm',  name: 'Kepala MPM',      username: 'kepala.mpm',      password: 'prima123', role: 'kepalaMpm' },
  { id: 'u-admin',       name: 'Admin Sistem',    username: 'admin',           password: 'prima123', role: 'admin' },
];

const SESSION_KEY = 'pl_hatchery__session';

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

export function login(username, password) {
  const u = USERS.find((x) => x.username === (username || '').trim().toLowerCase() && x.password === password);
  if (!u) return { ok: false, error: 'Username atau kata sandi salah.' };
  localStorage.setItem(SESSION_KEY, u.id);
  return { ok: true, user: u };
}
export function logout() { localStorage.removeItem(SESSION_KEY); }

export function roleLabel(user) { return ROLES[user.role]?.label || user.role; }
export function divisionOf(user) { return ROLES[user.role]?.division || null; }
export function divisionLabel(user) { const d = divisionOf(user); return d ? DIVISIONS[d] : (user.role === 'admin' ? 'Sistem' : ''); }
export function userStamp(user) { return { name: user.name, role: user.role, at: new Date().toISOString() }; }

export function divisionOfCategory(catId) { const h = hubForCategory(catId); return h ? h.division : null; }

/* --- Visibilitas hub/tab --- */
export function hubAllowed(user, hub) {
  if (hub.kind === 'dashboard') return true;      // Beranda
  if (hub.id === 'sistem') return true;           // Asisten AI untuk semua
  const d = divisionOf(user);
  if (hub.id === 'lab') return d === 'lab' || d === 'mpm';
  if (hub.id === 'produksi') return d === 'produksi' || d === 'mpm';
  if (hub.id === 'mpm') return d === 'mpm';
  return false;
}
export function tabAllowed(user, hub, tab) {
  if (hub.id === 'sistem') { if (tab.ref === 'tank') return user.role === 'admin'; return true; }
  return hubAllowed(user, hub);
}
export function visibleHubs(user) { return getHubs().filter((h) => hubAllowed(user, h)); }
export function visibleTabs(user, hub) { return (hub.tabs || []).filter((t) => tabAllowed(user, hub, t)); }

/* --- Izin aksi --- */
export function canInput(user, catId) {
  if (catId === 'tank') return user.role === 'admin';
  if (ROLES[user.role]?.kepala) return false;   // Kepala: hanya mengecek (Sahkan) & memantau alert
  const div = divisionOfCategory(catId);
  if (div === 'lab') return divisionOf(user) === 'lab';
  if (div === 'produksi') return divisionOf(user) === 'produksi';
  return false;
}
export function canSahkan(user, catId) {
  const div = divisionOfCategory(catId);
  if (div === 'lab') return user.role === 'kepalaLab';
  if (div === 'produksi') return user.role === 'kepalaProd';
  return false;
}
export function canPeriksa(user /*, catId */) { return divisionOf(user) === 'mpm'; }
export function canManageStandar(user) { return user.role === 'kepalaLab'; }        // Standar dimiliki Lab
// Petugas Produksi menandai rekomendasi Lab sebagai "Diterapkan" (Kepala hanya mengecek)
export function canApplyTemuan(user) { return user.role === 'petugasProd'; }
