import express from 'express';
import {
  creerCommande,
  obtenirMesCommandes,
  obtenirCommandeParId,
  annulerCommande,
  evaluerCommande,
  obtenirToutesCommandes,
  changerStatutCommande,
  obtenirStatistiques
} from '../controllers/commandeController.js';
import {
  protegerRoute,
  restreindreAcces,
  verifierProprietaire
} from '../middleware/auth.js';
import {
  validerCommande,
  validerIdMongoDB,
  validerPagination
} from '../middleware/validation.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protegerRoute);

// Routes pour les clients
router.post('/', validerCommande, creerCommande);

router.get('/mes-commandes',
  validerPagination,
  obtenirMesCommandes
);

// Routes admin : doivent être avant /:id pour être matchées
router.get('/',
  restreindreAcces('admin', 'livreur'),
  validerPagination,
  obtenirToutesCommandes
);
router.get('/statistiques/general',
  restreindreAcces('admin'),
  obtenirStatistiques
);

router.get('/:id',
  validerIdMongoDB(),
  obtenirCommandeParId
);

router.patch('/:id/annuler',
  validerIdMongoDB(),
  annulerCommande
);

router.post('/:id/evaluer',
  validerIdMongoDB(),
  evaluerCommande
);

router.patch('/:id/statut',
  restreindreAcces('admin', 'livreur'),
  validerIdMongoDB(),
  changerStatutCommande
);

export default router;