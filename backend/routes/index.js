// Fichier principal des routes API
import express from 'express';
import authRoutes from './authRoutes.js';
import platRoutes from './platRoutes.js';
import commandeRoutes from './commandeRoutes.js';
import avisRoutes from './avisRoutes.js';
import messageRoutes from './messageRoutes.js';
import promoRoutes from './promoRoutes.js';
import favoriRoutes from './favoriRoutes.js';
import paiementRoutes from './paiementRoutes.js';
import pushRoutes from './pushRoutes.js';
import caisseRoutes from './caisseRoutes.js';
import documentRoutes from './documentRoutes.js';
import signatureRoutes from './signatureRoutes.js';
import paieRoutes from './paieRoutes.js';
import panierRoutes from './panierRoutes.js';
import { lireInfosEntreprise, majInfosEntreprise } from '../controllers/factureController.js';
import { cronQuotidien } from '../controllers/cronController.js';
import { obtenirAvisPublics } from '../controllers/commandeController.js';
import { creerMessage } from '../controllers/contactMessageController.js';
import { subscribe } from '../controllers/newsletterController.js';
import {
  obtenirParametres,
  mettreAJourParametres,
  obtenirParametresLivraison,
} from '../controllers/settingsController.js';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    console.log(`📡 API: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
  });
}

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API Afro-Food fonctionnelle!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/plats', platRoutes);
router.use('/commandes', commandeRoutes);
router.use('/avis', avisRoutes);
router.use('/messages', messageRoutes);
router.use('/promos', promoRoutes);
router.use('/favoris', favoriRoutes);
router.use('/paiements', paiementRoutes);
router.use('/push', pushRoutes);
router.use('/caisse', caisseRoutes);
router.use('/documents', documentRoutes);
router.use('/signature', signatureRoutes);
router.use('/paie', paieRoutes);
router.use('/panier', panierRoutes);
router.get('/entreprise', protegerRoute, restreindreAcces('admin'), lireInfosEntreprise);
router.put('/entreprise', protegerRoute, restreindreAcces('admin'), majInfosEntreprise);
router.get('/cron/quotidien', cronQuotidien);

router.get('/avis-publics', obtenirAvisPublics);
router.post('/contact', creerMessage);
router.post('/newsletter', subscribe);

router.get('/settings/livraison', obtenirParametresLivraison);
router.get('/settings', protegerRoute, restreindreAcces('admin'), obtenirParametres);
router.put('/settings', protegerRoute, restreindreAcces('admin'), mettreAJourParametres);

router.get('/statistiques', async (req, res, next) => {
  try {
    const [nombrePlats, categories, platsPays, nombreTotalCommandes, nombreUtilisateursActifs, nombreAvis] =
      await Promise.all([
        prisma.plat.count({ where: { disponible: true } }),
        prisma.plat.findMany({ select: { categorie: true }, distinct: ['categorie'] }),
        prisma.plat.findMany({ select: { origineAfricaine: true } }),
        prisma.commande.count({ where: { statut: 'livree' } }),
        prisma.user.count({ where: { estActif: true, role: 'client' } }),
        prisma.avis.count({ where: { statut: 'approuve' } }),
      ]);

    const paysSet = new Set();
    for (const p of platsPays) {
      const pays = p.origineAfricaine?.pays;
      if (pays && pays !== 'multiple') paysSet.add(pays);
    }

    res.json({
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: {
        nombrePlats,
        nombreCategories: categories.length,
        nombrePays: paysSet.size,
        nombreTotalCommandes,
        nombreUtilisateursActifs,
        nombreAvis,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: "Informations de l'API Afro-Food",
    data: {
      nom: 'API Afro-Food',
      description: 'API RESTful pour application de commande de plats africains',
      version: '1.0.0',
      endpoints: {
        authentification: '/api/auth',
        plats: '/api/plats',
        commandes: '/api/commandes',
        avis: '/api/avis',
        promos: '/api/promos',
        newsletter: '/api/newsletter',
        settings: '/api/settings',
      },
      documentation: 'https://api.afro-food.com/docs',
      support: 'support@afro-food.com',
    },
  });
});

export default router;
