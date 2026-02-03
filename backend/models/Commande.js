import mongoose from 'mongoose';

const commandeSchema = new mongoose.Schema({
  // Numéro de commande unique
  numeroCommande: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Référence au client
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Un client est requis pour la commande']
  },
  
  // Informations client (snapshot au moment de la commande)
  informationsClient: {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true },
    telephone: { type: String, required: true }
  },
  
  // Adresse de livraison
  adresseLivraison: {
    nom: { type: String, required: true },
    adresse: { type: String, required: true },
    ville: { type: String, required: true },
    codePostal: { type: String, required: true },
    pays: { type: String, default: 'France' },
    complementAdresse: String,
    instructions: String // Instructions spéciales pour la livraison
  },
  
  // Articles commandés
  articles: [{
    plat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plat',
      required: true
    },
    // Snapshot des informations du plat au moment de la commande
    informationsPlat: {
      nom: { type: String, required: true },
      description: { type: String, required: true },
      prix: { type: Number, required: true },
      image: String,
      categorie: String
    },
    quantite: {
      type: Number,
      required: true,
      min: [1, 'La quantité doit être d\'au moins 1']
    },
    prixUnitaire: {
      type: Number,
      required: true,
      min: [0, 'Le prix unitaire ne peut pas être négatif']
    },
    variations: [{
      nom: String,
      optionChoisie: String,
      supplementPrix: {
        type: Number,
        default: 0
      }
    }],
    instructions: String, // Instructions spéciales pour ce plat
    sousTotal: {
      type: Number,
      required: true,
      min: [0, 'Le sous-total ne peut pas être négatif']
    }
  }],
  
  // Montants
  montants: {
    sousTotal: {
      type: Number,
      required: true,
      min: [0, 'Le sous-total ne peut pas être négatif']
    },
    fraisLivraison: {
      type: Number,
      default: 0,
      min: [0, 'Les frais de livraison ne peuvent pas être négatifs']
    },
    taxes: {
      type: Number,
      default: 0,
      min: [0, 'Les taxes ne peuvent pas être négatives']
    },
    remise: {
      type: Number,
      default: 0,
      min: [0, 'La remise ne peut pas être négative']
    },
    codePromo: String,
    total: {
      type: Number,
      required: true,
      min: [0, 'Le total ne peut pas être négatif']
    }
  },
  
  // Statut de la commande
  statut: {
    type: String,
    enum: {
      values: [
        'en_attente',      // Commande passée, en attente de confirmation
        'confirmee',       // Commande confirmée par le restaurant
        'en_preparation',  // Commande en cours de préparation
        'prete',          // Commande prête pour livraison
        'en_livraison',   // En cours de livraison
        'livree',         // Livrée avec succès
        'annulee',        // Annulée
        'remboursee'      // Remboursée
      ],
      message: 'Statut de commande non valide'
    },
    default: 'en_attente'
  },
  
  // Historique des changements de statut
  historiqueStatut: [{
    statut: {
      type: String,
      required: true
    },
    dateChangement: {
      type: Date,
      default: Date.now
    },
    commentaire: String,
    modifiePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Informations de paiement
  paiement: {
    methode: {
      type: String,
      enum: {
        values: ['carte', 'especes', 'mobile', 'virement'],
        message: 'Méthode de paiement non valide'
      },
      required: true
    },
    statut: {
      type: String,
      enum: {
        values: ['en_attente', 'valide', 'echec', 'rembourse'],
        message: 'Statut de paiement non valide'
      },
      default: 'en_attente'
    },
    transactionId: String,
    datePaiement: Date,
    montantPaye: Number
  },
  
  // Informations de livraison
  livraison: {
    type: {
      type: String,
      enum: {
        values: ['domicile', 'point_relais', 'retrait_sur_place'],
        message: 'Type de livraison non valide'
      },
      required: true,
      default: 'domicile'
    },
    livreur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    heureEstimee: Date,
    heureEffective: Date,
    codeTracking: String,
    instructions: String,
    preuve: {
      photo: String,
      signature: String,
      commentaire: String
    }
  },
  
  // Dates importantes
  dates: {
    commande: {
      type: Date,
      default: Date.now
    },
    confirmation: Date,
    preparation: Date,
    prete: Date,
    expedition: Date,
    livraison: Date,
    annulation: Date
  },
  
  // Préférences et instructions
  preferences: {
    niveauEpice: {
      type: String,
      enum: ['doux', 'moyen', 'epicee', 'tres-epicee']
    },
    allergies: [String],
    instructions: String
  },
  
  // Évaluation de la commande
  evaluation: {
    note: {
      type: Number,
      min: [1, 'La note doit être entre 1 et 5'],
      max: [5, 'La note doit être entre 1 et 5']
    },
    commentaire: String,
    dateEvaluation: Date,
    recommande: Boolean
  },
  
  // Informations pour le service client
  serviceClient: {
    reclamations: [{
      type: {
        type: String,
        enum: ['qualite', 'livraison', 'service', 'paiement', 'autre']
      },
      description: String,
      statut: {
        type: String,
        enum: ['ouverte', 'en_cours', 'resolue', 'fermee'],
        default: 'ouverte'
      },
      dateCreation: {
        type: Date,
        default: Date.now
      },
      dateResolution: Date,
      resolution: String
    }],
    notesSupplémentaires: String
  },
  
  // Métadonnées
  source: {
    type: String,
    enum: ['web', 'mobile', 'telephone', 'admin'],
    default: 'web'
  },
  
  deviceInfo: {
    userAgent: String,
    ip: String,
    device: String
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances (numeroCommande a déjà unique: true)
commandeSchema.index({ client: 1, createdAt: -1 });
commandeSchema.index({ statut: 1 });
commandeSchema.index({ 'dates.commande': -1 });
commandeSchema.index({ 'paiement.statut': 1 });
commandeSchema.index({ 'livraison.livreur': 1 });
commandeSchema.index({ createdAt: -1 });

// Virtual pour le temps écoulé depuis la commande
commandeSchema.virtual('dureeDepuisCommande').get(function() {
  return Date.now() - this.dates.commande.getTime();
});

// Virtual pour vérifier si la commande peut être annulée
commandeSchema.virtual('peutEtreAnnulee').get(function() {
  const statutsAnnulables = ['en_attente', 'confirmee'];
  const tempsLimite = 30 * 60 * 1000; // 30 minutes en millisecondes
  
  return statutsAnnulables.includes(this.statut) && 
         (Date.now() - this.dates.commande.getTime()) < tempsLimite;
});

// Virtual pour le statut de livraison formaté
commandeSchema.virtual('statutAffichage').get(function() {
  const statutsAffichage = {
    'en_attente': 'En attente de confirmation',
    'confirmee': 'Confirmée',
    'en_preparation': 'En préparation',
    'prete': 'Prête pour livraison',
    'en_livraison': 'En cours de livraison',
    'livree': 'Livrée',
    'annulee': 'Annulée',
    'remboursee': 'Remboursée'
  };
  
  return statutsAffichage[this.statut] || this.statut;
});

// Middleware pre-save pour générer le numéro de commande
commandeSchema.pre('save', async function(next) {
  if (this.isNew && !this.numeroCommande) {
    const annee = new Date().getFullYear();
    const mois = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Compter les commandes du mois
    const debut = new Date(annee, new Date().getMonth(), 1);
    const fin = new Date(annee, new Date().getMonth() + 1, 0, 23, 59, 59);
    
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: debut, $lte: fin }
    });
    
    const numero = String(count + 1).padStart(4, '0');
    this.numeroCommande = `CMD-${annee}${mois}-${numero}`;
  }
  
  next();
});

