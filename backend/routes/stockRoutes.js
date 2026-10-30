import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { listerAlertes, scannerStock, traiterAlerte } from '../controllers/stockController.js';

const router = express.Router();
router.use(protegerRoute, restreindreAcces('admin'));
router.get('/alertes', listerAlertes);
router.post('/alertes/:id/traiter', traiterAlerte);
router.post('/scan', scannerStock);
export default router;
