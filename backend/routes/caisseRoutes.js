import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import {
  alerteSoldes,
  annulerReversement,
  creerReversement,
  listerReversements,
  listerSoldes,
  lireJournal,
  monSolde,
  rapprochement,
} from '../controllers/caisseController.js';

const router = express.Router();

// Cron Vercel : authentifié par CRON_SECRET, pas par session
router.get('/alerte', alerteSoldes);

router.use(protegerRoute);
router.get('/mon-solde', restreindreAcces('livreur'), monSolde);

router.use(restreindreAcces('admin'));
router.get('/livreurs', listerSoldes);
router.get('/journal', lireJournal);
router.get('/rapprochement', rapprochement);
router.get('/reversements', listerReversements);
router.post('/reversements', creerReversement);
router.post('/reversements/:id/annuler', annulerReversement);

export default router;
