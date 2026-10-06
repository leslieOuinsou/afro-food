// Importation des dépendances nécessaires
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDB, disconnectDB } from './config/database.js';
import prisma from './lib/prisma.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const isVercel = process.env.VERCEL === '1';

app.set('trust proxy', 1);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://afro-food.vercel.app',
      'https://afrofood.vercel.app',
      'https://frontend-nine-beta-45.vercel.app',
    ];
    if (origin && origin.endsWith('.vercel.app')) {
      callback(null, true);
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      try {
        const u = new URL(origin);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          callback(null, true);
          return;
        }
      } catch {
        /* origine invalide */
      }
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

if (isVercel) {
  let dbConnectPromise = null;
  app.use(async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    if (!dbConnectPromise) dbConnectPromise = connectDB();
    try {
      await dbConnectPromise;
      next();
    } catch (err) {
      next(err);
    }
  });
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  })
);

app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

const limiteGenerale = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    return req.path === '/api/health' || req.path === '/api/health/full' || req.path === '/health';
  },
});

app.use(limiteGenerale);
app.use(cookieParser());
app.use(
  express.json({
    limit: '10mb',
    type: 'application/json',
    // corps brut nécessaire à la vérification de signature du webhook Stripe
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith('/api/paiements/webhook')) req.rawBody = buf;
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "Bienvenue sur l'API Afro-food!",
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    documentation: '/api/info',
  });
});

app.get(
  [
    '/favicon.ico',
    '/favicon.png',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/robots.txt',
    '/site.webmanifest',
  ],
  (req, res) => {
    res.status(204).end();
  }
);

async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', name: 'postgresql' };
  } catch (error) {
    return { status: 'disconnected', name: 'postgresql', error: error.message };
  }
}

app.get('/health', async (req, res) => {
  try {
    const database = await checkDatabaseHealth();
    const ok = database.status === 'connected';
    res.status(ok ? 200 : 503).json({
      success: ok,
      status: ok ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/full', async (req, res) => {
  try {
    const database = await checkDatabaseHealth();
    const ok = database.status === 'connected';
    res.status(ok ? 200 : 503).json({
      success: ok,
      status: ok ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.use('/api', routes);
app.use('/uploads', express.static('uploads'));
app.use(notFound);
app.use(errorHandler);

export default app;
export { app, connectDB, disconnectDB };

if (!isVercel) {
  const skipDB = process.env.SKIP_DB_CONNECTION === 'true' && process.env.NODE_ENV !== 'production';

  function attachListenError(server) {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `\n❌ Le port ${PORT} est déjà utilisé. Ferme l’autre terminal (Ctrl+C) ou change PORT.\n`
        );
      } else {
        console.error(err);
      }
      process.exit(1);
    });
  }

  console.log('\n═══════════════════════════════════════');
  console.log('🚀 Démarrage du serveur backend...');
  console.log('═══════════════════════════════════════\n');

  connectDB()
    .then(() => {
      const server = app.listen(PORT, () => {
        process.stdout.write('\n');
        process.stdout.write('═══════════════════════════════════════\n');
        process.stdout.write('✅ SERVEUR BACKEND ACTIF\n');
        process.stdout.write('═══════════════════════════════════════\n');
        console.log(`🚀 Serveur démarré sur le port ${PORT}`);
        console.log(`📍 API disponible sur http://localhost:${PORT}`);
        console.log(skipDB ? '⚠️  PostgreSQL non connecté (mode sans DB)' : '📡 PostgreSQL connecté avec succès');
        console.log('═══════════════════════════════════════\n');
      });
      attachListenError(server);
    })
    .catch((error) => {
      if (skipDB) {
        console.warn('\n⚠️  Mode sans base de données (SKIP_DB_CONNECTION=true)');
        const server = app.listen(PORT, () => console.log(`🚀 Serveur sur le port ${PORT}`));
        attachListenError(server);
      } else {
        console.error('\n❌ Erreur de connexion à PostgreSQL:', error.message);
        process.exit(1);
      }
    });
}
