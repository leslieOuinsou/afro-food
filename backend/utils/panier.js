import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { abandonedCartEmail } from './emailTemplates.js';
import { envoyerEmail } from './email.js';

const PREFIXE = 'panier:';
const cleDesabo = (userId) => `relance_panier_off:${userId}`;
const DELAI_RELANCE_H = 24; // le panier doit dormir depuis au moins 24 h
const VALIDITE_JOURS = 7; // au-delà de 7 jours, on ne relance plus
const CONSERVATION_JOURS = 30; // purge des paniers anciens

const frontUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const backUrl = () => (process.env.BACKEND_PUBLIC_URL || '').replace(/\/$/, '');

/** Jeton de désabonnement : signé, propre à un utilisateur (impossible à deviner). */
export const jetonDesabonnement = (userId) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET || 'afro-food').update(`desabo|${userId}`).digest('hex').slice(0, 32);

export const jetonValide = (userId, jeton) => {
  const attendu = Buffer.from(jetonDesabonnement(userId));
  const recu = Buffer.from(String(jeton ?? ''));
  return attendu.length === recu.length && crypto.timingSafeEqual(attendu, recu);
};

/** Nettoie les articles reçus du navigateur (jamais de confiance aveugle). */
export function nettoyerArticles(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 30).flatMap((i) => {
    const quantite = Math.floor(Number(i?.quantite));
    const prix = Number(i?.prixUnitaire);
    if (!i?.id || !(quantite >= 1) || !Number.isFinite(prix) || prix < 0) return [];
    return [
      {
        id: String(i.id).slice(0, 40),
        nom: String(i.nom ?? 'Produit').slice(0, 80),
        prixUnitaire: Math.round(prix * 100) / 100,
        quantite: Math.min(quantite, 99),
        image: /^https?:\/\//.test(String(i.image ?? '')) ? String(i.image).slice(0, 300) : '',
      },
    ];
  });
}

/** Enregistre (ou vide) le panier d'un client connecté. Un panier modifié redevient « relançable ». */
export async function enregistrerPanier(userId, items) {
  const articles = nettoyerArticles(items);
  const cle = `${PREFIXE}${userId}`;
  if (articles.length === 0) {
    await prisma.setting.deleteMany({ where: { cle } });
    return 0;
  }
  const valeur = { items: articles, relanceLe: null };
  await prisma.setting.upsert({ where: { cle }, update: { valeur }, create: { cle, valeur } });
  return articles.length;
}

export const viderPanier = (userId) => prisma.setting.deleteMany({ where: { cle: `${PREFIXE}${userId}` } });

export async function desabonnerRelances(userId) {
  await prisma.setting.upsert({
    where: { cle: cleDesabo(userId) },
    update: { valeur: { off: true } },
    create: { cle: cleDesabo(userId), valeur: { off: true } },
  });
}

/**
 * Relance quotidienne : paniers inactifs depuis 24 h à 7 jours, sans commande depuis, jamais relancés.
 * Retourne le nombre de relances envoyées.
 */
export async function relancerPaniersAbandonnes(maintenant = new Date()) {
  const il = (h) => new Date(maintenant.getTime() - h * 3600 * 1000);
  const paniers = await prisma.setting.findMany({
    where: { cle: { startsWith: PREFIXE }, updatedAt: { lte: il(DELAI_RELANCE_H), gte: il(VALIDITE_JOURS * 24) } },
  });
  let envoyes = 0;
  for (const p of paniers) {
    if (p.valeur?.relanceLe || !Array.isArray(p.valeur?.items) || p.valeur.items.length === 0) continue;
    const userId = p.cle.slice(PREFIXE.length);
    const [user, desabo, commandeDepuis] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, prenom: true, estActif: true, role: true } }),
      prisma.setting.findUnique({ where: { cle: cleDesabo(userId) } }),
      prisma.commande.count({ where: { clientId: userId, createdAt: { gte: p.updatedAt } } }),
    ]);
    if (!user?.estActif || user.role !== 'client' || desabo?.valeur?.off || commandeDepuis > 0) continue;

    const lienDesabo = backUrl()
      ? `${backUrl()}/api/panier/desabonner?u=${encodeURIComponent(userId)}&t=${jetonDesabonnement(userId)}`
      : undefined;
    const articles = p.valeur.items.map((i) => ({ nom: i.nom, image: i.image || undefined, prix: i.prixUnitaire, quantite: i.quantite }));
    try {
      await envoyerEmail({
        to: user.email,
        subject: 'Votre panier vous attend — Afro-food',
        text: `Vous avez laissé ${articles.length} article(s) dans votre panier. Reprenez votre commande : ${frontUrl()}/panier`,
        html: abandonedCartEmail({
          prenom: user.prenom,
          articles,
          cartUrl: `${frontUrl()}/panier`,
          clientEmail: user.email,
          unsubscribeUrl: lienDesabo,
        }),
      });
      await prisma.setting.update({ where: { id: p.id }, data: { valeur: { ...p.valeur, relanceLe: maintenant.toISOString() } } });
      envoyes += 1;
    } catch (e) {
      console.warn('Relance panier non envoyée:', e.message);
    }
  }
  // Purge des paniers anciens : libère de la place
  await prisma.setting.deleteMany({ where: { cle: { startsWith: PREFIXE }, updatedAt: { lt: il(CONSERVATION_JOURS * 24) } } });
  return envoyes;
}
