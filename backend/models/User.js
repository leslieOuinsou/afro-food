import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Informations de base
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  
  prenom: {
    type: String,
    required: [true, 'Le prénom est obligatoire'],
    trim: true,
    minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez entrer un email valide'
    ]
  },
  
  telephone: {
    type: String,
    required: [true, 'Le numéro de téléphone est obligatoire'],
    trim: true,
    match: [
      /^[\+]?[(]?[\d\s\-\(\)]{10,}$/,
      'Veuillez entrer un numéro de téléphone valide'
    ]
  },
  
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas inclure le mot de passe dans les requêtes par défaut
  },
  
  // Rôles et permissions
  role: {
    type: String,
    enum: {
      values: ['client', 'admin', 'livreur'],
      message: 'Le rôle doit être client, admin ou livreur'
    },
    default: 'client'
  },
  
  // Informations d'adresse
  adresses: [{
    type: {
      type: String,
      enum: ['domicile', 'travail', 'autre'],
      default: 'domicile'
    },
    nom: {
      type: String,
      required: true,
      trim: true
    },
    adresse: {
      type: String,
      required: true,
      trim: true
    },
    ville: {
      type: String,
      required: true,
      trim: true
    },
    codePostal: {
      type: String,
      required: true,
      trim: true
    },
    pays: {
      type: String,
      default: 'France',
      trim: true
    },
    parDefaut: {
      type: Boolean,
      default: false
    }
  }],
  
  // Préférences alimentaires
  preferences: {
    allergies: [{
      type: String,
      trim: true
    }],
    regimeAlimentaire: {
      type: String,
      enum: ['aucun', 'vegetarien', 'vegan', 'halal', 'kasher'],
      default: 'aucun'
    },
    niveauEpice: {
      type: String,
      enum: ['doux', 'moyen', 'epicee', 'tres-epicee'],
      default: 'moyen'
    }
  },
  
  // Statut du compte
  estActif: {
    type: Boolean,
    default: true
  },
  
  emailVerifie: {
    type: Boolean,
    default: false
  },
  
  telephoneVerifie: {
    type: Boolean,
    default: false
  },
  
  // Tokens de vérification
  tokenVerificationEmail: String,
  expirationTokenEmail: Date,
  tokenResetMotDePasse: String,
  expirationTokenReset: Date,
  
  // Statistiques client
  nombreCommandes: {
    type: Number,
    default: 0
  },
  
  montantTotalCommandes: {
    type: Number,
    default: 0
  },
  
  derniereConnexion: Date,
  
  // Avatar (optionnel)
  avatar: {
    type: String,
    default: null
  }
  
}, {
  timestamps: true, // Ajoute createdAt et updatedAt automatiquement
  toJSON: {
    transform: function(doc, ret) {
      delete ret.motDePasse;
      delete ret.tokenVerificationEmail;
      delete ret.expirationTokenEmail;
      delete ret.tokenResetMotDePasse;
      delete ret.expirationTokenReset;
      return ret;
    }
  }
});

// Index pour améliorer les performances de recherche
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'adresses.parDefaut': 1 });

// Middleware pre-save pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  // Seulement hasher le mot de passe s'il a été modifié (ou est nouveau)
  if (!this.isModified('motDePasse')) {
    return next();
  }
  
  try {
    // Hasher le mot de passe avec bcrypt
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.motDePasse = await bcrypt.hash(this.motDePasse, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour vérifier le mot de passe
userSchema.methods.verifierMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

// Méthode pour obtenir l'adresse par défaut
userSchema.methods.obtenirAdresseParDefaut = function() {
  return this.adresses.find(adresse => adresse.parDefaut) || this.adresses[0];
};

// Méthode pour définir une adresse par défaut
userSchema.methods.definirAdresseParDefaut = function(adresseId) {
  this.adresses.forEach(adresse => {
    adresse.parDefaut = adresse._id.toString() === adresseId.toString();
  });
};

// Méthode pour mettre à jour les statistiques
userSchema.methods.mettreAJourStatistiques = function(montantCommande) {
  this.nombreCommandes += 1;
  this.montantTotalCommandes += montantCommande;
  return this.save();
};

// Méthode statique pour rechercher par email
userSchema.statics.rechercherParEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+motDePasse');
};

export default mongoose.model('User', userSchema);