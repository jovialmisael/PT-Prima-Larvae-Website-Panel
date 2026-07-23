/* ===========================================================================
   auth.js — 3 divisi (Produksi / Lab & Algae / MPM) + Admin, dengan jenjang
   Petugas → Ka.Sie → Kabag, plus Petugas QC. Simulasi klien prototype;
   penegakan sesungguhnya di backend Laravel (policy/middleware).

   Model: Produksi mencatat SOP operasional & membawa sampel ke Lab; Lab menguji
   sampel + menetapkan standar/rekomendasi; MPM (QC + Kabag MPM) mengesahkan.
   Rantai pengesahan: Draft → Diparaf Ka.Sie → Diparaf QC → Disahkan (MPM).
   Lihat docs/model-peran-alur.md.
   =========================================================================== */

import { getHubs, getCategory } from './schema.js';

export const DIVISIONS = { produksi: 'Produksi', lab: 'Lab & Algae', mpm: 'MPM' };

/* Peran. `division` = pelingkupan; `level` = jenjang (petugas<kasie<kabag; qc; admin).
   Hanya `petugas` yang menginput; Ka.Sie/QC/Kabag MPM mengesahkan; Kabag = pemantau
   + target eskalasi kontak. */
export const ROLES = {
  petugasProd: { label: 'Petugas Produksi',  division: 'produksi', level: 'petugas' },
  kasieProd:   { label: 'Ka.Sie Produksi',   division: 'produksi', level: 'kasie'   },
  kabagProd:   { label: 'Kabag Produksi',     division: 'produksi', level: 'kabag'   },
  petugasLab:  { label: 'Petugas Lab',        division: 'lab',      level: 'petugas' },
  kasieLab:    { label: 'Ka.Sie Lab',         division: 'lab',      level: 'kasie'   },
  kabagLab:    { label: 'Kabag Lab & Algae',  division: 'lab',      level: 'kabag'   },
  qc:          { label: 'Petugas QC',         division: 'mpm',      level: 'qc'      },
  kabagMpm:    { label: 'Kabag MPM',          division: 'mpm',      level: 'kabag'   },
  admin:       { label: 'Admin Sistem',       division: null,       level: 'admin'   },
};

// Akun demo (password prototype). Penamaan berdasarkan divisi/role, bukan nama orang.
export const USERS = [
  { id: 'u-petugas-prod', name: 'Petugas Produksi', username: 'petugas.produksi', password: 'prima123', role: 'petugasProd' },
  { id: 'u-kasie-prod',   name: 'Ka.Sie Produksi',  username: 'kasie.produksi',   password: 'prima123', role: 'kasieProd' },
  { id: 'u-kabag-prod',   name: 'Kabag Produksi',   username: 'kabag.produksi',   password: 'prima123', role: 'kabagProd' },
  { id: 'u-petugas-lab',  name: 'Petugas Lab',      username: 'petugas.lab',      password: 'prima123', role: 'petugasLab' },
  { id: 'u-kasie-lab',    name: 'Ka.Sie Lab',       username: 'kasie.lab',        password: 'prima123', role: 'kasieLab' },
  { id: 'u-kabag-lab',    name: 'Kabag Lab & Algae',username: 'kabag.lab',        password: 'prima123', role: 'kabagLab' },
  { id: 'u-qc',           name: 'Petugas QC',       username: 'qc',               password: 'prima123', role: 'qc' },
  { id: 'u-kabag-mpm',    name: 'Kabag MPM',        username: 'kabag.mpm',        password: 'prima123', role: 'kabagMpm' },
  { id: 'u-admin',        name: 'Admin Sistem',     username: 'admin',            password: 'prima123', role: 'admin' },
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
export function levelOf(user) { return ROLES[user.role]?.level || null; }
export function divisionOf(user) { return ROLES[user.role]?.division || null; }
export function divisionLabel(user) { const d = divisionOf(user); return d ? DIVISIONS[d] : (user.role === 'admin' ? 'Sistem' : ''); }
export function userStamp(user) { return { name: user.name, role: user.role, at: new Date().toISOString() }; }

export function divisionOfCategory(catId) { const c = getCategory(catId); return c ? c.division : null; }

// Alert/dashboard: apakah kategori terlihat oleh user (divisi sendiri; MPM lintas divisi; sistem=admin)
export function categoryVisible(user, catId) {
  const div = divisionOfCategory(catId);
  if (!div) return false;
  if (div === 'sistem') return user.role === 'admin';
  if (divisionOf(user) === 'mpm') return true;
  return divisionOf(user) === div;
}

// Kabag divisi = kontak eskalasi bila batas terlampaui
export function kontakRoleFor(division) {
  if (division === 'lab') return 'kabagLab';
  if (division === 'produksi') return 'kabagProd';
  if (division === 'mpm') return 'kabagMpm';
  return null;
}
export function roleLabelOf(roleId) { return ROLES[roleId]?.label || roleId; }

/* --- Visibilitas hub/tab --- */
export function hubAllowed(user, hub) {
  if (hub.kind === 'dashboard') return true;      // Beranda
  if (hub.id === 'sistem') return true;           // Asisten AI untuk semua
  if (hub.id === 'analisis') return true;         // Lembar Harian & analisis: lintas divisi (baca)
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

/* --- Izin input (hanya petugas divisi pemilik; tank = admin) --- */
export function canInput(user, catId) {
  if (catId === 'tank') return user.role === 'admin';
  if (levelOf(user) !== 'petugas') return false;
  const div = divisionOfCategory(catId);
  return !!div && divisionOf(user) === div;
}

/* --- Rantai pengesahan berjenjang ---------------------------------------------
   Draft → Diparaf Ka.Sie → Diparaf QC → Disahkan (MPM). */
export const APPROVAL_FLOW = ['Draft', 'Diparaf Ka.Sie', 'Diparaf QC', 'Disahkan'];

export function canParafKasie(user, catId) {
  if (levelOf(user) !== 'kasie') return false;
  const div = divisionOfCategory(catId);
  return !!div && divisionOf(user) === div;
}
export function canParafQc(user) { return levelOf(user) === 'qc'; }
export function canSahkanMpm(user) { return user.role === 'kabagMpm'; }

// Langkah pengesahan berikutnya yang boleh dilakukan user ini pada record berstatus `status`.
export function nextApproval(user, catId, status) {
  const s = status || 'Draft';
  if (s === 'Draft' && canParafKasie(user, catId)) return { step: 'parafKasie', label: 'Paraf Ka.Sie' };
  if (s === 'Diparaf Ka.Sie' && canParafQc(user)) return { step: 'parafQc', label: 'Paraf QC' };
  if (s === 'Diparaf QC' && canSahkanMpm(user)) return { step: 'sahkanMpm', label: 'Sahkan' };
  return null;
}
export function isFinalStatus(status) { return (status || 'Draft') === 'Disahkan'; }

export function canManageStandar(user) { return user.role === 'kabagLab'; }        // Standar dimiliki Lab
// Petugas Produksi menandai rekomendasi Lab sebagai "Diterapkan"
export function canApplyTemuan(user) { return user.role === 'petugasProd'; }
