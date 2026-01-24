// Middleware pour gérer les erreurs de manière centralisée
// Ce middleware intercepte toutes les erreurs et les retourne dans un format cohérent

export const errorHandler = (err, req, res, next) => {
  // Récupération du code de statut HTTP (par défaut 500 pour erreur serveur)
  const statusCode = err.statusCode || 500;
  
  // Récupération du message d'erreur
  const message = err.message || 'Erreur interne du serveur';

  // En mode développement, on retourne aussi la stack trace pour le débogage
  const errorResponse = {
    success: false,
    status: statusCode,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Envoi de la réponse d'erreur au client
  res.status(statusCode).json(errorResponse);
};

// Middleware pour gérer les routes non trouvées (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error); // Passe l'erreur au middleware errorHandler
};
