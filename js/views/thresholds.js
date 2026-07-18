/* ===========================================================================
   thresholds.js — konfigurasi Batas & Peringatan.
   Menampilkan tiap parameter berbatas dan mengizinkan override
   safeMin/safeMax/dangerMin/dangerMax. Override disimpan via api dan
   dipakai mesin alert & grafik (garis batas) di seluruh sistem.

   Prinsip panduan: batas sebaiknya dihitung dari data siklus sendiri,
   bukan diambil dari buku — halaman ini tempat menyetelnya.
   =========================================================================== */

import { el, clear } from '../dom.js';
import { CATEGORIES } from '../schema.js';
import { resolveThreshold } from '../alerts.js';
import * as api from '../api.js';

const NUM_BOUNDS = [
  ['safeMin', 'Aman min'],
  ['safeMax', 'Aman maks'],
  ['dangerMin', 'Bahaya min'],
  ['dangerMax', 'Bahaya maks'],
];

export function renderThresholds() {
  const root = el('div', { class: 'space-y-6' });

  root.appendChild(el('div', {}, [
    el('h1', { class: 'text-2xl mb-1' }, 'Batas & Peringatan'),
    el('p', { class: 'muted text-sm max-w-2xl' }, 'Setel nilai aman dan bahaya tiap parameter. Nilai kosong berarti batas tersebut tidak dipakai. Perubahan langsung memengaruhi peringatan dan garis batas pada grafik.'),
  ]));

  for (const cat of CATEGORIES) {
    const numFields = cat.fields.filter((f) => f.threshold && !f.threshold.badValues);
    if (!numFields.length) continue;

    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'px-5 pt-4 pb-1 flex items-center gap-2' }, [
      el('span', { class: 'nav-code' }, cat.code),
      el('h3', { class: 'text-base' }, cat.title),
    ]));

    const table = el('table', { class: 'data-table' });
    table.appendChild(el('thead', {}, el('tr', {}, [
      el('th', {}, 'Parameter'),
      ...NUM_BOUNDS.map(([, label]) => el('th', {}, label)),
      el('th', {}, ''),
    ])));

    const tbody = el('tbody', {});
    for (const field of numFields) {
      const eff = resolveThreshold(field);
      const inputs = {};
      const cells = NUM_BOUNDS.map(([key]) => {
        const inp = el('input', { class: 'field-input', type: 'number', step: 'any', value: eff[key] ?? '', style: 'max-width:110px' });
        inputs[key] = inp;
        return el('td', {}, inp);
      });

      const saveBtn = el('button', { class: 'btn btn-ghost btn-sm' }, 'Simpan');
      const resetBtn = el('button', { class: 'btn btn-ghost btn-sm' }, 'Reset');
      const note = el('span', { class: 'text-xs muted ml-2' });

      saveBtn.addEventListener('click', () => {
        const obj = {};
        for (const [key] of NUM_BOUNDS) {
          const v = inputs[key].value;
          if (v !== '') obj[key] = Number(v);
        }
        api.setThresholdOverride(field.key, obj);
        note.textContent = 'Tersimpan';
        setTimeout(() => (note.textContent = ''), 1500);
      });
      resetBtn.addEventListener('click', () => {
        api.clearThresholdOverride(field.key);
        const def = field.threshold || {};
        for (const [key] of NUM_BOUNDS) inputs[key].value = def[key] ?? '';
        note.textContent = 'Direset ke default';
        setTimeout(() => (note.textContent = ''), 1500);
      });

      const isOverridden = !!api.getThresholdOverride(field.key);
      tbody.appendChild(el('tr', {}, [
        el('td', {}, [
          el('div', { class: 'font-medium' }, [field.label, field.unit ? el('span', { class: 'field-unit' }, field.unit) : null]),
          isOverridden ? el('span', { class: 'text-xs text-brand-600' }, 'disesuaikan') : null,
        ]),
        ...cells,
        el('td', { class: 'whitespace-nowrap' }, [saveBtn, ' ', resetBtn, note]),
      ]));
    }
    table.appendChild(tbody);
    card.appendChild(el('div', { class: 'p-2 overflow-x-auto' }, table));
    root.appendChild(card);
  }

  return root;
}
