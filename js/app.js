/* ===========================================================================
   app.js — titik masuk: seed, layout, sidebar modul (accordion), router.
   Navigasi & aksi difilter oleh peran aktif (js/auth.js — simulasi prototype).
   =========================================================================== */

import * as api from './api.js';
import * as auth from './auth.js';
import { getHub, getCategory, tabLabel } from './schema.js';
import { el, clear } from './dom.js';
import { ICONS } from './icons.js';
import { renderLoginView } from './views/login.js';
import { renderHub } from './views/hub.js';
import { renderDashboard } from './views/dashboard.js';

api.ensureSeeded();

const appEl = document.getElementById('app');

/* ---------- Layout ---------- */
let contentEl, sidebarEl, overlayEl, navEl, switcherEl;
let openHubId; // modul yang terbuka di accordion

function buildLayout() {
  const brand = el('div', { class: 'px-5 py-5 border-b border-[#e2e8f0] flex items-center gap-3' }, [
    el('div', { class: 'brand-mark', html: ICONS.droplet }),
    el('div', {}, [
      el('div', { class: 'text-[0.68rem] tracking-[0.2em] text-brand-600 font-bold' }, 'PRIMA LARVAE'),
      el('div', { class: 'text-lg font-display font-semibold leading-tight' }, 'Panel Hatchery'),
    ]),
  ]);

  switcherEl = el('div', { class: 'px-3 pt-3' });
  navEl = el('nav', { class: 'px-3 py-3 flex-1 overflow-y-auto space-y-1' });

  const resetBtn = el('button', {
    class: 'btn btn-ghost btn-sm w-full',
    onClick: () => { if (confirm('Reset semua data ke contoh awal? Perubahan akan hilang.')) { api.resetData(); route(); } },
  }, 'Reset data contoh');
  const sideFooter = el('div', { class: 'px-3 py-3 border-t border-[#e2e8f0]' }, resetBtn);

  sidebarEl = el('aside', {
    class: 'fixed lg:translate-x-0 -translate-x-full transition-transform z-40 top-0 left-0 h-screen w-72 bg-white border-r border-[#e2e8f0] flex flex-col shadow-sm',
  }, [brand, switcherEl, navEl, sideFooter]);

  overlayEl = el('div', { class: 'sidebar-overlay hidden', onClick: closeSidebar });

  const u = auth.currentUser();
  const roleText = u ? auth.roleLabel(u) : '';

  const mobileTopbar = el('div', {
    class: 'lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#e2e8f0] px-4 py-3 flex items-center justify-between gap-3',
  }, [
    el('div', { class: 'flex items-center gap-3' }, [
      el('button', { class: 'btn btn-ghost btn-sm', onClick: openSidebar, html: '☰', 'aria-label': 'Buka menu' }),
      el('div', { class: 'brand-mark', style: 'width:2rem;height:2rem;border-radius:0.6rem', html: ICONS.droplet }),
      el('div', { class: 'font-display font-semibold text-lg' }, 'Panel Hatchery'),
    ]),
    el('div', { class: 'text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200' }, roleText),
  ]);

  const desktopTopbar = el('div', {
    class: 'hidden lg:flex sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e2e8f0] px-8 py-3.5 items-center justify-between gap-4',
  }, [
    el('div', { class: 'search-box-wrap' }, [
      el('span', { class: 'search-icon-inside', html: ICONS.search }),
      el('input', {
        type: 'text',
        class: 'search-input-field',
        placeholder: 'Cari Tank, Parameter, atau Menu...',
        onInput: (e) => {
          const val = e.target.value.toLowerCase().trim();
          if (!val) return;
          // Melakukan pengalihan cepat jika cocok dengan kategori/tank
          if (val.includes('tank') || val.includes('t-')) {
            location.hash = '#/h/prodAir/harianTank';
          } else if (val.includes('lab') || val.includes('sampel')) {
            location.hash = '#/h/labWater/labFisikaKimia';
          }
        }
      }),
    ]),
    el('div', { class: 'flex items-center gap-3' }, [
      el('div', { class: 'flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold' }, [
        el('span', { class: 'w-2 h-2 rounded-full bg-emerald-500' }),
        roleText || 'Sistem Aktif',
      ]),
    ]),
  ]);

  contentEl = el('main', { id: 'content', class: 'p-5 lg:p-8 max-w-[1400px]' });
  const contentWrap = el('div', { class: 'lg:ml-72 min-h-screen flex flex-col bg-[#f8fafc]' }, [mobileTopbar, desktopTopbar, contentEl]);

  clear(appEl);
  appEl.appendChild(overlayEl);
  appEl.appendChild(sidebarEl);
  appEl.appendChild(contentWrap);
}

