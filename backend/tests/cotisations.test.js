import test from 'node:test';
import assert from 'node:assert/strict';
import { calculerBulletin } from '../utils/cotisations.js';

test('bulletin simplifié : cotisations, net et coût employeur', () => {
  const r = calculerBulletin(1000, { tauxSalarial: 22, tauxPatronal: 42 });
  assert.deepEqual(r, { brut: 1000, cotisationsSalariales: 220, netAvantImpot: 780, cotisationsPatronales: 420, coutEmployeur: 1420 });
  const p = calculerBulletin(184.5, { tauxSalarial: 22, tauxPatronal: 42 });
  assert.equal(p.cotisationsSalariales, 40.59);
  assert.equal(p.netAvantImpot, 143.91);
  assert.equal(calculerBulletin(100, { tauxSalarial: 0, tauxPatronal: 0 }).netAvantImpot, 100);
});
