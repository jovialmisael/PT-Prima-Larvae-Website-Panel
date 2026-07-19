/* ===========================================================================
   login.js — layar login per-akun (simulasi prototype).
   Desain dua kolom: panel brand (kiri) + kartu login (kanan).
   Menyertakan daftar akun demo agar kepala & tiap bagian mudah mencoba.
   =========================================================================== */

import { el, clear } from '../dom.js';
import { ICONS } from '../icons.js';
import { USERS, login, roleLabel } from '../auth.js';

export function renderLoginView(onSuccess) {
  const root = el('div', { class: 'login-wrap' });

  /* ---- Panel brand (kiri) ---- */
  const hero = el('div', { class: 'login-hero' }, [
    el('div', { class: 'login-hero-inner' }, [
      el('div', { class: 'flex items-center gap-3 mb-6' }, [
        el('div', { class: 'brand-mark', html: ICONS.droplet }),
        el('div', {}, [
          el('div', { class: 'text-[0.72rem] tracking-[0.22em] font-bold', style: 'color:rgba(255,255,255,0.85)' }, 'PRIMA LARVAE'),
          el('div', { class: 'font-display font-semibold text-xl' }, 'Panel Hatchery'),
        ]),
      ]),
      el('h1', { class: 'login-hero-title' }, 'Satu panel untuk seluruh bagian hatchery'),
      el('p', { class: 'login-hero-sub' },
        'Mempermudah kerja Kepala Bagian dan setiap seksi di bawahnya — mencatat, memantau, dan mengesahkan data harian dalam satu alur yang rapi.'),
      el('ul', { class: 'login-points' }, [
        heroPoint('Input harian cepat, sesuai bagian masing-masing'),
        heroPoint('Peringatan dini otomatis (NH3, Vibrio, survival)'),
        heroPoint('Alur pengesahan berjenjang: Petugas → Ka.Sie → MPM'),
      ]),
    ]),
  ]);

  /* ---- Kartu login (kanan) ---- */
  const errorBox = el('div', { class: 'login-error hidden' });
  const userInput = el('input', { class: 'field-input', id: 'login-user', autocomplete: 'username', placeholder: 'mis. dwi' });
  const passInput = el('input', { class: 'field-input', id: 'login-pass', type: 'password', autocomplete: 'current-password', placeholder: '••••••••' });

  const toggleBtn = el('button', { type: 'button', class: 'pass-toggle', 'aria-label': 'Tampilkan kata sandi' }, 'Lihat');
  toggleBtn.addEventListener('click', () => {
    const show = passInput.type === 'password';
    passInput.type = show ? 'text' : 'password';
    toggleBtn.textContent = show ? 'Sembunyikan' : 'Lihat';
  });

  function submit() {
    const res = login(userInput.value, passInput.value);
    if (!res.ok) {
      errorBox.textContent = res.error;
      errorBox.classList.remove('hidden');
      passInput.focus();
      return;
    }
    onSuccess && onSuccess(res.user);
  }

  const form = el('form', { class: 'space-y-4' }, [
    el('div', {}, [el('label', { class: 'field-label', for: 'login-user' }, 'Username'), userInput]),
    el('div', {}, [
      el('div', { class: 'flex items-center justify-between' }, [
        el('label', { class: 'field-label', for: 'login-pass' }, 'Kata sandi'),
        toggleBtn,
      ]),
      passInput,
    ]),
    errorBox,
    el('button', { type: 'submit', class: 'btn btn-primary w-full', style: 'min-height:2.9rem' }, 'Masuk'),
  ]);
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });

  // Akun demo — collapsible agar login tetap ringkas (tanpa scroll berlebih)
  const demoGrid = el('div', { class: 'demo-grid' });
  for (const u of USERS) {
    const initials = u.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
    demoGrid.appendChild(el('button', {
      type: 'button', class: 'demo-acc',
      onClick: () => { userInput.value = u.username; passInput.value = u.password; submit(); },
    }, [
      el('span', { class: 'demo-avatar' }, initials),
      el('span', { class: 'min-w-0' }, [
        el('span', { class: 'demo-name' }, u.name),
        el('span', { class: 'demo-role' }, roleLabel(u)),
      ]),
    ]));
  }
  const demoBox = el('div', { class: 'demo-box hidden' }, [
    demoGrid,
    el('p', { class: 'text-xs muted mt-2 text-center' }, 'Semua akun demo memakai kata sandi: prima123'),
  ]);
  const demoBtn = el('button', { type: 'button', class: 'demo-toggle' }, [
    el('span', {}, 'Coba akun demo'),
    el('span', { class: 'demo-chev', html: ICONS.chevron }),
  ]);
  demoBtn.addEventListener('click', () => { demoBox.classList.toggle('hidden'); demoBtn.classList.toggle('open'); });

  const card = el('div', { class: 'login-panel' }, [
    el('div', { class: 'login-card' }, [
      el('h2', { class: 'text-2xl mb-1' }, 'Masuk'),
      el('p', { class: 'muted text-sm mb-5' }, 'Gunakan akun Anda untuk mengakses panel sesuai peran.'),
      form,
      demoBtn,
      demoBox,
    ]),
  ]);

  root.appendChild(hero);
  root.appendChild(card);
  // fokus awal
  setTimeout(() => userInput.focus(), 50);
  return root;
}

function heroPoint(text) {
  const check = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  return el('li', {}, [el('span', { class: 'login-check', html: check }), el('span', {}, text)]);
}
