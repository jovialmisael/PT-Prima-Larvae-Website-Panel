/* ===========================================================================
   genericCategory.js — view kategori (dipakai semua fitur).
   Riwayat data tampil sebagai KARTU (tanpa scroll horizontal); form Tambah/Edit
   dan Detail dibuka di DRAWER. Sadar-peran (input/sahkan/periksa).
   =========================================================================== */

import { el, clear } from '../dom.js';
import { getCategory } from '../schema.js';
import * as auth from '../auth.js';
import { renderForm } from '../components/form.js';
import { renderRecordList, renderRecordDetail } from '../components/recordList.js';
import { renderCategoryTrends } from '../components/chart.js';
import { openDrawer, closeDrawer } from '../components/modal.js';
import * as api from '../api.js';

export function createCategoryView(categoryId) {
  return function renderCategoryView() {
    const category = getCategory(categoryId);
    const user = auth.currentUser();
    const mayInput = auth.canInput(user, category.id);
    const maySahkan = auth.canSahkan(user, category.id);
    const mayPeriksa = auth.canPeriksa(user, category.id);

    const root = el('div', { class: 'space-y-6' });
    const trendsWrap = el('div', {});
    const listCard = el('div', { class: 'card' });

    const addBtn = el('button', { class: 'btn btn-primary', onClick: () => openForm(null) }, [
      el('span', { html: '＋' }), 'Tambah Data',
    ]);
    const countChip = el('span', { class: 'chip' }, '0 baris');
    const readonlyChip = el('span', { class: 'chip chip-muted' }, '🔒 Mode baca');
    const actions = mayInput ? [countChip, addBtn] : [countChip, readonlyChip];

    const header = el('div', { class: 'flex items-start justify-between gap-4 flex-wrap' }, [
      el('div', { class: 'max-w-2xl' }, [
        el('div', { class: 'flex items-center gap-2 mb-1' }, [
          el('span', { class: 'nav-code' }, category.code),
          el('h1', { class: 'text-2xl' }, category.title),
        ]),
        el('p', { class: 'muted text-sm leading-relaxed' }, category.desc || ''),
      ]),
      el('div', { class: 'flex items-center gap-2' }, actions),
    ]);

    function openForm(record) {
      const form = renderForm(category, {
        record,
        onSubmit: (data) => {
          if (record) api.update(category.collection, record.id, data);
          else api.create(category.collection, { ...data, status: 'Draft', dibuatOleh: auth.userStamp(user) });
          closeDrawer();
          refresh();
        },
        onCancel: closeDrawer,
      });
      openDrawer({ title: (record ? 'Edit Data — ' : 'Tambah Data — ') + category.title, body: form });
    }

    function verify(rec, step) {
      api.verify(category.collection, rec.id, step, auth.userStamp(user));
      closeDrawer();
      refresh();
    }

    function openDetail(record) {
      const status = record.status || 'Draft';
      const btns = [];
      if (mayInput && status !== 'Diperiksa') btns.push(el('button', { class: 'btn btn-ghost', onClick: () => { closeDrawer(); openForm(record); } }, 'Edit'));
      if (maySahkan && status === 'Draft') btns.push(el('button', { class: 'btn btn-approve', onClick: () => verify(record, 'sahkan') }, 'Sahkan'));
      if (mayPeriksa && status === 'Disahkan') btns.push(el('button', { class: 'btn btn-verify', onClick: () => verify(record, 'periksa') }, 'Periksa'));
      btns.push(el('button', { class: 'btn btn-ghost', onClick: closeDrawer }, 'Tutup'));
      openDrawer({
        title: 'Detail — ' + category.title,
        body: renderRecordDetail(category, record),
        footer: el('div', { class: 'flex gap-2 flex-wrap justify-end' }, btns),
      });
    }

    function refresh() {
      const records = api.list(category.collection);
      countChip.textContent = `${records.length} baris`;

      clear(trendsWrap);
      const trends = renderCategoryTrends(category, records);
      if (trends) trendsWrap.appendChild(trends);

      clear(listCard);
      listCard.appendChild(el('div', { class: 'px-5 pt-4 pb-1 flex items-center justify-between' }, [
        el('h3', { class: 'text-base' }, 'Riwayat Data'),
      ]));
      listCard.appendChild(el('div', { class: 'p-4 pt-2' }, renderRecordList(category, records, {
        canEdit: mayInput, canSahkan: maySahkan, canPeriksa: mayPeriksa,
        onDetail: openDetail,
        onEdit: openForm,
        onDelete: (rec) => { if (confirm('Hapus baris data ini?')) { api.remove(category.collection, rec.id); refresh(); } },
        onSahkan: (rec) => verify(rec, 'sahkan'),
        onPeriksa: (rec) => verify(rec, 'periksa'),
      })));
    }

    root.appendChild(header);
    root.appendChild(trendsWrap);
    root.appendChild(listCard);
    refresh();
    return root;
  };
}
