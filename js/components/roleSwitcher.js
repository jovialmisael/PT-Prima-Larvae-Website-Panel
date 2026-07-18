/* ===========================================================================
   roleSwitcher.js — pemilih peran (simulasi login prototype).
   Mengubah peran aktif lalu memicu render ulang navigasi & konten.
   =========================================================================== */

import { el } from '../dom.js';
import { USERS, SECTIONS, currentUser, setUser, roleLabel } from '../auth.js';

export function renderRoleSwitcher(onChange) {
  const user = currentUser();
  const sel = el('select', { class: 'role-select', 'aria-label': 'Pilih peran pengguna' });
  for (const u of USERS) {
    const secLbl = u.section ? ' · ' + SECTIONS[u.section] : '';
    const opt = el('option', { value: u.id }, `${u.name} — ${roleLabel(u)}${secLbl}`);
    if (u.id === user.id) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => { setUser(sel.value); onChange && onChange(); });

  return el('div', { class: 'role-switcher' }, [
    el('div', { class: 'role-eyebrow' }, 'Masuk sebagai'),
    sel,
  ]);
}
