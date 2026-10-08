import { cloturerSessionsExpirees } from './paieController.js';
import { executerAlerteCaisse } from './caisseController.js';
import { relancerPaniersAbandonnes } from '../utils/panier.js';

/** GET /api/cron/quotidien — une seule tâche planifiée par jour (cron Vercel, authentifié par CRON_SECRET) */
export const cronQuotidien = async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      return next(Object.assign(new Error('Non autorisé'), { statusCode: 401 }));
    }
    const resultat = {};
    // Chaque tâche est indépendante : l'échec de l'une n'empêche pas les autres
    for (const [nom, tache] of [
      ['livreursEnAlerteCaisse', executerAlerteCaisse],
      ['sessionsCloturees', () => cloturerSessionsExpirees()],
      ['paniersRelances', () => relancerPaniersAbandonnes()],
    ]) {
      try {
        resultat[nom] = await tache();
      } catch (e) {
        console.error(`[cron] ${nom}:`, e.message);
        resultat[nom] = `erreur: ${e.message}`;
      }
    }
    res.json({ success: true, data: resultat });
  } catch (e) {
    next(e);
  }
};
