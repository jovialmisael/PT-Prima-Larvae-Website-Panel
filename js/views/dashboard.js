/* ===========================================================================
   dashboard.js — Beranda. Hero + tiap fitur dibungkus SECTION-CARD sendiri
   (Aksi Cepat, Peringatan, Modul, tiap Tren). Warna via token (light/dark).
   =========================================================================== */

import { el, fmt, fmtDate } from '../dom.js';
import { getCategory, routeForCategory, getHub } from '../schema.js';
import * as auth from '../auth.js';
import { scanAlerts, alertCounts } from '../alerts.js';
import { statusBadge } from '../components/alertBadge.js';
import { renderCategoryTrends } from '../components/chart.js';
import { sectionCard } from '../components/section.js';
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

function heroStat(num, label) {
  return el('div', { class: 'hero-stat' }, [
    el('div', { class: 'hero-num' }, String(num)),
    el('div', { class: 'hero-label' }, label),
  ]);
}

export function renderDashboard() {
  const root = el('div', { class: 'space-y-5' });
  const user = auth.currentUser();
  const tanks = api.list('tank');
  const aktif = tanks.filter((t) => t.status === 'Aktif').length;
  const rekomendasi = api.list('temuanLab').filter((t) => (t.status || 'Baru') === 'Baru').length;
  const alerts = scanAlerts({ days: 10 }).filter((a) => auth.categoryVisible(user, a.categoryId));
  const counts = alertCounts(alerts);
  const st = overallStatus(counts);

  // ---- HERO (KPI ringkas, gradien brand) ----
  root.appendChild(el('div', { class: 'hero' }, [
    el('div', { class: 'hero-main' }, [
      el('div', { class: 'hero-eyebrow' }, greeting() + (user ? ', ' + user.name : '')),
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

  // ---- Aksi Cepat (section-card, sadar-peran) ----
  const shortcuts = [
    { label: 'Catat Data Tank', href: '#/h/produksi/form-13', hubId: 'produksi', icon: 'plus' },
    { label: 'Uji Air Lab', href: '#/h/lab/form-pcr', hubId: 'lab', icon: 'flask' },
    { label: 'Verifikasi Batch', href: '#/h/mpm/verifikasi', hubId: 'mpm', icon: 'shield' },
    { label: 'Standar Parameter', href: '#/h/lab/standar', hubId: 'lab', icon: 'gear' },
  ].filter((s) => { const h = getHub(s.hubId); return h && auth.hubAllowed(user, h); });

  if (shortcuts.length) {
    const grid = el('div', { class: 'grid grid-cols-2 sm:grid-cols-4 gap-3' },
      shortcuts.map((s) => el('a', {
        class: 'flex items-center gap-3 p-3 rounded-xl border border-line bg-surface hover:border-primary-600 hover:shadow-md transition text-fg font-semibold text-sm',
        href: s.href,
      }, [
        el('span', { class: 'section-card__ico', html: ICONS[s.icon] }),
        el('span', {}, s.label),
      ])));
    root.appendChild(sectionCard({ icon: 'plus', title: 'Aksi Cepat', body: grid }));
  }

  // ---- Grid: Peringatan | Modul ----
  const grid = el('div', { class: 'grid grid-cols-1 lg:grid-cols-3 gap-5 items-start' });

  // Kolom kiri: Peringatan (section-card, tone ikut status)
  let alertBody;
  if (!alerts.length) {
    alertBody = el('div', { class: 'empty-state py-8' }, '✓ Seluruh parameter hatchery berada dalam batas aman yang ditentukan.');
  } else {
    alertBody = el('div', { class: '-m-1' });
    const shown = alerts.slice(0, 6);
    for (const a of shown) {
      const tankLabel = a.tankId ? api.refLabel('tank', a.tankId, 'namaTank') : '';
      alertBody.appendChild(el('a', { class: `alert-row accent-${a.status}`, href: routeForCategory(a.categoryId) }, [
        statusBadge(a.status),
        el('div', { class: 'flex-1 min-w-0' }, [
          el('div', { class: 'font-semibold text-fg truncate' }, `${a.field}${tankLabel ? ' · ' + tankLabel : ''}`),
          el('div', { class: 'text-xs text-muted' }, `${a.categoryTitle} · ${fmtDate(a.tanggal)}`),
          a.tindakan ? el('div', { class: 'alert-action text-xs mt-1' }, [
            el('span', { class: 'text-primary-600 font-medium' }, 'Rekomendasi: ' + a.tindakan),
            a.kontakRole ? el('span', { class: 'alert-contact' }, ' · Penanggungjawab: ' + auth.roleLabelOf(a.kontakRole)) : null,
          ]) : null,
        ]),
        el('div', { class: 'num font-bold text-sm whitespace-nowrap text-fg' }, `${fmt(a.value)} ${a.unit}`.trim()),
      ]));
    }
    if (alerts.length > shown.length) {
      alertBody.appendChild(el('div', { class: 'px-4 py-3 text-xs text-muted bg-surface-2 mt-2 rounded-lg' },
        `Menampilkan 6 dari ${alerts.length} peringatan. Buka modul terkait untuk melihat riwayat lengkap.`));
    }
  }
  const alertChip = el('span', { class: 'chip' }, `${counts.bahaya} bahaya · ${counts.waspada} waspada`);
  const left = el('div', { class: 'lg:col-span-2' }, sectionCard({
    icon: 'shield', title: 'Peringatan Parameter Aktif', subtitle: '10 hari terakhir',
    tone: counts.bahaya ? 'bahaya' : counts.waspada ? 'warn' : 'ok',
    actions: alertChip, body: alertBody,
  }));
  grid.appendChild(left);

  // Kolom kanan: Modul Operasional (section-card)
  const menuList = el('div', { class: '-m-1' });
  for (const h of auth.visibleHubs(user).filter((x) => x.kind !== 'dashboard')) {
    menuList.appendChild(el('a', { class: 'menu-item', href: `#/h/${h.id}` }, [
      el('span', { class: 'menu-ico', html: ICONS[h.icon] || '' }),
      el('div', { class: 'min-w-0 flex-1' }, [
        el('div', { class: 'font-semibold text-sm text-fg' }, h.title),
        el('div', { class: 'text-xs text-muted truncate' }, h.subtitle || ''),
      ]),
      el('span', { class: 'menu-arrow', html: '→' }),
    ]));
  }
  grid.appendChild(el('div', {}, sectionCard({ icon: 'gears', title: 'Modul Operasional', body: menuList })));
  root.appendChild(grid);

  // ---- Tren: tiap grafik = section-card sendiri ----
  const airTrends = renderCategoryTrends(getCategory('prodLarvae'), api.list('prodLarvae'));
  if (airTrends) root.appendChild(sectionCard({ icon: 'chart', title: 'Tren Kualitas Air Tank (Produksi)', body: airTrends }));

  const labTrends = renderCategoryTrends(getCategory('labCekLarva'), api.list('labCekLarva'));
  if (labTrends) root.appendChild(sectionCard({ icon: 'flask', title: 'Mutu Larva (Pengujian Lab)', body: labTrends }));

  return root;
}
