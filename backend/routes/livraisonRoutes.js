import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { estimerLivraison, lireReglagesLivraison, listerCreneaux, majCreneaux, majZones } from '../controllers/livraisonController.js';

const router = express.Router();
router.post('/estimer', estimerLivraison);
router.get('/creneaux', listerCreneaux);
router.get('/reglages', protegerRoute, restreindreAcces('admin'), lireReglagesLivraison);
router.put('/zones', protegerRoute, restreindreAcces('admin'), majZones);
router.put('/creneaux', protegerRoute, restreindreAcces('admin'), majCreneaux);
export default router;
