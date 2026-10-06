import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidId, serialize, serializePlat, serializeCommande } from '../utils/serialize.js';

test('isValidId accepte cuid et uuid, refuse le reste', () => {
  assert.equal(isValidId('cmg8x2k4a0000abcdefghijkl'), true);
  assert.equal(isValidId('3f2504e0-4f89-41d3-9a0c-0305e82c3301'), true);
  assert.equal(isValidId('507f1f77bcf86cd799439011'), false); // ancien ObjectId
  assert.equal(isValidId('abc'), false);
  assert.equal(isValidId(''), false);
  assert.equal(isValidId(undefined), false);
  assert.equal(isValidId('../../etc/passwd-xxxxxxxxxx'), false);
});

test('serialize ajoute _id et masque les champs sensibles', () => {
  const out = serialize({ id: 'u1', email: 'a@b.c', motDePasse: 'hash', tokenResetMotDePasse: 't' });
  assert.equal(out._id, 'u1');
  assert.equal(out.motDePasse, undefined);
  assert.equal(out.tokenResetMotDePasse, undefined);
});

test('serializePlat calcule la promotion', () => {
  const p = serializePlat({ id: 'p', prix: 10, prixPromo: 8 });
  assert.equal(p.enPromotion, true);
  assert.equal(p.prixEffectif, 8);
  assert.equal(p.pourcentageReduction, 20);
  assert.equal(serializePlat({ id: 'p', prix: 10, prixPromo: null }).enPromotion, false);
});

test('serializeCommande : annulable seulement < 30 min et statut précoce', () => {
  const recent = { id: 'c', statut: 'en_attente', createdAt: new Date(), dates: {} };
  const ancien = { ...recent, createdAt: new Date(Date.now() - 3600_000) };
  const livree = { ...recent, statut: 'livree' };
  assert.equal(serializeCommande(recent).peutEtreAnnulee, true);
  assert.equal(serializeCommande(ancien).peutEtreAnnulee, false);
  assert.equal(serializeCommande(livree).peutEtreAnnulee, false);
});
