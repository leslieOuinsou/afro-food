# Backend Afro-Eats 🍽️

API RESTful complète pour l'application Afro-Eats, développée avec Node.js, Express et MongoDB.
Spécialisée dans la livraison de plats authentiques du Cameroun et du Bénin.

## 🎯 Fonctionnalités

- ✅ **Authentification JWT** complète (inscription, connexion, gestion de profil)
- ✅ **Gestion des plats** (CRUD avec filtres avancés, recherche textuelle, catégories)
- ✅ **Système de commandes** complet avec suivi de statut
- ✅ **Système d'avis** et évaluations avec modération
- ✅ **Upload d'images** sécurisé pour les plats
- ✅ **Middlewares de sécurité** (rate limiting, helmet, validation)
- ✅ **Templates d'emails** pour notifications
- ✅ **API de statistiques** pour dashboard admin
- ✅ **Documentation complète** des endpoints

## 📋 Prérequis

- **Node.js** (version 16 ou supérieure)
- **MongoDB** (local ou MongoDB Atlas)
- **npm** ou **yarn**

## 🚀 Installation rapide

1. **Installer les dépendances :**
```bash
npm install
```

2. **Configurer l'environnement :**
```bash
cp .env.example .env
```

3. **Configurer les variables dans `.env` :**
```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/afro-food

# Serveur
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=votre_cle_secrete_tres_longue_et_complexe
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# Sécurité
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=1000
```

4. **Démarrer le serveur :**
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

### Connexion à la page admin

Il n’y a pas d’admin par défaut. Pour en créer un :

```bash
node scripts/seedAdmin.js
```

Cela crée un compte admin avec :
- **Email :** `admin@afrofood.com`
- **Mot de passe :** `Admin123!`

Ensuite, allez sur la page **Connexion** du site (ou `/login`) et connectez-vous avec ces identifiants. En production, changez le mot de passe après la première connexion.

## 📁 Architecture du projet

```
backend/
├── 📂 config/
│   └── database.js           # Configuration MongoDB + gestion des erreurs
├── 📂 controllers/
│   ├── authController.js     # Authentification (inscription, connexion, profil)
│   ├── platController.js     # Gestion des plats (CRUD, recherche, filtres)
│   ├── commandeController.js # Gestion des commandes (création, suivi, stats)
│   └── avisController.js     # Système d'avis et modération
├── 📂 models/
│   ├── User.js              # Modèle utilisateur (clients, admins, livreurs)
│   ├── Plat.js              # Modèle plat (avec variations, nutrition, etc.)
│   ├── Commande.js          # Modèle commande (avec historique de statut)
│   ├── Avis.js              # Modèle avis (avec modération et votes)
│   └── index.js             # Export centralisé des modèles
├── 📂 routes/
│   ├── authRoutes.js        # Routes d'authentification
│   ├── platRoutes.js        # Routes des plats
│   ├── commandeRoutes.js    # Routes des commandes
│   ├── avisRoutes.js        # Routes des avis
│   └── index.js             # Routeur principal API
├── 📂 middleware/
│   ├── auth.js              # Middlewares d'authentification et autorisation
│   ├── validation.js        # Middlewares de validation des données
│   └── errorHandler.js      # Gestionnaire d'erreurs centralisé
├── 📂 utils/
│   ├── generateToken.js     # Utilitaires JWT
│   ├── emailTemplates.js    # Templates d'emails
│   └── helpers.js           # Fonctions utilitaires diverses
├── 📄 server.js             # Point d'entrée avec middlewares de sécurité
├── 📄 .env.example          # Template de configuration
└── 📄 package.json          # Dépendances et scripts
```

## 🔌 API Endpoints

### 🔐 Authentification (`/api/auth`)
```
POST   /inscription          # Créer un compte
POST   /connexion            # Se connecter
POST   /deconnexion          # Se déconnecter
GET    /profil               # Obtenir le profil
PUT    /profil               # Mettre à jour le profil
PUT    /mot-de-passe         # Changer le mot de passe
POST   /adresses             # Ajouter une adresse
DELETE /adresses/:id         # Supprimer une adresse
GET    /verifier             # Vérifier l'authentification
```

### 🍽️ Plats (`/api/plats`)
```
GET    /                     # Liste des plats (avec filtres)
GET    /categories           # Catégories disponibles
GET    /populaires/:limite   # Plats populaires
GET    /nouveautes/:limite   # Nouveautés
GET    /recherche/:terme     # Recherche textuelle
GET    /:id                  # Détails d'un plat
GET    /slug/:slug           # Plat par slug

# Routes admin
POST   /                     # Créer un plat
PUT    /:id                  # Modifier un plat
DELETE /:id                  # Supprimer un plat
PATCH  /:id/disponibilite    # Gérer la disponibilité
PATCH  /:id/promotion        # Gérer les promotions
```

