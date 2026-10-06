import express from 'express';
import {
  obtenirAvisPlat,
  obtenirMesAvis,
  creerAvis,
  voterAvis,
  signalerAvis,
  modererAvis,
  ajouterReponseRestaurant,
} from '../controllers/avisController.js';
import {
  protegerRoute,
  restreindreAcces,
} from '../middleware/auth.js';
import {
  validerAvis,
  validerId,
  validerPagination,
} from '../middleware/validation.js';

const router = express.Router();

router.get('/plat/:platId', validerId('platId'), validerPagination, obtenirAvisPlat);

router.get('/mes-avis', protegerRoute, validerPagination, obtenirMesAvis);

router.post('/', protegerRoute, validerAvis, creerAvis);

router.post('/:id/voter', protegerRoute, validerId(), voterAvis);

router.post('/:id/signaler', protegerRoute, validerId(), signalerAvis);

router.patch(
  '/:id/moderer',
  protegerRoute,
  restreindreAcces('admin'),
  validerId(),
  modererAvis
);

router.post(
  '/:id/reponse',
  protegerRoute,
  restreindreAcces('admin'),
  validerId(),
  ajouterReponseRestaurant
);

export default router;
