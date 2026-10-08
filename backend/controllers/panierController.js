import { desabonnerRelances, enregistrerPanier, jetonValide } from '../utils/panier.js';
import { isValidId } from '../utils/serialize.js';

/** PUT /api/panier { items } — le client connecté enregistre son panier (pour la relance en cas d'abandon) */
export const synchroniserPanier = async (req, res, next) => {
  try {
    const n = await enregistrerPanier(req.utilisateur.id, req.body?.items);
    res.json({ success: true, data: { articles: n } });
  } catch (e) {
    next(e);
  }
};

const page = (titre, texte) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre}</title></head>
<body style="margin:0;background:#F4EBDD;font-family:Arial,Helvetica,sans-serif;color:#4A3426;"><div style="max-width:480px;margin:12vh auto;padding:32px;background:#FFFDF8;border-radius:24px;border:1px solid #E8DCC4;text-align:center;">
<div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#2C1A0E;">Afro-food</div><h1 style="font-size:20px;margin:18px 0 8px;color:#2C1A0E;">${titre}</h1><p style="line-height:1.6;">${texte}</p>
<p style="margin-top:22px;"><a href="${(process.env.FRONTEND_URL || '/').replace(/\/$/, '')}/catalogue" style="display:inline-block;background:#C2610F;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:700;">Retour au catalogue</a></p></div></body></html>`;

/** GET /api/panier/desabonner?u=&t= — lien de désabonnement des rappels de panier (signé) */
export const desabonner = async (req, res) => {
  const { u, t } = req.query;
  res.set('Content-Type', 'text/html; charset=utf-8');
  if (!isValidId(u) || !jetonValide(u, t)) {
    return res.status(400).send(page('Lien invalide', 'Ce lien de désabonnement n’est pas valide ou a expiré.'));
  }
  await desabonnerRelances(u);
  res.send(page('Rappels désactivés', 'Vous ne recevrez plus de rappel pour les paniers laissés en attente.'));
};
