import express from 'express';
import {
  listerPromos,
  creerPromo,
  modifierPromo,
  basculerPromo,
  supprimerPromo,
} from '../controllers/promoController.js';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { validerId } from '../middleware/validation.js';

const router = express.Router();

router.use(protegerRoute, restreindreAcces('admin'));

router.get('/', listerPromos);
router.post('/', creerPromo);
router.put('/:id', validerId(), modifierPromo);
router.patch('/:id/actif', validerId(), basculerPromo);
router.delete('/:id', validerId(), supprimerPromo);

export default router;
