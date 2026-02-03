/**
 * Handler Vercel serverless : expose l'API Express sur /api/*
 * Root Directory = "backend" sur Vercel.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

const ROOT_JSON = '{"success":true,"message":"Bienvenue sur l\'API Afro-Eats!","status":"OK","version":"1.0.0","docs":"/api/health et /api/plats"}';

let appInstance = null;
let initPromise = null;

function safeSend(res, status, headers, body) {
  try {
    if (res.writeHead) res.writeHead(status, { ...CORS_HEADERS, ...headers });
    else if (res.setHeader) {
      Object.entries({ ...CORS_HEADERS, ...headers }).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = status;
    }
    if (res.end) res.end(body || '');
  } catch (_) {}
}

async function getApp() {
  if (appInstance) return appInstance;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { app, connectDB } = await import('../server.js');
    connectDB().catch(() => {});
    appInstance = app;
    return app;
  })();
  return initPromise;
}

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
    try { app(req, res); } catch (_) { done(); }
  });
}

export default async function handler(req, res) {
  if (res && typeof res.setHeader === 'function') {
    try {
      Object.entries(CORS_HEADERS).forEach(([k, v]) => { res.setHeader(k, v); });
    } catch (_) {}
  }

  let path = '';
  let method = 'GET';
  try {
    if (req && req.url) path = (req.url || '').split('?')[0];
    else if (req && req.path) path = (req.path || '').split('?')[0];
    if (req && req.method) method = String(req.method).toUpperCase();
  } catch (_) {}

  try {
    if (method === 'OPTIONS') {
      safeSend(res, 204, { 'Content-Length': '0' });
      return;
    }
    if (method === 'GET' && (path === '/' || path === '' || path === '/api')) {
      safeSend(res, 200, { 'Content-Type': 'application/json' }, ROOT_JSON);
      return;
    }
  } catch (_) {
    try {
      safeSend(res, 200, { 'Content-Type': 'application/json' }, ROOT_JSON);
    } catch (_) {}
    return;
  }

  try {
    const app = await getApp();
    await runExpress(app, req, res);
  } catch (err) {
    try {
      if (res && !res.headersSent) {
        safeSend(res, 503, { 'Content-Type': 'application/json' }, JSON.stringify({
          success: false,
          error: 'INIT_FAILED',
          message: (err && err.message) ? String(err.message) : 'Erreur serveur',
        }));
      }
    } catch (_) {}
  }
}
