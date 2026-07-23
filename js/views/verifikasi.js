/* ===========================================================================
   verifikasi.js — antrean pengesahan MPM. Menampilkan record yang menunggu
   LANGKAH pengesahan milik user aktif (QC: item "Diparaf Ka.Sie"; Kabag MPM:
   item "Diparaf QC"). Tombol menjalankan langkah berikutnya via api.verify.
   =========================================================================== */

import { el, clear, fmtDate } from '../dom.js';
import { CATEGORIES } from '../schema.js';
import * as auth from '../auth.js';
import * as api from '../api.js';

export function renderVerifikasi() {
  const user = auth.currentUser();
  const root = el('div', { class: 'space-y-5' });
  const listWrap = el('div', {});

  function card(cat, rec, approval) {
    const tank = rec.tankId ? api.refLabel('tank', rec.tankId, 'namaTank') : '';
    const btn = el('button', {
      class: 'btn btn-verify btn-sm',
      onClick: () => { api.verify(cat.collection, rec.id, approval.step, auth.userStamp(user)); refresh(); },
    }, approval.label);
    const divLabel = cat.division ? (auth.DIVISIONS[cat.division] || cat.division) : '';
    return el('div', { class: 'rec-card' }, [
      el('div', { class: 'rec-head' }, [
        el('div', { class: 'rec-head-main' }, [
          el('span', { class: 'rec-title' }, fmtDate(rec.tanggal)),
          tank ? el('span', { class: 'rec-tank' }, tank) : null,
        ]),
        el('span', { class: 'verif ' + (rec.status === 'Diparaf QC' ? 'v-qc' : 'v-kasie') }, rec.status),
      ]),
      el('div', { class: 'text-sm muted' }, `${cat.title}${divLabel ? ' · ' + divLabel : ''}`),
      rec.diparafKasie ? el('div', { class: 'text-xs muted' }, 'Diparaf Ka.Sie: ' + rec.diparafKasie.name) : null,
      rec.diparafQc ? el('div', { class: 'text-xs muted' }, 'Diparaf QC: ' + rec.diparafQc.name) : null,
      el('div', { class: 'rec-actions' }, btn),
    ]);
  }

  function refresh() {
    clear(listWrap);
    const items = [];
    for (const cat of CATEGORIES) {
      if (cat.id === 'tank') continue;
      for (const rec of api.list(cat.collection)) {
        const approval = auth.nextApproval(user, cat.id, rec.status);
        if (approval) items.push({ cat, rec, approval });
      }
    }
    listWrap.appendChild(el('div', { class: 'flex items-center justify-between mb-3' }, [
      el('h2', { class: 'text-lg' }, 'Antrean Pengesahan'),
      el('span', { class: 'chip' }, `${items.length} menunggu`),
    ]));
    if (!items.length) {
      listWrap.appendChild(el('div', { class: 'empty-state' }, '✓ Tidak ada data menunggu pengesahan Anda.'));
      return;
    }
    const grid = el('div', { class: 'rec-grid' });
    for (const it of items) grid.appendChild(card(it.cat, it.rec, it.approval));
    listWrap.appendChild(grid);
  }

  root.appendChild(el('div', {}, [
    el('h1', { class: 'text-2xl mb-1' }, 'Pengesahan'),
    el('p', { class: 'muted text-sm' }, 'Antrean data yang menunggu langkah pengesahan Anda (QC memaraf setelah Ka.Sie; Kabag MPM mengesahkan setelah QC).'),
  ]));
  root.appendChild(listWrap);
  refresh();
  return root;
}
