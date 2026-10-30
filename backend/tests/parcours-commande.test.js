/**
 * Smoke test du parcours logique commande (sans HTTP) :
 * transitions de statut + allergènes heuristique.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const TRANSITIONS = {
  en_attente: ['confirmee', 'annulee'],
  confirmee: ['en_preparation', 'annulee'],
  en_preparation: ['prete', 'annulee'],
  prete: ['en_livraison', 'annulee'],
  en_livraison: ['livree', 'annulee'],
  livree: ['remboursee'],
};

function peutPasser(de, vers) {
  return (TRANSITIONS[de] || []).includes(vers);
}

function conflitAllergies(allergiesClient, allergenesPlat) {
  const a = allergiesClient.map((x) => x.toLowerCase());
  const p = allergenesPlat.map((x) => x.toLowerCase());
  return a.filter((x) => p.some((y) => y.includes(x) || x.includes(y)));
}

describe('parcours commande', () => {
  it('autorise le chemin happy path', () => {
    const chemin = ['en_attente', 'confirmee', 'en_preparation', 'prete', 'en_livraison', 'livree'];
    for (let i = 0; i < chemin.length - 1; i += 1) {
      assert.equal(peutPasser(chemin[i], chemin[i + 1]), true);
    }
  });

  it('refuse un saut illégal', () => {
    assert.equal(peutPasser('en_attente', 'livree'), false);
  });

  it('détecte un conflit allergène arachide', () => {
    const hit = conflitAllergies(['arachide'], ['arachides', 'gluten']);
    assert.ok(hit.includes('arachide'));
  });

  it('passe si aucun allergène commun', () => {
    assert.deepEqual(conflitAllergies(['lactose'], ['gluten']), []);
  });
});
