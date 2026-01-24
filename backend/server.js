// Importation des dépendances nécessaires
import express from 'express'; // Framework web Express pour créer l'API
import cors from 'cors'; // Middleware pour gérer les requêtes cross-origin (CORS)
import dotenv from 'dotenv'; // Pour charger les variables d'environnement depuis .env
import helmet from 'helmet'; // Middleware de sécurité
import morgan from 'morgan'; // Logger HTTP
import compression from 'compression'; // Middleware de compression
import cookieParser from 'cookie-parser'; // Parser pour les cookies
import rateLimit from 'express-rate-limit'; // Limitation du taux de requêtes
import { connectDB } from './config/database.js'; // Fonction de connexion à MongoDB
import routes from './routes/index.js'; // Routes API
import { errorHandler, notFound } from './middleware/errorHandler.js'; // Middlewares de gestion d'erreurs

// Chargement des variables d'environnement
dotenv.config();

// Création de l'application Express
const app = express();

// Configuration du port (par défaut 5000 si PORT n'est pas défini dans .env)
const PORT = process.env.PORT || 5000;

// Trust proxy si derrière un reverse proxy (Nginx, Cloudflare, etc.)
app.set('trust proxy', 1);

// Middlewares de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// Compression des réponses
app.use(compression());

// Logging des requêtes HTTP en mode développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// Limitation globale du taux de requêtes
const limiteGenerale = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes par défaut
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requêtes par défaut
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Retourner les informations de rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactiver les headers `X-RateLimit-*`
  skip: (req) => {
    // Ignorer la limitation pour les routes de santé
    return req.path === '/api/health' || req.path === '/health';
  }
});

app.use(limiteGenerale);

// Parser pour les cookies
app.use(cookieParser());

// Middleware pour parser les requêtes JSON (permet de lire les données JSON dans le body)
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));

// Middleware pour parser les requêtes URL-encoded
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Middleware CORS - permet à notre frontend (Next.js) de communiquer avec le backend
const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://afro-food.vercel.app' // Ajouter votre domaine de production
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true, // Permet l'envoi de cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ]
};

app.use(cors(corsOptions));

// Route racine pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Bienvenue sur l\'API Afro-Eats!',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    documentation: '/api/info'
  });
});

// Route de santé pour vérifier l'état du serveur et de la base de données
app.get('/health', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    const mongoose = await import('mongoose');
    const dbStatus = mongoose.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    const healthCheck = {
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        status: dbStatus,
        name: mongoose.default.connection.name || 'unknown'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };
    
    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Route de santé rapide pour les load balancers
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Utilisation des routes API (toutes les routes commencent par /api)
app.use('/api', routes);

// Middleware pour servir les fichiers statiques (uploads d'images)
app.use('/uploads', express.static('uploads'));

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
