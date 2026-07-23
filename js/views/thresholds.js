/* ===========================================================================
   thresholds.js — Standar Parameter (dimiliki Kabag Lab). Prinsip 1: tiap
   parameter = BATAS + TINDAKAN + KONTAK, dan batas dapat DIKALIBRASI dari data
   siklus yang berhasil (bukan dari buku). Divisi lain hanya membaca.
   =========================================================================== */

import { el, clear, fmt } from '../dom.js';
import { CATEGORIES, getCategory } from '../schema.js';
import { resolveStandard } from '../alerts.js';
import { stats, suggestBounds, computeField } from '../compute.js';
import * as auth from '../auth.js';
import * as api from '../api.js';

const NUM_BOUNDS = [
  ['safeMin', 'Aman min'],
  ['safeMax', 'Aman maks'],
  ['dangerMin', 'Bahaya min'],
  ['dangerMax', 'Bahaya maks'],
];
const KONTAK_ROLES = ['kabagProd', 'kabagLab', 'kabagMpm'];
const today = () => new Date().toISOString().slice(0, 10);

export function renderThresholds() {
  const user = auth.currentUser();
  const canEdit = auth.canManageStandar(user);
  const root = el('div', { class: 'space-y-6' });

  function rebuild() {
    clear(root);
    root.appendChild(el('div', {}, [
      el('h1', { class: 'text-2xl mb-1' }, 'Standar Parameter'),
      el('p', { class: 'muted text-sm max-w-2xl' },
        canEdit
          ? 'Tetapkan batas, tindakan, dan kontak tiap parameter. Batas sebaiknya dikalibrasi dari data siklus yang berhasil (tombol Kalibrasi), bukan dari buku. Perubahan langsung mengubah peringatan di seluruh sistem.'
          : 'Standar mutu ditetapkan Kabag Lab. Halaman ini untuk dibaca; ikuti batas, tindakan, dan kontak berikut.'),
    ]));

    for (const cat of CATEGORIES) {
      const numFields = cat.fields.filter((f) => f.threshold && !f.threshold.badValues);
      if (!numFields.length) continue;
      const card = el('div', { class: 'card' });
      card.appendChild(el('div', { class: 'px-5 pt-4 pb-1 flex items-center gap-2' }, [
        el('span', { class: 'nav-code' }, cat.code),
        el('h3', { class: 'text-base' }, cat.title),
      ]));
      const body = el('div', { class: 'p-4 pt-2 space-y-3' });
      for (const field of numFields) body.appendChild(stdRow(cat, field, canEdit, rebuild));
      card.appendChild(body);
      root.appendChild(card);
    }
  }

  rebuild();
  return root;
}

