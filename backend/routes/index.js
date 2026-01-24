// Fichier principal des routes
// Ce fichier centralise toutes les routes de l'API

import express from 'express';

const router = express.Router(); // Création d'un routeur Express pour gérer les routes

// Route d'exemple - à remplacer par vos vraies routes
router.get('/test', (req, res) => {
  res.json({ message: 'Route de test fonctionnelle!' });
});

// Ici, vous ajouterez vos routes :
// - router.use('/auth', authRoutes); // Routes d'authentification
// - router.use('/plats', platsRoutes); // Routes pour les plats
// - router.use('/commandes', commandesRoutes); // Routes pour les commandes
// etc.

export default router;
