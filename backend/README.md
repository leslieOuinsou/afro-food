# Backend Afro Food

Backend API pour l'application Afro Food, développé avec Node.js, Express et MongoDB.

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- MongoDB (local ou MongoDB Atlas)

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Créer un fichier `.env` à partir de `.env.example` :
```bash
cp .env.example .env
```

3. Configurer les variables d'environnement dans `.env` :
   - `MONGODB_URI` : URI de connexion à MongoDB
   - `PORT` : Port du serveur (par défaut 5000)
   - `FRONTEND_URL` : URL du frontend Next.js
   - `JWT_SECRET` : Clé secrète pour JWT

## 🏃 Exécution

### Mode développement (avec rechargement automatique) :
```bash
npm run dev
```

### Mode production :
```bash
npm start
```

## 📁 Structure du projet

```
backend/
├── config/
│   └── database.js       # Configuration de la connexion MongoDB
├── controllers/          # Contrôleurs (logique métier)
├── models/              # Modèles Mongoose (schémas de données)
├── routes/              # Routes API
├── middleware/          # Middlewares personnalisés
├── server.js            # Point d'entrée de l'application
├── .env                 # Variables d'environnement (non versionné)
└── package.json         # Dépendances et scripts
```

## 🔌 Endpoints API

- `GET /` - Message de bienvenue
- `GET /api/health` - Vérification de l'état du serveur

## 🗄️ Base de données

Le backend utilise MongoDB pour stocker les données. Assurez-vous que MongoDB est en cours d'exécution avant de démarrer le serveur.

### MongoDB local :
Démarrer MongoDB sur votre machine locale (port 27017 par défaut).

### MongoDB Atlas :
Utilisez l'URI de connexion fournie par MongoDB Atlas dans votre fichier `.env`.
