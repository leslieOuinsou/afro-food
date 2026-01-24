// Importation des dépendances nécessaires
import express from 'express'; // Framework web Express pour créer l'API
import cors from 'cors'; // Middleware pour gérer les requêtes cross-origin (CORS)
import dotenv from 'dotenv'; // Pour charger les variables d'environnement depuis .env
import { connectDB } from './config/database.js'; // Fonction de connexion à MongoDB
import routes from './routes/index.js'; // Routes API
import { errorHandler, notFound } from './middleware/errorHandler.js'; // Middlewares de gestion d'erreurs

// Chargement des variables d'environnement
dotenv.config();

// Création de l'application Express
const app = express();

// Configuration du port (par défaut 5000 si PORT n'est pas défini dans .env)
const PORT = process.env.PORT || 5000;

// Middleware pour parser les requêtes JSON (permet de lire les données JSON dans le body)
app.use(express.json());

// Middleware CORS - permet à notre frontend (Next.js) de communiquer avec le backend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // URL du frontend
  credentials: true // Permet l'envoi de cookies/credentials
}));

// Route de test pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API Afro Food!',
    status: 'OK'
  });
});

// Route de santé pour vérifier l'état du serveur
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Utilisation des routes API (toutes les routes commencent par /api)
app.use('/api', routes);

// Middleware pour les routes non trouvées (404) - doit être après toutes les routes
app.use(notFound);

// Middleware de gestion d'erreurs - doit être le dernier middleware
app.use(errorHandler);

// Message de démarrage initial
console.log('\n═══════════════════════════════════════');
console.log('🚀 Démarrage du serveur backend...');
console.log('═══════════════════════════════════════\n');

// Connexion à la base de données MongoDB
connectDB()
  .then(() => {
    // Démarrage du serveur seulement si la connexion à la DB réussit
    app.listen(PORT, () => {
      // Forcer l'affichage immédiat
      process.stdout.write('\n');
      process.stdout.write('═══════════════════════════════════════\n');
      process.stdout.write('✅ SERVEUR BACKEND ACTIF\n');
      process.stdout.write('═══════════════════════════════════════\n');
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 API disponible sur http://localhost:${PORT}`);
      console.log(`📡 MongoDB connecté avec succès`);
      console.log('═══════════════════════════════════════\n');
    });
  })
  .catch((error) => {
    // En cas d'erreur de connexion, afficher l'erreur et arrêter le processus
    console.error('\n❌ Erreur de connexion à la base de données:', error);
    console.error('═══════════════════════════════════════\n');
    process.exit(1); // Arrêter l'application si la DB n'est pas accessible
  });
