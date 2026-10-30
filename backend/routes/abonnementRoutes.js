import express from 'express';
import { protegerRoute } from '../middleware/auth.js';
import { creerAbonnement, majAbonnement, monAbonnement } from '../controllers/abonnementController.js';

const router = express.Router();
router.use(protegerRoute);
router.get('/moi', monAbonnement);
router.post('/', creerAbonnement);
router.patch('/:id', majAbonnement);
export default router;
