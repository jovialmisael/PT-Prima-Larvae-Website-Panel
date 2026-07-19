/* ===========================================================================
   verifikasi.js — antrean QA MPM. Menampilkan record berstatus "Disahkan"
   (dari semua divisi) yang menunggu diperiksa MPM. Tombol Periksa → Diperiksa.
   =========================================================================== */

import { el, clear, fmtDate } from '../dom.js';
import { CATEGORIES } from '../schema.js';
import * as auth from '../auth.js';
import * as api from '../api.js';

export function renderVerifikasi() {
  const user = auth.currentUser();
  const canPeriksa = auth.canPeriksa(user);
  const root = el('div', { class: 'space-y-5' });
  const listWrap = el('div', {});

  function card(cat, rec) {
    const tank = rec.tankId ? api.refLabel('tank', rec.tankId, 'namaTank') : '';
    const periksaBtn = canPeriksa
      ? el('button', { class: 'btn btn-verify btn-sm', onClick: () => { api.verify(cat.collection, rec.id, 'periksa', auth.userStamp(user)); refresh(); } }, 'Periksa')
      : el('span', { class: 'muted text-xs' }, '—');
    return el('div', { class: 'rec-card' }, [
      el('div', { class: 'rec-head' }, [
        el('div', { class: 'rec-head-main' }, [
          el('span', { class: 'rec-title' }, fmtDate(rec.tanggal)),
          tank ? el('span', { class: 'rec-tank' }, tank) : null,
        ]),
        el('span', { class: 'verif v-disahkan' }, 'Disahkan'),
      ]),
      el('div', { class: 'text-sm muted' }, `${cat.title}${cat.division ? ' · ' + (cat.division === 'lab' ? 'Lab' : cat.division === 'produksi' ? 'Produksi' : cat.division) : ''}`),
      rec.disahkanOleh ? el('div', { class: 'text-xs muted' }, 'Disahkan oleh: ' + rec.disahkanOleh.name) : null,
      el('div', { class: 'rec-actions' }, periksaBtn),
    ]);
  }

  function refresh() {
    clear(listWrap);
    const items = [];
    for (const cat of CATEGORIES) {
      if (cat.id === 'tank') continue;
      for (const rec of api.list(cat.collection)) {
        if ((rec.status || 'Draft') === 'Disahkan') items.push({ cat, rec });
      }
    }
    listWrap.appendChild(el('div', { class: 'flex items-center justify-between mb-3' }, [
      el('h2', { class: 'text-lg' }, 'Antrean Pemeriksaan'),
      el('span', { class: 'chip' }, `${items.length} menunggu`),
    ]));
    if (!items.length) {
      listWrap.appendChild(el('div', { class: 'empty-state' }, '✓ Tidak ada data menunggu pemeriksaan.'));
      return;
    }
    const grid = el('div', { class: 'rec-grid' });
    for (const it of items) grid.appendChild(card(it.cat, it.rec));
    listWrap.appendChild(grid);
  }

  root.appendChild(el('div', {}, [
    el('h1', { class: 'text-2xl mb-1' }, 'Verifikasi'),
    el('p', { class: 'muted text-sm' }, 'Antrean data yang sudah disahkan Kepala divisi dan menunggu pemeriksaan MPM (QA).'),
  ]));
  root.appendChild(listWrap);
  refresh();
  return root;
}
