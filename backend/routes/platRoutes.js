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

// Route dev : créer un plat sans auth (désactivée en production)
router.post('/dev', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const err = new Error('Route réservée au développement');
    err.statusCode = 404;
    return next(err);
  }
  req.utilisateur = { id: null };
  creerPlat(req, res, next);
});

// Routes protégées pour les admins
router.post('/', 
  protegerRoute,
  restreindreAcces('admin'),
  validerPlat,
  creerPlat
);

// Route dev : modifier un plat sans auth (désactivée en production)
router.put('/dev/:id', validerIdMongoDB(), (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const err = new Error('Route réservée au développement');
    err.statusCode = 404;
    return next(err);
  }
  mettreAJourPlat(req, res, next);
});

router.put('/:id', 
  protegerRoute,
  restreindreAcces('admin'),
  validerIdMongoDB(),
  validerPlat,
  mettreAJourPlat
);

// Route dev : supprimer un plat sans auth (désactivée en production)
router.delete('/dev/:id', validerIdMongoDB(), (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const err = new Error('Route réservée au développement');
    err.statusCode = 404;
    return next(err);
  }
  supprimerPlat(req, res, next);
});

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