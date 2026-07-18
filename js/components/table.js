/* ===========================================================================
   table.js — generator tabel generik.
   - Nilai computed dihitung saat render; sel berbatas diwarnai per status.
   - Kolom Status verifikasi (Draft → Disahkan → Diperiksa) + jejak paraf.
   - Tombol aksi (Edit/Hapus/Sahkan/Periksa) muncul sesuai wewenang peran.
   =========================================================================== */

import { el, fmt, fmtDate } from '../dom.js';
import { evalField, isMonitored } from '../alerts.js';
import { computeField } from '../compute.js';
import { statusDot } from './alertBadge.js';
import { infoIcon, hintFor } from './tooltip.js';
import * as api from '../api.js';

function columns(category) {
  return category.fields.filter((f) => f.type !== 'textarea');
}

function cellValue(field, rec) {
  if (field.type === 'computed') { const v = computeField(field, rec); return v == null ? '—' : fmt(v); }
  if (field.type === 'ref') return api.refLabel(field.refCollection, rec[field.key], field.refLabelKey) || '—';
  if (field.type === 'date') return fmtDate(rec[field.key]);
  if (field.type === 'number') return fmt(rec[field.key]);
  const v = rec[field.key];
  return v == null || v === '' ? '—' : v;
}

function verifBadge(status) {
  const s = status || 'Draft';
  const cls = s === 'Diperiksa' ? 'v-diperiksa' : s === 'Disahkan' ? 'v-disahkan' : 'v-draft';
  return el('span', { class: 'verif ' + cls }, s);
}
function parafLabel(rec) {
  if (rec.diperiksaOleh) return 'Diperiksa: ' + rec.diperiksaOleh.name;
  if (rec.disahkanOleh) return 'Disahkan: ' + rec.disahkanOleh.name;
  if (rec.dibuatOleh) return 'Dibuat: ' + rec.dibuatOleh.name;
  return '';
}

export function renderTable(category, records, opts = {}) {
  const { canEdit, canSahkan, canPeriksa, onEdit, onDelete, onSahkan, onPeriksa } = opts;
  const cols = columns(category);

  if (!records.length) {
    return el('div', { class: 'empty-state' }, 'Belum ada data. Klik “Tambah Data” untuk mulai mencatat.');
  }

  const wrap = el('div', { class: 'overflow-x-auto' });
  const table = el('table', { class: 'data-table' });

  // ---- header ----
  const headCells = cols.map((f) =>
    el('th', {}, [
      el('span', { class: 'inline-flex items-center' }, [
        f.label, f.unit ? el('span', { class: 'field-unit' }, f.unit) : null, infoIcon(hintFor(f)),
      ]),
    ])
  );
  if (category.traceKey) headCells.push(el('th', {}, 'Traceability'));
  headCells.push(el('th', { class: 'col-actions' }, 'Status & Aksi'));
  table.appendChild(el('thead', {}, el('tr', {}, headCells)));

  // ---- body ----
  const tbody = el('tbody', {});
  for (const rec of records) {
    const status = rec.status || 'Draft';
    const cells = cols.map((f) => {
      const monitored = isMonitored(f);
      const s = monitored ? evalField(f, rec) : 'none';
      const cls = s === 'bahaya' ? 'cell-bahaya' : s === 'waspada' ? 'cell-waspada' : '';
      const isNum = f.type === 'number' || f.type === 'computed';
      return el('td', { class: `${cls} ${isNum ? 'num' : ''}`.trim() }, [
        monitored && s !== 'none' && s !== 'aman' ? statusDot(s) : null,
        monitored && s !== 'none' && s !== 'aman' ? ' ' : null,
        String(cellValue(f, rec)),
      ]);
    });

    if (category.traceKey) {
      const tank = rec.tankId ? api.get('tank', rec.tankId) : null;
      let trace = '—';
      if (tank) {
        const batch = tank.batchInduk ? api.refLabel('indukBatch', tank.batchInduk, 'kodeBatch') : '';
        trace = [batch, tank.tambakTujuan].filter(Boolean).join(' · ') || '—';
      }
      cells.push(el('td', { class: 'muted text-xs' }, trace));
    }

    // Kolom Status & Aksi (menempel di kanan)
    const btns = [];
    if (canEdit && status !== 'Diperiksa') {
      btns.push(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => onEdit && onEdit(rec) }, 'Edit'));
      btns.push(el('button', { class: 'btn btn-danger btn-sm', onClick: () => onDelete && onDelete(rec) }, 'Hapus'));
    }
    if (canSahkan && status === 'Draft') {
      btns.push(el('button', { class: 'btn btn-approve btn-sm', onClick: () => onSahkan && onSahkan(rec) }, 'Sahkan'));
    }
    if (canPeriksa && status === 'Disahkan') {
      btns.push(el('button', { class: 'btn btn-verify btn-sm', onClick: () => onPeriksa && onPeriksa(rec) }, 'Periksa'));
    }
    cells.push(el('td', { class: 'col-actions' }, [
      verifBadge(status),
      parafLabel(rec) ? el('div', { class: 'text-[0.68rem] muted mt-1' }, parafLabel(rec)) : null,
      btns.length ? el('div', { class: 'flex flex-wrap gap-1 mt-2' }, btns) : null,
    ]));

    tbody.appendChild(el('tr', {}, cells));
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}
