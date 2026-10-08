import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import {
  corrigerPointage,
  cronCloture,
  debutPointage,
  definirPlafond,
  definirPrimes,
  definirTaux,
  finPointage,
  listerPaies,
  monPointage,
  payerJournee,
  positionLivreur,
  prolongerPointage,
  reglerAttribution,
  resume,
  sessionsJournee,
} from '../controllers/paieController.js';
import { emettreFiches, lireTauxCotisations, listerFiches, majTauxCotisations, mesFiches, pdfBulletin, pdfFiche } from '../controllers/ficheController.js';

const router = express.Router();

// Cron Vercel : authentifié par CRON_SECRET
router.get('/cron', cronCloture);

router.use(protegerRoute);

// Livreur
router.post('/pointage/debut', restreindreAcces('livreur'), debutPointage);
router.post('/pointage/fin', restreindreAcces('livreur'), finPointage);
router.post('/pointage/prolonger', restreindreAcces('livreur'), prolongerPointage);
router.post('/position', restreindreAcces('livreur'), positionLivreur);
router.get('/mon-pointage', restreindreAcces('livreur'), monPointage);

router.get('/mes-fiches', restreindreAcces('livreur'), mesFiches);
router.get('/fiches/:id/pdf', restreindreAcces('livreur', 'admin'), pdfFiche);
router.get('/fiches/:id/bulletin', restreindreAcces('livreur', 'admin'), pdfBulletin);

// Admin
router.use('/admin', restreindreAcces('admin'));
router.get('/admin/resume', resume);
router.get('/admin/pointages', sessionsJournee);
router.patch('/admin/pointages/:id', corrigerPointage);
router.post('/admin/payer', payerJournee);
router.get('/admin/paiements', listerPaies);
router.put('/admin/taux', definirTaux);
router.put('/admin/plafond', definirPlafond);
router.put('/admin/primes', definirPrimes);
router.put('/admin/attribution', reglerAttribution);
router.post('/admin/fiches', emettreFiches);
router.get('/admin/fiches', listerFiches);
router.get('/admin/cotisations', lireTauxCotisations);
router.put('/admin/cotisations', majTauxCotisations);

export default router;
