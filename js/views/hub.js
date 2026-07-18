/* ===========================================================================
   hub.js — shell "judul utama". Navigasi antar fitur dilakukan lewat sidebar
   (modul accordion), jadi TIDAK ada tab bar di halaman. Halaman menampilkan
   breadcrumb hub + konten fitur aktif (dengan judulnya sendiri).
   Fitur aktif ditentukan URL: #/h/<hubId>/<tabRef>.
   =========================================================================== */

import { el } from '../dom.js';
import { getHub } from '../schema.js';
import * as auth from '../auth.js';
import { createCategoryView } from './genericCategory.js';
import { renderThresholds } from './thresholds.js';
import { renderAssistant } from './assistant.js';

const VIEW_RENDERERS = {
  thresholds: renderThresholds,
  assistant: renderAssistant,
};

function renderTabContent(tab) {
  if (tab.kind === 'category') return createCategoryView(tab.ref)(); // header lengkap sendiri
  const fn = VIEW_RENDERERS[tab.ref];
  return fn ? fn() : el('div', { class: 'empty-state' }, 'Konten tidak ditemukan.');
}

export function renderHub(hubId, tabRef) {
  const hub = getHub(hubId);
  if (!hub || !hub.tabs) return el('div', { class: 'empty-state' }, 'Halaman tidak ditemukan.');

  const tabs = auth.visibleTabs(auth.currentUser(), hub);
  if (!tabs.length) return el('div', { class: 'empty-state' }, 'Anda tidak memiliki akses ke modul ini.');
  const active = tabs.find((t) => t.ref === tabRef) || tabs[0];

  const root = el('div', { class: 'space-y-5' });
  root.appendChild(el('div', { class: 'hub-crumb' }, hub.title));
  root.appendChild(renderTabContent(active));
  return root;
}
