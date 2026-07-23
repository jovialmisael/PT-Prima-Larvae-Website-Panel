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
    const mayApprove = auth.canParafKasie(user, category.id) || auth.canParafQc(user) || auth.canSahkanMpm(user);
    const approvalFor = (rec) => auth.nextApproval(user, category.id, rec.status);

    const root = el('div', { class: 'space-y-6' });
    const trendsWrap = el('div', {});
    const listCard = el('div', { class: 'card' });

    const addBtn = el('button', { class: 'btn btn-primary', onClick: () => openForm(null) }, [
      el('span', { html: '＋' }), 'Tambah Data',
    ]);
    const countChip = el('span', { class: 'chip' }, '0 baris');
    const readonlyChip = el('span', { class: 'chip chip-muted' }, mayApprove ? '✔ Mode pengesahan' : '🔒 Mode baca');
    const actions = mayInput ? [countChip, addBtn] : [countChip, readonlyChip];

    const header = el('div', { class: 'flex items-start justify-between gap-4 flex-wrap' }, [
      el('div', { class: 'max-w-2xl' }, [
        el('div', { class: 'flex items-center gap-2 mb-1' }, [
          el('span', { class: 'nav-code' }, category.code),
          el('h1', { class: 'text-2xl' }, category.title),
        ]),
        el('p', { class: 'muted text-sm leading-relaxed' }, category.desc || ''),
        category.frekuensi ? el('div', { class: 'mt-2' }, el('span', { class: 'freq-badge' }, '⏱ ' + category.frekuensi)) : null,
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
      if (mayInput && status === 'Draft') btns.push(el('button', { class: 'btn btn-ghost', onClick: () => { closeDrawer(); openForm(record); } }, 'Edit'));
      const approval = approvalFor(record);
      if (approval) {
        const cls = approval.step === 'sahkanMpm' ? 'btn-verify' : 'btn-approve';
        btns.push(el('button', { class: `btn ${cls}`, onClick: () => verify(record, approval.step) }, approval.label));
      }
      btns.push(el('button', { class: 'btn btn-ghost', onClick: closeDrawer }, 'Tutup'));
      openDrawer({
        title: 'Detail — ' + category.title,
        body: renderRecordDetail(category, record),
        footer: el('div', { class: 'flex gap-2 flex-wrap justify-end' }, btns),
      });
    }

    let selectedTankFilter = 'semua';
    let selectedStatusFilter = 'semua';

    function renderFilterToolbar(records) {
      const tanksInCategory = [...new Set(records.map((r) => r.tankId).filter(Boolean))];
      const toolbar = el('div', { class: 'filter-toolbar' });

      toolbar.appendChild(el('span', { class: 'text-xs font-bold text-slate-500 uppercase tracking-wider' }, 'Filter Data:'));

      if (tanksInCategory.length) {
        const tankSelect = el('select', {
          class: 'filter-select',
          onChange: (e) => { selectedTankFilter = e.target.value; refresh(); }
        }, [
          el('option', { value: 'semua' }, 'Semua Tank'),
          ...tanksInCategory.map((tId) => el('option', { value: tId, selected: selectedTankFilter === tId }, api.refLabel('tank', tId, 'namaTank') || tId))
        ]);
        toolbar.appendChild(tankSelect);
      }

      const statusSelect = el('select', {
        class: 'filter-select',
        onChange: (e) => { selectedStatusFilter = e.target.value; refresh(); }
      }, [
        el('option', { value: 'semua' }, 'Semua Status'),
        el('option', { value: 'Draft', selected: selectedStatusFilter === 'Draft' }, 'Draft'),
        el('option', { value: 'Diparaf Ka.Sie', selected: selectedStatusFilter === 'Diparaf Ka.Sie' }, 'Diparaf Ka.Sie'),
        el('option', { value: 'Diparaf QC', selected: selectedStatusFilter === 'Diparaf QC' }, 'Diparaf QC'),
        el('option', { value: 'Disahkan', selected: selectedStatusFilter === 'Disahkan' }, 'Disahkan'),
      ]);
      toolbar.appendChild(statusSelect);

      return toolbar;
    }

    function refresh() {
      let records = api.list(category.collection);
      const totalCount = records.length;

      if (selectedTankFilter !== 'semua') {
        records = records.filter((r) => r.tankId === selectedTankFilter);
      }
      if (selectedStatusFilter !== 'semua') {
        records = records.filter((r) => (r.status || 'Draft') === selectedStatusFilter);
      }

      countChip.textContent = `${records.length} dari ${totalCount} baris`;

      clear(trendsWrap);
      const trends = renderCategoryTrends(category, records);
      if (trends) trendsWrap.appendChild(trends);

      clear(listCard);
      listCard.appendChild(el('div', { class: 'px-5 pt-4 pb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100' }, [
        el('h3', { class: 'text-base font-bold' }, 'Riwayat Data'),
        renderFilterToolbar(api.list(category.collection)),
      ]));
      listCard.appendChild(el('div', { class: 'p-4 pt-4' }, renderRecordList(category, records, {
        canEdit: mayInput,
        getApproval: approvalFor,
        onApprove: (rec, step) => verify(rec, step),
        onDetail: openDetail,
        onEdit: openForm,
        onDelete: (rec) => { if (confirm('Hapus baris data ini?')) { api.remove(category.collection, rec.id); refresh(); } },
        cardExtra: (category.id === 'temuanLab' && auth.canApplyTemuan(user))
          ? (rec) => (rec.status !== 'Diterapkan'
              ? el('button', { class: 'btn btn-approve btn-sm', onClick: () => { api.update(category.collection, rec.id, { status: 'Diterapkan', diterapkanOleh: auth.userStamp(user) }); refresh(); } }, 'Tandai Diterapkan')
              : null)
          : null,
      })));
    }

    root.appendChild(header);
    root.appendChild(trendsWrap);
    root.appendChild(listCard);
    refresh();
    return root;
  };
}
