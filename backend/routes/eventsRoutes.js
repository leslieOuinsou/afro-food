import express from 'express';
import { authentificationOptionnelle } from '../middleware/auth.js';
import { streamEvenements } from '../controllers/eventsController.js';

const router = express.Router();
router.get('/stream', authentificationOptionnelle, streamEvenements);
export default router;
