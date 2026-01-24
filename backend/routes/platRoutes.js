import express from 'express';
import {
  obtenirPlats,
  obtenirPlatParId,
  obtenirPlatParSlug,
  creerPlat,
  mettreAJourPlat,
  supprimerPlat,
  obtenirPlatsPopulaires,
  obtenirNouveautes,
  rechercherPlats,
  obtenirCategories,
  mettreAJourDisponibilite,
  mettreAJourPromotion
} from '../controllers/platController.js';
import {
  protegerRoute,
  restreindreAcces,
  authentificationOptionnelle
} from '../middleware/auth.js';
import {
  validerPlat,
  validerIdMongoDB,
  validerPagination,
  validerFiltresPrix
} from '../middleware/validation.js';

const router = express.Router();

// Routes publiques
router.get('/', 
  validerPagination,
  validerFiltresPrix,
  obtenirPlats
);

router.get('/categories', obtenirCategories);

router.get('/populaires/:limite?', obtenirPlatsPopulaires);

router.get('/nouveautes/:limite?', obtenirNouveautes);

router.get('/recherche/:terme', 
  validerPagination,
  validerFiltresPrix,
  rechercherPlats
);

router.get('/slug/:slug', obtenirPlatParSlug);

router.get('/:id', 
  validerIdMongoDB(),
  authentificationOptionnelle,
  obtenirPlatParId
);

// Routes protégées pour les admins
router.post('/', 
  protegerRoute,
  restreindreAcces('admin'),
  validerPlat,
  creerPlat
);

router.put('/:id', 
  protegerRoute,
  restreindreAcces('admin'),
  validerIdMongoDB(),
  validerPlat,
  mettreAJourPlat
);

router.delete('/:id', 
  protegerRoute,
  restreindreAcces('admin'),
  validerIdMongoDB(),
  supprimerPlat
);

router.patch('/:id/disponibilite', 
  protegerRoute,
  restreindreAcces('admin'),
  validerIdMongoDB(),
  mettreAJourDisponibilite
);

router.patch('/:id/promotion', 
  protegerRoute,
  restreindreAcces('admin'),
  validerIdMongoDB(),
  mettreAJourPromotion
);

export default router;