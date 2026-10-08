import prisma from '../lib/prisma.js';
import { lirePeriode } from './statsController.js';
import { jourParis } from '../utils/paie.js';
import { nombreFr, versCsv } from '../utils/csv.js';

const dateHeure = (d) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }) : '');
const nomComplet = (u) => [u?.prenom, u?.nom].filter(Boolean).join(' ');

function envoyerCsv(res, nom, contenu) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(contenu);
}

/** GET /api/export/ventes?du=&au= — ventes de la période (une ligne par commande) */
export const exporterVentes = async (req, res, next) => {
  try {
    const { du, au, debut, fin } = lirePeriode(req.query);
    const commandes = await prisma.commande.findMany({
      where: { createdAt: { gte: debut, lte: fin } },
      orderBy: { createdAt: 'asc' },
      include: { livreur: { select: { nom: true, prenom: true } } },
    });
    const lignes = commandes
      .filter((c) => {
        const j = jourParis(c.createdAt);
        return j >= du && j <= au;
      })
      .map((c) => [
        c.numeroFacture ?? '',
        c.numeroCommande,
        dateHeure(c.createdAt),
        nomComplet(c.informationsClient),
        c.methodePaiement,
        c.statutPaiement,
        c.statut,
        nombreFr(c.sousTotal),
        nombreFr(c.fraisLivraison),
        nombreFr(c.remise),
        nombreFr(c.total - c.taxes),
        nombreFr(c.taxes),
        nombreFr(c.total),
        c.codePromo ?? '',
        nomComplet(c.livreur),
      ]);
    envoyerCsv(
      res,
      `ventes-${du}_${au}.csv`,
      versCsv(
        ['Facture', 'Commande', 'Date', 'Client', 'Paiement', 'Statut paiement', 'Statut', 'Sous-total HT', 'Livraison HT', 'Remise', 'Total HT', 'TVA', 'Total TTC', 'Code promo', 'Livreur'],
        lignes
      )
    );
  } catch (e) {
    next(e);
  }
};

/** GET /api/export/caisse?du=&au= — journal de la caisse espèces */
export const exporterCaisse = async (req, res, next) => {
  try {
    const { du, au, debut, fin } = lirePeriode(req.query);
    const journal = await prisma.journalCaisse.findMany({
      where: { createdAt: { gte: debut, lte: fin } },
      orderBy: { createdAt: 'asc' },
      include: {
        livreur: { select: { nom: true, prenom: true } },
        auteur: { select: { nom: true, prenom: true } },
        commande: { select: { numeroCommande: true } },
      },
    });
    const lignes = journal
      .filter((j) => {
        const d = jourParis(j.createdAt);
        return d >= du && d <= au;
      })
      .map((j) => [dateHeure(j.createdAt), j.type, nomComplet(j.livreur), j.commande?.numeroCommande ?? '', nombreFr(j.montant), nomComplet(j.auteur), j.note ?? '']);
    envoyerCsv(res, `caisse-${du}_${au}.csv`, versCsv(['Date', 'Opération', 'Livreur', 'Commande', 'Montant', 'Auteur', 'Note'], lignes));
  } catch (e) {
    next(e);
  }
};

/** GET /api/export/paie?du=&au= — paies des livreurs (une ligne par journée payée) */
export const exporterPaie = async (req, res, next) => {
  try {
    const { du, au } = lirePeriode(req.query);
    const paies = await prisma.paieLivreur.findMany({
      where: { jour: { gte: du, lte: au } },
      orderBy: [{ jour: 'asc' }],
      include: { livreur: { select: { nom: true, prenom: true } }, admin: { select: { nom: true, prenom: true } }, fiche: { select: { numero: true } } },
    });
    const lignes = paies.map((p) => [
      p.jour,
      nomComplet(p.livreur),
      nombreFr(p.minutes / 60),
      nombreFr(p.tauxHoraire),
      p.nbLivraisons,
      nombreFr(p.montant - p.prime),
      nombreFr(p.prime),
      nombreFr(p.montant),
      p.mode,
      dateHeure(p.createdAt),
      nomComplet(p.admin),
      p.fiche?.numero ?? '',
    ]);
    envoyerCsv(res, `paie-${du}_${au}.csv`, versCsv(['Journée', 'Livreur', 'Heures', 'Taux horaire', 'Livraisons', 'Salaire', 'Prime', 'Total payé', 'Mode', 'Payée le', 'Payée par', 'Fiche'], lignes));
  } catch (e) {
    next(e);
  }
};
