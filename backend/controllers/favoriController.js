import prisma from '../lib/prisma.js';
import { serializePlat } from '../utils/serialize.js';
import { isValidId } from '../utils/serialize.js';

function erreur(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

/** GET /api/favoris — plats favoris du client connecté */
export const listerFavoris = async (req, res, next) => {
  try {
    const favoris = await prisma.favori.findMany({
      where: { userId: req.utilisateur.id },
      orderBy: { createdAt: 'desc' },
      include: { plat: true },
    });
    res.json({
      success: true,
      data: {
        plats: favoris.map((f) => serializePlat(f.plat)),
        ids: favoris.map((f) => f.platId),
      },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/favoris/:platId/basculer — ajoute ou retire */
export const basculerFavori = async (req, res, next) => {
  try {
    const { platId } = req.params;
    if (!isValidId(platId)) throw erreur('ID de plat invalide', 400);
    const userId = req.utilisateur.id;

    const existant = await prisma.favori.findUnique({
      where: { userId_platId: { userId, platId } },
    });
    if (existant) {
      await prisma.favori.delete({ where: { id: existant.id } });
      return res.json({ success: true, data: { favori: false } });
    }

    const plat = await prisma.plat.findUnique({ where: { id: platId }, select: { id: true } });
    if (!plat) throw erreur('Plat introuvable', 404);

    await prisma.favori.create({ data: { userId, platId } });
    res.status(201).json({ success: true, data: { favori: true } });
  } catch (error) {
    // double clic simultané : l'autre requête a déjà créé la ligne
    if (error.code === 'P2002') return res.json({ success: true, data: { favori: true } });
    next(error);
  }
};
