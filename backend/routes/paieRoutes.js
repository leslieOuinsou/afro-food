import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import {
  corrigerPointage,
  debutPointage,
  definirTaux,
  finPointage,
  listerPaies,
  monPointage,
  payerJournee,
  resume,
  sessionsJournee,
} from '../controllers/paieController.js';

const router = express.Router();
router.use(protegerRoute);

// Livreur
router.post('/pointage/debut', restreindreAcces('livreur'), debutPointage);
router.post('/pointage/fin', restreindreAcces('livreur'), finPointage);
router.get('/mon-pointage', restreindreAcces('livreur'), monPointage);

// Admin
router.use('/admin', restreindreAcces('admin'));
router.get('/admin/resume', resume);
router.get('/admin/pointages', sessionsJournee);
router.patch('/admin/pointages/:id', corrigerPointage);
router.post('/admin/payer', payerJournee);
router.get('/admin/paiements', listerPaies);
router.put('/admin/taux', definirTaux);

export default router;
