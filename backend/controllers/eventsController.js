import { souscrire } from '../utils/events.js';
import prisma from '../lib/prisma.js';

/**
 * GET /api/events/stream?canal=commande:ID|cuisine|chat:ID
 * Server-Sent Events (fallback polling côté client si la connexion coupe).
 */
export const streamEvenements = async (req, res, next) => {
  try {
    const canal = String(req.query.canal || '');
    if (!canal || canal.length > 120) {
      const error = new Error('Canal invalide');
      error.statusCode = 400;
      return next(error);
    }

    if (canal.startsWith('commande:') || canal.startsWith('chat:')) {
      const commandeId = canal.split(':')[1];
      if (!req.utilisateur) {
        const error = new Error('Authentification requise');
        error.statusCode = 401;
        return next(error);
      }
      const c = await prisma.commande.findUnique({ where: { id: commandeId } });
      if (!c) {
        const error = new Error('Commande introuvable');
        error.statusCode = 404;
        return next(error);
      }
      const u = req.utilisateur;
      const ok =
        u.role === 'admin' ||
        c.clientId === u.id ||
        (u.role === 'livreur' && (!c.livreurId || c.livreurId === u.id));
      if (!ok) {
        const error = new Error('Accès refusé');
        error.statusCode = 403;
        return next(error);
      }
    } else if (canal === 'cuisine') {
      if (!req.utilisateur || !['admin', 'livreur'].includes(req.utilisateur.role)) {
        const error = new Error('Réservé cuisine / admin');
        error.statusCode = 403;
        return next(error);
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`event: ping\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    const listener = (payload) => {
      res.write(`event: update\ndata: ${JSON.stringify(payload)}\n\n`);
    };
    const off = souscrire(canal, listener);
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      off();
    });
  } catch (e) {
    next(e);
  }
};
