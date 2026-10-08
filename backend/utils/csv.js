/** Cellule CSV sûre : guillemets doublés, et neutralisation des formules (=, +, -, @) pour Excel / Sheets. */
export function cellule(v) {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV avec séparateur « ; » et BOM UTF-8 : s'ouvre directement dans Excel en français. */
export function versCsv(entetes, lignes) {
  const corps = [entetes, ...lignes].map((l) => l.map(cellule).join(';')).join('\r\n');
  return `﻿${corps}\r\n`;
}

export const nombreFr = (n) => String(Math.round(Number(n || 0) * 100) / 100).replace('.', ',');
