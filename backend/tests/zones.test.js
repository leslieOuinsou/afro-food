import test from 'node:test';
import assert from 'node:assert/strict';
import { CRENEAUX_DEFAUT, dateParis, evaluerLivraison, genererCreneaux, trouverZone } from '../utils/zones.js';

const config = {
  actif: true,
  zones: [
    { id: 'paris', nom: 'Paris', codesPostaux: ['75'], villes: [], frais: 2.9, minimumCommande: 15, gratuitDepuis: 40 },
    { id: 'proche', nom: 'Petite couronne', codesPostaux: ['92', '93', '94', '75019'], villes: ['Saint-Denis'], frais: 4.9, minimumCommande: 0, gratuitDepuis: null },
  ],
};
const defauts = { fraisStandard: 3.9, seuilGratuit: 30 };

test('zone : préfixe de code postal, le plus précis gagne, ville en secours', () => {
  assert.equal(trouverZone(config, { codePostal: '75010', ville: 'Paris' }).id, 'paris');
  assert.equal(trouverZone(config, { codePostal: '75019', ville: 'Paris' }).id, 'proche'); // 75019 plus précis que 75
  assert.equal(trouverZone(config, { codePostal: '99999', ville: 'saint denis' }).id, 'proche'); // ville sans accents/casse
  assert.equal(trouverZone(config, { codePostal: '13001', ville: 'Marseille' }), null);
});

test('livraison : tarif de zone, gratuité, minimum, hors zone', () => {
  assert.deepEqual([evaluerLivraison(config, { codePostal: '75010' }, 20, defauts).livrable, evaluerLivraison(config, { codePostal: '75010' }, 20, defauts).frais], [true, 2.9]);
  assert.equal(evaluerLivraison(config, { codePostal: '75010' }, 45, defauts).frais, 0); // gratuit dès 40 €
  const mini = evaluerLivraison(config, { codePostal: '75010' }, 10, defauts);
  assert.equal(mini.livrable, false);
  assert.match(mini.message, /minimum de 15,00 €/);
  assert.equal(evaluerLivraison(config, { codePostal: '92100' }, 35, defauts).frais, 0); // seuil global 30 €
  const hors = evaluerLivraison(config, { codePostal: '13001', ville: 'Marseille' }, 50, defauts);
  assert.equal(hors.livrable, false);
});

test('zones désactivées : tarif standard', () => {
  assert.equal(evaluerLivraison({ actif: false, zones: [] }, { codePostal: '13001' }, 10, defauts).frais, 3.9);
  assert.equal(evaluerLivraison({ actif: false, zones: [] }, { codePostal: '13001' }, 50, defauts).frais, 0);
});

test('dateParis : heure d’été (UTC+2) et d’hiver (UTC+1)', () => {
  assert.equal(dateParis('2026-07-15', '12:00').toISOString(), '2026-07-15T10:00:00.000Z');
  assert.equal(dateParis('2026-01-15', '12:00').toISOString(), '2026-01-15T11:00:00.000Z');
});

test('créneaux : respecte le délai minimum, l’ouverture et la fermeture', () => {
  const maintenant = new Date('2026-10-08T10:00:00Z'); // 12 h à Paris
  const c = genererCreneaux({ ...CRENEAUX_DEFAUT, joursMax: 1 }, maintenant);
  assert.ok(c.length > 0);
  assert.ok(c.every((x) => x.debut.getTime() >= maintenant.getTime() + 60 * 60000), 'au moins 1 h de délai');
  assert.equal(c[0].heure, '13:00'); // 12 h + 1 h de délai → premier créneau à 13 h
  assert.ok(c.every((x) => x.heure >= '11:30' && x.heure <= '21:30'));
});
