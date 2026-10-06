import express from 'express';
import { abonner, cleePublique, desabonner } from '../controllers/pushController.js';
import { protegerRoute } from '../middleware/auth.js';

const router = express.Router();

router.get('/cle-publique', cleePublique);
router.post('/abonnement', protegerRoute, abonner);
router.delete('/abonnement', protegerRoute, desabonner);

export default router;
