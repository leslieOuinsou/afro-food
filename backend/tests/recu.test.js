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

test('une signature personnalisée est intégrée et reste reproductible', async () => {
  const QRCode = (await import('qrcode')).default;
  const image = await QRCode.toBuffer('signature-test', { margin: 0, width: 120 }); // PNG quelconque
  const sig = { image, nom: 'Leslie Ouinsou', fonction: 'Gérante' };
  const a = await genererRecuPdf(commande, stripe, sig);
  const b = await genererRecuPdf(commande, stripe, sig);
  assert.ok(a.equals(b));
  assert.ok(!a.equals(await genererRecuPdf(commande, stripe)), 'différent de la signature par défaut');
});

test('décodage de signature : PNG uniquement', async () => {
  const { decoderPng } = await import('../utils/signature.js');
  const QRCode = (await import('qrcode')).default;
  const png = await QRCode.toBuffer('x', { margin: 0, width: 50 });
  assert.ok(decoderPng(`data:image/png;base64,${png.toString('base64')}`).length > 24);
  assert.throws(() => decoderPng('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='));
  assert.throws(() => decoderPng(`data:image/png;base64,${Buffer.from('<html>pas un png...........').toString('base64')}`));
});
