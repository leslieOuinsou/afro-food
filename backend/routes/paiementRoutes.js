import express from 'express';
import { configPaiement, creerSessionPaiement, webhookStripe } from '../controllers/paiementController.js';
import { protegerRoute } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', configPaiement);
router.post('/webhook', webhookStripe); // authentifié par signature Stripe
router.post('/session', protegerRoute, creerSessionPaiement);

export default router;
