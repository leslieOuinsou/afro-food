/** Taux horaire par défaut (€/h) : modifiable par l'admin (réglage « taux_horaire_livreur »). */
export const TAUX_HORAIRE_DEFAUT = 9;
/** Une session de pointage ne peut pas dépasser cette durée (oubli de « Je termine »). */
export const DUREE_MAX_SESSION_MIN = 14 * 60;

const FUSEAU = 'Europe/Paris';

export const arrondir = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Jour (AAAA-MM-JJ) d'une date, selon l'heure de Paris. */
export function jourParis(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(date)
  );
}

/** Minutes entières entre deux dates, bornées à la durée maximale d'une session. */
export function minutesEntre(debut, fin) {
  const m = Math.floor((new Date(fin).getTime() - new Date(debut).getTime()) / 60000);
  return Math.max(0, Math.min(m, DUREE_MAX_SESSION_MIN));
}

/** Montant dû : minutes × taux horaire / 60, arrondi au centime. */
export const montantPourMinutes = (minutes, taux) => arrondir((Number(minutes) / 60) * Number(taux));

export const formaterDuree = (minutes) => `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;

/**
 * Regroupe pointages et livraisons par (livreur, jour).
 * pointages : { livreurId, jour, debut, fin, paieId }
 * livraisons : { livreurId, jour }
 */
export function agregerJournees(pointages, livraisons, taux, maintenant = new Date()) {
  const lignes = new Map();
  const ligne = (livreurId, jour) => {
    const cle = `${livreurId}|${jour}`;
    if (!lignes.has(cle)) {
      lignes.set(cle, { livreurId, jour, minutesAPayer: 0, minutesPayees: 0, enCours: false, nbLivraisons: 0, sessions: 0 });
    }
    return lignes.get(cle);
  };
  for (const p of pointages) {
    const l = ligne(p.livreurId, p.jour);
    l.sessions += 1;
    if (!p.fin) {
      l.enCours = true;
      continue;
    }
    const min = minutesEntre(p.debut, p.fin);
    if (p.paieId) l.minutesPayees += min;
    else l.minutesAPayer += min;
  }
  for (const d of livraisons) ligne(d.livreurId, d.jour).nbLivraisons += 1;
  return [...lignes.values()]
    .map((l) => ({ ...l, montantAPayer: montantPourMinutes(l.minutesAPayer, taux) }))
    .sort((a, b) => (a.jour === b.jour ? 0 : a.jour < b.jour ? 1 : -1));
}
