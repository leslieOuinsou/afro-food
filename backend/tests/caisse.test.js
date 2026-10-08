import test from 'node:test';
import assert from 'node:assert/strict';
import { controlerEncaissement, syntheseLivreur, genererCodeRemise } from '../utils/caisse.js';

const cmd = { total: 25.5, codeRemise: '0420' };

test('code à 4 chiffres', () => {
  for (let i = 0; i < 50; i += 1) assert.match(genererCodeRemise(), /^\d{4}$/);
});

test('refuse un mauvais code', () => {
  const r = controlerEncaissement(cmd, { codeRemise: '1111', montantEncaisse: 25.5 });
  assert.equal(r.ok, false);
});

test('refuse sans montant', () => {
  assert.equal(controlerEncaissement(cmd, { codeRemise: '0420' }).ok, false);
});

test('accepte le montant exact', () => {
  const r = controlerEncaissement(cmd, { codeRemise: '0420', montantEncaisse: 25.5 });
  assert.deepEqual([r.ok, r.montant, r.ecart, r.raison], [true, 25.5, 0, null]);
});

test('écart sans raison refusé, avec raison accepté', () => {
  assert.equal(controlerEncaissement(cmd, { codeRemise: '0420', montantEncaisse: 20 }).ok, false);
  const r = controlerEncaissement(cmd, { codeRemise: '0420', montantEncaisse: 20, raisonEcart: 'Pas de monnaie' });
  assert.equal(r.ok, true);
  assert.equal(r.ecart, -5.5);
});

test('admin sans code exigé', () => {
  assert.equal(controlerEncaissement(cmd, { montantEncaisse: 25.5 }, { exigerCode: false }).ok, true);
});

test('synthèse : alerte après 48 h et plafond', () => {
  const now = new Date('2026-10-08T12:00:00Z');
  const vieux = { especesEncaissees: 100, especesEncaisseLe: new Date('2026-10-06T08:00:00Z') };
  const recent = { especesEncaissees: 60, especesEncaisseLe: new Date('2026-10-08T10:00:00Z') };
  const s = syntheseLivreur([vieux, recent], now);
  assert.equal(s.solde, 160);
  assert.equal(s.alerte, true);
  assert.equal(s.plafondAtteint, true);
  assert.equal(syntheseLivreur([recent], now).alerte, false);
  assert.equal(syntheseLivreur([], now).solde, 0);
});
