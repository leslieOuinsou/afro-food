import test from 'node:test';
import assert from 'node:assert/strict';
import { jetonDesabonnement, jetonValide, nettoyerArticles } from '../utils/panier.js';

test('jeton de désabonnement : propre à l’utilisateur et infalsifiable', () => {
  const t = jetonDesabonnement('user1');
  assert.ok(jetonValide('user1', t));
  assert.ok(!jetonValide('user2', t));
  assert.ok(!jetonValide('user1', 'x'.repeat(32)));
  assert.ok(!jetonValide('user1', ''));
});

test('nettoyage du panier : articles invalides ignorés, valeurs bornées', () => {
  const r = nettoyerArticles([
    { id: 'a', nom: 'Ndolé', prixUnitaire: 14.567, quantite: 2, image: 'https://x/y.jpg' },
    { id: '', nom: 'sans id', prixUnitaire: 5, quantite: 1 },
    { id: 'b', nom: 'qté 0', prixUnitaire: 5, quantite: 0 },
    { id: 'c', nom: 'prix négatif', prixUnitaire: -1, quantite: 1 },
    { id: 'd', nom: 'gros', prixUnitaire: 1, quantite: 500, image: 'javascript:alert(1)' },
  ]);
  assert.equal(r.length, 2);
  assert.equal(r[0].prixUnitaire, 14.57);
  assert.equal(r[1].quantite, 99);
  assert.equal(r[1].image, '');
  assert.deepEqual(nettoyerArticles('pas un tableau'), []);
  assert.equal(nettoyerArticles(Array.from({ length: 50 }, (_, i) => ({ id: `i${i}`, nom: 'x', prixUnitaire: 1, quantite: 1 }))).length, 30);
});
