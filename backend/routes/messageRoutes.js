import express from 'express';
import {
  obtenirMessages,
  obtenirMessageParId,
  marquerCommeLu,
  repondreMessage
} from '../controllers/contactMessageController.js';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';

const router = express.Router();

// Option : en dev, autoriser l'accès à la messagerie sans auth (pour tester sans login admin)
// Définir SKIP_MESSAGERIE_AUTH=true dans .env pour activer.
const skipAuth = process.env.SKIP_MESSAGERIE_AUTH === 'true';

if (!skipAuth) {
  router.use(protegerRoute);
  router.use(restreindreAcces('admin'));
}

router.get('/', obtenirMessages);
router.get('/:id', obtenirMessageParId);
router.patch('/:id/lu', marquerCommeLu);
router.post('/:id/reply', repondreMessage);

export default router;
