// Fichier principal des routes API
// Ce fichier centralise toutes les routes de l'API Afro-Food

import express from 'express';
import authRoutes from './authRoutes.js';
import platRoutes from './platRoutes.js';
import commandeRoutes from './commandeRoutes.js';
import avisRoutes from './avisRoutes.js';
import messageRoutes from './messageRoutes.js';
import { creerMessage } from '../controllers/contactMessageController.js';

const router = express.Router(); // Création d'un routeur Express pour gérer les routes

// Middleware pour logger toutes les requêtes API en mode développement
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    console.log(`📡 API: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
  });
}

// Route de test pour vérifier que l'API fonctionne
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'API Afro-Food fonctionnelle!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes principales de l'API
router.use('/auth', authRoutes);           // Routes d'authentification
router.use('/plats', platRoutes);          // Routes pour les plats
router.use('/commandes', commandeRoutes);  // Routes pour les commandes
router.use('/avis', avisRoutes);           // Routes pour les avis
router.use('/messages', messageRoutes);    // Routes messagerie (admin)

// Envoi message depuis la page contact (public)
router.post('/contact', creerMessage);

// Route pour les statistiques générales (publique)
router.get('/statistiques', async (req, res, next) => {
  try {
    const { Plat, Commande, User, Avis } = await import('../models/index.js');
    
    // Statistiques basiques (sans informations sensibles)
    const stats = {
      nombrePlats: await Plat.countDocuments({ disponible: true }),
      nombreCategories: (await Plat.distinct('categorie')).length,
      nombrePays: (await Plat.distinct('origineAfricaine.pays')).filter(p => p !== 'multiple').length,
      nombreTotalCommandes: await Commande.countDocuments({ statut: 'livree' }),
      nombreUtilisateursActifs: await User.countDocuments({ estActif: true, role: 'client' }),
      nombreAvis: await Avis.countDocuments({ statut: 'approuve' })
    };
    
    res.json({
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: stats
    });
    
  } catch (error) {
    next(error);
  }
});

// Route pour obtenir les informations de l'API
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Informations de l\'API Afro-Food',
    data: {
      nom: 'API Afro-Food',
      description: 'API RESTful pour application de commande de plats africains',
      version: '1.0.0',
      endpoints: {
        authentification: '/api/auth',
        plats: '/api/plats',
        commandes: '/api/commandes',
        avis: '/api/avis'
      },
      documentation: 'https://api.afro-food.com/docs',
      support: 'support@afro-food.com'
    }
  });
});

export default router;
