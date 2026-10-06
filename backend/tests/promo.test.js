import test from 'node:test';
import assert from 'node:assert/strict';
import { promoEstValide, calculerRemise } from '../utils/promo.js';

const base = {
  actif: true,
  typeRemise: 'pourcentage',
  valeur: 10,
  montantMax: null,
  dateDebut: new Date('2026-01-01'),
  dateFin: null,
  utilisationsMax: null,
  utilisations: 0,
};
const maintenant = new Date('2026-06-01');

test('promo valide', () => assert.equal(promoEstValide(base, maintenant), true));
test('promo absente ou inactive', () => {
  assert.equal(promoEstValide(null, maintenant), false);
  assert.equal(promoEstValide({ ...base, actif: false }, maintenant), false);
});
test('promo pas encore commencée ou expirée', () => {
  assert.equal(promoEstValide({ ...base, dateDebut: new Date('2026-07-01') }, maintenant), false);
  assert.equal(promoEstValide({ ...base, dateFin: new Date('2026-05-01') }, maintenant), false);
});
test('promo épuisée', () => {
  assert.equal(promoEstValide({ ...base, utilisationsMax: 5, utilisations: 5 }, maintenant), false);
  assert.equal(promoEstValide({ ...base, utilisationsMax: 5, utilisations: 4 }, maintenant), true);
});

test('remise pourcentage plafonnée', () => {
  assert.equal(calculerRemise(base, 50), 5);
  assert.equal(calculerRemise({ ...base, montantMax: 3 }, 50), 3);
});
test('remise fixe jamais supérieure au sous-total', () => {
  const fixe = { ...base, typeRemise: 'fixe', valeur: 20 };
  assert.equal(calculerRemise(fixe, 12.5), 12.5);
  assert.equal(calculerRemise(fixe, 100), 20);
});
test('remise arrondie au centime', () => assert.equal(calculerRemise(base, 33.33), 3.33));

// ---------- evaluerPromo : conditions ----------
import { evaluerPromo, decrirePromo } from '../utils/promo.js';

const ctx = {
  sousTotal: 40,
  fraisLivraison: 3.9,
  lignes: [
    { categorie: 'plats-principaux', sousTotal: 30 },
    { categorie: 'boissons', sousTotal: 10 },
  ],
  nbCommandesClient: 0,
  nbUsagesClient: 0,
  maintenant,
};

test('évalue : cas nominal', () => {
  const r = evaluerPromo(base, ctx);
  assert.equal(r.ok, true);
  assert.equal(r.remise, 4);
});

test('évalue : code inconnu / inactif / expiré / épuisé', () => {
  assert.equal(evaluerPromo(null, ctx).raison, 'introuvable');
  assert.equal(evaluerPromo({ ...base, actif: false }, ctx).raison, 'inactif');
  assert.equal(evaluerPromo({ ...base, dateFin: new Date('2026-05-01') }, ctx).raison, 'expire');
  assert.equal(evaluerPromo({ ...base, dateDebut: new Date('2026-07-01') }, ctx).raison, 'pas_commence');
  assert.equal(evaluerPromo({ ...base, utilisationsMax: 1, utilisations: 1 }, ctx).raison, 'epuise');
});

test('évalue : montant minimum', () => {
  const promo = { ...base, montantMinimum: 50 };
  const r = evaluerPromo(promo, ctx);
  assert.equal(r.raison, 'minimum');
  assert.match(r.message, /50,00 €/);
  assert.match(r.message, /10,00 €/); // il manque 10 €
  assert.equal(evaluerPromo(promo, { ...ctx, sousTotal: 50 }).ok, true);
  assert.equal(evaluerPromo({ ...base, montantMinimum: 40 }, ctx).ok, true); // égal = accepté
});

test('évalue : première commande uniquement', () => {
  const promo = { ...base, premiereCommandeSeulement: true };
  assert.equal(evaluerPromo(promo, ctx).ok, true);
  assert.equal(evaluerPromo(promo, { ...ctx, nbCommandesClient: 1 }).raison, 'premiere_commande');
});

test('évalue : usage par client', () => {
  const promo = { ...base, usageParClient: 2 };
  assert.equal(evaluerPromo(promo, { ...ctx, nbUsagesClient: 1 }).ok, true);
  assert.equal(evaluerPromo(promo, { ...ctx, nbUsagesClient: 2 }).raison, 'deja_utilise');
  assert.match(evaluerPromo({ ...base, usageParClient: 1 }, { ...ctx, nbUsagesClient: 1 }).message, /déjà utilisé/);
});

test('évalue : restriction par catégories (casse ignorée) sur la base éligible', () => {
  const promo = { ...base, categories: ['Boissons'] };
  const r = evaluerPromo(promo, ctx);
  assert.equal(r.ok, true);
  assert.equal(r.remise, 1); // 10 % de 10 € de boissons seulement
  assert.equal(evaluerPromo({ ...base, categories: ['desserts'] }, ctx).raison, 'categories');
});

test('évalue : livraison offerte', () => {
  const promo = { ...base, typeRemise: 'livraison', valeur: 0 };
  assert.equal(evaluerPromo(promo, ctx).remise, 3.9);
  assert.equal(evaluerPromo(promo, { ...ctx, fraisLivraison: 0 }).raison, 'livraison_deja_offerte');
});

test('décrit les conditions pour le client', () => {
  const lignes = decrirePromo({
    ...base,
    montantMax: 10,
    montantMinimum: 25,
    premiereCommandeSeulement: true,
    categories: ['boissons'],
  });
  assert.equal(lignes.length, 4);
  assert.match(lignes[0], /10 % de remise \(plafonnée à 10,00 €\)/);
  assert.ok(lignes.includes('Première commande uniquement'));
});
