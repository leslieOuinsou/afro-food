import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { desabonner, synchroniserPanier } from '../controllers/panierController.js';

const router = express.Router();
router.get('/desabonner', desabonner); // lien signé reçu par e-mail
router.put('/', protegerRoute, restreindreAcces('client'), synchroniserPanier);
export default router;
