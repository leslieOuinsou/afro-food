import express from 'express';
import { authentificationOptionnelle, protegerRoute } from '../middleware/auth.js';
import { ajouterArticleGroupe, creerGroupe, fermerGroupe, lireGroupe } from '../controllers/groupeController.js';

const router = express.Router();
router.post('/', protegerRoute, creerGroupe);
router.get('/:code', lireGroupe);
router.post('/:code/articles', authentificationOptionnelle, ajouterArticleGroupe);
router.post('/:code/fermer', protegerRoute, fermerGroupe);
export default router;
