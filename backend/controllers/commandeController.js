import { Commande, Plat, User } from '../models/index.js';
import mongoose from 'mongoose';

// @desc    Créer une nouvelle commande
// @route   POST /api/commandes
// @access  Private
export const creerCommande = async (req, res, next) => {
  try {
    const {
      articles,
      adresseLivraison,
      preferences,
      methodePaiement,
      typeLivraison = 'domicile',
      codePromo,
      instructions
    } = req.body;
    
    // Validation des champs requis
    if (!articles || articles.length === 0) {
      const error = new Error('Au moins un article est requis');
      error.statusCode = 400;
      return next(error);
    }
    
    if (!adresseLivraison) {
      const error = new Error('L\'adresse de livraison est requise');
      error.statusCode = 400;
      return next(error);
    }
    
    if (!methodePaiement) {
      const error = new Error('La méthode de paiement est requise');
      error.statusCode = 400;
      return next(error);
    }
    
    // Récupérer les informations du client
    const client = await User.findById(req.utilisateur.id);
    if (!client) {
      const error = new Error('Client non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    // Vérifier et calculer les articles
    let articlesCommande = [];
    let sousTotal = 0;
    
    for (const article of articles) {
      const plat = await Plat.findById(article.platId);
      
      if (!plat) {
        const error = new Error(`Plat non trouvé: ${article.platId}`);
        error.statusCode = 404;
        return next(error);
      }
      
      if (!plat.disponible || plat.enRupture) {
        const error = new Error(`Le plat "${plat.nom}" n'est pas disponible`);
        error.statusCode = 400;
        return next(error);
      }
      
      // Vérifier la quantité disponible
      if (plat.quantiteDisponible !== null && article.quantite > plat.quantiteDisponible) {
        const error = new Error(`Quantité insuffisante pour "${plat.nom}". Disponible: ${plat.quantiteDisponible}`);
        error.statusCode = 400;
        return next(error);
      }
      
      const prixUnitaire = plat.prixPromo && plat.prixPromo > 0 ? plat.prixPromo : plat.prix;
      let supplementsTotal = 0;
      
      // Calculer les suppléments des variations
      if (article.variations) {
        for (const variation of article.variations) {
          const variationPlat = plat.variations.find(v => v.nom === variation.nom);
          if (variationPlat) {
            const option = variationPlat.options.find(o => o.nom === variation.optionChoisie);
            if (option) {
              supplementsTotal += option.supplementPrix || 0;
            }
          }
        }
      }
      
      const sousArticle = (prixUnitaire + supplementsTotal) * article.quantite;
      
      articlesCommande.push({
        plat: plat._id,
        informationsPlat: {
          nom: plat.nom,
          description: plat.description,
          prix: prixUnitaire,
          image: plat.images.principale,
          categorie: plat.categorie
        },
        quantite: article.quantite,
        prixUnitaire,
        variations: article.variations || [],
        instructions: article.instructions || '',
        sousTotal: sousArticle
      });
      
      sousTotal += sousArticle;
    }
    
    // Calculer les frais de livraison (à adapter selon votre logique)
    let fraisLivraison = 0;
    if (typeLivraison === 'domicile') {
      fraisLivraison = sousTotal < 30 ? 3.90 : 0; // Gratuit à partir de 30€
    }
    
    // Appliquer le code promo (à adapter selon votre logique)
    let remise = 0;
    if (codePromo) {
      // Logique de validation du code promo
      // Pour l'exemple, on applique une remise fixe
      if (codePromo === 'BIENVENUE10') {
        remise = Math.min(sousTotal * 0.1, 10); // 10% max 10€
      }
    }
    
    // Calculer les taxes (exemple: 10%)
    const taxes = (sousTotal + fraisLivraison - remise) * 0.10;
    
    // Total final
    const total = sousTotal + fraisLivraison + taxes - remise;
    
    // Créer la commande
    const nouvelleCommande = await Commande.create({
      client: client._id,
      informationsClient: {
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone
      },
      adresseLivraison,
      articles: articlesCommande,
      montants: {
        sousTotal,
        fraisLivraison,
        taxes,
        remise,
        codePromo,
        total
      },
      paiement: {
        methode: methodePaiement,
        statut: 'en_attente'
      },
      livraison: {
        type: typeLivraison,
        instructions: instructions
      },
      preferences,
      source: 'web'
    });
    
    // Mettre à jour les compteurs des plats et les quantités
    for (const article of articlesCommande) {
      await Plat.findByIdAndUpdate(article.plat, {
        $inc: { 
          nombreCommandes: article.quantite,
          ...(plat.quantiteDisponible !== null && { quantiteDisponible: -article.quantite })
        }
      });
    }
    
    // Mettre à jour les statistiques du client
    await client.mettreAJourStatistiques(total);
    
    // Populer la commande pour la réponse
    const commandePopulee = await Commande.findById(nouvelleCommande._id)
      .populate('client', 'nom prenom email telephone')
      .populate('articles.plat', 'nom prix images.principale');
    
    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: { commande: commandePopulee }
    });
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      const customError = new Error(messages.join(', '));
      customError.statusCode = 400;
      return next(customError);
    }
    next(error);
  }
};

