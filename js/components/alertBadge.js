/* ===========================================================================
   alertBadge.js — komponen visual status (aman/waspada/bahaya).
   =========================================================================== */

import { el } from '../dom.js';

const LABEL = { aman: 'Aman', waspada: 'Waspada', bahaya: 'Bahaya', none: '—' };

export function statusBadge(status) {
  const s = status || 'none';
  return el('span', { class: `status-badge status-${s}` }, [
    el('span', { class: `status-dot dot-${s}` }),
    LABEL[s] || s,
  ]);
}

export function statusDot(status) {
  const s = status || 'none';
  return el('span', { class: `status-dot dot-${s}`, title: LABEL[s] });
}

export function statusLabel(status) {
  return LABEL[status] || status;
}
