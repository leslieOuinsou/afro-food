// Middleware pour gérer les erreurs de manière centralisée
// Ce middleware intercepte toutes les erreurs et les retourne dans un format cohérent

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  // Toujours logger côté serveur (visible dans les logs Vercel)
  console.error('[API Error]', statusCode, message, err.stack || '');

  if (res.headersSent) return;
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
