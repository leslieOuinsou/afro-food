import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { statistiquesAvancees } from '../controllers/statsController.js';
import { exporterCaisse, exporterPaie, exporterVentes } from '../controllers/exportController.js';

const router = express.Router();
router.use(protegerRoute, restreindreAcces('admin'));
router.get('/avancees', statistiquesAvancees);
router.get('/export/ventes', exporterVentes);
router.get('/export/caisse', exporterCaisse);
router.get('/export/paie', exporterPaie);
export default router;
