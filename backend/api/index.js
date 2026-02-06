/**
 * Handler Vercel pour la route exacte /api (et /api/)
 * Root Directory = "backend" sur Vercel.
 * Ce fichier évite la 404 sur GET https://xxx.vercel.app/api/
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

export default async function handler(req, res) {
  const CORS_HEADERS = getCorsHeaders(req);

  let method = (req?.method && String(req.method).toUpperCase()) || 'GET';
  const acrm = req?.headers?.['access-control-request-method'] ?? req?.headers?.['Access-Control-Request-Method'] ?? (req?.headers?.get && req.headers.get('access-control-request-method'));
  if (acrm) method = 'OPTIONS';

  if (method === 'OPTIONS') {
    try {
      if (res?.setHeader) Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      if (res?.status) res.status(200); else if (res) res.statusCode = 200;
      if (res?.end) res.end(); else safeSend(res, 200, { 'Content-Length': '0' }, '', CORS_HEADERS);
    } catch (_) {
      safeSend(res, 200, { 'Content-Length': '0' }, '', CORS_HEADERS);
    }
    return;
  }

  if (res?.setHeader) {
    try {
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    } catch (_) {}
  }

  safeSend(res, 200, { 'Content-Type': 'application/json' }, ROOT_JSON, CORS_HEADERS);
}
