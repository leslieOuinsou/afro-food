import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { creerRecette, lireRecette, listerRecettes } from '../controllers/recetteController.js';

const router = express.Router();
router.get('/', listerRecettes);
router.get('/:slug', lireRecette);
router.post('/', protegerRoute, restreindreAcces('admin'), creerRecette);
export default router;
