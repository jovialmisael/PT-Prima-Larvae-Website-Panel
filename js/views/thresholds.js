/* ===========================================================================
   thresholds.js — Standar Parameter (dimiliki Divisi Lab).
   Kepala Lab menetapkan/menyesuaikan target & batas (normal/waspada/bahaya).
   Perubahan langsung dipakai mesin alert & grafik → peringatan Produksi ikut
   menyesuaikan. Divisi lain hanya membaca.
   =========================================================================== */

import { el } from '../dom.js';
import { CATEGORIES } from '../schema.js';
import { resolveThreshold } from '../alerts.js';
import * as auth from '../auth.js';
import * as api from '../api.js';

const NUM_BOUNDS = [
  ['safeMin', 'Aman min'],
  ['safeMax', 'Aman maks'],
  ['dangerMin', 'Bahaya min'],
  ['dangerMax', 'Bahaya maks'],
];

export function renderThresholds() {
  const canEdit = auth.canManageStandar(auth.currentUser());
  const root = el('div', { class: 'space-y-6' });

  root.appendChild(el('div', {}, [
    el('h1', { class: 'text-2xl mb-1' }, 'Standar Parameter'),
    el('p', { class: 'muted text-sm max-w-2xl' },
      canEdit
        ? 'Setel target & batas tiap parameter. Perubahan langsung mengubah peringatan di seluruh sistem (termasuk Produksi). Nilai kosong = batas tidak dipakai.'
        : 'Standar mutu ditetapkan Divisi Lab. Halaman ini hanya untuk dibaca; ikuti nilai batas berikut.'),
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
      canEdit ? el('th', {}, '') : null,
    ].filter(Boolean))));

    const tbody = el('tbody', {});
    for (const field of numFields) {
      const eff = resolveThreshold(field);
      const isOverridden = !!api.getThresholdOverride(field.key);
      const nameCell = el('td', {}, [
        el('div', { class: 'font-medium' }, [field.label, field.unit ? el('span', { class: 'field-unit' }, field.unit) : null]),
        isOverridden ? el('span', { class: 'text-xs text-brand-600' }, 'disesuaikan') : null,
      ]);

      if (!canEdit) {
        tbody.appendChild(el('tr', {}, [
          nameCell,
          ...NUM_BOUNDS.map(([key]) => el('td', { class: 'num' }, eff[key] == null ? '—' : String(eff[key]))),
        ]));
        continue;
      }

      const inputs = {};
      const cells = NUM_BOUNDS.map(([key]) => {
        const inp = el('input', { class: 'field-input', type: 'number', step: 'any', value: eff[key] ?? '', style: 'max-width:110px' });
        inputs[key] = inp;
        return el('td', {}, inp);
      });
      const note = el('span', { class: 'text-xs muted ml-2' });
      const saveBtn = el('button', { class: 'btn btn-ghost btn-sm' }, 'Simpan');
      const resetBtn = el('button', { class: 'btn btn-ghost btn-sm' }, 'Reset');
      saveBtn.addEventListener('click', () => {
        const obj = {};
        for (const [key] of NUM_BOUNDS) { const v = inputs[key].value; if (v !== '') obj[key] = Number(v); }
        api.setThresholdOverride(field.key, obj);
        note.textContent = 'Tersimpan';
        setTimeout(() => (note.textContent = ''), 1500);
      });
      resetBtn.addEventListener('click', () => {
        api.clearThresholdOverride(field.key);
        const def = field.threshold || {};
        for (const [key] of NUM_BOUNDS) inputs[key].value = def[key] ?? '';
        note.textContent = 'Direset';
        setTimeout(() => (note.textContent = ''), 1500);
      });

      tbody.appendChild(el('tr', {}, [nameCell, ...cells, el('td', { class: 'whitespace-nowrap' }, [saveBtn, ' ', resetBtn, note])]));
    }
    table.appendChild(tbody);
    card.appendChild(el('div', { class: 'p-2 overflow-x-auto' }, table));
    root.appendChild(card);
  }

  return root;
}
