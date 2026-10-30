import express from 'express';
import { protegerRoute } from '../middleware/auth.js';
import { monParrainage } from '../controllers/parrainageController.js';

const router = express.Router();
router.get('/', protegerRoute, monParrainage);
export default router;
