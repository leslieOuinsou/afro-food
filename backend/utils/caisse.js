import crypto from 'crypto';

/** Plafond d'espèces non reversées par livreur (€). Au-delà : plus de course en espèces. */
export const plafondEspeces = () => Number(process.env.PLAFOND_ESPECES) || 150;
/** Au-delà de ce délai (heures), un solde non reversé déclenche une alerte. */
export const delaiAlerteHeures = () => Number(process.env.DELAI_ALERTE_ESPECES_H) || 48;

export const arrondir = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Code de remise à 4 chiffres, communiqué au seul client. */
export const genererCodeRemise = () => String(crypto.randomInt(0, 10000)).padStart(4, '0');

/**
 * Contrôle l'encaissement saisi par le livreur à la livraison d'une commande en espèces.
 * Retourne { ok, montant, ecart, raison } ou { ok: false, message }.
 */
export function controlerEncaissement(commande, { codeRemise, montantEncaisse, raisonEcart }, { exigerCode = true } = {}) {
  const total = arrondir(commande.total ?? commande.montants?.total ?? 0);

  if (exigerCode) {
    const saisi = String(codeRemise ?? '').trim();
    const attendu = String(commande.codeRemise ?? '');
    const a = Buffer.from(saisi);
    const b = Buffer.from(attendu);
    if (!attendu || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, message: 'Code de remise incorrect. Demandez au client le code à 4 chiffres reçu sur son compte.' };
    }
  }

  const montant = montantEncaisse === undefined || montantEncaisse === null || montantEncaisse === ''
    ? NaN
    : arrondir(montantEncaisse);
  if (!Number.isFinite(montant) || montant < 0) {
    return { ok: false, message: 'Indiquez le montant réellement encaissé.' };
  }

  const ecart = arrondir(montant - total);
  const raison = String(raisonEcart ?? '').trim();
  if (ecart !== 0 && raison.length < 5) {
    return { ok: false, message: `Le montant encaissé (${montant} €) diffère du total (${total} €) : indiquez la raison de l'écart.` };
  }
  return { ok: true, montant, ecart, raison: ecart !== 0 ? raison : null };
}

/**
 * Synthèse d'un livreur à partir de ses commandes en espèces non reversées.
 * @param {{id:string,numeroCommande:string,especesEncaissees:number,especesEncaisseLe:Date}[]} commandes
 */
export function syntheseLivreur(commandes, maintenant = new Date()) {
  const solde = arrondir(commandes.reduce((t, c) => t + (c.especesEncaissees || 0), 0));
  const dates = commandes.map((c) => new Date(c.especesEncaisseLe).getTime()).filter(Number.isFinite);
  const plusAncien = dates.length ? new Date(Math.min(...dates)) : null;
  const ageHeures = plusAncien ? (maintenant.getTime() - plusAncien.getTime()) / 3600000 : 0;
  return {
    solde,
    nbCommandes: commandes.length,
    plusAncien,
    ageHeures: Math.floor(ageHeures),
    alerte: solde > 0 && ageHeures > delaiAlerteHeures(),
    plafondAtteint: solde >= plafondEspeces(),
  };
}
