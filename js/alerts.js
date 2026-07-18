/* ===========================================================================
   alerts.js — mesin evaluasi batas.
   Mengubah sebuah nilai + threshold menjadi status: aman | waspada | bahaya.
   Batas efektif = default schema DITIMPA override dari api (view Batas).
   =========================================================================== */

import { CATEGORIES } from './schema.js';
import { computeField, num } from './compute.js';
import * as api from './api.js';

// Field yang dipantau: punya threshold, atau field PCR (Positif = bahaya)
export function isMonitored(field) {
  return !!field.threshold || field.type === 'pcr';
}
function monitoredFields(category) {
  return category.fields.filter(isMonitored);
}

export const STATUS_META = {
  aman:    { label: 'Aman',    order: 0 },
  waspada: { label: 'Waspada', order: 1 },
  bahaya:  { label: 'Bahaya',  order: 2 },
  none:    { label: '—',       order: -1 },
};

// Batas efektif untuk sebuah field (default + override tersimpan)
export function resolveThreshold(field) {
  const override = api.getThresholdOverride(field.key);
  let base = field.threshold || {};
  // Field PCR tanpa batas eksplisit: Positif dianggap bahaya
  if (!field.threshold && field.type === 'pcr') base = { badValues: ['Positif'] };
  return { ...base, ...(override || {}) };
}

/* Evaluasi satu nilai terhadap threshold.
   Numerik : safeMin/safeMax/dangerMin/dangerMax.
   Kategori: badValues (→ bahaya), warnValues (→ waspada). */
export function evaluate(value, t) {
  if (!t) return 'none';

  // Kategori (nilai teks)
  if (t.badValues || t.warnValues) {
    if (value == null || value === '') return 'none';
    if (t.badValues && t.badValues.includes(value)) return 'bahaya';
    if (t.warnValues && t.warnValues.includes(value)) return 'waspada';
    return 'aman';
  }

  const v = num(value);
  if (Number.isNaN(v)) return 'none';
  if (t.dangerMax != null && v > t.dangerMax) return 'bahaya';
  if (t.dangerMin != null && v < t.dangerMin) return 'bahaya';
  if (t.safeMax != null && v > t.safeMax) return 'waspada';
  if (t.safeMin != null && v < t.safeMin) return 'waspada';
  return 'aman';
}

// Status sebuah field pada sebuah record (menangani field computed)
export function evalField(field, record) {
  const t = resolveThreshold(field);
  const value = field.type === 'computed' ? computeField(field, record) : record[field.key];
  return evaluate(value, t);
}

const rank = (s) => STATUS_META[s]?.order ?? -1;

/* Pindai peringatan aktif = status pembacaan TERBARU per tank per kategori
   (bukan mengulang tiap hari). opts.days: abaikan data lebih lama dari N hari. */
export function scanAlerts(opts = {}) {
  const days = opts.days ?? 10;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const alerts = [];

  for (const cat of CATEGORIES) {
    const fields = monitoredFields(cat);
    if (!fields.length) continue;

    // api.list terurut terbaru dulu → ambil record teratas per tank (atau 'all')
    const latest = new Map();
    for (const rec of api.list(cat.collection)) {
      const key = rec.tankId || 'all';
      if (!latest.has(key)) latest.set(key, rec);
    }

    for (const rec of latest.values()) {
      if (rec.tanggal) {
        const d = new Date(rec.tanggal);
        if (!Number.isNaN(d.getTime()) && d < cutoff) continue;
      }
      for (const field of fields) {
        const status = evalField(field, rec);
        if (status === 'waspada' || status === 'bahaya') {
          const value = field.type === 'computed' ? computeField(field, rec) : rec[field.key];
          alerts.push({
            categoryId: cat.id,
            categoryTitle: cat.title,
            code: cat.code,
            field: field.label,
            fieldKey: field.key,
            unit: field.unit || '',
            value,
            status,
            tankId: rec.tankId || null,
            tanggal: rec.tanggal || null,
            recordId: rec.id,
          });
        }
      }
    }
  }

  alerts.sort((a, b) => {
    if (rank(b.status) !== rank(a.status)) return rank(b.status) - rank(a.status);
    return String(b.tanggal || '').localeCompare(String(a.tanggal || ''));
  });
  return alerts;
}

// Ringkasan jumlah per status (untuk kartu dashboard)
export function alertCounts(alerts) {
  return alerts.reduce(
    (acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; },
    { waspada: 0, bahaya: 0 }
  );
}
