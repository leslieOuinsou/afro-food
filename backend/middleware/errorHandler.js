// Middleware pour gérer les erreurs de manière centralisée
// Ce middleware intercepte toutes les erreurs et les retourne dans un format cohérent

/** En cas d'erreur avant/après la chaîne CORS, le navigateur a besoin des headers pour lire le JSON d'erreur */
function attachCorsForBrowser(req, res) {
  const origin = req.headers.origin;
  if (!origin || typeof origin !== 'string') return;
  try {
    const u = new URL(origin);
    const ok =
      origin.endsWith('.vercel.app') ||
      origin === (process.env.FRONTEND_URL || '').replace(/\/$/, '') ||
      ['https://afro-food.vercel.app', 'https://afrofood.vercel.app'].includes(origin);
    const localhostOk =
      process.env.NODE_ENV !== 'production' &&
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
    if (ok || localhostOk) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } catch {
    /* ignore */
  }
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  // Toujours logger côté serveur (visible dans les logs Vercel)
  console.error('[API Error]', statusCode, message, err.stack || '');

  if (res.headersSent) return;
  attachCorsForBrowser(req, res);
  const errorResponse = {
    success: false,
    status: statusCode,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  res.status(statusCode).json(errorResponse);
};

// Middleware pour gérer les routes non trouvées (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error); // Passe l'erreur au middleware errorHandler
};
