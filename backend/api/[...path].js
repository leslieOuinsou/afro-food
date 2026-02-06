/**
 * Handler Vercel serverless : expose l'API Express sur /api/*
 * Root Directory = "backend" sur Vercel.
 * Fichier [...path].js = route /api/:path+ (reconnu par Vercel)
 */

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://afro-food.vercel.app',
  'https://afrofood.vercel.app',
  'https://frontend-nine-beta-45.vercel.app',
];

function isOriginAllowed(origin) {
  if (!origin || typeof origin !== 'string') return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

function getCorsHeaders(req) {
  let origin = null;
  if (req) {
    if (typeof req.getHeader === 'function') origin = req.getHeader('origin') || req.getHeader('Origin');
    if (!origin && req.headers?.get) origin = req.headers.get('origin') || req.headers.get('Origin');
    if (!origin && req.headers) origin = req.headers.origin || req.headers.Origin || req.headers['origin'];
  }
  const allowOrigin = isOriginAllowed(origin) ? origin : (process.env.FRONTEND_URL || 'https://afrofood.vercel.app');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

const ROOT_JSON = '{"success":true,"message":"Bienvenue sur l\'API Afro-Eats!","status":"OK","version":"1.0.0","docs":"/api/health et /api/plats"}';

let appInstance = null;
let initPromise = null;

function safeSend(res, status, headers, body, corsHeaders) {
  const merged = { ...(corsHeaders || getCorsHeaders({})), ...headers };
  try {
    if (res.writeHead) res.writeHead(status, merged);
    else if (res.setHeader) {
      Object.entries(merged).forEach(([k, v]) => res.setHeader(k, v));
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
    try {
      await connectDB();
    } catch (err) {
      console.error('MongoDB connection failed:', err?.message || err);
      initPromise = null;
      throw err;
    }
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
  const CORS_HEADERS = getCorsHeaders(req);

  let method = 'GET';
  try {
    if (req?.method) method = String(req.method).toUpperCase();
    const acrm = req?.headers?.['access-control-request-method'] ?? req?.headers?.['Access-Control-Request-Method'] ?? (req?.headers?.get && req.headers.get('access-control-request-method'));
    if (acrm) method = 'OPTIONS';
  } catch (_) {}

  if (method === 'OPTIONS') {
    try {
      if (res?.setHeader) Object.entries(CORS_HEADERS).forEach(([k, v]) => { res.setHeader(k, v); });
      if (res?.status) res.status(200); else if (res) res.statusCode = 200;
      if (res?.end) res.end(); else safeSend(res, 200, { 'Content-Length': '0' }, '', CORS_HEADERS);
    } catch (_) {
      safeSend(res, 200, { 'Content-Length': '0' }, '', CORS_HEADERS);
    }
    return;
  }

  if (res && typeof res.setHeader === 'function') {
    try {
      Object.entries(CORS_HEADERS).forEach(([k, v]) => { res.setHeader(k, v); });
    } catch (_) {}
  }

  let path = '';
  try {
    if (req && req.url) path = (req.url || '').split('?')[0];
    else if (req && req.path) path = (req.path || '').split('?')[0];
  } catch (_) {}

  try {
    if (method === 'GET' && (path === '/' || path === '' || path === '/api' || path === '/api/')) {
      safeSend(res, 200, { 'Content-Type': 'application/json' }, ROOT_JSON, CORS_HEADERS);
      return;
    }
  } catch (_) {
    try {
      safeSend(res, 200, { 'Content-Type': 'application/json' }, ROOT_JSON, CORS_HEADERS);
    } catch (_) {}
    return;
  }

  try {
    const app = await getApp();
    await runExpress(app, req, res);
  } catch (err) {
    try {
      if (res && !res.headersSent) {
        const msg = (err && err.message) ? String(err.message) : 'Erreur serveur';
        const hint = msg.includes('MONGODB') || msg.includes('mongo') || msg.includes('timed out')
          ? ' Verifiez MONGODB_URI sur Vercel (Settings > Environment Variables) et Network Access sur MongoDB Atlas (0.0.0.0/0).'
          : '';
        safeSend(res, 503, { 'Content-Type': 'application/json' }, JSON.stringify({
          success: false,
          error: 'INIT_FAILED',
          message: msg + hint,
        }), CORS_HEADERS);
      }
    } catch (_) {}
  }
}
