/* ===========================================================================
   dashboard.js — Beranda: komposisi berkolom yang tenang.
   Hero ringkas + (peringatan | menu) berdampingan + tren rapi.
   =========================================================================== */

import { el, fmt, fmtDate } from '../dom.js';
import { getCategory, routeForCategory } from '../schema.js';
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
  // Peringatan dilingkup ke divisi yang relevan bagi peran aktif (MPM lintas divisi)
  const alerts = scanAlerts({ days: 10 }).filter((a) => auth.categoryVisible(user, a.categoryId));
  const counts = alertCounts(alerts);
  const st = overallStatus(counts);

  // ---- HERO ----
  root.appendChild(el('div', { class: 'hero' }, [
    el('div', { class: 'hero-main' }, [
      el('div', { class: 'hero-eyebrow' }, greeting()),
      el('div', { class: 'hero-title' }, 'Panel Hatchery'),
      el('div', { class: 'hero-status' }, [el('span', { class: `status-dot dot-${st.tone}` }), st.text]),
    ]),
    el('div', { class: 'hero-stats' }, [
      heroStat(aktif, 'Tank Aktif'),
      heroStat(counts.waspada, 'Waspada'),
      heroStat(counts.bahaya, 'Bahaya'),
      heroStat(rekomendasi, 'Rekomendasi Lab'),
    ]),
  ]));

  // ---- Grid: Peringatan | Menu ----
  const grid = el('div', { class: 'grid grid-cols-1 lg:grid-cols-3 gap-6 items-start' });

  // Kolom kiri: peringatan (lebih lebar)
  const left = el('div', { class: 'lg:col-span-2' });
  const alertCard = el('div', { class: 'card overflow-hidden' });
  alertCard.appendChild(el('div', { class: 'px-5 pt-4 pb-3 flex items-center justify-between' }, [
    el('h2', { class: 'text-lg' }, 'Peringatan Aktif'),
    el('span', { class: 'chip' }, `${counts.bahaya} bahaya · ${counts.waspada} waspada`),
  ]));
  if (!alerts.length) {
    alertCard.appendChild(el('div', { class: 'empty-state' }, '✓ Tidak ada peringatan. Seluruh parameter dalam batas aman.'));
  } else {
    const list = el('div', {});
    const shown = alerts.slice(0, 6);
    for (const a of shown) {
      const tankLabel = a.tankId ? api.refLabel('tank', a.tankId, 'namaTank') : '';
      list.appendChild(el('a', { class: `alert-row accent-${a.status}`, href: routeForCategory(a.categoryId) }, [
        statusBadge(a.status),
        el('div', { class: 'flex-1 min-w-0' }, [
          el('div', { class: 'font-semibold truncate' }, `${a.field}${tankLabel ? ' · ' + tankLabel : ''}`),
          el('div', { class: 'text-sm muted' }, `${a.categoryTitle} · ${fmtDate(a.tanggal)}`),
          a.tindakan ? el('div', { class: 'alert-action' }, [
            el('span', {}, '→ ' + a.tindakan),
            a.kontakRole ? el('span', { class: 'alert-contact' }, 'Hubungi: ' + auth.roleLabelOf(a.kontakRole)) : null,
          ]) : null,
        ]),
        el('div', { class: 'num font-bold whitespace-nowrap' }, `${fmt(a.value)} ${a.unit}`.trim()),
      ]));
    }
    alertCard.appendChild(list);
    if (alerts.length > shown.length) {
      alertCard.appendChild(el('div', { class: 'px-5 py-3 text-sm muted border-t border-[#f1f5f9]' },
        `Menampilkan 6 dari ${alerts.length} peringatan. Buka menu terkait untuk selengkapnya.`));
    }
  }
  left.appendChild(alertCard);
  grid.appendChild(left);

  // Kolom kanan: menu ringkas
  const right = el('div', {});
  const menuCard = el('div', { class: 'card overflow-hidden' });
  menuCard.appendChild(el('div', { class: 'px-5 pt-4 pb-2' }, el('h2', { class: 'text-lg' }, 'Menu')));
  const menuList = el('div', { class: 'pb-2' });
  for (const h of auth.visibleHubs(auth.currentUser()).filter((x) => x.kind !== 'dashboard')) {
    menuList.appendChild(el('a', { class: 'menu-item', href: `#/h/${h.id}` }, [
      el('span', { class: 'menu-ico', html: ICONS[h.icon] || '' }),
      el('div', { class: 'min-w-0 flex-1' }, [
        el('div', { class: 'font-semibold text-sm' }, h.title),
        el('div', { class: 'text-xs muted truncate' }, h.subtitle || ''),
      ]),
      el('span', { class: 'menu-arrow', html: '→' }),
    ]));
  }
  menuCard.appendChild(menuList);
  right.appendChild(menuCard);
  grid.appendChild(right);

  root.appendChild(grid);

  // ---- Tren ----
  const trends = renderCategoryTrends(getCategory('prodLarvae'), api.list('prodLarvae'));
  if (trends) {
    const sec = el('div', {});
    sec.appendChild(sectionTitle('Tren Kualitas Air Tank (Produksi)'));
    sec.appendChild(trends);
    root.appendChild(sec);
  }
  const labTrends = renderCategoryTrends(getCategory('labCekLarva'), api.list('labCekLarva'));
  if (labTrends) {
    const sec = el('div', {});
    sec.appendChild(sectionTitle('Mutu Larva (Lab)'));
    sec.appendChild(labTrends);
    root.appendChild(sec);
  }

  return root;
}
