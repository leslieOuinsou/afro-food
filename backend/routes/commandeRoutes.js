import express from 'express';
import {
  creerCommande,
  validerCodePromo,
  obtenirMesCommandes,
  obtenirCommandeParId,
  annulerCommande,
  evaluerCommande,
  obtenirToutesCommandes,
  changerStatutCommande,
  obtenirStatistiques,
  exporterCommandesCsv,
  mettreAJourPositionLivreur,
  obtenirAvis
} from '../controllers/commandeController.js';
import {
  protegerRoute,
  restreindreAcces,
  verifierProprietaire
} from '../middleware/auth.js';
import {
  validerCommande,
  validerId,
  validerPagination
} from '../middleware/validation.js';

import {
  ajouterJustificatif,
  listerJustificatifs,
  lireJustificatif,
  televerserFichier,
} from '../controllers/justificatifController.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protegerRoute);

// Routes pour les clients
router.post('/', validerCommande, creerCommande);
router.post('/promo/valider', validerCodePromo);

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
router.get('/export/csv',
  restreindreAcces('admin'),
  exporterCommandesCsv
);
router.get('/statistiques/general',
  restreindreAcces('admin'),
  obtenirStatistiques
);

router.get('/avis',
  restreindreAcces('admin'),
  obtenirAvis
);

router.post('/:id/justificatifs',
  validerId(),
  televerserFichier,
  ajouterJustificatif
);

router.get('/:id/justificatifs',
  validerId(),
  listerJustificatifs
);

router.get('/:id/justificatifs/:jid/fichier',
  validerId(),
  lireJustificatif
);

router.get('/:id',
  validerId(),
  obtenirCommandeParId
);

router.patch('/:id/annuler',
  validerId(),
  annulerCommande
);

router.post('/:id/evaluer',
  validerId(),
  evaluerCommande
);

router.patch('/:id/statut',
  restreindreAcces('admin', 'livreur'),
  validerId(),
  changerStatutCommande
);

router.patch('/:id/position',
  restreindreAcces('admin', 'livreur'),
  validerId(),
  mettreAJourPositionLivreur
);

export default router;