import prisma from '../lib/prisma.js';
import { jourParis, arrondir } from '../utils/paie.js';

const erreur = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

/** Période : du / au (AAAA-MM-JJ, heure de Paris). Défaut : 30 derniers jours. */
export function lirePeriode(query) {
  const au = JOUR.test(query.au) ? query.au : jourParis(new Date());
  const du = JOUR.test(query.du) ? query.du : jourParis(new Date(Date.now() - 29 * 24 * 3600 * 1000));
  if (du > au) throw erreur('Période invalide', 400);
  // Marge d'un jour de chaque côté, puis filtrage exact par jour de Paris
  const debut = new Date(new Date(`${du}T00:00:00Z`).getTime() - 24 * 3600 * 1000);
  const fin = new Date(new Date(`${au}T23:59:59Z`).getTime() + 24 * 3600 * 1000);
  return { du, au, debut, fin };
}

const heureParis = (date) =>
  Number(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', hour12: false, timeZone: 'Europe/Paris' }).format(new Date(date)).slice(0, 2)) % 24;

/** GET /api/stats/avancees?du=&au= — chiffres clés pour piloter l'activité (admin) */
export const statistiquesAvancees = async (req, res, next) => {
  try {
    const { du, au, debut, fin } = lirePeriode(req.query);
    const commandes = await prisma.commande.findMany({
      where: { createdAt: { gte: debut, lte: fin } },
      select: {
        id: true,
        createdAt: true,
        statut: true,
        statutPaiement: true,
        methodePaiement: true,
        total: true,
        sousTotal: true,
        taxes: true,
        fraisLivraison: true,
        remise: true,
        articles: { select: { quantite: true, sousTotal: true, informationsPlat: true } },
      },
    });
    const dansPeriode = commandes.filter((c) => {
      const j = jourParis(c.createdAt);
      return j >= du && j <= au;
    });
    const annulees = dansPeriode.filter((c) => ['annulee', 'remboursee'].includes(c.statut));
    const valides = dansPeriode.filter((c) => !['annulee', 'remboursee'].includes(c.statut));
    const payees = valides.filter((c) => c.statutPaiement === 'valide');

    // Par jour (tous les jours de la période, même sans commande)
    const parJour = new Map();
    for (let t = new Date(`${du}T12:00:00Z`).getTime(); jourParis(new Date(t)) <= au && parJour.size < 400; t += 24 * 3600 * 1000) {
      parJour.set(jourParis(new Date(t)), { jour: jourParis(new Date(t)), commandes: 0, chiffreAffaires: 0 });
    }
    for (const c of valides) {
      const l = parJour.get(jourParis(c.createdAt));
      if (!l) continue;
      l.commandes += 1;
      if (c.statutPaiement === 'valide') l.chiffreAffaires += c.total;
    }

    // Plats les plus vendus
    const plats = new Map();
    for (const c of valides) {
      for (const a of c.articles) {
        const nom = a.informationsPlat?.nom || 'Plat';
        const p = plats.get(nom) ?? { nom, quantite: 0, chiffreAffaires: 0 };
        p.quantite += a.quantite;
        p.chiffreAffaires += a.sousTotal;
        plats.set(nom, p);
      }
    }

    // Heures de pointe
    const heures = Array.from({ length: 24 }, (_, h) => ({ heure: h, commandes: 0 }));
    for (const c of valides) heures[heureParis(c.createdAt)].commandes += 1;

    const modes = {};
    for (const c of valides) modes[c.methodePaiement] = (modes[c.methodePaiement] ?? 0) + 1;

    const chiffreAffaires = arrondir(payees.reduce((t, c) => t + c.total, 0));
    res.json({
      success: true,
      data: {
        du,
        au,
        commandes: valides.length,
        commandesPayees: payees.length,
        annulees: annulees.length,
        tauxAnnulation: dansPeriode.length ? arrondir((annulees.length / dansPeriode.length) * 100) : 0,
        chiffreAffaires,
        chiffreAffairesHT: arrondir(payees.reduce((t, c) => t + (c.total - c.taxes), 0)),
        tva: arrondir(payees.reduce((t, c) => t + c.taxes, 0)),
        panierMoyen: payees.length ? arrondir(chiffreAffaires / payees.length) : 0,
        parJour: [...parJour.values()].map((l) => ({ ...l, chiffreAffaires: arrondir(l.chiffreAffaires) })),
        topPlats: [...plats.values()]
          .sort((a, b) => b.quantite - a.quantite)
          .slice(0, 10)
          .map((p) => ({ ...p, chiffreAffaires: arrondir(p.chiffreAffaires) })),
        heuresDePointe: heures,
        modesPaiement: modes,
      },
    });
  } catch (e) {
    next(e);
  }
};