// @desc    Obtenir les commandes de l'utilisateur
// @route   GET /api/commandes/mes-commandes
// @access  Private
export const obtenirMesCommandes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limite = 10,
      statut,
      dateDebut,
      dateFin
    } = req.query;
    
    const criteres = {
      client: req.utilisateur.id,
      statut,
      dateDebut,
      dateFin,
      limite: parseInt(limite),
      page: parseInt(page)
    };
    
    const commandes = await Commande.rechercher(criteres);
    
    // Compter le total
    let queryTotal = { client: req.utilisateur.id };
    if (statut) queryTotal.statut = statut;
    if (dateDebut || dateFin) {
      queryTotal.createdAt = {};
      if (dateDebut) queryTotal.createdAt.$gte = new Date(dateDebut);
      if (dateFin) queryTotal.createdAt.$lte = new Date(dateFin);
    }
    
    const total = await Commande.countDocuments(queryTotal);
    
    const pagination = {
      pageActuelle: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limite)),
      totalCommandes: total,
      commandesPourPage: parseInt(limite)
    };
    
    res.status(200).json({
      success: true,
      message: 'Commandes récupérées avec succès',
      data: { commandes },
      pagination
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir une commande par ID
// @route   GET /api/commandes/:id
// @access  Private
export const obtenirCommandeParId = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de commande invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const commande = await Commande.findById(id)
      .populate('client', 'nom prenom email telephone avatar')
      .populate('articles.plat', 'nom prix images.principale description')
      .populate('livraison.livreur', 'nom prenom telephone');
    
    if (!commande) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      return next(error);
    }
    
    // Vérifier que l'utilisateur est le propriétaire de la commande ou un admin
    if (commande.client._id.toString() !== req.utilisateur.id.toString() && 
        req.utilisateur.role !== 'admin') {
      const error = new Error('Non autorisé à voir cette commande');
      error.statusCode = 403;
      return next(error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Commande récupérée avec succès',
      data: { commande }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Annuler une commande
// @route   PATCH /api/commandes/:id/annuler
// @access  Private
export const annulerCommande = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de commande invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const commande = await Commande.findById(id);
    
    if (!commande) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      return next(error);
    }
    
    // Vérifier que l'utilisateur est le propriétaire
    if (commande.client.toString() !== req.utilisateur.id.toString()) {
      const error = new Error('Non autorisé à annuler cette commande');
      error.statusCode = 403;
      return next(error);
    }
    
    // Vérifier si la commande peut être annulée
    if (!commande.peutEtreAnnulee) {
      const error = new Error('Cette commande ne peut plus être annulée');
      error.statusCode = 400;
      return next(error);
    }
    
    // Changer le statut
    await commande.changerStatut('annulee', raison || 'Annulée par le client', req.utilisateur.id);
    
    // Remettre les quantités en stock si nécessaire
    for (const article of commande.articles) {
      const plat = await Plat.findById(article.plat);
      if (plat && plat.quantiteDisponible !== null) {
        plat.quantiteDisponible += article.quantite;
        plat.nombreCommandes = Math.max(0, plat.nombreCommandes - article.quantite);
        await plat.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Commande annulée avec succès',
      data: { commande }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Évaluer une commande
// @route   POST /api/commandes/:id/evaluer
// @access  Private
export const evaluerCommande = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, commentaire, recommande } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de commande invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    if (!note || note < 1 || note > 5) {
      const error = new Error('La note doit être entre 1 et 5');
      error.statusCode = 400;
      return next(error);
    }
    
    const commande = await Commande.findById(id);
    
    if (!commande) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      return next(error);
    }
    
    // Vérifier que l'utilisateur est le propriétaire
    if (commande.client.toString() !== req.utilisateur.id.toString()) {
      const error = new Error('Non autorisé à évaluer cette commande');
      error.statusCode = 403;
      return next(error);
    }
    
    if (commande.evaluation) {
      const error = new Error('Cette commande a déjà été évaluée');
      error.statusCode = 400;
      return next(error);
    }
    
    await commande.ajouterEvaluation(note, commentaire, recommande);
    
    res.status(200).json({
      success: true,
      message: 'Évaluation ajoutée avec succès',
      data: { commande }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir toutes les commandes (Admin)
// @route   GET /api/commandes
// @access  Private/Admin
export const obtenirToutesCommandes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limite = 20,
      statut,
      dateDebut,
      dateFin,
      numeroCommande,
      clientId
    } = req.query;
    
    const criteres = {
      statut,
      dateDebut,
      dateFin,
      numeroCommande,
      client: clientId,
      limite: parseInt(limite),
      page: parseInt(page)
    };
    
    const commandes = await Commande.rechercher(criteres);
    
    // Compter le total
    let queryTotal = {};
    if (statut) queryTotal.statut = statut;
    if (clientId) queryTotal.client = clientId;
    if (numeroCommande) queryTotal.numeroCommande = new RegExp(numeroCommande, 'i');
    if (dateDebut || dateFin) {
      queryTotal.createdAt = {};
      if (dateDebut) queryTotal.createdAt.$gte = new Date(dateDebut);
      if (dateFin) queryTotal.createdAt.$lte = new Date(dateFin);
    }
    
    const total = await Commande.countDocuments(queryTotal);
    
    const pagination = {
      pageActuelle: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limite)),
      totalCommandes: total,
      commandesPourPage: parseInt(limite)
    };
    
    res.status(200).json({
      success: true,
      message: 'Commandes récupérées avec succès',
      data: { commandes },
      pagination
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Changer le statut d'une commande (Admin)
// @route   PATCH /api/commandes/:id/statut
// @access  Private/Admin
export const changerStatutCommande = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut, commentaire, livreurId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de commande invalide');
      error.statusCode = 400;
      return next(error);
    }
    
    const commande = await Commande.findById(id);
    
    if (!commande) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      return next(error);
    }
    
    // Assigner un livreur si nécessaire
    if (statut === 'en_livraison' && livreurId) {
      if (!mongoose.Types.ObjectId.isValid(livreurId)) {
        const error = new Error('ID de livreur invalide');
        error.statusCode = 400;
        return next(error);
      }
      
      const livreur = await User.findOne({ _id: livreurId, role: 'livreur' });
      if (!livreur) {
        const error = new Error('Livreur non trouvé');
        error.statusCode = 404;
        return next(error);
      }
      
      commande.livraison.livreur = livreurId;
    }
    
    await commande.changerStatut(statut, commentaire, req.utilisateur.id);
    
    const commandePopulee = await Commande.findById(id)
      .populate('client', 'nom prenom email telephone')
      .populate('livraison.livreur', 'nom prenom telephone');
    
    res.status(200).json({
      success: true,
      message: 'Statut de la commande mis à jour avec succès',
      data: { commande: commandePopulee }
    });
    
  } catch (error) {
    if (error.message.includes('Transition de statut non valide')) {
      error.statusCode = 400;
    }
    next(error);
  }
};