function openSidebar() { sidebarEl.classList.remove('-translate-x-full'); overlayEl.classList.remove('hidden'); }
function closeSidebar() { if (window.innerWidth < 1024) { sidebarEl.classList.add('-translate-x-full'); overlayEl.classList.add('hidden'); } }

/* ---------- Panel pengguna aktif + Keluar ---------- */
function renderUserPanel() {
  clear(switcherEl);
  const u = auth.currentUser();
  if (!u) return;
  const initials = u.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  switcherEl.appendChild(el('div', { class: 'user-panel' }, [
    el('div', { class: 'user-avatar' }, initials),
    el('div', { class: 'min-w-0 flex-1' }, [
      el('div', { class: 'user-name' }, u.name),
      el('div', { class: 'user-role' }, auth.roleLabel(u)),
    ]),
    el('button', {
      class: 'user-logout', title: 'Keluar', 'aria-label': 'Keluar',
      html: ICONS.logout, onClick: () => { auth.logout(); start(); },
    }),
  ]));
}

function renderNav() {
  const user = auth.currentUser();
  const hash = currentHash();
  const activeHub = activeHubOf(hash);
  const activeTab = activeTabOf(hash);
  clear(navEl);

  for (const hub of auth.visibleHubs(user)) {
    // Beranda: tautan datar
    if (hub.kind === 'dashboard') {
      navEl.appendChild(el('a', {
        class: 'nav-link' + (activeHub === 'beranda' ? ' active' : ''), href: '#/beranda',
      }, [
        el('span', { class: 'nav-ico', html: ICONS[hub.icon] || '' }),
        el('span', { class: 'nav-title' }, hub.title),
      ]));
      continue;
    }

    const tabs = auth.visibleTabs(user, hub);
    if (!tabs.length) continue;
    const open = openHubId === hub.id;

    const header = el('button', {
      class: 'module-header' + (activeHub === hub.id ? ' active' : '') + (open ? ' open' : ''),
      'aria-expanded': open ? 'true' : 'false',
      onClick: () => { openHubId = open ? null : hub.id; renderNav(); },
    }, [
      el('span', { class: 'nav-ico', html: ICONS[hub.icon] || '' }),
      el('span', { class: 'module-title' }, hub.title),
      el('span', { class: 'chevron', html: ICONS.chevron }),
    ]);

    const sub = el('div', { class: 'module-sub' + (open ? ' open' : '') });
    tabs.forEach((tab, i) => {
      const isActive = activeHub === hub.id && (activeTab === tab.ref || (!activeTab && i === 0));
      sub.appendChild(el('a', {
        class: 'sub-link' + (isActive ? ' active' : ''),
        href: `#/h/${hub.id}/${tab.ref}`,
      }, tabLabel(tab)));
    });

    navEl.appendChild(el('div', { class: 'module' }, [header, sub]));
  }
}

/* ---------- Router ---------- */
function currentHash() { return location.hash || '#/beranda'; }
function activeHubOf(hash) { return hash.startsWith('#/h/') ? hash.slice(4).split('/')[0] : 'beranda'; }
function activeTabOf(hash) { return hash.startsWith('#/h/') ? hash.slice(4).split('/')[1] || '' : ''; }

function resolveContent(hash) {
  if (hash.startsWith('#/h/')) {
    const [hubId, tabRef] = hash.slice(4).split('/');
    return () => renderHub(hubId, tabRef);
  }
  return renderDashboard;
}

function route() {
  if (!auth.isLoggedIn()) return;
  const hash = currentHash();
  const user = auth.currentUser();
  const hubId = activeHubOf(hash);

  // Guard: hub tak diizinkan → Beranda
  if (hubId !== 'beranda') {
    const hub = getHub(hubId);
    if (!hub || !auth.hubAllowed(user, hub)) { location.hash = '#/beranda'; return; }
    openHubId = hubId; // buka modul aktif
  }

  clear(contentEl);
  try {
    contentEl.appendChild(resolveContent(hash)());
  } catch (err) {
    console.error(err);
    contentEl.appendChild(el('div', { class: 'card p-5' }, [
      el('h3', { class: 'text-red-600 mb-2' }, 'Terjadi kesalahan saat menampilkan halaman'),
      el('pre', { class: 'text-xs muted whitespace-pre-wrap' }, String((err && err.stack) || err)),
    ]));
  }
  renderNav();
  window.scrollTo(0, 0);
  closeSidebar();
}

window.addEventListener('hashchange', () => { if (auth.isLoggedIn()) route(); });

// Bootstrap: belum login → layar login; sudah login → aplikasi
function start() {
  if (!auth.isLoggedIn()) {
    clear(appEl);
    appEl.appendChild(renderLoginView(() => start()));
    return;
  }
  buildLayout();
  renderUserPanel();
  route();
}

start();
