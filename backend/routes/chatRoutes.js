import express from 'express';
import { protegerRoute } from '../middleware/auth.js';
import { envoyerMessage, lireConversation } from '../controllers/chatController.js';

const router = express.Router();
router.use(protegerRoute);
router.get('/:commandeId', lireConversation);
router.post('/:commandeId', envoyerMessage);
export default router;
