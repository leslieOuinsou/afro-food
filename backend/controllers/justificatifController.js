import multer from 'multer';
import prisma from '../lib/prisma.js';
import { isValidId } from '../utils/serialize.js';
import { detecterTypeFichier } from '../utils/fichiers.js';
import { pushVersRole } from '../utils/push.js';

const TAILLE_MAX = 4 * 1024 * 1024; // limite de corps des fonctions Vercel : 4,5 Mo
const MAX_PAR_COMMANDE = 3;
const erreur = (message, statusCode) => Object.assign(new Error(message), { statusCode });

export const televerser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAILLE_MAX, files: 1 },
}).single('fichier');

/** Enveloppe multer pour renvoyer des erreurs claires. */
export const televerserFichier = (req, res, next) =>
  televerser(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return next(erreur('Fichier trop lourd (4 Mo maximum)', 413));
    return next(erreur('Envoi du fichier impossible', 400));
  });

async function chargerCommandeAutorisee(req) {
  const { id } = req.params;
  if (!isValidId(id)) throw erreur('ID de commande invalide', 400);
  const commande = await prisma.commande.findUnique({ where: { id } });
  if (!commande) throw erreur('Commande non trouvée', 404);
  const estAdmin = req.utilisateur.role === 'admin';
  if (!estAdmin && commande.clientId !== req.utilisateur.id) throw erreur('Non autorisé', 403);
  return { commande, estAdmin };
}

/** POST /api/commandes/:id/justificatifs — le client envoie sa preuve de virement */
export const ajouterJustificatif = async (req, res, next) => {
  try {
    const { commande, estAdmin } = await chargerCommandeAutorisee(req);
    if (estAdmin) throw erreur('Réservé au client de la commande', 403);
    if (commande.methodePaiement !== 'virement') throw erreur("Cette commande n'est pas payée par virement", 400);
    if (commande.statutPaiement === 'valide') throw erreur('Le virement est déjà confirmé', 409);
    if (['annulee', 'remboursee'].includes(commande.statut)) throw erreur('Commande annulée', 400);
    if (!req.file) throw erreur('Aucun fichier reçu', 400);

    const type = detecterTypeFichier(req.file.buffer);
    if (!type) throw erreur('Format non accepté : PDF, PNG, JPEG ou WebP uniquement', 400);

    const deja = await prisma.justificatifVirement.count({
      where: { commandeId: commande.id, statut: { not: 'refuse' } },
    });
    if (deja >= MAX_PAR_COMMANDE) throw erreur(`Maximum ${MAX_PAR_COMMANDE} justificatifs par commande`, 400);

    const nomBrut = String(req.file.originalname || 'justificatif').replace(/[^\w.\- ]+/g, '_').slice(0, 80);
    const justificatif = await prisma.justificatifVirement.create({
      data: {
        commandeId: commande.id,
        nom: nomBrut.toLowerCase().endsWith(`.${type.ext}`) ? nomBrut : `${nomBrut}.${type.ext}`,
        mime: type.mime,
        taille: req.file.size,
        donnees: req.file.buffer,
      },
      select: { id: true, nom: true, mime: true, taille: true, statut: true, createdAt: true },
    });

    await pushVersRole('admin', {
      titre: 'Justificatif de virement reçu',
      corps: `Commande ${commande.numeroCommande} : le client a envoyé sa preuve de virement.`,
      url: '/admin-documents',
    }).catch(() => undefined);

    res.status(201).json({ success: true, message: 'Justificatif envoyé', data: { justificatif } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/commandes/:id/justificatifs — liste (client concerné ou admin) */
export const listerJustificatifs = async (req, res, next) => {
  try {
    const { commande } = await chargerCommandeAutorisee(req);
    const justificatifs = await prisma.justificatifVirement.findMany({
      where: { commandeId: commande.id },
      select: { id: true, nom: true, mime: true, taille: true, statut: true, motifRefus: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: { justificatifs } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/commandes/:id/justificatifs/:jid/fichier — contenu du fichier */
export const lireJustificatif = async (req, res, next) => {
  try {
    const { commande } = await chargerCommandeAutorisee(req);
    const { jid } = req.params;
    if (!isValidId(jid)) throw erreur('ID invalide', 400);
    const j = await prisma.justificatifVirement.findFirst({ where: { id: jid, commandeId: commande.id } });
    if (!j) throw erreur('Justificatif introuvable', 404);
    res.setHeader('Content-Type', j.mime);
    res.setHeader('Content-Length', j.donnees.length);
    res.setHeader('Content-Disposition', `inline; filename="${j.nom.replace(/"/g, '')}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(j.donnees);
  } catch (e) {
    next(e);
  }
};
