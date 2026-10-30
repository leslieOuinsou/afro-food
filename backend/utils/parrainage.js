import crypto from 'crypto';
import prisma from '../lib/prisma.js';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function genererCodeParrain() {
  let s = 'AFRO-';
  for (let i = 0; i < 6; i += 1) s += alphabet[crypto.randomInt(alphabet.length)];
  return s;
}

/** Garantit un code parrain pour l'utilisateur. */
export async function assurerCodeParrain(userId) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { codeParrain: true } });
  if (u?.codeParrain) return u.codeParrain;
  for (let i = 0; i < 8; i += 1) {
    const code = genererCodeParrain();
    try {
      await prisma.user.update({ where: { id: userId }, data: { codeParrain: code } });
      return code;
    } catch (err) {
      if (err.code !== 'P2002') throw err;
    }
  }
  throw new Error('Impossible de générer un code parrain');
}

/**
 * Applique un code parrain à l'inscription (une seule fois).
 * Crée un promo −5 € pour le filleul.
 */
export async function lierParrain(userId, code) {
  if (!code || typeof code !== 'string') return null;
  const normalise = code.trim().toUpperCase();
  const parrain = await prisma.user.findFirst({
    where: { codeParrain: normalise, estActif: true },
  });
  if (!parrain || parrain.id === userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.parraineParId) return null;

  await prisma.user.update({
    where: { id: userId },
    data: { parraineParId: parrain.id },
  });

  const dateFin = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  await prisma.promoCode.create({
    data: {
      code: `PARRAIN-${normalise.slice(-6)}-${crypto.randomInt(100, 999)}`,
      description: `Parrainage ${parrain.prenom} : −5 €`,
      typeRemise: 'fixe',
      valeur: 5,
      clientId: userId,
      usageParClient: 1,
      utilisationsMax: 1,
      montantMinimum: 20,
      dateFin,
    },
  });

  return parrain;
}

/** Après livraison de la 1re commande d'un filleul : +50 pts au parrain. */
export async function recompenserParrainSiEligible(commande) {
  if (!commande?.clientId) return;
  const client = await prisma.user.findUnique({
    where: { id: commande.clientId },
    select: { parraineParId: true, nombreCommandes: true },
  });
  if (!client?.parraineParId) return;
  if ((client.nombreCommandes || 0) > 1) return;

  const deja = await prisma.mouvementPoints.findFirst({
    where: {
      userId: client.parraineParId,
      motif: `parrainage:${commande.clientId}`,
    },
  });
  if (deja) return;

  await prisma.$transaction([
    prisma.mouvementPoints.create({
      data: {
        userId: client.parraineParId,
        delta: 50,
        motif: `parrainage:${commande.clientId}`,
        commandeId: commande.id,
      },
    }),
    prisma.user.update({
      where: { id: client.parraineParId },
      data: { pointsFidelite: { increment: 50 } },
    }),
  ]);
}