// @desc    Obtenir les statistiques des commandes (Admin)
// @route   GET /api/commandes/statistiques
// @access  Private/Admin
export const obtenirStatistiques = async (req, res, next) => {
  try {
    const { 
      dateDebut = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      dateFin = new Date()
    } = req.query;
    
    const statistiques = await Commande.obtenirStatistiques(dateDebut, dateFin);
    
    // Statistiques par statut
    const statsParStatut = await Commande.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(dateDebut), $lte: new Date(dateFin) }
        }
      },
      {
        $group: {
          _id: '$statut',
          nombre: { $sum: 1 },
          montantTotal: { $sum: '$montants.total' }
        }
      }
    ]);
    
    // Évolution des commandes par jour
    const evolutionQuotidienne = await Commande.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(dateDebut), $lte: new Date(dateFin) }
        }
      },
      {
        $group: {
          _id: {
            annee: { $year: '$createdAt' },
            mois: { $month: '$createdAt' },
            jour: { $dayOfMonth: '$createdAt' }
          },
          nombreCommandes: { $sum: 1 },
          revenus: { $sum: '$montants.total' }
        }
      },
      { $sort: { '_id.annee': 1, '_id.mois': 1, '_id.jour': 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: {
        statistiques,
        statsParStatut,
        evolutionQuotidienne
      }
    });
    
  } catch (error) {
    next(error);
  }
};