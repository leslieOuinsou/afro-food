import test from 'node:test';
import assert from 'node:assert/strict';
import { envoyerEmailStatutCommande } from '../utils/email.js';

test('e-mail de statut : pas de notification pour en_attente', async () => {
  const r = await envoyerEmailStatutCommande('a@b.c', { statut: 'en_attente', numeroCommande: 'AF-1' });
  assert.equal(r.reason, 'statut_sans_notification');
});

test('e-mail de statut : sans SMTP, n’échoue pas', async () => {
  const log = console.log;
  console.log = () => {};
  try {
    const r = await envoyerEmailStatutCommande('a@b.c', { statut: 'livree', numeroCommande: 'AF-1' }, '<b>x</b>');
    assert.equal(r.sent, false);
  } finally {
    console.log = log;
  }
});