// Middleware pre-save pour calculer les montants
commandeSchema.pre('save', function(next) {
  // Calculer le sous-total
  this.montants.sousTotal = this.articles.reduce((total, article) => {
    article.sousTotal = article.quantite * article.prixUnitaire;
    // Ajouter les suppléments des variations
    if (article.variations) {
      article.variations.forEach(variation => {
        article.sousTotal += variation.supplementPrix || 0;
      });
    }
    return total + article.sousTotal;
  }, 0);
  
  // Calculer le total final
  this.montants.total = this.montants.sousTotal + 
                       this.montants.fraisLivraison + 
                       this.montants.taxes - 
                       this.montants.remise;
  
  next();
});

// Méthode pour changer le statut avec historique
commandeSchema.methods.changerStatut = function(nouveauStatut, commentaire = '', utilisateur = null) {
  // Vérifier si le changement de statut est valide
  const transitionsValides = {
    'en_attente': ['confirmee', 'annulee'],
    'confirmee': ['en_preparation', 'annulee'],
    'en_preparation': ['prete', 'annulee'],
    'prete': ['en_livraison', 'annulee'],
    'en_livraison': ['livree', 'annulee'],
    'livree': ['remboursee'],
    'annulee': [],
    'remboursee': []
  };
  
  if (!transitionsValides[this.statut].includes(nouveauStatut)) {
    throw new Error(`Transition de statut non valide: ${this.statut} -> ${nouveauStatut}`);
  }
  
  // Mettre à jour le statut
  const ancienStatut = this.statut;
  this.statut = nouveauStatut;
  
  // Ajouter à l'historique
  this.historiqueStatut.push({
    statut: nouveauStatut,
    commentaire,
    modifiePar: utilisateur
  });
  
  // Mettre à jour les dates correspondantes
  const maintenant = new Date();
  switch (nouveauStatut) {
    case 'confirmee':
      this.dates.confirmation = maintenant;
      break;
    case 'en_preparation':
      this.dates.preparation = maintenant;
      break;
    case 'prete':
      this.dates.prete = maintenant;
      break;
    case 'en_livraison':
      this.dates.expedition = maintenant;
      break;
    case 'livree':
      this.dates.livraison = maintenant;
      break;
    case 'annulee':
      this.dates.annulation = maintenant;
      break;
  }
  
  return this.save();
};

