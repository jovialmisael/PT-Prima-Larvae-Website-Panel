/* ===========================================================================
   tooltip.js — ikon ⓘ dengan penjelasan bahasa awam (aksesibel keyboard).
   `hintFor(field)` mencari penjelasan dari field.hint, lalu dari GLOSSARY
   dengan mencocokkan istilah pada label/key field. Satu sumber untuk
   form & tabel.
   =========================================================================== */

import { el } from '../dom.js';
import { GLOSSARY } from '../schema.js';

// Istilah glosarium diurut dari terpanjang agar kecocokan paling spesifik menang
const TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function hintFor(field) {
  if (!field) return '';
  if (field.hint) return field.hint;
  const label = (field.label || '').toLowerCase();
  const key = (field.key || '').toLowerCase();
  for (const term of TERMS) {
    const t = term.toLowerCase();
    const wordBoundary = new RegExp('\\b' + escapeRe(t) + '\\b', 'i');
    if (wordBoundary.test(label)) return GLOSSARY[term];
    if (t.length >= 3 && key.includes(t)) return GLOSSARY[term];
  }
  return '';
}

// Ikon ⓘ + tooltip. Mengembalikan null bila tidak ada penjelasan.
export function infoIcon(text) {
  if (!text) return null;
  return el('span', {
    class: 'info', tabindex: '0', role: 'note', 'aria-label': text, title: text,
  }, [
    el('span', { class: 'info-mark', 'aria-hidden': 'true' }, 'ⓘ'),
    el('span', { class: 'info-tip' }, text),
  ]);
}
