import mongoose from 'mongoose';

const avisSchema = new mongoose.Schema({
  // Références
  plat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plat',
    required: [true, 'Un plat est requis pour l\'avis']
  },
  
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Un utilisateur est requis pour l\'avis']
  },
  
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commande',
    required: [true, 'Une commande est requise pour l\'avis']
  },
  
  // Contenu de l'avis
  note: {
    type: Number,
    required: [true, 'Une note est obligatoire'],
    min: [1, 'La note doit être entre 1 et 5'],
    max: [5, 'La note doit être entre 1 et 5'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'La note doit être un nombre entier'
    }
  },
  
  titre: {
    type: String,
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  
  commentaire: {
    type: String,
    required: [true, 'Un commentaire est obligatoire'],
    trim: true,
    minlength: [10, 'Le commentaire doit contenir au moins 10 caractères'],
    maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères']
  },
  
  // Aspects détaillés de l'évaluation
  evaluations: {
    gout: {
      type: Number,
      min: [1, 'L\'évaluation du goût doit être entre 1 et 5'],
      max: [5, 'L\'évaluation du goût doit être entre 1 et 5']
    },
    presentation: {
      type: Number,
      min: [1, 'L\'évaluation de la présentation doit être entre 1 et 5'],
      max: [5, 'L\'évaluation de la présentation doit être entre 1 et 5']
    },
    quantite: {
      type: Number,
      min: [1, 'L\'évaluation de la quantité doit être entre 1 et 5'],
      max: [5, 'L\'évaluation de la quantité doit être entre 1 et 5']
    },
    rapportQualitePrix: {
      type: Number,
      min: [1, 'L\'évaluation du rapport qualité-prix doit être entre 1 et 5'],
      max: [5, 'L\'évaluation du rapport qualité-prix doit être entre 1 et 5']
    }
  },
  
  // Recommandation
  recommande: {
    type: Boolean,
    required: true
  },
  
  // Photos jointes à l'avis (optionnel)
  photos: [{
    url: {
      type: String,
      required: true
    },
    legende: {
      type: String,
      trim: true,
      maxlength: [200, 'La légende ne peut pas dépasser 200 caractères']
    }
  }],
  
  // Tags personnalisés
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Un tag ne peut pas dépasser 30 caractères']
  }],
  
  // Modération et statut
  statut: {
    type: String,
    enum: {
      values: ['en_attente', 'approuve', 'rejete', 'signale'],
      message: 'Statut d\'avis non valide'
    },
    default: 'en_attente'
  },
  
  dateApprobation: Date,
  
  moderePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  raisonRejet: {
    type: String,
    trim: true,
    maxlength: [300, 'La raison de rejet ne peut pas dépasser 300 caractères']
  },
  
  // Interactions avec l'avis
  utile: {
    type: Number,
    default: 0,
    min: [0, 'Le nombre de votes utiles ne peut pas être négatif']
  },
  
  pasUtile: {
    type: Number,
    default: 0,
    min: [0, 'Le nombre de votes pas utiles ne peut pas être négatif']
  },
  
  votants: [{
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['utile', 'pas_utile']
    },
    dateVote: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Signalements
  signalements: [{
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    raison: {
      type: String,
      enum: [
        'contenu_inapproprie',
        'spam',
        'faux_avis',
        'langage_offensant',
        'hors_sujet',
        'autre'
      ],
      required: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'La description ne peut pas dépasser 300 caractères']
    },
    dateSignalement: {
      type: Date,
      default: Date.now
    },
    traite: {
      type: Boolean,
      default: false
    }
  }],
  
  // Réponse du restaurant (optionnel)
  reponseRestaurant: {
    contenu: {
      type: String,
      trim: true,
      maxlength: [500, 'La réponse ne peut pas dépasser 500 caractères']
    },
    dateReponse: {
      type: Date,
      default: Date.now
    },
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Métadonnées
  langue: {
    type: String,
    enum: ['fr', 'en', 'es', 'de', 'it'],
    default: 'fr'
  },
  
  adresseIP: {
    type: String,
    select: false // Ne pas inclure par défaut dans les queries
  },
  
  userAgent: {
    type: String,
    select: false
  },
  
  // Vérification de l'achat
  achatVerifie: {
    type: Boolean,
    default: false
  },
  
  dateAchat: Date
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les performances
avisSchema.index({ plat: 1, createdAt: -1 });
avisSchema.index({ utilisateur: 1, createdAt: -1 });
avisSchema.index({ commande: 1 });
avisSchema.index({ statut: 1 });
avisSchema.index({ note: 1 });
avisSchema.index({ recommande: 1 });

// Index composé pour éviter les doublons
avisSchema.index({ utilisateur: 1, commande: 1, plat: 1 }, { unique: true });

// Index de recherche textuelle
avisSchema.index({
  titre: 'text',
  commentaire: 'text',
  tags: 'text'
});

// Virtual pour la note moyenne détaillée
avisSchema.virtual('noteMoyenneDetaillee').get(function() {
  if (!this.evaluations) return null;
  
  const evaluations = this.evaluations;
  const notes = [
    evaluations.gout,
    evaluations.presentation,
    evaluations.quantite,
    evaluations.rapportQualitePrix
  ].filter(note => note !== undefined && note !== null);
  
  if (notes.length === 0) return null;
  
  return Math.round((notes.reduce((sum, note) => sum + note, 0) / notes.length) * 10) / 10;
});

// Virtual pour le score d'utilité
avisSchema.virtual('scoreUtilite').get(function() {
  const total = this.utile + this.pasUtile;
  if (total === 0) return 0;
  return Math.round((this.utile / total) * 100);
});

// Virtual pour vérifier si l'avis est récent
avisSchema.virtual('estRecent').get(function() {
  const maintenant = new Date();
  const uneSemaine = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes
  return (maintenant - this.createdAt) < uneSemaine;
});

// Virtual pour le nom complet de l'utilisateur (si autorisé)
avisSchema.virtual('nomUtilisateur').get(function() {
  if (!this.utilisateur) return 'Utilisateur anonyme';
  if (typeof this.utilisateur === 'object' && this.utilisateur.nom) {
    // Masquer une partie du nom pour la confidentialité
    const nom = this.utilisateur.nom;
    const prenom = this.utilisateur.prenom;
    return `${prenom} ${nom.charAt(0)}.`;
  }
  return 'Utilisateur anonyme';
});

// Middleware pre-save pour vérification
avisSchema.pre('save', async function(next) {
  // Vérifier que l'utilisateur a bien commandé ce plat
  if (this.isNew) {
    const Commande = mongoose.model('Commande');
    const commande = await Commande.findOne({
      _id: this.commande,
      client: this.utilisateur,
      'articles.plat': this.plat,
      statut: 'livree'
    });
    
    if (!commande) {
      const error = new Error('Vous ne pouvez évaluer que les plats que vous avez commandés et reçus');
      error.statusCode = 403;
      return next(error);
    }
    
    this.achatVerifie = true;
    this.dateAchat = commande.dates.livraison;
  }
  
  // Auto-approuver si l'utilisateur est vérifié et l'avis semble légitime
  if (this.isNew && this.statut === 'en_attente') {
    const motsInterditsMajeurs = ['merde', 'fuck', 'connard', 'salope'];
    const contientMotsInterdits = motsInterditsMajeurs.some(mot => 
      this.commentaire.toLowerCase().includes(mot) || 
      (this.titre && this.titre.toLowerCase().includes(mot))
    );
    
    if (!contientMotsInterdits && this.commentaire.length >= 20) {
      this.statut = 'approuve';
      this.dateApprobation = new Date();
    }
  }
  
  next();
});

// Middleware post-save pour mettre à jour la note du plat
avisSchema.post('save', async function(doc, next) {
  if (doc.statut === 'approuve') {
    const Plat = mongoose.model('Plat');
    const plat = await Plat.findById(doc.plat);
    if (plat) {
      await plat.mettreAJourNote(doc.note);
    }
  }
  next();
});

// Méthode pour voter sur l'utilité de l'avis
avisSchema.methods.voter = function(utilisateurId, typeVote) {
  // Vérifier si l'utilisateur a déjà voté
  const voteExistant = this.votants.find(
    vote => vote.utilisateur.toString() === utilisateurId.toString()
  );
  
  if (voteExistant) {
    // Retirer l'ancien vote
    if (voteExistant.vote === 'utile') {
      this.utile = Math.max(0, this.utile - 1);
    } else {
      this.pasUtile = Math.max(0, this.pasUtile - 1);
    }
    
    // Si même vote, le retirer complètement
    if (voteExistant.vote === typeVote) {
      this.votants = this.votants.filter(
        vote => vote.utilisateur.toString() !== utilisateurId.toString()
      );
    } else {
      // Changer le vote
      voteExistant.vote = typeVote;
      voteExistant.dateVote = new Date();
      if (typeVote === 'utile') {
        this.utile += 1;
      } else {
        this.pasUtile += 1;
      }
    }
  } else {
    // Nouveau vote
    this.votants.push({
      utilisateur: utilisateurId,
      vote: typeVote,
      dateVote: new Date()
    });
    
    if (typeVote === 'utile') {
      this.utile += 1;
    } else {
      this.pasUtile += 1;
    }
  }
  
  return this.save();
};

// Méthode pour signaler un avis
avisSchema.methods.signaler = function(utilisateurId, raison, description = '') {
  // Vérifier si l'utilisateur a déjà signalé cet avis
  const signalementExistant = this.signalements.find(
    s => s.utilisateur.toString() === utilisateurId.toString()
  );
  
  if (signalementExistant) {
    throw new Error('Vous avez déjà signalé cet avis');
  }
  
  this.signalements.push({
    utilisateur: utilisateurId,
    raison,
    description
  });
  
  // Si plusieurs signalements, changer le statut
  if (this.signalements.length >= 3) {
    this.statut = 'signale';
  }
  
  return this.save();
};

// Méthode pour ajouter une réponse du restaurant
avisSchema.methods.ajouterReponseRestaurant = function(contenu, auteur) {
  this.reponseRestaurant = {
    contenu,
    auteur,
    dateReponse: new Date()
  };
  
  return this.save();
};

// Méthode statique pour obtenir les statistiques d'avis d'un plat
avisSchema.statics.obtenirStatistiquesPlat = async function(platId) {
  const stats = await this.aggregate([
    { $match: { plat: mongoose.Types.ObjectId(platId), statut: 'approuve' } },
    {
      $group: {
        _id: null,
        nombreTotal: { $sum: 1 },
        noteMoyenne: { $avg: '$note' },
        repartitionNotes: {
          $push: '$note'
        },
        pourcentageRecommandation: {
          $avg: { $cond: ['$recommande', 1, 0] }
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      nombreTotal: 0,
      noteMoyenne: 0,
      repartitionNotes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      pourcentageRecommandation: 0
    };
  }
  
  const stat = stats[0];
  
  // Calculer la répartition des notes
  const repartition = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  stat.repartitionNotes.forEach(note => {
    repartition[note] = (repartition[note] || 0) + 1;
  });
  
  return {
    nombreTotal: stat.nombreTotal,
    noteMoyenne: Math.round(stat.noteMoyenne * 10) / 10,
    repartitionNotes: repartition,
    pourcentageRecommandation: Math.round(stat.pourcentageRecommandation * 100)
  };
};

// Méthode statique pour rechercher des avis
avisSchema.statics.rechercher = function(criteres = {}) {
  const {
    plat,
    utilisateur,
    note,
    recommande,
    statut = 'approuve',
    dateDebut,
    dateFin,
    terme,
    limite = 20,
    page = 1,
    tri = 'recent'
  } = criteres;
  
  let query = { statut };
  
  if (plat) query.plat = plat;
  if (utilisateur) query.utilisateur = utilisateur;
  if (note) query.note = note;
  if (recommande !== undefined) query.recommande = recommande;
  
  if (dateDebut || dateFin) {
    query.createdAt = {};
    if (dateDebut) query.createdAt.$gte = new Date(dateDebut);
    if (dateFin) query.createdAt.$lte = new Date(dateFin);
  }
  
  if (terme) {
    query.$text = { $search: terme };
  }
  
  // Options de tri
  let sortOptions = {};
  switch (tri) {
    case 'recent':
      sortOptions = { createdAt: -1 };
      break;
    case 'ancien':
      sortOptions = { createdAt: 1 };
      break;
    case 'note_desc':
      sortOptions = { note: -1, createdAt: -1 };
      break;
    case 'note_asc':
      sortOptions = { note: 1, createdAt: -1 };
      break;
    case 'utile':
      sortOptions = { utile: -1, createdAt: -1 };
      break;
    default:
      sortOptions = { createdAt: -1 };
  }
  
  if (terme) {
    sortOptions = { score: { $meta: 'textScore' }, ...sortOptions };
  }
  
  return this.find(query)
    .populate('utilisateur', 'nom prenom avatar')
    .populate('plat', 'nom images.principale')
    .sort(sortOptions)
    .limit(limite)
    .skip((page - 1) * limite);
};

export default mongoose.model('Avis', avisSchema);