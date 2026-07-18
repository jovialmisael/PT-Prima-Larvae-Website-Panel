/* ===========================================================================
   recordList.js — daftar record sebagai KARTU responsif (pengganti tabel lebar).
   Tanpa scroll horizontal: hanya menampilkan nilai kunci per kartu; seluruh
   field dilihat lewat drawer Detail (renderRecordDetail).
   =========================================================================== */

import { el, fmt, fmtDate } from '../dom.js';
import { evalField, isMonitored } from '../alerts.js';
import { computeField } from '../compute.js';
import { statusDot } from './alertBadge.js';
import { infoIcon, hintFor } from './tooltip.js';
import * as api from '../api.js';

function verifBadge(status) {
  const s = status || 'Draft';
  const cls = s === 'Diperiksa' ? 'v-diperiksa' : s === 'Disahkan' ? 'v-disahkan' : 'v-draft';
  return el('span', { class: 'verif ' + cls }, s);
}

// Pilih nilai kunci yang ditampilkan di kartu (generik)
function summaryFields(category) {
  if (category.chart && category.chart.length) {
    return category.chart.map((k) => category.fields.find((f) => f.key === k)).filter(Boolean);
  }
  const monitored = category.fields.filter(isMonitored);
  if (monitored.length) return monitored.slice(0, 3);
  return category.fields
    .filter((f) => !['tanggal', 'tankId', category.labelKey].includes(f.key) && f.type !== 'textarea')
    .slice(0, 3);
}

function fieldValue(field, rec) {
  const val = field.type === 'computed' ? computeField(field, rec) : rec[field.key];
  if (field.type === 'ref') return api.refLabel(field.refCollection, val, field.refLabelKey) || '—';
  if (field.type === 'date') return fmtDate(val);
  if (field.type === 'number' || field.type === 'computed') return val == null || val === '' ? '—' : fmt(val);
  return val == null || val === '' ? '—' : String(val);
}

function recordCard(category, rec, opts) {
  const status = rec.status || 'Draft';

  // Header: judul (tanggal atau label) + tank + status
  let titleText, subText = '';
  if (category.labelKey) titleText = rec[category.labelKey] || '—';
  else { titleText = fmtDate(rec.tanggal); subText = rec.tankId ? api.refLabel('tank', rec.tankId, 'namaTank') : ''; }

  const head = el('div', { class: 'rec-head' }, [
    el('div', { class: 'rec-head-main' }, [
      el('span', { class: 'rec-title' }, titleText),
      subText ? el('span', { class: 'rec-tank' }, subText) : null,
    ]),
    verifBadge(status),
  ]);

  // Nilai kunci
  const kv = el('div', { class: 'rec-kv' });
  for (const f of summaryFields(category)) {
    const monitored = isMonitored(f);
    const s = monitored ? evalField(f, rec) : 'none';
    const flag = monitored && s !== 'none' && s !== 'aman';
    kv.appendChild(el('div', { class: 'rec-kv-item' }, [
      el('span', { class: 'rec-kv-label' }, f.label),
      el('span', { class: `rec-kv-val ${s === 'bahaya' ? 'val-bahaya' : s === 'waspada' ? 'val-waspada' : ''}` }, [
        flag ? statusDot(s) : null, flag ? ' ' : null,
        fieldValue(f, rec) + (f.unit ? ' ' + f.unit : ''),
      ]),
    ]));
  }

  // Traceability
  let traceEl = null;
  if (category.traceKey && rec.tankId) {
    const tank = api.get('tank', rec.tankId);
    if (tank) {
      const batch = tank.batchInduk ? api.refLabel('indukBatch', tank.batchInduk, 'kodeBatch') : '';
      const trace = [batch, tank.tambakTujuan].filter(Boolean).join(' · ');
      if (trace) traceEl = el('div', { class: 'rec-trace' }, trace);
    }
  }

  // Aksi
  const acts = el('div', { class: 'rec-actions' });
  acts.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => opts.onDetail(rec) }, 'Detail'));
  if (opts.canEdit && status !== 'Diperiksa') {
    acts.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => opts.onEdit(rec) }, 'Edit'));
    acts.appendChild(el('button', { class: 'btn btn-danger btn-sm', onClick: () => opts.onDelete(rec) }, 'Hapus'));
  }
  if (opts.canSahkan && status === 'Draft') {
    acts.appendChild(el('button', { class: 'btn btn-approve btn-sm', onClick: () => opts.onSahkan(rec) }, 'Sahkan'));
  }
  if (opts.canPeriksa && status === 'Disahkan') {
    acts.appendChild(el('button', { class: 'btn btn-verify btn-sm', onClick: () => opts.onPeriksa(rec) }, 'Periksa'));
  }

  return el('div', { class: 'rec-card' }, [head, kv, traceEl, acts]);
}

export function renderRecordList(category, records, opts = {}) {
  if (!records.length) {
    return el('div', { class: 'empty-state' }, 'Belum ada data. Klik “Tambah Data” untuk mulai mencatat.');
  }
  const grid = el('div', { class: 'rec-grid' });
  for (const rec of records) grid.appendChild(recordCard(category, rec, opts));
  return grid;
}

/* --- Detail lengkap (isi drawer) --- */
export function renderRecordDetail(category, rec) {
  const wrap = el('div', { class: 'detail-wrap' });
  let currentGroup = null;
  let list = null;
  const flush = () => { if (list) { wrap.appendChild(list); list = null; } };

  for (const f of category.fields) {
    if (f.group && f.group !== currentGroup) { flush(); currentGroup = f.group; wrap.appendChild(el('div', { class: 'detail-group-title' }, f.group)); }
    else if (!f.group) currentGroup = null;
    if (!list) list = el('div', { class: 'detail-dl' });

    const monitored = isMonitored(f);
    const s = monitored ? evalField(f, rec) : 'none';
    const flag = monitored && s !== 'none' && s !== 'aman';
    list.appendChild(el('div', { class: 'detail-row' }, [
      el('div', { class: 'detail-label' }, [f.label, f.unit ? el('span', { class: 'field-unit' }, f.unit) : null, infoIcon(hintFor(f))]),
      el('div', { class: `detail-val ${s === 'bahaya' ? 'val-bahaya' : s === 'waspada' ? 'val-waspada' : ''}` }, [
        flag ? statusDot(s) : null, flag ? ' ' : null, fieldValue(f, rec),
      ]),
    ]));
  }
  flush();

  // Jejak pengesahan
  const trailRow = (label, stamp) => el('div', { class: 'trail-row' }, [
    el('span', { class: 'trail-label' }, label),
    el('span', { class: 'trail-val' }, stamp ? `${stamp.name} · ${fmtDate(stamp.at)}` : '—'),
  ]);
  wrap.appendChild(el('div', { class: 'detail-trail' }, [
    el('div', { class: 'detail-group-title' }, 'Riwayat Pengesahan'),
    el('div', { class: 'trail-status' }, verifBadge(rec.status || 'Draft')),
    trailRow('Dibuat', rec.dibuatOleh),
    trailRow('Disahkan', rec.disahkanOleh),
    trailRow('Diperiksa', rec.diperiksaOleh),
  ]));

  return wrap;
}
