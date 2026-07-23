/* ===========================================================================
   formView.js — merakit satu FORM fisik dari section-nya (schema.FORMS).
   Tiap section = kategori milik satu divisi; user hanya boleh menginput
   section divisinya sendiri (canInput), section lain tampil sebagai konteks
   baca. Mewujudkan "struktur ikut form asli, input dipisah per role".
   Lihat docs/model-peran-alur.md.
   =========================================================================== */

import { el } from '../dom.js';
import { getForm, getCategory } from '../schema.js';
import * as auth from '../auth.js';
import { createCategoryView } from './genericCategory.js';

export function renderFormView(formId) {
  const user = auth.currentUser();
  const form = getForm(formId);
  if (!form) return el('div', { class: 'empty-state' }, 'Form tidak ditemukan.');

  const root = el('div', { class: 'space-y-6' });

  // Legenda kepemilikan (divisi unik yang mengisi form)
  const owners = form.sections
    .map((ref) => { const c = getCategory(ref); return c ? (auth.DIVISIONS[c.division] || c.division) : null; })
    .filter((v, i, a) => v && a.indexOf(v) === i);

  root.appendChild(el('div', { class: 'max-w-2xl' }, [
    el('div', { class: 'flex items-center gap-2 mb-1' }, [
      form.no !== '—' ? el('span', { class: 'nav-code' }, 'FORM ' + form.no) : null,
      el('h1', { class: 'text-2xl' }, form.title),
    ]),
    el('p', { class: 'muted text-sm' },
      `Diisi bersama: ${owners.join(' & ')}. Tiap bagian diisi divisinya sendiri; pengesahan berjenjang Ka.Sie → QC → MPM.`),
  ]));

  // Tiap section: panel dengan penanda pemilik + view kategori (sadar-peran)
  for (const ref of form.sections) {
    const cat = getCategory(ref);
    if (!cat) continue;
    const mine = auth.canInput(user, ref);
    const divLabel = auth.DIVISIONS[cat.division] || cat.division;
    root.appendChild(el('div', { class: 'form-section' + (mine ? ' form-section-mine' : '') }, [
      el('div', { class: 'form-section-head' }, [
        el('span', { class: 'section-owner ' + (mine ? 'owner-mine' : 'owner-other') },
          mine ? `Bagian Anda · ${divLabel}` : `Bagian ${divLabel} · baca`),
      ]),
      createCategoryView(ref)(),
    ]));
  }
  return root;
}
