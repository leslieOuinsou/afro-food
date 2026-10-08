import test from 'node:test';
import assert from 'node:assert/strict';
import { codeVerification, genererRecuPdf } from '../utils/recuPaiement.js';

const commande = { numeroCommande: 'AF-1', total: 25.5, informationsClient: { prenom: 'A', nom: 'B' } };
const stripe = { reference: 'cs_test_123', payeLe: '2026-10-08T09:00:00.000Z' };

test('le justificatif est identique à chaque génération (empreinte vérifiable)', async () => {
  const a = await genererRecuPdf(commande, stripe);
  await new Promise((r) => setTimeout(r, 1100));
  const b = await genererRecuPdf(commande, stripe);
  assert.ok(a.equals(b));
});

test('un autre paiement ou montant produit un fichier différent', async () => {
  const a = await genererRecuPdf(commande, stripe);
  assert.ok(!a.equals(await genererRecuPdf({ ...commande, total: 30 }, stripe)));
  assert.ok(!a.equals(await genererRecuPdf(commande, { ...stripe, reference: 'cs_test_autre' })));
});

test('le code de vérification dépend de la commande, du montant et du paiement', () => {
  const c = codeVerification(commande, 'cs_1');
  assert.match(c, /^[0-9A-F]{12}$/);
  assert.notEqual(c, codeVerification({ ...commande, total: 26 }, 'cs_1'));
  assert.notEqual(c, codeVerification(commande, 'cs_2'));
});
