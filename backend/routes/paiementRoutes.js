import express from 'express';
import { configPaiement, confirmerPaiementMobile, confirmerVirementRecu, initierPaiementMobile, creerSessionPaiement, telechargerRecu, webhookStripe } from '../controllers/paiementController.js';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', configPaiement);
router.post('/webhook', webhookStripe); // authentifié par signature Stripe
router.post('/session', protegerRoute, creerSessionPaiement);
router.patch('/:commandeId/virement-recu', protegerRoute, restreindreAcces('admin'), confirmerVirementRecu);
router.get('/:commandeId/justificatif.pdf', protegerRoute, telechargerRecu);
router.post('/mobile/initier', protegerRoute, initierPaiementMobile);
router.post('/mobile/confirmer', protegerRoute, confirmerPaiementMobile);

export default router;
