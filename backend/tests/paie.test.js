import test from 'node:test';
import assert from 'node:assert/strict';
import { agregerJournees, jourParis, minutesEntre, montantPourMinutes } from '../utils/paie.js';

test('9 €/h : 8 h = 72 €, 7 h 30 = 67,50 €, 1 minute arrondie au centime', () => {
  assert.equal(montantPourMinutes(480, 9), 72);
  assert.equal(montantPourMinutes(450, 9), 67.5);
  assert.equal(montantPourMinutes(1, 9), 0.15);
  assert.equal(montantPourMinutes(0, 9), 0);
});

test('minutes entre deux dates, bornées à 14 h', () => {
  assert.equal(minutesEntre('2026-10-08T08:00:00Z', '2026-10-08T12:30:00Z'), 270);
  assert.equal(minutesEntre('2026-10-08T08:00:00Z', '2026-10-09T08:00:00Z'), 14 * 60);
  assert.equal(minutesEntre('2026-10-08T10:00:00Z', '2026-10-08T09:00:00Z'), 0);
});

test('jour de Paris (minuit local)', () => {
  assert.equal(jourParis('2026-10-08T21:59:00Z'), '2026-10-08'); // 23 h 59 à Paris (UTC+2)
  assert.equal(jourParis('2026-10-08T22:01:00Z'), '2026-10-09'); // 00 h 01 le lendemain
});

test('journée : heures à payer, déjà payées, session en cours, livraisons', () => {
  const pointages = [
    { livreurId: 'a', jour: '2026-10-08', debut: '2026-10-08T08:00:00Z', fin: '2026-10-08T12:00:00Z', paieId: null },
    { livreurId: 'a', jour: '2026-10-08', debut: '2026-10-08T13:00:00Z', fin: '2026-10-08T15:30:00Z', paieId: 'p1' },
    { livreurId: 'a', jour: '2026-10-08', debut: '2026-10-08T16:00:00Z', fin: null, paieId: null },
    { livreurId: 'b', jour: '2026-10-07', debut: '2026-10-07T08:00:00Z', fin: '2026-10-07T10:00:00Z', paieId: null },
  ];
  const livraisons = [
    { livreurId: 'a', jour: '2026-10-08' },
    { livreurId: 'a', jour: '2026-10-08' },
    { livreurId: 'b', jour: '2026-10-07' },
  ];
  const j = agregerJournees(pointages, livraisons, 9);
  assert.equal(j.length, 2);
  const a = j.find((x) => x.livreurId === 'a');
  assert.deepEqual([a.minutesAPayer, a.minutesPayees, a.enCours, a.nbLivraisons, a.montantAPayer], [240, 150, true, 2, 36]);
  assert.equal(j.find((x) => x.livreurId === 'b').montantAPayer, 18);
  assert.equal(j[0].jour, '2026-10-08', 'jours les plus récents d’abord');
});
