import prisma from '../lib/prisma.js';
import { isValidId } from '../utils/serialize.js';
import { genererFacturePdf } from '../utils/facture.js';
import { enregistrerEntreprise, lireEntreprise } from '../utils/entreprise.js';

const erreur = (message, statusCode) => Object.assign(new Error(message), { statusCode });

/** Attribue le numéro de facture (séquence continue) une seule fois, à la première émission. */
async function assurerNumeroFacture(commande) {
  if (commande.numeroFacture) return commande;
  const [{ n }] = await prisma.$queryRaw`SELECT nextval('facture_numero_seq')::int AS n`;
  const maintenant = new Date();
  const numero = `FA-${maintenant.getFullYear()}-${String(n).padStart(5, '0')}`;
  const { count } = await prisma.commande.updateMany({
    where: { id: commande.id, numeroFacture: null },
    data: { numeroFacture: numero, factureLe: maintenant },
  });
  // Émission simultanée : l'autre requête a gagné, on relit le numéro attribué (la valeur de séquence perdue est un « trou » rare)
  return prisma.commande.findUnique({ where: { id: commande.id }, include: { articles: { orderBy: { id: 'asc' } } } }).then((c) => {
    if (count === 0 && !c?.numeroFacture) throw erreur('Facture indisponible, réessayez', 409);
    return c;
  });
}

/** GET /api/commandes/:id/facture — facture PDF d'une commande payée (client concerné ou admin) */
export const telechargerFacture = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw erreur('Identifiant invalide', 400);
    let commande = await prisma.commande.findUnique({ where: { id }, include: { articles: { orderBy: { id: 'asc' } } } });
    if (!commande) throw erreur('Commande non trouvée', 404);
    if (req.utilisateur.role !== 'admin' && commande.clientId !== req.utilisateur.id) throw erreur('Non autorisé', 403);
    if (commande.statutPaiement !== 'valide') throw erreur('La facture est disponible une fois la commande payée', 409);
    if (['annulee', 'remboursee'].includes(commande.statut)) throw erreur('Aucune facture pour une commande annulée ou remboursée', 409);

    commande = await assurerNumeroFacture(commande);
    const pdf = await genererFacturePdf(commande, await lireEntreprise(prisma));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${commande.numeroFacture}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(pdf);
  } catch (e) {
    next(e);
  }
};

/** GET/PUT /api/entreprise — coordonnées légales du vendeur (admin) */
export const lireInfosEntreprise = async (req, res, next) => {
  try {
    res.json({ success: true, data: await lireEntreprise(prisma) });
  } catch (e) {
    next(e);
  }
};
export const majInfosEntreprise = async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Informations enregistrées', data: await enregistrerEntreprise(prisma, req.body) });
  } catch (e) {
    next(e);
  }
};
