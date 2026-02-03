/**
 * Handler Vercel serverless : expose l'API Express sur /api/*
 * Déploie ce projet avec Root Directory = "backend" pour avoir l'API sur un domaine Vercel.
 */

let appInstance = null;
let initPromise = null;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin.endsWith('.vercel.app')) return true;
  const allowed = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://frontend-nine-beta-45.vercel.app',
    'https://afro-food.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  return allowed.includes(origin);
}

function setCorsHeaders(req, res) {
  if (!res || typeof res.setHeader !== 'function') return;
  try {
    const origin = (req && req.headers && req.headers.origin) || '';
    if (origin && isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  } catch (_) {}
}

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(body));
}

/** Réponse immédiate pour la racine (sans charger Express) - évite le crash au premier hit */
function sendRootResponse(req, res) {
  setCorsHeaders(req, res);
  sendJson(res, 200, {
    success: true,
    message: "Bienvenue sur l'API Afro-Eats!",
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    docs: '/api/health et /api/plats'
  });
}

async function getApp() {
  if (appInstance) return appInstance;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { app, connectDB } = await import('../server.js');
    connectDB().catch((err) => console.error('MongoDB init:', err.message));
    appInstance = app;
    return app;
  })();
  return initPromise;
}

/** Attendre la fin de la réponse Express, avec timeout pour éviter le blocage Vercel */
function runExpress(app, req, res) {
  return new Promise((resolve) => {
    const done = () => resolve();
    const t = setTimeout(done, 9000);
    if (res.on && typeof res.on === 'function') {
      res.once('finish', () => { clearTimeout(t); done(); });
      res.once('close', () => { clearTimeout(t); done(); });
    } else {
      clearTimeout(t);
      done();
    }
    app(req, res);
  });
}

export default async function handler(req, res) {
  try {
    if (!res || typeof res.setHeader !== 'function') {
      console.error('Handler: res invalide');
      return;
    }
    const path = ((req && (req.url || req.path)) || '').split('?')[0];
    const method = (req && req.method || 'GET').toUpperCase();

    setCorsHeaders(req, res);

    if (method === 'OPTIONS') {
      setCorsHeaders(req, res);
      res.writeHead(204, { 'Content-Length': 0 });
      res.end();
      return;
    }

    if (method === 'GET' && (path === '/' || path === '' || path === '/api')) {
      sendRootResponse(req, res);
      return;
    }

    const app = await getApp();
    await runExpress(app, req, res);
  } catch (err) {
    console.error('Serverless handler error:', err);
    try {
      if (res && typeof res.setHeader === 'function' && !res.headersSent) {
        setCorsHeaders(req, res);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).end(JSON.stringify({
          success: false,
          error: 'FUNCTION_INVOCATION_FAILED',
          message: err.message || 'Erreur serveur',
        }));
      }
    } catch (_) {}
  }
}
