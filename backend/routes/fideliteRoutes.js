import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { echangerPoints, lireConfigFidelite, maFidelite, majConfigFidelite } from '../controllers/fideliteController.js';

const router = express.Router();
router.use(protegerRoute);
router.get('/config', restreindreAcces('admin'), lireConfigFidelite);
router.put('/config', restreindreAcces('admin'), majConfigFidelite);
router.get('/', restreindreAcces('client'), maFidelite);
router.post('/echanger', restreindreAcces('client'), echangerPoints);
export default router;