function stdRow(cat, field, canEdit, rebuild) {
  const std = resolveStandard(field, cat.division);
  const override = api.getThresholdOverride(field.key) || {};
  const row = el('div', { class: 'std-row' });

  // Kepala: nama + sumber
  const sumberBadge = el('span', { class: 'std-sumber ' + (std.sumber === 'kalibrasi' ? 'src-kalibrasi' : 'src-buku') },
    std.sumber === 'kalibrasi' ? `kalibrasi${std.sumberTgl ? ' · ' + std.sumberTgl : ''}` : 'buku');
  row.appendChild(el('div', { class: 'std-head' }, [
    el('div', { class: 'font-medium' }, [field.label, field.unit ? el('span', { class: 'field-unit' }, field.unit) : null]),
    sumberBadge,
  ]));

  // Batas
  const boundsWrap = el('div', { class: 'std-bounds' });
  const inputs = {};
  for (const [key, label] of NUM_BOUNDS) {
    if (canEdit) {
      const inp = el('input', { class: 'field-input', type: 'number', step: 'any', value: std[key] ?? '', style: 'max-width:96px' });
      inputs[key] = inp;
      boundsWrap.appendChild(el('label', { class: 'std-bound' }, [el('span', { class: 'std-bound-label' }, label), inp]));
    } else {
      boundsWrap.appendChild(el('div', { class: 'std-bound' }, [
        el('span', { class: 'std-bound-label' }, label),
        el('span', { class: 'num' }, std[key] == null ? '—' : String(std[key])),
      ]));
    }
  }
  row.appendChild(boundsWrap);

  // Tindakan + Kontak
  const tindakanInput = canEdit
    ? el('input', { class: 'field-input', value: std.tindakan, placeholder: 'Tindakan saat batas terlampaui' })
    : null;
  const kontakSelect = canEdit
    ? el('select', { class: 'field-input', style: 'max-width:200px' },
        KONTAK_ROLES.map((r) => el('option', { value: r, selected: std.kontakRole === r ? '' : null }, auth.roleLabelOf(r))))
    : null;

  row.appendChild(el('div', { class: 'std-action' }, [
    el('div', { class: 'std-action-line' }, [
      el('span', { class: 'std-mini-label' }, '→ Tindakan'),
      canEdit ? tindakanInput : el('span', { class: 'std-action-text' }, std.tindakan),
    ]),
    el('div', { class: 'std-action-line' }, [
      el('span', { class: 'std-mini-label' }, 'Hubungi'),
      canEdit ? kontakSelect : el('span', { class: 'chip chip-muted' }, auth.roleLabelOf(std.kontakRole)),
    ]),
  ]));

  if (!canEdit) return row;

  // Aksi (Kabag Lab): Simpan / Reset / Kalibrasi
  const note = el('span', { class: 'text-xs muted ml-1' });
  const calibWrap = el('div', { class: 'std-calib' });

  const saveBtn = el('button', { class: 'btn btn-ghost btn-sm', onClick: () => {
    const patch = { tindakan: tindakanInput.value.trim(), kontakRole: kontakSelect.value, sumber: 'buku', sumberTgl: null };
    for (const [key] of NUM_BOUNDS) patch[key] = inputs[key].value === '' ? null : Number(inputs[key].value);
    api.patchStandard(field.key, patch);
    note.textContent = 'Tersimpan';
    setTimeout(rebuild, 500);
  } }, 'Simpan');

  const resetBtn = el('button', { class: 'btn btn-ghost btn-sm', onClick: () => {
    api.clearStandard(field.key);
    rebuild();
  } }, 'Reset');

  const calibBtn = el('button', { class: 'btn btn-ghost btn-sm', onClick: () => {
    clear(calibWrap);
    calibWrap.appendChild(renderCalibration(cat, field, rebuild));
  } }, '📈 Kalibrasi dari data');

  row.appendChild(el('div', { class: 'std-buttons' }, [saveBtn, resetBtn, calibBtn, note]));
  row.appendChild(calibWrap);
  return row;
}

/* Kalibrasi: usulkan batas dari data siklus BERHASIL untuk field ini. */
function renderCalibration(cat, field, rebuild) {
  const successIds = api.list('tank').filter((t) => t.hasilSiklus === 'Berhasil').map((t) => t.id);
  const recs = api.list(cat.collection).filter((r) => !r.tankId || successIds.includes(r.tankId));
  const values = recs
    .map((r) => (field.type === 'computed' ? computeField(field, r) : r[field.key]))
    .filter((v) => v != null && v !== '');
  const res = suggestBounds(values, field);

  const box = el('div', { class: 'calib-box' });
  if (!res || res.stats.n === 0) {
    box.appendChild(el('div', { class: 'text-sm muted' }, 'Belum ada data dari siklus berhasil untuk parameter ini. Tandai tank sebagai "Berhasil" di Master Tank lebih dulu.'));
    return box;
  }
  const s = res.stats;
  box.appendChild(el('div', { class: 'text-sm mb-2' }, [
    el('strong', {}, `Sebaran ${s.n} data siklus berhasil: `),
    `min ${fmt(s.min)} · p10 ${fmt(s.p10)} · median ${fmt(s.p50)} · p90 ${fmt(s.p90)} · maks ${fmt(s.max)} (rerata ${fmt(s.mean)} ± ${fmt(s.sd)})`,
  ]));
  if (s.n < 20) box.appendChild(el('div', { class: 'calib-warn' }, `⚠ Data masih sedikit (n=${s.n}); usulan batas bersifat sementara. Kumpulkan lebih banyak siklus untuk kalibrasi yang andal.`));

  const usul = res.bounds;
  box.appendChild(el('div', { class: 'text-sm mt-2 mb-1 font-medium' }, 'Usulan batas (persentil):'));
  box.appendChild(el('div', { class: 'std-bounds' },
    NUM_BOUNDS.filter(([k]) => usul[k] != null).map(([k, label]) =>
      el('div', { class: 'std-bound' }, [el('span', { class: 'std-bound-label' }, label), el('span', { class: 'num' }, String(usul[k]))]))));

  box.appendChild(el('button', { class: 'btn btn-approve btn-sm mt-2', onClick: () => {
    api.patchStandard(field.key, { ...usul, sumber: 'kalibrasi', sumberTgl: today() });
    rebuild();
  } }, 'Terapkan sebagai standar'));
  return box;
}
