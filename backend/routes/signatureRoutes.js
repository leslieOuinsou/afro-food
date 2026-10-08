import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { definirSignature, lireSignature, retirerSignature } from '../controllers/signatureController.js';

const router = express.Router();
router.use(protegerRoute, restreindreAcces('admin'));
router.get('/', lireSignature);
router.put('/', definirSignature);
router.delete('/', retirerSignature);
export default router;