// Méthode pour ajouter une évaluation
commandeSchema.methods.ajouterEvaluation = function(note, commentaire = '', recommande = null) {
  if (this.statut !== 'livree') {
    throw new Error('Seules les commandes livrées peuvent être évaluées');
  }
  
  this.evaluation = {
    note,
    commentaire,
    recommande,
    dateEvaluation: new Date()
  };
  
  return this.save();
};

// Méthode statique pour obtenir les statistiques
commandeSchema.statics.obtenirStatistiques = async function(dateDebut, dateFin) {
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: new Date(dateDebut),
          $lte: new Date(dateFin)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalCommandes: { $sum: 1 },
        totalRevenu: { $sum: '$montants.total' },
        commandesLivrees: {
          $sum: { $cond: [{ $eq: ['$statut', 'livree'] }, 1, 0] }
        },
        commandesAnnulees: {
          $sum: { $cond: [{ $eq: ['$statut', 'annulee'] }, 1, 0] }
        },
        panierMoyen: { $avg: '$montants.total' },
        noteMovenne: { $avg: '$evaluation.note' }
      }
    }
  ];
  
  const stats = await this.aggregate(pipeline);
  return stats[0] || {
    totalCommandes: 0,
    totalRevenu: 0,
    commandesLivrees: 0,
    commandesAnnulees: 0,
    panierMoyen: 0,
    noteMovenne: 0
  };
};

// Méthode statique pour rechercher des commandes
commandeSchema.statics.rechercher = function(criteres = {}) {
  const {
    client,
    statut,
    dateDebut,
    dateFin,
    numeroCommande,
    limite = 20,
    page = 1
  } = criteres;
  
  let query = {};
  
  if (client) query.client = client;
  if (statut) query.statut = statut;
  if (numeroCommande) query.numeroCommande = new RegExp(numeroCommande, 'i');
  
  if (dateDebut || dateFin) {
    query.createdAt = {};
    if (dateDebut) query.createdAt.$gte = new Date(dateDebut);
    if (dateFin) query.createdAt.$lte = new Date(dateFin);
  }
  
  return this.find(query)
    .populate('client', 'nom prenom email telephone')
    .populate('articles.plat', 'nom prix images.principale')
    .sort({ createdAt: -1 })
    .limit(limite)
    .skip((page - 1) * limite);
};

export default mongoose.model('Commande', commandeSchema);