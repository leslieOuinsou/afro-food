import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { avancerCuisine, fileCuisine } from '../controllers/cuisineController.js';

const router = express.Router();
router.use(protegerRoute, restreindreAcces('admin', 'livreur'));
router.get('/file', fileCuisine);
router.patch('/:id/statut', avancerCuisine);
export default router;
