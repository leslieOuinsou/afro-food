import express from 'express';
import { Avis } from '../models/index.js';
import {
  protegerRoute,
  restreindreAcces,
  authentificationOptionnelle
} from '../middleware/auth.js';
import {
  validerAvis,
  validerIdMongoDB,
  validerPagination
} from '../middleware/validation.js';

const router = express.Router();

// @desc    Obtenir les avis d'un plat
// @route   GET /api/avis/plat/:platId
// @access  Public
const obtenirAvisPlat = async (req, res, next) => {
  try {
    const { platId } = req.params;
    const {
      page = 1,
      limite = 10,
      tri = 'recent',
      note
    } = req.query;
    
    const criteres = {
      plat: platId,
      statut: 'approuve',
      note: note ? parseInt(note) : undefined,
      limite: parseInt(limite),
      page: parseInt(page),
      tri
    };
    
    const avis = await Avis.rechercher(criteres);
    
    // Obtenir les statistiques du plat
    const statistiques = await Avis.obtenirStatistiquesPlat(platId);
    
    res.status(200).json({
      success: true,
      message: 'Avis récupérés avec succès',
      data: {
        avis,
        statistiques
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les avis de l'utilisateur connecté
// @route   GET /api/avis/mes-avis
// @access  Private
const obtenirMesAvis = async (req, res, next) => {
  try {
    const {
      page = 1,
      limite = 20,
      tri = 'recent',
      statut,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite, 10) || 20));

    const query = {
      utilisateur: req.utilisateur.id,
      ...(statut ? { statut } : {}),
    };

    const sortOptions = (() => {
      switch (tri) {
        case 'ancien':
          return { createdAt: 1 };
        case 'note_desc':
          return { note: -1, createdAt: -1 };
        case 'note_asc':
          return { note: 1, createdAt: -1 };
        case 'recent':
        default:
          return { createdAt: -1 };
      }
    })();

    const [avis, total] = await Promise.all([
      Avis.find(query)
        .populate('plat', 'nom images.principale')
        .populate('commande', 'numeroCommande')
        .sort(sortOptions)
        .limit(limiteNum)
        .skip((pageNum - 1) * limiteNum),
      Avis.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: 'Mes avis récupérés avec succès',
      data: { avis },
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

// @desc    Créer un nouvel avis
// @route   POST /api/avis
// @access  Private
const creerAvis = async (req, res, next) => {
  try {
    const {
      platId,
      commandeId,
      note,
      titre,
      commentaire,
      evaluations,
      recommande,
      tags
    } = req.body;
    
    // Créer l'avis
    const avis = await Avis.create({
      plat: platId,
      utilisateur: req.utilisateur.id,
      commande: commandeId,
      note,
      titre,
      commentaire,
      evaluations,
      recommande,
      tags,
      adresseIP: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    const avisPopule = await Avis.findById(avis._id)
      .populate('utilisateur', 'nom prenom avatar')
      .populate('plat', 'nom images.principale');
    
    res.status(201).json({
      success: true,
      message: 'Avis créé avec succès',
      data: { avis: avisPopule }
    });
    
  } catch (error) {
    if (error.message.includes('vous avez commandé')) {
      error.statusCode = 403;
    } else if (error.code === 11000) {
      const customError = new Error('Vous avez déjà donné votre avis sur ce plat pour cette commande');
      customError.statusCode = 409;
      return next(customError);
    }
    next(error);
  }
};

// @desc    Voter sur l'utilité d'un avis
// @route   POST /api/avis/:id/voter
// @access  Private
const voterAvis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'utile' ou 'pas_utile'
    
    if (!vote || !['utile', 'pas_utile'].includes(vote)) {
      const error = new Error('Vote invalide. Doit être "utile" ou "pas_utile"');
      error.statusCode = 400;
      return next(error);
    }
    
    const avis = await Avis.findById(id);
    
    if (!avis) {
      const error = new Error('Avis non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    // L'utilisateur ne peut pas voter sur son propre avis
    if (avis.utilisateur.toString() === req.utilisateur.id.toString()) {
      const error = new Error('Vous ne pouvez pas voter sur votre propre avis');
      error.statusCode = 400;
      return next(error);
    }
    
    await avis.voter(req.utilisateur.id, vote);
    
    res.status(200).json({
      success: true,
      message: 'Vote enregistré avec succès',
      data: {
        utile: avis.utile,
        pasUtile: avis.pasUtile
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Signaler un avis
// @route   POST /api/avis/:id/signaler
// @access  Private
const signalerAvis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { raison, description } = req.body;
    
    const raisonsValides = [
      'contenu_inapproprie',
      'spam',
      'faux_avis',
      'langage_offensant',
      'hors_sujet',
      'autre'
    ];
    
    if (!raison || !raisonsValides.includes(raison)) {
      const error = new Error('Raison de signalement invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const avis = await Avis.findById(id);
    
    if (!avis) {
      const error = new Error('Avis non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    await avis.signaler(req.utilisateur.id, raison, description);
    
    res.status(200).json({
      success: true,
      message: 'Signalement enregistré avec succès',
      data: null
    });
    
  } catch (error) {
    if (error.message.includes('déjà signalé')) {
      error.statusCode = 400;
    }
    next(error);
  }
};

// @desc    Modérer un avis (Admin)
// @route   PATCH /api/avis/:id/moderer
// @access  Private/Admin
const modererAvis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut, raisonRejet } = req.body;
    
    const statutsValides = ['approuve', 'rejete'];
    if (!statut || !statutsValides.includes(statut)) {
      const error = new Error('Statut de modération invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const updateData = {
      statut,
      moderePar: req.utilisateur.id,
      dateApprobation: statut === 'approuve' ? new Date() : undefined
    };
    
    if (statut === 'rejete' && raisonRejet) {
      updateData.raisonRejet = raisonRejet;
    }
    
    const avis = await Avis.findByIdAndUpdate(id, updateData, { new: true })
      .populate('utilisateur', 'nom prenom')
      .populate('plat', 'nom');
    
    if (!avis) {
      const error = new Error('Avis non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    res.status(200).json({
      success: true,
      message: `Avis ${statut === 'approuve' ? 'approuvé' : 'rejeté'} avec succès`,
      data: { avis }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter une réponse restaurant (Admin)
// @route   POST /api/avis/:id/reponse
// @access  Private/Admin
const ajouterReponseRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenu } = req.body;
    
    if (!contenu || contenu.trim() === '') {
      const error = new Error('Le contenu de la réponse est obligatoire');
      error.statusCode = 400;
      return next(error);
    }
    
    const avis = await Avis.findById(id);
    
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
    
    await avis.ajouterReponseRestaurant(contenu, req.utilisateur.id);
    
    const avisPopule = await Avis.findById(id)
      .populate('utilisateur', 'nom prenom')
      .populate('reponseRestaurant.auteur', 'nom prenom');
    
    res.status(200).json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      data: { avis: avisPopule }
    });
    
  } catch (error) {
    next(error);
  }
};

// Routes publiques
router.get('/plat/:platId', 
  validerIdMongoDB('platId'),
  validerPagination,
  obtenirAvisPlat
);

// Routes protégées
router.get('/mes-avis',
  protegerRoute,
  validerPagination,
  obtenirMesAvis
);

router.post('/', 
  protegerRoute,
  validerAvis,
  creerAvis
);

router.post('/:id/voter', 
  protegerRoute,
  validerIdMongoDB(),
  voterAvis
);

router.post('/:id/signaler', 
  protegerRoute,
  validerIdMongoDB(),
  signalerAvis
);

// Routes admin
router.patch('/:id/moderer', 
  protegerRoute,
  restreindreAcces('admin'),
  validerIdMongoDB(),
  modererAvis
);

router.post('/:id/reponse', 
  protegerRoute,
  restreindreAcces('admin'),
  validerIdMongoDB(),
  ajouterReponseRestaurant
);

export default router;