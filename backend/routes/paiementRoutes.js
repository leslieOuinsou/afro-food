import express from 'express';
import { configPaiement, confirmerVirementRecu, creerSessionPaiement, webhookStripe } from '../controllers/paiementController.js';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', configPaiement);
router.post('/webhook', webhookStripe); // authentifié par signature Stripe
router.post('/session', protegerRoute, creerSessionPaiement);
router.patch('/:commandeId/virement-recu', protegerRoute, restreindreAcces('admin'), confirmerVirementRecu);

export default router;
