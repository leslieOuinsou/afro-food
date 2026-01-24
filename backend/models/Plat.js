import mongoose from 'mongoose';

const platSchema = new mongoose.Schema({
  // Informations de base
  nom: {
    type: String,
    required: [true, 'Le nom du plat est obligatoire'],
    trim: true,
    minlength: [3, 'Le nom doit contenir au moins 3 caractères'],
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  
  description: {
    type: String,
    required: [true, 'La description est obligatoire'],
    trim: true,
    minlength: [10, 'La description doit contenir au moins 10 caractères'],
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  
  descriptionLongue: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description longue ne peut pas dépasser 1000 caractères']
  },
  
  // Prix et disponibilité
  prix: {
    type: Number,
    required: [true, 'Le prix est obligatoire'],
    min: [0, 'Le prix ne peut pas être négatif'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Le prix doit être supérieur à 0'
    }
  },
  
  prixPromo: {
    type: Number,
    min: [0, 'Le prix promo ne peut pas être négatif'],
    validate: {
      validator: function(v) {
        return !v || v < this.prix;
      },
      message: 'Le prix promo doit être inférieur au prix normal'
    }
  },
  
  // Catégorisation
  categorie: {
    type: String,
    required: [true, 'La catégorie est obligatoire'],
    enum: {
      values: [
        'entrees',
        'plats-principaux', 
        'accompagnements',
        'desserts',
        'boissons',
        'specialites-africaines',
        'vegetarien',
        'vegan'
      ],
      message: 'Catégorie non valide'
    }
  },
  
  sousCategorie: {
    type: String,
    trim: true
  },
  
  // Origine géographique
  origineAfricaine: {
    pays: {
      type: String,
      required: [true, 'Le pays d\'origine est obligatoire'],
      enum: {
        values: [
          'cameroun',
          'benin',
          'senegal',
          'cote-ivoire',
          'mali',
          'burkina-faso',
          'ghana',
          'togo',
          'niger',
          'guinee',
          'multiple'
        ],
        message: 'Pays d\'origine non reconnu'
      }
    },
    region: {
      type: String,
      trim: true
    },
    traditionnel: {
      type: Boolean,
      default: true
    }
  },
  
  // Images
  images: {
    principale: {
      type: String,
      required: [true, 'Une image principale est obligatoire']
    },
    galerie: [{
      type: String
    }]
  },
  
  // Informations nutritionnelles
  nutrition: {
    calories: {
      type: Number,
      min: [0, 'Les calories ne peuvent pas être négatives']
    },
    proteines: Number,
    glucides: Number,
    lipides: Number,
    fibres: Number,
    sodium: Number
  },
  
  // Allergènes et régimes
  allergenes: [{
    type: String,
    enum: [
      'gluten',
      'lactose', 
      'oeufs',
      'arachides',
      'fruits-a-coque',
      'poisson',
      'crustaces',
      'soja',
      'sesame',
      'moutarde',
      'celeri',
      'lupin',
      'mollusques',
      'anhydride-sulfureux'
    ]
  }],
  
  regimesCompatibles: [{
    type: String,
    enum: [
      'vegetarien',
      'vegan', 
      'sans-gluten',
      'sans-lactose',
      'halal',
      'kasher',
      'sans-sucre-ajoute',
      'bio'
    ]
  }],
  
  // Niveau de piment
  niveauEpice: {
    type: String,
    enum: {
      values: ['doux', 'moyen', 'epicee', 'tres-epicee'],
      message: 'Niveau d\'épice non valide'
    },
    default: 'moyen'
  },
  
  // Ingrédients
  ingredients: [{
    nom: {
      type: String,
      required: true,
      trim: true
    },
    quantite: String,
    unite: String,
    optionnel: {
      type: Boolean,
      default: false
    }
  }],
  
  // Temps de préparation
  tempsPreparation: {
    type: Number, // en minutes
    min: [1, 'Le temps de préparation doit être d\'au moins 1 minute'],
    max: [480, 'Le temps de préparation ne peut pas dépasser 8 heures']
  },
  
  // Disponibilité et statut
  disponible: {
    type: Boolean,
    default: true
  },
  
  enRupture: {
    type: Boolean,
    default: false
  },
  
  quantiteDisponible: {
    type: Number,
    min: [0, 'La quantité disponible ne peut pas être négative'],
    default: null // null = quantité illimitée
  },
  
  // Popularité et évaluations
  notemoyenne: {
    type: Number,
    min: [0, 'La note ne peut pas être inférieure à 0'],
    max: [5, 'La note ne peut pas être supérieure à 5'],
    default: 0
  },
  
  nombreAvis: {
    type: Number,
    min: [0, 'Le nombre d\'avis ne peut pas être négatif'],
    default: 0
  },
  
  nombreCommandes: {
    type: Number,
    min: [0, 'Le nombre de commandes ne peut pas être négatif'], 
    default: 0
  },
  
  // Tags et mots-clés
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Métadonnées SEO
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  metaDescription: {
    type: String,
    maxlength: [160, 'La meta description ne peut pas dépasser 160 caractères']
  },
  
  // Informations de gestion
  creeParAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  derniereModification: {
    type: Date,
    default: Date.now
  },
  
  // Promotion et mise en avant
  estMisEnAvant: {
    type: Boolean,
    default: false
  },
  
  estNouveaute: {
    type: Boolean,
    default: false
  },
  
  dateFinNouveaute: Date,
  
  // Configuration pour les variations (tailles, options)
  variations: [{
    nom: {
      type: String,
      required: true
    },
    options: [{
      nom: String,
      supplementPrix: {
        type: Number,
        default: 0
      }
    }]
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches
platSchema.index({ nom: 1 });
platSchema.index({ categorie: 1 });
platSchema.index({ 'origineAfricaine.pays': 1 });
platSchema.index({ prix: 1 });
platSchema.index({ notemoyenne: -1 });
platSchema.index({ nombreCommandes: -1 });
platSchema.index({ disponible: 1, enRupture: 1 });
platSchema.index({ tags: 1 });
platSchema.index({ slug: 1 });

// Index de recherche textuelle
platSchema.index({
  nom: 'text',
  description: 'text',
  tags: 'text',
  'ingredients.nom': 'text'
});

// Virtual pour le prix effectif (promo ou normal)
platSchema.virtual('prixEffectif').get(function() {
  return this.prixPromo && this.prixPromo > 0 ? this.prixPromo : this.prix;
});

// Virtual pour le pourcentage de réduction
platSchema.virtual('pourcentageReduction').get(function() {
  if (!this.prixPromo || this.prixPromo >= this.prix) return 0;
  return Math.round(((this.prix - this.prixPromo) / this.prix) * 100);
});

// Virtual pour vérifier si en promotion
platSchema.virtual('enPromotion').get(function() {
  return this.prixPromo && this.prixPromo > 0 && this.prixPromo < this.prix;
});

// Middleware pre-save pour générer le slug
platSchema.pre('save', function(next) {
  if (this.isModified('nom')) {
    this.slug = this.nom
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Mettre à jour la date de dernière modification
  this.derniereModification = new Date();
  
  next();
});

// Méthode pour mettre à jour la note moyenne
platSchema.methods.mettreAJourNote = async function(nouvelleNote, ancienneNote = null) {
  if (ancienneNote) {
    // Mise à jour d'un avis existant
    const totalPoints = this.notemoyenne * this.nombreAvis;
    const nouveauTotal = totalPoints - ancienneNote + nouvelleNote;
    this.notemoyenne = nouveauTotal / this.nombreAvis;
  } else {
    // Nouvel avis
    const totalPoints = this.notemoyenne * this.nombreAvis + nouvelleNote;
    this.nombreAvis += 1;
    this.notemoyenne = totalPoints / this.nombreAvis;
  }
  
  // Arrondir à 1 décimale
  this.notemoyenne = Math.round(this.notemoyenne * 10) / 10;
  
  return this.save();
};

// Méthode pour incrémenter le compteur de commandes
platSchema.methods.incrementerCommandes = function(quantite = 1) {
  this.nombreCommandes += quantite;
  return this.save();
};

// Méthode statique pour rechercher des plats
platSchema.statics.rechercher = function(terme, options = {}) {
  const {
    categorie,
    pays,
    prixMin,
    prixMax,
    niveauEpice,
    vegetarien,
    disponibleSeulement = true,
    limite = 20,
    page = 1
  } = options;
  
  let query = {};
  
  // Recherche textuelle
  if (terme) {
    query.$text = { $search: terme };
  }
  
  // Filtres
  if (categorie) query.categorie = categorie;
  if (pays) query['origineAfricaine.pays'] = pays;
  if (niveauEpice) query.niveauEpice = niveauEpice;
  if (vegetarien) query.regimesCompatibles = { $in: ['vegetarien', 'vegan'] };
  if (disponibleSeulement) query.disponible = true;
  
  // Filtre de prix sur le prix effectif
  if (prixMin || prixMax) {
    const prixFilter = {};
    if (prixMin) prixFilter.$gte = prixMin;
    if (prixMax) prixFilter.$lte = prixMax;
    
    // Utiliser une aggregation pour filtrer sur le prix effectif
    return this.aggregate([
      { $match: query },
      {
        $addFields: {
          prixEffectif: {
            $cond: {
              if: { $and: [{ $gt: ['$prixPromo', 0] }, { $lt: ['$prixPromo', '$prix'] }] },
              then: '$prixPromo',
              else: '$prix'
            }
          }
        }
      },
      { $match: { prixEffectif: prixFilter } },
      { $sort: terme ? { score: { $meta: 'textScore' } } : { nombreCommandes: -1 } },
      { $skip: (page - 1) * limite },
      { $limit: limite }
    ]);
  }
  
  return this.find(query)
    .sort(terme ? { score: { $meta: 'textScore' } } : { nombreCommandes: -1 })
    .limit(limite)
    .skip((page - 1) * limite);
};

// Méthode statique pour obtenir les plats populaires
platSchema.statics.obtenirPopulaires = function(limite = 10) {
  return this.find({ disponible: true })
    .sort({ nombreCommandes: -1, notemoyenne: -1 })
    .limit(limite);
};

// Méthode statique pour obtenir les nouveautés
platSchema.statics.obtenirNouveautes = function(limite = 10) {
  return this.find({ 
    disponible: true,
    estNouveaute: true,
    $or: [
      { dateFinNouveaute: { $exists: false } },
      { dateFinNouveaute: { $gte: new Date() } }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limite);
};

export default mongoose.model('Plat', platSchema);