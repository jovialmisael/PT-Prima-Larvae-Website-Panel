/* ===========================================================================
   dashboard.js — Beranda: komposisi berkolom yang tenang.
   Hero ringkas + (peringatan | menu) berdampingan + tren rapi.
   =========================================================================== */

import { el, fmt, fmtDate } from '../dom.js';
import { getCategory, routeForCategory, getHub } from '../schema.js';
import * as auth from '../auth.js';
import { scanAlerts, alertCounts } from '../alerts.js';
import { statusBadge } from '../components/alertBadge.js';
import { renderCategoryTrends } from '../components/chart.js';
import { ICONS } from '../icons.js';
import * as api from '../api.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

function overallStatus(counts) {
  if (counts.bahaya > 0) return { tone: 'bahaya', text: `Perlu tindakan — ${counts.bahaya} peringatan bahaya` };
  if (counts.waspada > 0) return { tone: 'waspada', text: `Perlu dipantau — ${counts.waspada} peringatan waspada` };
  return { tone: 'aman', text: 'Semua parameter dalam batas aman' };
}

function heroStat(num, label, tone) {
  return el('div', { class: 'hero-stat' }, [
    el('div', { class: 'hero-num' }, String(num)),
    el('div', { class: 'hero-label' }, label),
  ]);
}

function sectionTitle(text, extra) {
  return el('div', { class: 'flex items-center justify-between mb-3' }, [
    el('h2', { class: 'text-lg' }, text),
    extra || null,
  ]);
}

