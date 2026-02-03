/**
 * Handler Vercel serverless : expose l'API Express sur /api/*
 * Déploie ce projet avec Root Directory = "backend" pour avoir l'API sur un domaine Vercel.
 */

let appInstance = null;
let initPromise = null;

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(body));
}

/** Réponse immédiate pour la racine (sans charger Express) - évite le crash au premier hit */
function sendRootResponse(res) {
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
  const path = (req.url || req.path || '').split('?')[0];
  const method = req.method || 'GET';

  if (method === 'GET' && (path === '/' || path === '' || path === '/api')) {
    sendRootResponse(res);
    return;
  }

  try {
    const app = await getApp();
    await runExpress(app, req, res);
  } catch (err) {
    console.error('Serverless handler error:', err);
    if (!res.headersSent) {
      sendJson(res, 503, {
        success: false,
        error: 'FUNCTION_INIT_FAILED',
        message: err.message || 'Service temporairement indisponible.',
        hint: !process.env.MONGODB_URI ? 'Ajoute MONGODB_URI dans Vercel → Settings → Environment Variables.' : undefined,
      });
    }
  }
}
