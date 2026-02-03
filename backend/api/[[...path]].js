/**
 * Handler Vercel serverless : expose l'API Express sur /api/*
 * Déploie ce projet avec Root Directory = "backend" pour avoir l'API sur un domaine Vercel.
 */

let appInstance = null;
let initPromise = null;

async function getApp() {
  if (appInstance) return appInstance;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { app, connectDB } = await import('../server.js');
    // Connexion en arrière-plan pour ne pas bloquer (évite le timeout Vercel 10s)
    connectDB().catch((err) => console.error('MongoDB init:', err.message));
    appInstance = app;
    return app;
  })();
  return initPromise;
}

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(body));
}

/** Attendre que Express ait fini d'envoyer la réponse (évite FUNCTION_INVOCATION_FAILED) */
function runExpress(app, req, res) {
  return new Promise((resolve, reject) => {
    const onFinish = () => resolve();
    const onError = (err) => reject(err);
    res.once('finish', onFinish);
    res.once('close', onFinish);
    res.once('error', onError);
    app(req, res);
  });
}

export default async function handler(req, res) {
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
