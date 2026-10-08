import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import {
  alerteSoldes,
  annulerReversement,
  creerReversement,
  declarerRemise,
  listerReversements,
  listerSoldes,
  lireJournal,
  monSolde,
  rapprochement,
  refuserRemise,
  validerRemise,
} from '../controllers/caisseController.js';

const router = express.Router();

// Cron Vercel : authentifié par CRON_SECRET, pas par session
router.get('/alerte', alerteSoldes);

router.use(protegerRoute);
router.get('/mon-solde', restreindreAcces('livreur'), monSolde);
router.post('/remises', restreindreAcces('livreur'), declarerRemise);

router.use(restreindreAcces('admin'));
router.get('/livreurs', listerSoldes);
router.get('/journal', lireJournal);
router.get('/rapprochement', rapprochement);
router.get('/reversements', listerReversements);
router.post('/reversements', creerReversement);
router.post('/reversements/:id/annuler', annulerReversement);
router.post('/reversements/:id/valider', validerRemise);
router.post('/reversements/:id/refuser', refuserRemise);

export default router;
