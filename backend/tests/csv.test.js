import test from 'node:test';
import assert from 'node:assert/strict';
import { cellule, nombreFr, versCsv } from '../utils/csv.js';

test('CSV : guillemets, séparateur et retours à la ligne protégés', () => {
  assert.equal(cellule('a;b'), '"a;b"');
  assert.equal(cellule('dit "oui"'), '"dit ""oui"""');
  assert.equal(cellule(null), '');
  assert.equal(cellule(12.5), '12.5');
});

test('CSV : les formules sont neutralisées', () => {
  assert.equal(cellule('=SOMME(A1:A9)'), "'=SOMME(A1:A9)");
  assert.equal(cellule('+33 6 12'), "'+33 6 12");
  assert.equal(cellule('@cmd'), "'@cmd");
});

test('CSV : BOM, séparateur ; et décimale française', () => {
  const c = versCsv(['A', 'B'], [['x', nombreFr(12.345)]]);
  assert.ok(c.startsWith('﻿'));
  assert.ok(c.includes('A;B\r\nx;12,35'));
});
