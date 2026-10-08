import crypto from 'crypto';

const CLE = 'fidelite';

export const FIDELITE_DEFAUT = {
  actif: true,
  pointsParEuro: 1,
  paliers: [
    { points: 100, remise: 5 },
    { points: 250, remise: 15 },
    { points: 500, remise: 35 },
  ],
  validiteJours: 90,
};

export async function lireFidelite(prisma) {
  const s = await prisma.setting.findUnique({ where: { cle: CLE } });
  return { ...FIDELITE_DEFAUT, ...(s?.valeur ?? {}) };
}

export async function enregistrerFidelite(prisma, d) {
  const paliers = (Array.isArray(d?.paliers) ? d.paliers : [])
    .map((p) => ({ points: Math.floor(Number(p.points)), remise: Math.round(Number(p.remise) * 100) / 100 }))
    .filter((p) => p.points >= 1 && p.points <= 100000 && p.remise > 0 && p.remise <= 1000)
    .sort((a, b) => a.points - b.points)
    .slice(0, 10);
  const valeur = {
    actif: Boolean(d?.actif),
    pointsParEuro: Math.max(0.1, Math.min(20, Number(d?.pointsParEuro) || 1)),
    paliers,
    validiteJours: Math.max(7, Math.min(730, Math.floor(Number(d?.validiteJours)) || 90)),
  };
  await prisma.setting.upsert({ where: { cle: CLE }, update: { valeur }, create: { cle: CLE, valeur } });
  return valeur;
}

/** Points gagnés pour une commande : montant TTC × points par euro, arrondi à l'entier inférieur. */
export const pointsPourMontant = (total, pointsParEuro) => Math.max(0, Math.floor(Number(total) * Number(pointsParEuro)));

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const codeFidelite = () => `FIDELE-${Array.from({ length: 6 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('')}`;

/**
 * Crédite les points d'une commande livrée (une seule fois, grâce à pointsGagnes).
 * Retourne le nombre de points ajoutés (0 si rien à faire).
 */
export async function crediterPoints(prisma, commande) {
  const config = await lireFidelite(prisma);
  if (!config.actif || commande.pointsGagnes > 0 || !commande.clientId) return 0;
  const points = pointsPourMontant(commande.total, config.pointsParEuro);
  if (points <= 0) return 0;
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.commande.updateMany({ where: { id: commande.id, pointsGagnes: 0 }, data: { pointsGagnes: points } });
    if (count !== 1) return 0; // déjà crédité par une autre requête
    await tx.user.update({ where: { id: commande.clientId }, data: { pointsFidelite: { increment: points } } });
    await tx.mouvementPoints.create({
      data: { userId: commande.clientId, delta: points, motif: `Commande ${commande.numeroCommande}`, commandeId: commande.id },
    });
    return points;
  });
}

/** Retire les points d'une commande remboursée (sans passer sous zéro). */
export async function retirerPoints(prisma, commande) {
  if (!(commande.pointsGagnes > 0)) return 0;
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.commande.updateMany({ where: { id: commande.id, pointsGagnes: { gt: 0 } }, data: { pointsGagnes: 0 } });
    if (count !== 1) return 0;
    const user = await tx.user.findUnique({ where: { id: commande.clientId }, select: { pointsFidelite: true } });
    const retrait = Math.min(commande.pointsGagnes, user?.pointsFidelite ?? 0);
    if (retrait > 0) {
      await tx.user.update({ where: { id: commande.clientId }, data: { pointsFidelite: { decrement: retrait } } });
      await tx.mouvementPoints.create({
        data: { userId: commande.clientId, delta: -retrait, motif: `Remboursement ${commande.numeroCommande}`, commandeId: commande.id },
      });
    }
    return retrait;
  });
}