export function renderDashboard() {
  const root = el('div', { class: 'space-y-6' });

  const user = auth.currentUser();
  const tanks = api.list('tank');
  const aktif = tanks.filter((t) => t.status === 'Aktif').length;
  const rekomendasi = api.list('temuanLab').filter((t) => (t.status || 'Baru') === 'Baru').length;
  const alerts = scanAlerts({ days: 10 }).filter((a) => auth.categoryVisible(user, a.categoryId));
  const counts = alertCounts(alerts);
  const st = overallStatus(counts);

  // ---- HERO ----
  root.appendChild(el('div', { class: 'hero' }, [
    el('div', { class: 'hero-main' }, [
      el('div', { class: 'hero-eyebrow' }, greeting() + ', ' + (user ? user.name : '')),
      el('div', { class: 'hero-title' }, 'Panel Monitoring Hatchery'),
      el('div', { class: 'hero-status' }, [el('span', { class: `status-dot dot-${st.tone}` }), st.text]),
    ]),
    el('div', { class: 'hero-stats' }, [
      heroStat(aktif, 'Tank Aktif'),
      heroStat(counts.waspada, 'Waspada'),
      heroStat(counts.bahaya, 'Bahaya'),
      heroStat(rekomendasi, 'Rekomendasi Lab'),
    ]),
  ]));

  // ---- AKSI CEPAT / SHORTCUT BAR (rute nyata, sadar-peran) ----
  const shortcuts = [
    { label: 'Catat Data Tank',  href: '#/h/produksi/form-13', hubId: 'produksi', icon: 'plus',   bg: 'bg-blue-50',    fg: 'text-blue-600' },
    { label: 'Uji Air Lab',      href: '#/h/lab/form-pcr',     hubId: 'lab',      icon: 'flask',  bg: 'bg-emerald-50', fg: 'text-emerald-600' },
    { label: 'Verifikasi Batch', href: '#/h/mpm/verifikasi',   hubId: 'mpm',      icon: 'shield', bg: 'bg-purple-50',  fg: 'text-purple-600' },
    { label: 'Standar Parameter',href: '#/h/lab/standar',      hubId: 'lab',      icon: 'gear',   bg: 'bg-amber-50',   fg: 'text-amber-600' },
  ].filter((s) => { const h = getHub(s.hubId); return h && auth.hubAllowed(user, h); });

  if (shortcuts.length) {
    root.appendChild(el('div', { class: 'grid grid-cols-2 sm:grid-cols-4 gap-3' },
      shortcuts.map((s) => el('a', {
        class: 'p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition flex items-center gap-3 text-slate-800 font-semibold text-sm',
        href: s.href,
      }, [
        el('span', { class: `w-8 h-8 rounded-lg ${s.bg} ${s.fg} flex items-center justify-center font-bold text-lg`, html: ICONS[s.icon] }),
        el('span', {}, s.label),
      ]))));
  }

  // ---- Grid: Peringatan | Menu ----
  const grid = el('div', { class: 'grid grid-cols-1 lg:grid-cols-3 gap-6 items-start' });

  // Kolom kiri: peringatan
  const left = el('div', { class: 'lg:col-span-2' });
  const alertCard = el('div', { class: 'card overflow-hidden shadow-sm' });
  alertCard.appendChild(el('div', { class: 'px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100' }, [
    el('div', { class: 'flex items-center gap-2' }, [
      el('h2', { class: 'text-lg font-bold' }, 'Peringatan Parameter Aktif'),
      el('span', { class: 'text-xs text-slate-400 font-normal' }, '(10 Hari Terakhir)'),
    ]),
    el('span', { class: 'chip' }, `${counts.bahaya} bahaya · ${counts.waspada} waspada`),
  ]));

  if (!alerts.length) {
    alertCard.appendChild(el('div', { class: 'empty-state py-8' }, '✓ Seluruh parameter hatchery berada dalam batas aman yang ditentukan.'));
  } else {
    const list = el('div', {});
    const shown = alerts.slice(0, 6);
    for (const a of shown) {
      const tankLabel = a.tankId ? api.refLabel('tank', a.tankId, 'namaTank') : '';
      list.appendChild(el('a', { class: `alert-row accent-${a.status}`, href: routeForCategory(a.categoryId) }, [
        statusBadge(a.status),
        el('div', { class: 'flex-1 min-w-0' }, [
          el('div', { class: 'font-semibold text-slate-900 truncate' }, `${a.field}${tankLabel ? ' · ' + tankLabel : ''}`),
          el('div', { class: 'text-xs text-slate-500' }, `${a.categoryTitle} · ${fmtDate(a.tanggal)}`),
          a.tindakan ? el('div', { class: 'alert-action text-xs mt-1' }, [
            el('span', { class: 'text-blue-700 font-medium' }, 'Rekomendasi: ' + a.tindakan),
            a.kontakRole ? el('span', { class: 'alert-contact text-slate-600' }, ' · Penanggungjawab: ' + auth.roleLabelOf(a.kontakRole)) : null,
          ]) : null,
        ]),
        el('div', { class: 'num font-bold text-sm whitespace-nowrap text-slate-800' }, `${fmt(a.value)} ${a.unit}`.trim()),
      ]));
    }
    alertCard.appendChild(list);
    if (alerts.length > shown.length) {
      alertCard.appendChild(el('div', { class: 'px-5 py-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-100' },
        `Menampilkan 6 dari ${alerts.length} peringatan. Buka modul terkait untuk melihat riwayat lengkap.`));
    }
  }
  left.appendChild(alertCard);
  grid.appendChild(left);

  // Kolom kanan: modul divisi ringkas
  const right = el('div', {});
  const menuCard = el('div', { class: 'card overflow-hidden shadow-sm' });
  menuCard.appendChild(el('div', { class: 'px-5 pt-4 pb-3 border-b border-slate-100' }, el('h2', { class: 'text-lg font-bold' }, 'Modul Operasional')));
  const menuList = el('div', { class: 'divide-y divide-slate-100' });
  for (const h of auth.visibleHubs(auth.currentUser()).filter((x) => x.kind !== 'dashboard')) {
    menuList.appendChild(el('a', { class: 'menu-item hover:bg-blue-50/50 transition', href: `#/h/${h.id}` }, [
      el('span', { class: 'menu-ico', html: ICONS[h.icon] || '' }),
      el('div', { class: 'min-w-0 flex-1' }, [
        el('div', { class: 'font-semibold text-sm text-slate-900' }, h.title),
        el('div', { class: 'text-xs text-slate-500 truncate' }, h.subtitle || ''),
      ]),
      el('span', { class: 'menu-arrow text-slate-400', html: '→' }),
    ]));
  }
  menuCard.appendChild(menuList);
  right.appendChild(menuCard);
  grid.appendChild(right);

  root.appendChild(grid);

  // ---- Tren Kualitas Air & Mutu Larva ----
  const trendsWrap = el('div', { class: 'grid grid-cols-1 lg:grid-cols-2 gap-6' });

  const trends = renderCategoryTrends(getCategory('prodLarvae'), api.list('prodLarvae'));
  if (trends) {
    const sec = el('div', { class: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3' }, [
      sectionTitle('Tren Kualitas Air Tank (Produksi)'),
      trends
    ]);
    trendsWrap.appendChild(sec);
  }

  const labTrends = renderCategoryTrends(getCategory('labCekLarva'), api.list('labCekLarva'));
  if (labTrends) {
    const sec = el('div', { class: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3' }, [
      sectionTitle('Mutu Larva (Pengujian Lab)'),
      labTrends
    ]);
    trendsWrap.appendChild(sec);
  }

  root.appendChild(trendsWrap);

  return root;
}
