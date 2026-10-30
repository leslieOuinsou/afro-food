import prisma from '../lib/prisma.js';
import { isValidId, serializeAvis } from '../utils/serialize.js';
import { obtenirStatistiquesAvisPlat } from './platController.js';

const MOTS_INTERDITS = ['merde', 'fuck', 'connard', 'salope'];

async function recalculerNotePlat(platId) {
  const avis = await prisma.avis.findMany({
    where: { platId, statut: 'approuve' },
    select: { note: true },
  });
  const nombreAvis = avis.length;
  const notemoyenne =
    nombreAvis === 0
      ? 0
      : Math.round((avis.reduce((s, a) => s + a.note, 0) / nombreAvis) * 10) / 10;

  await prisma.plat.update({
    where: { id: platId },
    data: { notemoyenne, nombreAvis },
  });
}

export const obtenirAvisPlat = async (req, res, next) => {
  try {
    const { platId } = req.params;
    const { page = 1, limite = 10, tri = 'recent', note } = req.query;

    if (!isValidId(platId)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite, 10) || 10));

    const where = {
      platId,
      statut: 'approuve',
      ...(note ? { note: parseInt(note, 10) } : {}),
    };

    let orderBy;
    switch (tri) {
      case 'ancien':
        orderBy = { createdAt: 'asc' };
        break;
      case 'utile':
        orderBy = [{ utile: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'note_desc':
        orderBy = [{ note: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'note_asc':
        orderBy = [{ note: 'asc' }, { createdAt: 'desc' }];
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [avis, statistiques] = await Promise.all([
      prisma.avis.findMany({
        where,
        include: {
          utilisateur: { select: { id: true, nom: true, prenom: true, avatar: true } },
          reponseAuteur: { select: { id: true, nom: true, prenom: true } },
        },
        orderBy,
        skip: (pageNum - 1) * limiteNum,
        take: limiteNum,
      }),
      obtenirStatistiquesAvisPlat(platId),
    ]);

    res.status(200).json({
      success: true,
      message: 'Avis récupérés avec succès',
      data: {
        avis: avis.map(serializeAvis),
        statistiques,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirMesAvis = async (req, res, next) => {
  try {
    const { page = 1, limite = 20, tri = 'recent', statut } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite, 10) || 20));

    const where = {
      utilisateurId: req.utilisateur.id,
      ...(statut ? { statut } : {}),
    };

    let orderBy;
    switch (tri) {
      case 'ancien':
        orderBy = { createdAt: 'asc' };
        break;
      case 'note_desc':
        orderBy = [{ note: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'note_asc':
        orderBy = [{ note: 'asc' }, { createdAt: 'desc' }];
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [avis, total] = await Promise.all([
      prisma.avis.findMany({
        where,
        include: {
          plat: { select: { id: true, nom: true, images: true } },
          commande: { select: { id: true, numeroCommande: true } },
          reponseAuteur: { select: { id: true, nom: true, prenom: true } },
        },
        orderBy,
        skip: (pageNum - 1) * limiteNum,
        take: limiteNum,
      }),
      prisma.avis.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Mes avis récupérés avec succès',
      data: { avis: avis.map(serializeAvis) },
      pagination: {
        pageActuelle: pageNum,
        totalPages: Math.ceil(total / limiteNum),
        totalAvis: total,
        avisParPage: limiteNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const creerAvis = async (req, res, next) => {
  try {
    const {
      platId,
      commandeId,
      note,
      titre,
      commentaire,
      evaluations,
      recommande,
      tags,
      photos,
    } = req.body;

    if (!isValidId(platId) || !isValidId(commandeId)) {
      const error = new Error('IDs invalides');
      error.statusCode = 400;
      return next(error);
    }

    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        clientId: req.utilisateur.id,
        statut: 'livree',
        articles: { some: { platId } },
      },
    });

    if (!commande) {
      const error = new Error(
        'Vous ne pouvez évaluer que les plats que vous avez commandés et reçus'
      );
      error.statusCode = 403;
      return next(error);
    }

    const dates = commande.dates || {};
    let statut = 'en_attente';
    let dateApprobation = null;
    const texte = `${commentaire || ''} ${titre || ''}`.toLowerCase();
    const contientInterdit = MOTS_INTERDITS.some((mot) => texte.includes(mot));
    if (!contientInterdit && (commentaire || '').length >= 20) {
      statut = 'approuve';
      dateApprobation = new Date();
    }

    const avis = await prisma.avis.create({
      data: {
        platId,
        utilisateurId: req.utilisateur.id,
        commandeId,
        note,
        titre: titre || null,
        commentaire,
        evaluations: evaluations || null,
        recommande: recommande ?? true,
        tags: tags || [],
        photos: Array.isArray(photos)
          ? photos
              .filter((p) => typeof p === 'string' && (p.startsWith('data:image/') || p.startsWith('https://')))
              .slice(0, 4)
          : [],
        statut,
        dateApprobation,
        adresseIP: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
        achatVerifie: true,
        dateAchat: dates.livraison ? new Date(dates.livraison) : commande.updatedAt,
      },
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true, avatar: true } },
        plat: { select: { id: true, nom: true, images: true } },
      },
    });

    if (statut === 'approuve') {
      await recalculerNotePlat(platId);
    }

    res.status(201).json({
      success: true,
      message: 'Avis créé avec succès',
      data: { avis: serializeAvis(avis) },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const customError = new Error(
        'Vous avez déjà donné votre avis sur ce plat pour cette commande'
      );
      customError.statusCode = 409;
      return next(customError);
    }
    next(error);
  }
};

export const voterAvis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vote } = req.body;

    if (!vote || !['utile', 'pas_utile'].includes(vote)) {
      const error = new Error('Vote invalide. Doit être "utile" ou "pas_utile"');
      error.statusCode = 400;
      return next(error);
    }

    if (!isValidId(id)) {
      const error = new Error('ID avis invalide');
      error.statusCode = 400;
      return next(error);
    }

    const avis = await prisma.avis.findUnique({
      where: { id },
      include: { votants: true },
    });

    if (!avis) {
      const error = new Error('Avis non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    if (avis.utilisateurId === req.utilisateur.id) {
      const error = new Error('Vous ne pouvez pas voter sur votre propre avis');
      error.statusCode = 400;
      return next(error);
    }

    const voteExistant = avis.votants.find((v) => v.utilisateurId === req.utilisateur.id);
    let utile = avis.utile;
    let pasUtile = avis.pasUtile;

    if (voteExistant) {
      if (voteExistant.vote === 'utile') utile = Math.max(0, utile - 1);
      else pasUtile = Math.max(0, pasUtile - 1);

      if (voteExistant.vote === vote) {
        await prisma.avisVote.delete({ where: { id: voteExistant.id } });
      } else {
        await prisma.avisVote.update({
          where: { id: voteExistant.id },
          data: { vote, dateVote: new Date() },
        });
        if (vote === 'utile') utile += 1;
        else pasUtile += 1;
      }
    } else {
      await prisma.avisVote.create({
        data: {
          avisId: id,
          utilisateurId: req.utilisateur.id,
          vote,
        },
      });
      if (vote === 'utile') utile += 1;
      else pasUtile += 1;
    }

    await prisma.avis.update({
      where: { id },
      data: { utile, pasUtile },
    });

    res.status(200).json({
      success: true,
      message: 'Vote enregistré avec succès',
      data: { utile, pasUtile },
    });
  } catch (error) {
    next(error);
  }
};

export const signalerAvis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { raison, description } = req.body;

    const raisonsValides = [
      'contenu_inapproprie',
      'spam',
      'faux_avis',
      'langage_offensant',
      'hors_sujet',
      'autre',
    ];

    if (!raison || !raisonsValides.includes(raison)) {
      const error = new Error('Raison de signalement invalide');
      error.statusCode = 400;
      return next(error);
    }

    if (!isValidId(id)) {
      const error = new Error('ID avis invalide');
      error.statusCode = 400;
      return next(error);
    }

    const avis = await prisma.avis.findUnique({
      where: { id },
      include: { signalements: true },
    });

    if (!avis) {
      const error = new Error('Avis non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    const deja = avis.signalements.find((s) => s.utilisateurId === req.utilisateur.id);
    if (deja) {
      const error = new Error('Vous avez déjà signalé cet avis');
      error.statusCode = 400;
      return next(error);
    }

    await prisma.avisSignalement.create({
      data: {
        avisId: id,
        utilisateurId: req.utilisateur.id,
        raison,
        description: description || null,
      },
    });

    const nb = avis.signalements.length + 1;
    if (nb >= 3) {
      await prisma.avis.update({
        where: { id },
        data: { statut: 'signale' },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Signalement enregistré avec succès',
      data: null,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const customError = new Error('Vous avez déjà signalé cet avis');
      customError.statusCode = 400;
      return next(customError);
    }
    next(error);
  }
};

export const modererAvis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut, raisonRejet } = req.body;

    if (!statut || !['approuve', 'rejete'].includes(statut)) {
      const error = new Error('Statut de modération invalide');
      error.statusCode = 400;
      return next(error);
    }

    if (!isValidId(id)) {
      const error = new Error('ID avis invalide');
      error.statusCode = 400;
      return next(error);
    }

    const data = {
      statut,
      modereParId: req.utilisateur.id,
      dateApprobation: statut === 'approuve' ? new Date() : null,
    };
    if (statut === 'rejete' && raisonRejet) {
      data.raisonRejet = raisonRejet;
    }

    const avis = await prisma.avis.update({
      where: { id },
      data,
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true } },
        plat: { select: { id: true, nom: true } },
      },
    });

    await recalculerNotePlat(avis.platId);

    res.status(200).json({
      success: true,
      message: `Avis ${statut === 'approuve' ? 'approuvé' : 'rejeté'} avec succès`,
      data: { avis: serializeAvis(avis) },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const customError = new Error('Avis non trouvé');
      customError.statusCode = 404;
      return next(customError);
    }
    next(error);
  }
};

export const ajouterReponseRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenu } = req.body;

    if (!contenu || contenu.trim() === '') {
      const error = new Error('Le contenu de la réponse est obligatoire');
      error.statusCode = 400;
      return next(error);
    }

    if (!isValidId(id)) {
      const error = new Error('ID avis invalide');
      error.statusCode = 400;
      return next(error);
    }

    const avis = await prisma.avis.findUnique({ where: { id } });
    if (!avis) {
      const error = new Error('Avis non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    if (avis.statut !== 'approuve') {
      const error = new Error('Seuls les avis approuvés peuvent recevoir une réponse');
      error.statusCode = 400;
      return next(error);
    }

    const misAJour = await prisma.avis.update({
      where: { id },
      data: {
        reponseContenu: contenu.trim(),
        reponseDate: new Date(),
        reponseAuteurId: req.utilisateur.id,
      },
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true } },
        reponseAuteur: { select: { id: true, nom: true, prenom: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      data: { avis: serializeAvis(misAJour) },
    });
  } catch (error) {
    next(error);
  }
};
