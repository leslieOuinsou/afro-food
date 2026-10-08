import test from 'node:test';
import assert from 'node:assert/strict';
import { FIDELITE_DEFAUT, codeFidelite, pointsPourMontant } from '../utils/fidelite.js';

test('points : 1 point par euro, arrondi à l’entier inférieur', () => {
  assert.equal(pointsPourMontant(46.09, 1), 46);
  assert.equal(pointsPourMontant(19.99, 2), 39);
  assert.equal(pointsPourMontant(0.5, 1), 0);
  assert.equal(pointsPourMontant(-5, 1), 0);
});

test('paliers par défaut triés et cohérents', () => {
  const p = FIDELITE_DEFAUT.paliers;
  assert.ok(p.every((x, i) => i === 0 || x.points > p[i - 1].points));
  assert.ok(p.every((x, i) => i === 0 || x.remise / x.points >= p[i - 1].remise / p[i - 1].points), 'le taux de remise ne baisse pas');
});

test('code de fidélité : préfixe et caractères non ambigus', () => {
  for (let i = 0; i < 40; i += 1) assert.match(codeFidelite(), /^FIDELE-[A-HJ-NP-Z2-9]{6}$/);
});
