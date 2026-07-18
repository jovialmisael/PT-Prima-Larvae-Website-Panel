/* ===========================================================================
   form.js — generator formulir generik dari definisi kategori (schema).
   - Menangani semua tipe field (termasuk ref, pcr, computed).
   - Field computed (NH3, selisih pagi–sore) dihitung ulang otomatis.
   - Status batas ditampilkan langsung di samping field saat input berubah.
   =========================================================================== */

import { el, clear } from '../dom.js';
import { PCR_OPTIONS } from '../schema.js';
import { computeField, num } from '../compute.js';
import { evaluate, evalField, resolveThreshold } from '../alerts.js';
import { statusBadge } from './alertBadge.js';
import { infoIcon, hintFor } from './tooltip.js';
import * as api from '../api.js';

function updateBadge(container, status) {
  clear(container);
  if (status && status !== 'none' && status !== 'aman') container.appendChild(statusBadge(status));
  else if (status === 'aman') container.appendChild(statusBadge('aman'));
}

export function renderForm(category, { record = null, onSubmit, onCancel } = {}) {
  const form = el('form', { class: 'space-y-4', autocomplete: 'off' });
  const grid = el('div', { class: 'grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3' });
  const controls = {};       // key -> input/select/textarea
  const computedEls = {};    // key -> { input, badge }
  const statusEls = {};      // key -> badge container
  let currentGroup = null;

  const makeControl = (field) => {
    const val = record ? record[field.key] : '';
    const base = { name: field.key, class: 'field-input' };

    if (field.type === 'textarea') {
      return el('textarea', { ...base, rows: '2' }, val || '');
    }
    if (field.type === 'select' || field.type === 'pcr') {
      const opts = field.type === 'pcr' ? PCR_OPTIONS : (field.options || []);
      const sel = el('select', base);
      sel.appendChild(el('option', { value: '' }, '— pilih —'));
      for (const o of opts) {
        const opt = el('option', { value: o }, o);
        if (String(val) === String(o)) opt.selected = true;
        sel.appendChild(opt);
      }
      return sel;
    }
    if (field.type === 'ref') {
      const sel = el('select', base);
      sel.appendChild(el('option', { value: '' }, '— pilih —'));
      const rows = api.list(field.refCollection);
      if (!rows.length) sel.appendChild(el('option', { value: '', disabled: 'true' }, '(belum ada data)'));
      for (const r of rows) {
        const opt = el('option', { value: r.id }, r[field.refLabelKey] || r.id);
        if (val === r.id) opt.selected = true;
        sel.appendChild(opt);
      }
      return sel;
    }
    if (field.type === 'computed') {
      const initial = record ? computeField(field, record) : '';
      return el('input', { ...base, class: 'field-input field-computed', readonly: 'true', value: initial == null ? '' : initial });
    }
    // number / text / date / time
    const type = field.type === 'number' ? 'number' : field.type || 'text';
    const attrs = { ...base, type, value: val == null ? '' : val };
    if (type === 'number') attrs.step = 'any';
    return el('input', attrs);
  };

  for (const field of category.fields) {
    // Subjudul grup
    if (field.group && field.group !== currentGroup) {
      currentGroup = field.group;
      grid.appendChild(el('div', { class: 'md:col-span-2', html: `<div class="nav-section-title" style="padding-left:0">${field.group}</div>` }));
    } else if (!field.group) {
      currentGroup = null;
    }

    const control = makeControl(field);
    controls[field.key] = control;

    const badge = el('span', {});
    if (field.type === 'computed') computedEls[field.key] = { input: control, badge };
    if (field.threshold) statusEls[field.key] = badge;

    const labelRow = el('div', { class: 'flex items-center justify-between gap-2 mb-1' }, [
      el('label', { class: 'field-label flex items-center', style: 'margin:0' }, [
        field.label + (field.required ? ' *' : ''),
        field.unit ? el('span', { class: 'field-unit' }, field.unit) : null,
        infoIcon(hintFor(field)),
      ]),
      badge,
    ]);

    const wrap = el('div', { class: field.type === 'textarea' ? 'md:col-span-2' : '' }, [
      labelRow,
      control,
      field.help ? el('p', { class: 'text-[0.72rem] muted mt-1' }, field.help) : null,
    ]);
    grid.appendChild(wrap);
  }

  // ---- baca nilai form saat ini ----
  const readForm = () => {
    const data = {};
    for (const field of category.fields) {
      if (field.type === 'computed') continue;
      const c = controls[field.key];
      if (!c) continue;
      let v = c.value;
      if (field.type === 'number' && v !== '') v = num(v);
      data[field.key] = v;
    }
    return data;
  };

  // ---- hitung ulang computed + status ----
  const recompute = () => {
    const data = readForm();
    for (const field of category.fields) {
      if (field.type === 'computed') {
        const v = computeField(field, data);
        const c = computedEls[field.key];
        c.input.value = v == null ? '' : v;
        if (field.threshold) updateBadge(c.badge, evaluate(v, resolveThreshold(field)));
      } else if (field.threshold && statusEls[field.key]) {
        updateBadge(statusEls[field.key], evalField(field, data));
      }
    }
  };
  form.addEventListener('input', recompute);
  form.addEventListener('change', recompute);

  // ---- baris tombol ----
  const msg = el('p', { class: 'text-sm text-red-600 hidden' });
  const actions = el('div', { class: 'flex items-center gap-2 pt-1' }, [
    el('button', { type: 'submit', class: 'btn btn-primary' }, record ? 'Simpan Perubahan' : 'Simpan Data'),
    onCancel ? el('button', { type: 'button', class: 'btn btn-ghost', onClick: onCancel }, 'Batal') : null,
    msg,
  ]);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = readForm();
    const missing = category.fields.filter((f) => f.required && (data[f.key] === '' || data[f.key] == null));
    if (missing.length) {
      msg.textContent = 'Lengkapi field wajib: ' + missing.map((f) => f.label).join(', ');
      msg.classList.remove('hidden');
      return;
    }
    msg.classList.add('hidden');
    onSubmit && onSubmit(data);
  });

  form.appendChild(grid);
  form.appendChild(actions);
  recompute();
  return form;
}
