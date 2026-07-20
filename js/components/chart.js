/* ===========================================================================
   chart.js — pembungkus Chart.js untuk tren time-series.
   Menggambar satu grafik per field di `category.chart`, satu garis per tank,
   plus garis batas aman (kuning) & bahaya (merah) bila ada.
   =========================================================================== */

import { el } from '../dom.js';
import { computeField } from '../compute.js';
import { resolveThreshold } from '../alerts.js';
import * as api from '../api.js';

const PALETTE = ['#2563eb', '#e0902a', '#6d6bd6', '#0ea5a3', '#c65b7c', '#57a04a'];
// Bentuk titik berbeda per seri → pembeda tambahan bagi pengguna buta warna
const POINT_STYLES = ['circle', 'triangle', 'rectRot', 'rect', 'star', 'crossRot'];

function toNum(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function valueOf(field, rec) {
  return field.type === 'computed' ? computeField(field, rec) : toNum(rec[field.key]);
}

function fieldChartCard(category, field, records, dates, tanks) {
  const card = el('div', { class: 'card p-4' });
  card.appendChild(el('h3', { class: 'text-sm font-semibold mb-3' }, [
    field.label, field.unit ? el('span', { class: 'field-unit' }, field.unit) : null,
  ]));
  const canvas = el('canvas', { height: '180' });
  card.appendChild(el('div', { style: 'position:relative;height:220px' }, canvas));

  const labels = dates.map((d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
  const single = tanks.length === 1;
  const datasets = [];

  tanks.forEach((tankId, i) => {
    const color = PALETTE[i % PALETTE.length];
    const data = dates.map((d) => {
      const rec = records.find((r) => r.tanggal === d && (tankId == null || r.tankId === tankId));
      return rec ? valueOf(field, rec) : null;
    });
    datasets.push({
      label: tankId ? (api.refLabel('tank', tankId, 'namaTank') || tankId) : category.title,
      data, borderColor: color, backgroundColor: color + '1f',
      tension: 0.35, spanGaps: true, borderWidth: 2.5,
      pointStyle: POINT_STYLES[i % POINT_STYLES.length],
      pointRadius: 2.6, pointHoverRadius: 6, pointBackgroundColor: color, pointBorderColor: '#fff', pointBorderWidth: 1.5,
      fill: single,
    });
  });

  // Garis batas (halus)
  const t = resolveThreshold(field);
  const refLine = (val, color) => ({
    label: '', data: dates.map(() => val), borderColor: color, borderDash: [4, 5],
    borderWidth: 1.25, pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0,
  });
  if (t.safeMax != null) datasets.push(refLine(t.safeMax, '#d99b12'));
  if (t.dangerMax != null) datasets.push(refLine(t.dangerMax, '#e5455f'));
  if (t.safeMin != null) datasets.push(refLine(t.safeMin, '#d99b12'));
  if (t.dangerMin != null) datasets.push(refLine(t.dangerMin, '#e5455f'));

  new window.Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 4 } },
      plugins: {
        legend: {
          display: tanks.length > 1 && tanks[0] != null,
          labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 14, font: { size: 11, family: "'Source Sans 3'" }, color: '#475569', filter: (it) => it.text !== '' },
        },
        tooltip: {
          backgroundColor: '#142a4a', padding: 10, cornerRadius: 8, titleFont: { size: 12 }, bodyFont: { size: 12 },
          usePointStyle: true, callbacks: { title: (items) => items[0]?.label },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
        y: { beginAtZero: false, border: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 5 }, grid: { color: '#eef2f6' } },
      },
    },
  });
  return card;
}

// Grafik tren untuk sebuah kategori (dipakai view kategori & dashboard)
export function renderCategoryTrends(category, records) {
  const fields = (category.chart || [])
    .map((k) => category.fields.find((f) => f.key === k))
    .filter(Boolean);
  if (!fields.length || !records.length) return null;

  const dates = [...new Set(records.map((r) => r.tanggal).filter(Boolean))].sort();
  if (dates.length < 2) return null;
  const tanks = category.traceKey ? [...new Set(records.map((r) => r.tankId).filter(Boolean))] : [null];

  const wrap = el('div', { class: 'grid grid-cols-1 lg:grid-cols-2 gap-4' });
  for (const field of fields) wrap.appendChild(fieldChartCard(category, field, records, dates, tanks));
  return wrap;
}
