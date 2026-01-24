import { Plat, Avis } from '../models/index.js';
import mongoose from 'mongoose';

// @desc    Obtenir tous les plats avec filtres
// @route   GET /api/plats
// @access  Public
export const obtenirPlats = async (req, res, next) => {
  try {
    const {
      page = 1,
      limite = 20,
      categorie,
      pays,
      prixMin,
      prixMax,
      niveauEpice,
      vegetarien,
      disponibleSeulement = 'true',
      tri = 'populaire',
      recherche
    } = req.query;
    
    // Construire la query de base
    let query = {};
    
    // Filtres
    if (categorie) query.categorie = categorie;
    if (pays) query['origineAfricaine.pays'] = pays;
    if (niveauEpice) query.niveauEpice = niveauEpice;
    if (vegetarien === 'true') query.regimesCompatibles = { $in: ['vegetarien', 'vegan'] };
    if (disponibleSeulement === 'true') {
      query.disponible = true;
      query.enRupture = false;
    }
    
    // Recherche textuelle
    if (recherche) {
      query.$text = { $search: recherche };
    }
    
    // Construction de l'agrégation pour gérer le prix effectif
    let pipeline = [
      { $match: query },
      {
        $addFields: {
          prixEffectif: {
            $cond: {
              if: { 
                $and: [
                  { $gt: ['$prixPromo', 0] }, 
                  { $lt: ['$prixPromo', '$prix'] }
                ] 
              },
              then: '$prixPromo',
              else: '$prix'
            }
          }
        }
      }
    ];
    
    // Filtre de prix sur le prix effectif
    if (prixMin || prixMax) {
      const prixFilter = {};
      if (prixMin) prixFilter.$gte = parseFloat(prixMin);
      if (prixMax) prixFilter.$lte = parseFloat(prixMax);
      pipeline.push({ $match: { prixEffectif: prixFilter } });
    }
    
    // Tri
    let sortStage = {};
    switch (tri) {
      case 'prix-asc':
        sortStage = { prixEffectif: 1, nom: 1 };
        break;
      case 'prix-desc':
        sortStage = { prixEffectif: -1, nom: 1 };
        break;
      case 'nom':
        sortStage = { nom: 1 };
        break;
      case 'note':
        sortStage = { notemoyenne: -1, nombreCommandes: -1 };
        break;
      case 'nouveau':
        sortStage = { createdAt: -1 };
        break;
      case 'populaire':
      default:
        sortStage = { nombreCommandes: -1, notemoyenne: -1 };
        break;
    }
    
    if (recherche) {
      sortStage = { score: { $meta: 'textScore' }, ...sortStage };
    }
    
    pipeline.push({ $sort: sortStage });
    
    // Pagination
    const limiteNum = parseInt(limite);
    const skip = (parseInt(page) - 1) * limiteNum;
    
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limiteNum });
    
    // Exécution de l'agrégation
    const plats = await Plat.aggregate(pipeline);
    
    // Compter le total pour la pagination
    const totalPipeline = [
      { $match: query },
      {
        $addFields: {
          prixEffectif: {
            $cond: {
              if: { 
                $and: [
                  { $gt: ['$prixPromo', 0] }, 
                  { $lt: ['$prixPromo', '$prix'] }
                ] 
              },
              then: '$prixPromo',
              else: '$prix'
            }
          }
        }
      }
    ];
    
    if (prixMin || prixMax) {
      const prixFilter = {};
      if (prixMin) prixFilter.$gte = parseFloat(prixMin);
      if (prixMax) prixFilter.$lte = parseFloat(prixMax);
      totalPipeline.push({ $match: { prixEffectif: prixFilter } });
    }
    
    totalPipeline.push({ $count: 'total' });
    
    const countResult = await Plat.aggregate(totalPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    // Métadonnées de pagination
    const pagination = {
      pageActuelle: parseInt(page),
      totalPages: Math.ceil(total / limiteNum),
      totalPlats: total,
      platsPourPage: limiteNum,
      aPrecedent: parseInt(page) > 1,
      aSuivant: parseInt(page) < Math.ceil(total / limiteNum)
    };
    
    res.status(200).json({
      success: true,
      message: 'Plats récupérés avec succès',
      data: { plats },
      pagination
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un plat par ID
// @route   GET /api/plats/:id
// @access  Public
export const obtenirPlatParId = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const plat = await Plat.findById(id).populate('creeParAdmin', 'nom prenom');
    
    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    // Obtenir les statistiques des avis
    const statistiquesAvis = await Avis.obtenirStatistiquesPlat(id);
    
    // Obtenir quelques avis récents
    const avisRecents = await Avis.rechercher({
      plat: id,
      limite: 5,
      tri: 'recent'
    });
    
    res.status(200).json({
      success: true,
      message: 'Plat récupéré avec succès',
      data: {
        plat,
        statistiquesAvis,
        avisRecents
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un plat par slug
// @route   GET /api/plats/slug/:slug
// @access  Public
export const obtenirPlatParSlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const plat = await Plat.findOne({ slug }).populate('creeParAdmin', 'nom prenom');
    
    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    // Obtenir les statistiques des avis
    const statistiquesAvis = await Avis.obtenirStatistiquesPlat(plat._id);
    
    // Obtenir quelques avis récents
    const avisRecents = await Avis.rechercher({
      plat: plat._id,
      limite: 5,
      tri: 'recent'
    });
    
    res.status(200).json({
      success: true,
      message: 'Plat récupéré avec succès',
      data: {
        plat,
        statistiquesAvis,
        avisRecents
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un nouveau plat
// @route   POST /api/plats
// @access  Private/Admin
export const creerPlat = async (req, res, next) => {
  try {
    const platData = {
      ...req.body,
      creeParAdmin: req.utilisateur.id
    };
    
    const plat = await Plat.create(platData);
    
    res.status(201).json({
      success: true,
      message: 'Plat créé avec succès',
      data: { plat }
    });
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      const customError = new Error(messages.join(', '));
      customError.statusCode = 400;
      return next(customError);
    }
    
    if (error.code === 11000) {
      const customError = new Error('Un plat avec ce slug existe déjà');
      customError.statusCode = 409;
      return next(customError);
    }
    
    next(error);
  }
};

// @desc    Mettre à jour un plat
// @route   PUT /api/plats/:id
// @access  Private/Admin
export const mettreAJourPlat = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const plat = await Plat.findByIdAndUpdate(
      id,
      { ...req.body, derniereModification: new Date() },
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Plat mis à jour avec succès',
      data: { plat }
    });
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      const customError = new Error(messages.join(', '));
      customError.statusCode = 400;
      return next(customError);
    }
    
    if (error.code === 11000) {
      const customError = new Error('Un plat avec ce slug existe déjà');
      customError.statusCode = 409;
      return next(customError);
    }
    
    next(error);
  }
};

// @desc    Supprimer un plat
// @route   DELETE /api/plats/:id
// @access  Private/Admin
export const supprimerPlat = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const plat = await Plat.findById(id);
    
    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    // Vérifier s'il y a des commandes en cours pour ce plat
    const Commande = mongoose.model('Commande');
    const commandesEnCours = await Commande.countDocuments({
      'articles.plat': id,
      statut: { $in: ['en_attente', 'confirmee', 'en_preparation', 'prete', 'en_livraison'] }
    });
    
    if (commandesEnCours > 0) {
      const error = new Error('Impossible de supprimer ce plat car il y a des commandes en cours');
      error.statusCode = 400;
      return next(error);
    }
    
    await Plat.findByIdAndDelete(id);
    
    // Supprimer aussi tous les avis associés
    await Avis.deleteMany({ plat: id });
    
    res.status(200).json({
      success: true,
      message: 'Plat supprimé avec succès',
      data: null
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les plats populaires
// @route   GET /api/plats/populaires/:limite
// @access  Public
export const obtenirPlatsPopulaires = async (req, res, next) => {
  try {
    const { limite = 10 } = req.params;
    
    const plats = await Plat.obtenirPopulaires(parseInt(limite));
    
    res.status(200).json({
      success: true,
      message: 'Plats populaires récupérés avec succès',
      data: { plats }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les nouveautés
// @route   GET /api/plats/nouveautes/:limite
// @access  Public
export const obtenirNouveautes = async (req, res, next) => {
  try {
    const { limite = 10 } = req.params;
    
    const plats = await Plat.obtenirNouveautes(parseInt(limite));
    
    res.status(200).json({
      success: true,
      message: 'Nouveautés récupérées avec succès',
      data: { plats }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Rechercher des plats
// @route   GET /api/plats/recherche/:terme
// @access  Public
export const rechercherPlats = async (req, res, next) => {
  try {
    const { terme } = req.params;
    const {
      page = 1,
      limite = 20,
      categorie,
      pays,
      prixMin,
      prixMax,
      niveauEpice,
      vegetarien
    } = req.query;
    
    const options = {
      categorie,
      pays,
      prixMin: prixMin ? parseFloat(prixMin) : undefined,
      prixMax: prixMax ? parseFloat(prixMax) : undefined,
      niveauEpice,
      vegetarien: vegetarien === 'true',
      limite: parseInt(limite),
      page: parseInt(page)
    };
    
    const plats = await Plat.rechercher(terme, options);
    
    res.status(200).json({
      success: true,
      message: 'Recherche effectuée avec succès',
      data: { 
        plats,
        terme,
        nombreResultats: plats.length
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les catégories disponibles
// @route   GET /api/plats/categories
// @access  Public
export const obtenirCategories = async (req, res, next) => {
  try {
    const categories = await Plat.aggregate([
      { $group: { _id: '$categorie', nombre: { $sum: 1 } } },
      { $sort: { nombre: -1 } },
      { $project: { categorie: '$_id', nombre: 1, _id: 0 } }
    ]);
    
    const pays = await Plat.aggregate([
      { $group: { _id: '$origineAfricaine.pays', nombre: { $sum: 1 } } },
      { $sort: { nombre: -1 } },
      { $project: { pays: '$_id', nombre: 1, _id: 0 } }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Catégories récupérées avec succès',
      data: {
        categories,
        pays
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour la disponibilité d'un plat
// @route   PATCH /api/plats/:id/disponibilite
// @access  Private/Admin
export const mettreAJourDisponibilite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { disponible, enRupture, quantiteDisponible } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const plat = await Plat.findByIdAndUpdate(
      id,
      {
        disponible,
        enRupture,
        quantiteDisponible,
        derniereModification: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Disponibilité mise à jour avec succès',
      data: { plat }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour le prix promotionnel
// @route   PATCH /api/plats/:id/promotion
// @access  Private/Admin
export const mettreAJourPromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prixPromo } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const plat = await Plat.findById(id);
    
    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    // Valider que le prix promo est inférieur au prix normal
    if (prixPromo && prixPromo >= plat.prix) {
      const error = new Error('Le prix promotionnel doit être inférieur au prix normal');
      error.statusCode = 400;
      return next(error);
    }
    
    plat.prixPromo = prixPromo || null;
    plat.derniereModification = new Date();
    
    await plat.save();
    
    res.status(200).json({
      success: true,
      message: 'Promotion mise à jour avec succès',
      data: { plat }
    });
    
  } catch (error) {
    next(error);
  }
};