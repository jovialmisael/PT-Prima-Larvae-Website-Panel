/* ===========================================================================
   modal.js — drawer (panel geser dari kanan) reusable untuk form & detail.
   Satu instance di document.body. Tutup via overlay / tombol X / Esc.
   Di layar kecil menjadi lebar penuh; scroll hanya vertikal.
   =========================================================================== */

import { el, clear } from '../dom.js';

let overlayEl, panelEl, titleEl, bodyEl, footerEl, escHandler;

function ensure() {
  if (overlayEl) return;
  titleEl = el('h3', { class: 'drawer-title' });
  const closeBtn = el('button', { class: 'drawer-close', 'aria-label': 'Tutup', onClick: closeDrawer, html: '✕' });
  bodyEl = el('div', { class: 'drawer-body' });
  footerEl = el('div', { class: 'drawer-footer hidden' });
  panelEl = el('div', { class: 'drawer', role: 'dialog', 'aria-modal': 'true' }, [
    el('div', { class: 'drawer-header' }, [titleEl, closeBtn]),
    bodyEl,
    footerEl,
  ]);
  overlayEl = el('div', { class: 'drawer-overlay hidden' }, panelEl);
  overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) closeDrawer(); });
  document.body.appendChild(overlayEl);
}

export function openDrawer({ title = '', body, footer } = {}) {
  ensure();
  titleEl.textContent = title;
  clear(bodyEl); if (body) bodyEl.appendChild(body);
  clear(footerEl);
  if (footer) { footerEl.appendChild(footer); footerEl.classList.remove('hidden'); }
  else footerEl.classList.add('hidden');

  overlayEl.classList.remove('hidden');
  requestAnimationFrame(() => overlayEl.classList.add('open'));
  document.body.style.overflow = 'hidden';

  escHandler = (e) => { if (e.key === 'Escape') closeDrawer(); };
  document.addEventListener('keydown', escHandler);
  setTimeout(() => { const f = bodyEl.querySelector('input, select, textarea, button'); if (f) f.focus(); }, 60);
}

export function closeDrawer() {
  if (!overlayEl) return;
  overlayEl.classList.remove('open');
  document.body.style.overflow = '';
  if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
  setTimeout(() => overlayEl && overlayEl.classList.add('hidden'), 220);
}
