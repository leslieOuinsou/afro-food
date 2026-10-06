import crypto from 'crypto';
import prisma from '../lib/prisma.js';

/** Montant (TTC) au-dessus duquel le client reçoit un code promo en remerciement. */
export const SEUIL_RECOMPENSE = 30;
const REMISE_POURCENT = 10;
const UTILISATIONS = 3;
const VALIDITE_JOURS = 90;

function nouveauCode() {
  // Sans caractères ambigus (0/O, 1/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffixe = '';
  for (let i = 0; i < 6; i += 1) suffixe += alphabet[crypto.randomInt(alphabet.length)];
  return `MERCI-${suffixe}`;
}

/**
 * Crée le code personnel (−10 % + livraison offerte) pour une commande de plus de 30 €.
 * Idempotent : une seule récompense par commande. Retourne le code créé, ou null.
 */
export async function genererCodeRecompense(commande) {
  const total = Number(commande.total ?? commande.montants?.total ?? 0);
  if (!(total > SEUIL_RECOMPENSE) || !commande.clientId) return null;

  const existant = await prisma.promoCode.findUnique({ where: { sourceCommandeId: commande.id } });
  if (existant) return null;

  const dateFin = new Date(Date.now() + VALIDITE_JOURS * 24 * 60 * 60 * 1000);
  for (let essai = 0; essai < 5; essai += 1) {
    try {
      return await prisma.promoCode.create({
        data: {
          code: nouveauCode(),
          description: `Merci pour la commande ${commande.numeroCommande} (−${REMISE_POURCENT} % + livraison offerte)`,
          typeRemise: 'pourcentage',
          valeur: REMISE_POURCENT,
          livraisonOfferte: true,
          clientId: commande.clientId,
          sourceCommandeId: commande.id,
          usageParClient: UTILISATIONS,
          utilisationsMax: UTILISATIONS,
          dateFin,
        },
      });
    } catch (err) {
      // P2002 : code déjà pris (ou récompense créée en parallèle) → on réessaie / on abandonne
      if (err.code !== 'P2002') throw err;
      const deja = await prisma.promoCode.findUnique({ where: { sourceCommandeId: commande.id } });
      if (deja) return null;
    }
  }
  return null;
}
