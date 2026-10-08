import test from 'node:test';
import assert from 'node:assert/strict';
import { choisirLivreur, distanceKm } from '../utils/attribution.js';
import { PRIMES_DEFAUT, calculerPrime } from '../utils/primes.js';

const paris = { lat: 48.8566, lng: 2.3522 };
const lyon = { lat: 45.764, lng: 4.8357 };

test('distance : Paris-Lyon ≈ 392 km, même point = 0', () => {
  assert.ok(Math.abs(distanceKm(paris, lyon) - 392) < 5);
  assert.equal(distanceKm(paris, paris), 0);
});

test('attribution : le moins chargé gagne, puis le plus proche', () => {
  const dest = { lat: 48.87, lng: 2.35 };
  const c = [
    { id: 'a', charge: 2, position: { lat: 48.87, lng: 2.35 } },
    { id: 'b', charge: 0, position: lyon },
    { id: 'c', charge: 0, position: { lat: 48.86, lng: 2.36 } },
  ];
  assert.equal(choisirLivreur(c, dest).id, 'c'); // charge 0 et plus proche que b
  assert.equal(choisirLivreur(c.slice(0, 2), dest).id, 'b'); // b moins chargé malgré la distance
});

test('attribution : sans position, départage par charge puis identifiant', () => {
  assert.equal(choisirLivreur([{ id: 'z', charge: 1, position: null }, { id: 'a', charge: 1, position: null }], null).id, 'a');
  assert.equal(choisirLivreur([], null), null);
  assert.equal(choisirLivreur([{ id: 'x', charge: 0, position: null }, { id: 'y', charge: 0, position: paris }], paris).id, 'y');
});

test('primes : palier de livraisons et bonus avis', () => {
  assert.equal(calculerPrime(PRIMES_DEFAUT, { nbLivraisons: 5, notes: [] }).prime, 0);
  assert.equal(calculerPrime(PRIMES_DEFAUT, { nbLivraisons: 8, notes: [] }).prime, 5);
  assert.equal(calculerPrime(PRIMES_DEFAUT, { nbLivraisons: 13, notes: [] }).prime, 12); // le plus haut palier, pas la somme
  const avecAvis = calculerPrime(PRIMES_DEFAUT, { nbLivraisons: 9, notes: [5, 5, 4] });
  assert.equal(avecAvis.prime, 8); // 5 + 3 (moyenne 4,67 ≥ 4,5)
  assert.match(avecAvis.detail, /note moyenne 4,7/);
  assert.equal(calculerPrime(PRIMES_DEFAUT, { nbLivraisons: 9, notes: [5, 4] }).prime, 5); // pas assez d'avis
  assert.equal(calculerPrime(PRIMES_DEFAUT, { nbLivraisons: 9, notes: [4, 4, 4] }).prime, 5); // moyenne trop basse
  assert.equal(calculerPrime({ ...PRIMES_DEFAUT, actif: false }, { nbLivraisons: 20, notes: [5, 5, 5] }).prime, 0);
});
