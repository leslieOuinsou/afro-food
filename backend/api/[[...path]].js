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
    await connectDB();
    appInstance = app;
    return app;
  })();
  return initPromise;
}

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(body));
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('Serverless handler error:', err);
    sendJson(res, 503, {
      success: false,
      error: 'FUNCTION_INIT_FAILED',
      message: process.env.NODE_ENV === 'production' ? 'Service temporairement indisponible.' : err.message,
    });
  }
}
