/* ===========================================================================
   assistant.js — panel Asisten AI.
   UI siap pakai; jawaban kini placeholder berbasis aturan (api.askAssistant).
   Saat backend Laravel siap, cukup ubah isi api.askAssistant → fetch proxy.
   =========================================================================== */

import { el, clear } from '../dom.js';
import { scanAlerts } from '../alerts.js';
import * as auth from '../auth.js';
import * as api from '../api.js';

const SUGGESTIONS = [
  'Apa peringatan paling kritis hari ini?',
  'Bagaimana menangani NH3 yang tinggi?',
  'Jelaskan risiko Vibrio luminescent',
  'Kenapa survival bisa menurun?',
];

function buildContext() {
  // Sertakan label kontak agar jawaban bisa menyebut siapa yang dihubungi
  const alerts = scanAlerts({ days: 10 }).map((a) => ({
    ...a,
    tankLabel: a.tankId ? api.refLabel('tank', a.tankId, 'namaTank') : null,
    kontakLabel: a.kontakRole ? auth.roleLabelOf(a.kontakRole) : null,
  }));
  return { alerts, generatedAt: new Date().toISOString() };
}

function bubble(role, text) {
  return el('div', { class: `flex ${role === 'user' ? 'justify-end' : 'justify-start'}` }, [
    el('div', { class: `chat-bubble ${role === 'user' ? 'chat-user' : 'chat-ai'}`, style: 'white-space:pre-wrap' }, text),
  ]);
}

export function renderAssistant() {
  const root = el('div', { class: 'space-y-4 max-w-3xl mx-auto' });

  root.appendChild(el('div', {}, [
    el('h1', { class: 'text-2xl mb-1' }, 'Asisten AI Hatchery'),
    el('p', { class: 'muted text-sm' }, 'Tanya kondisi tank, interpretasi parameter, atau langkah tindakan. Asisten membaca peringatan aktif dari data Anda.'),
  ]));

  const thread = el('div', { class: 'card p-4 space-y-3', style: 'min-height:320px;max-height:52vh;overflow-y:auto' });

  // Sapaan awal berbasis data
  const ctx0 = buildContext();
  const bahaya = ctx0.alerts.filter((a) => a.status === 'bahaya').length;
  const waspada = ctx0.alerts.filter((a) => a.status === 'waspada').length;
  thread.appendChild(bubble('ai',
    `Halo. Saya siap membantu memantau hatchery.\nSaat ini terdeteksi ${bahaya} peringatan bahaya dan ${waspada} peringatan waspada dalam 10 hari terakhir. Silakan ajukan pertanyaan.`));

  // Chips saran
  const chips = el('div', { class: 'flex flex-wrap gap-2' });
  for (const s of SUGGESTIONS) {
    chips.appendChild(el('button', { class: 'chip', style: 'cursor:pointer', onClick: () => { input.value = s; send(); } }, s));
  }

  const input = el('input', { class: 'field-input', placeholder: 'Tulis pertanyaan…' });
  const sendBtn = el('button', { class: 'btn btn-primary', onClick: () => send() }, 'Kirim');
  const inputRow = el('div', { class: 'flex gap-2' }, [el('div', { class: 'flex-1' }, input), sendBtn]);

  async function send() {
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    thread.appendChild(bubble('user', q));
    thread.scrollTop = thread.scrollHeight;

    const typing = bubble('ai', 'Menganalisis data…');
    thread.appendChild(typing);
    thread.scrollTop = thread.scrollHeight;

    sendBtn.disabled = true;
    const answer = await api.askAssistant(buildContext(), q);
    thread.removeChild(typing);
    thread.appendChild(bubble('ai', answer));
    thread.scrollTop = thread.scrollHeight;
    sendBtn.disabled = false;
    input.focus();
  }

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

  root.appendChild(thread);
  root.appendChild(chips);
  root.appendChild(inputRow);
  root.appendChild(el('p', { class: 'text-xs muted' }, 'Placeholder — integrasi model AI penuh menyusul melalui backend Laravel (POST /api/assistant).'));
  return root;
}
