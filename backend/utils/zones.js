const CLE_ZONES = 'zones_livraison';
const CLE_CRENEAUX = 'creneaux_livraison';

export const ZONES_DEFAUT = { actif: false, zones: [] };
export const CRENEAUX_DEFAUT = {
  actif: true,
  ouverture: '11:30',
  fermeture: '22:00',
  pasMinutes: 30,
  delaiMinimumMinutes: 60,
  joursMax: 3,
  capaciteParCreneau: 8,
};

const normaliser = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export async function lireZones(prisma) {
  const s = await prisma.setting.findUnique({ where: { cle: CLE_ZONES } });
  return { ...ZONES_DEFAUT, ...(s?.valeur ?? {}) };
}

export async function enregistrerZones(prisma, donnees) {
  const zones = (Array.isArray(donnees?.zones) ? donnees.zones : []).slice(0, 50).map((z, i) => ({
    id: String(z.id || `z${i + 1}`).slice(0, 30),
    nom: String(z.nom ?? '').trim().slice(0, 60) || `Zone ${i + 1}`,
    codesPostaux: [...new Set((Array.isArray(z.codesPostaux) ? z.codesPostaux : []).map((c) => String(c).replace(/\s/g, '')).filter((c) => /^\d{2,5}$/.test(c)))].slice(0, 200),
    villes: [...new Set((Array.isArray(z.villes) ? z.villes : []).map((v) => String(v).trim()).filter(Boolean))].slice(0, 100),
    frais: Math.max(0, Math.min(200, Number(z.frais) || 0)),
    minimumCommande: Math.max(0, Math.min(1000, Number(z.minimumCommande) || 0)),
    gratuitDepuis: z.gratuitDepuis === null || z.gratuitDepuis === '' || z.gratuitDepuis === undefined ? null : Math.max(0, Number(z.gratuitDepuis) || 0),
  }));
  const valeur = { actif: Boolean(donnees?.actif), zones };
  await prisma.setting.upsert({ where: { cle: CLE_ZONES }, update: { valeur }, create: { cle: CLE_ZONES, valeur } });
  return valeur;
}

/** Zone correspondant à une adresse : le code postal le plus précis l'emporte, sinon la ville. */
export function trouverZone(config, { codePostal, ville }) {
  const cp = String(codePostal ?? '').replace(/\s/g, '');
  let meilleure = null;
  let longueur = -1;
  for (const z of config.zones ?? []) {
    for (const c of z.codesPostaux ?? []) {
      if (cp.startsWith(c) && c.length > longueur) {
        meilleure = z;
        longueur = c.length;
      }
    }
  }
  if (meilleure) return meilleure;
  const v = normaliser(ville);
  return v ? (config.zones ?? []).find((z) => (z.villes ?? []).some((x) => normaliser(x) === v)) ?? null : null;
}

/**
 * Frais de livraison d'une adresse.
 * Retourne { livrable, zone, frais, minimum, message }.
 */
export function evaluerLivraison(config, adresse, sousTotal, defauts) {
  if (!config.actif || (config.zones ?? []).length === 0) {
    return { livrable: true, zone: null, frais: sousTotal < defauts.seuilGratuit ? defauts.fraisStandard : 0, minimum: 0, message: null };
  }
  const zone = trouverZone(config, adresse);
  if (!zone) {
    return { livrable: false, zone: null, frais: 0, minimum: 0, message: "Nous ne livrons pas encore à cette adresse. Contactez-nous pour connaître nos zones de livraison." };
  }
  const gratuitDepuis = zone.gratuitDepuis ?? defauts.seuilGratuit;
  const frais = sousTotal >= gratuitDepuis ? 0 : zone.frais;
  const minimum = zone.minimumCommande || 0;
  return {
    livrable: sousTotal >= minimum,
    zone: { id: zone.id, nom: zone.nom },
    frais,
    minimum,
    message: sousTotal >= minimum ? null : `Commande minimum de ${minimum.toFixed(2).replace('.', ',')} € pour la zone « ${zone.nom} ».`,
  };
}

// ───────────── Créneaux de livraison ─────────────

export async function lireCreneaux(prisma) {
  const s = await prisma.setting.findUnique({ where: { cle: CLE_CRENEAUX } });
  return { ...CRENEAUX_DEFAUT, ...(s?.valeur ?? {}) };
}

export async function enregistrerCreneaux(prisma, d) {
  const heure = (v, def) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v)) ? String(v) : def);
  const valeur = {
    actif: Boolean(d?.actif),
    ouverture: heure(d?.ouverture, CRENEAUX_DEFAUT.ouverture),
    fermeture: heure(d?.fermeture, CRENEAUX_DEFAUT.fermeture),
    pasMinutes: [15, 30, 60].includes(Number(d?.pasMinutes)) ? Number(d.pasMinutes) : 30,
    delaiMinimumMinutes: Math.max(15, Math.min(1440, Number(d?.delaiMinimumMinutes) || 60)),
    joursMax: Math.max(1, Math.min(14, Number(d?.joursMax) || 3)),
    capaciteParCreneau: Math.max(1, Math.min(100, Number(d?.capaciteParCreneau) || 8)),
  };
  await prisma.setting.upsert({ where: { cle: CLE_CRENEAUX }, update: { valeur }, create: { cle: CLE_CRENEAUX, valeur } });
  return valeur;
}

/** Décalage de Paris par rapport à UTC (minutes) à un instant donné. */
function decalageParis(date) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' }).formatToParts(date).find((x) => x.type === 'timeZoneName')?.value ?? 'GMT+1';
  const m = /GMT([+-])(\d+)(?::(\d+))?/.exec(p);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 60;
}

/** Date UTC correspondant à AAAA-MM-JJ HH:MM à Paris. */
export function dateParis(jour, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const approx = new Date(`${jour}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
  return new Date(approx.getTime() - decalageParis(approx) * 60000);
}

/** Tous les créneaux théoriques des prochains jours (sans tenir compte de la capacité). */
export function genererCreneaux(config, maintenant = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [oh, om] = config.ouverture.split(':').map(Number);
  const [fh, fm] = config.fermeture.split(':').map(Number);
  const debutMin = oh * 60 + om;
  const finMin = fh * 60 + fm;
  const limite = maintenant.getTime() + config.delaiMinimumMinutes * 60000;
  const creneaux = [];
  for (let j = 0; j <= config.joursMax; j += 1) {
    const jour = fmt.format(new Date(maintenant.getTime() + j * 24 * 3600 * 1000));
    for (let t = debutMin; t <= finMin - config.pasMinutes; t += config.pasMinutes) {
      const hhmm = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
      const d = dateParis(jour, hhmm);
      if (d.getTime() >= limite) creneaux.push({ jour, heure: hhmm, debut: d });
    }
  }
  return creneaux;
}
