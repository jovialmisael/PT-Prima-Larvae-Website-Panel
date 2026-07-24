/* ===========================================================================
   section.js — pola inti redesain: SECTION-CARD. Tiap fitur/area dibungkus
   satu panel bertajuk sendiri (ikon + judul + aksi opsional) → memenuhi
   prinsip "tiap fitur punya section sendiri". Warna via token (light/dark).
   =========================================================================== */

import { el } from '../dom.js';
import { ICONS } from '../icons.js';

// sectionCard({ icon, title, subtitle, actions, body, tone })
//  - icon: nama ikon di ICONS (opsional)
//  - actions: elemen/array elemen di kanan header (opsional)
//  - body: elemen/array elemen isi
//  - tone: 'ok' | 'warn' | 'bahaya' (mewarnai ikon header)
export function sectionCard({ icon, title, subtitle, actions, body, tone } = {}) {
  const hasHead = !!(title || icon || actions);
  const head = hasHead ? el('div', { class: 'section-card__head' }, [
    icon ? el('span', { class: 'section-card__ico', html: ICONS[icon] || '' }) : null,
    (title || subtitle) ? el('div', { class: 'min-w-0' }, [
      title ? el('div', { class: 'section-card__title' }, title) : null,
      subtitle ? el('div', { class: 'section-card__sub' }, subtitle) : null,
    ]) : null,
    actions ? el('div', { class: 'section-card__actions' }, actions) : null,
  ]) : null;

  return el('div', { class: 'section-card' + (tone ? ' section-card--' + tone : '') }, [
    head,
    el('div', { class: 'section-card__body' }, body),
  ]);
}
