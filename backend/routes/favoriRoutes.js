import express from 'express';
import { listerFavoris, basculerFavori } from '../controllers/favoriController.js';
import { protegerRoute } from '../middleware/auth.js';
import { validerId } from '../middleware/validation.js';

const router = express.Router();

router.use(protegerRoute);
router.get('/', listerFavoris);
router.post('/:platId/basculer', validerId('platId'), basculerFavori);

export default router;