### 📦 Commandes (`/api/commandes`)
```
POST   /                     # Créer une commande
GET    /mes-commandes        # Mes commandes (client)
GET    /:id                  # Détails d'une commande
PATCH  /:id/annuler          # Annuler une commande
POST   /:id/evaluer          # Évaluer une commande

# Routes admin/livreur
GET    /                     # Toutes les commandes
PATCH  /:id/statut           # Changer le statut
GET    /statistiques/general # Statistiques
```

### ⭐ Avis (`/api/avis`)
```
GET    /plat/:platId         # Avis d'un plat
POST   /                     # Créer un avis
POST   /:id/voter            # Voter sur l'utilité
POST   /:id/signaler         # Signaler un avis

# Routes admin
PATCH  /:id/moderer          # Modérer un avis
POST   /:id/reponse          # Réponse restaurant
```

### 📊 Utilitaires
```
GET    /api/info             # Informations sur l'API
GET    /api/statistiques     # Statistiques publiques
GET    /api/health           # État de santé
GET    /health               # État détaillé (DB, mémoire)
```

## 🛡️ Sécurité intégrée

- **Helmet.js** : Protection contre les vulnérabilités communes
- **Rate Limiting** : Limitation du nombre de requêtes
- **CORS** configuré pour le frontend
- **Validation** complète des données d'entrée
- **Authentification JWT** avec cookies sécurisés
- **Hachage des mots de passe** avec bcrypt
- **Middlewares d'autorisation** par rôle
- **Compression** des réponses HTTP

## 🔧 Modèles de données

### 👤 **User (Utilisateur)**
```javascript
{
  nom, prenom, email, telephone, motDePasse,
  role: ['client', 'admin', 'livreur'],
  adresses: [{ type, nom, adresse, ville, codePostal, parDefaut }],
  preferences: { allergies, regimeAlimentaire, niveauEpice },
  estActif, emailVerifie, nombreCommandes, montantTotalCommandes
}
```

### 🍽️ **Plat**
```javascript
{
  nom, description, prix, prixPromo, categorie,
  origineAfricaine: { pays, region, traditionnel },
  images: { principale, galerie },
  nutrition: { calories, proteines, glucides },
  allergenes, regimesCompatibles, niveauEpice,
  ingredients, tempsPreparation, disponible,
  notemoyenne, nombreAvis, nombreCommandes, tags
}
```

### 📦 **Commande**
```javascript
{
  numeroCommande, client, informationsClient,
  adresseLivraison, articles: [{ plat, quantite, prix }],
  montants: { sousTotal, fraisLivraison, taxes, total },
  statut: ['en_attente', 'confirmee', 'en_preparation', 'en_livraison', 'livree'],
  paiement: { methode, statut, transactionId },
  livraison: { type, livreur, heureEstimee },
  evaluation: { note, commentaire }
}
```

### ⭐ **Avis**
```javascript
{
  plat, utilisateur, commande, note, commentaire,
  evaluations: { gout, presentation, quantite, rapportQualitePrix },
  recommande, photos, statut: ['en_attente', 'approuve', 'rejete'],
  utile, pasUtile, votants, signalements
}
```

## 📈 Exemples d'utilisation

### Recherche de plats avec filtres :
```bash
GET /api/plats?categorie=plats-principaux&pays=cameroun&prixMax=20&vegetarien=true&page=1&limite=10
```

### Création d'une commande :
```javascript
POST /api/commandes
{
  "articles": [
    { "platId": "...", "quantite": 2, "variations": [...] }
  ],
  "adresseLivraison": { "nom": "...", "adresse": "...", "ville": "...", "codePostal": "..." },
  "methodePaiement": "carte",
  "preferences": { "niveauEpice": "moyen" }
}
```

## 🚦 Codes de statut HTTP

- **200** : Succès
- **201** : Ressource créée
- **400** : Erreur de validation
- **401** : Non authentifié
- **403** : Non autorisé
- **404** : Ressource non trouvée
- **409** : Conflit (doublon)
- **429** : Trop de requêtes
- **500** : Erreur serveur

## 🧪 Tests et développement

```bash
# Démarrage avec rechargement automatique
npm run dev

# Utilisation avec nodemon
npm run dev:nodemon

# Vérification de l'état
curl http://localhost:5000/health
```

## 📧 Templates d'emails inclus

- Email de bienvenue
- Confirmation de commande
- Mise à jour de statut
- Réinitialisation de mot de passe
- Vérification d'email
- Emails promotionnels

## 🔗 Intégration Frontend

L'API est conçue pour s'intégrer parfaitement avec le frontend Next.js. 
Configuration CORS incluse pour `http://localhost:3000`.

## 📝 Logs et monitoring

- Logs HTTP avec Morgan (développement)
- Logs d'authentification
- Gestion centralisée des erreurs
- Monitoring de santé avec métriques

---

**Développé avec ❤️ pour Afro-Eats**  
*Apportant les saveurs authentiques du Cameroun et du Bénin à votre porte*
