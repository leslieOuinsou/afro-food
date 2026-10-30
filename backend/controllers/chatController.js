import prisma from '../lib/prisma.js';
import { canalChat, publier } from '../utils/events.js';
import { isValidId } from '../utils/serialize.js';

async function accesCommande(commandeId, utilisateur) {
  const c = await prisma.commande.findUnique({ where: { id: commandeId } });
  if (!c) return null;
  const ok =
    utilisateur.role === 'admin' ||
    c.clientId === utilisateur.id ||
    (utilisateur.role === 'livreur' && (!c.livreurId || c.livreurId === utilisateur.id));
  return ok ? c : false;
}

/** GET /api/chat/:commandeId */
export const lireConversation = async (req, res, next) => {
  try {
    const { commandeId } = req.params;
    if (!isValidId(commandeId)) {
      const error = new Error('ID invalide');
      error.statusCode = 400;
      return next(error);
    }
    const acces = await accesCommande(commandeId, req.utilisateur);
    if (acces === null) {
      const error = new Error('Commande introuvable');
      error.statusCode = 404;
      return next(error);
    }
    if (acces === false) {
      const error = new Error('Accès refusé');
      error.statusCode = 403;
      return next(error);
    }

    let conv = await prisma.conversation.findUnique({
      where: { commandeId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { auteur: { select: { id: true, prenom: true, nom: true, role: true } } },
        },
      },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: { commandeId },
        include: { messages: true },
      });
    }

    res.json({
      success: true,
      data: {
        conversationId: conv.id,
        messages: (conv.messages || []).map((m) => ({
          id: m.id,
          corps: m.corps,
          createdAt: m.createdAt,
          auteur: m.auteur,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
};

/** POST /api/chat/:commandeId { corps } */
export const envoyerMessage = async (req, res, next) => {
  try {
    const { commandeId } = req.params;
    const corps = String(req.body?.corps || '').trim().slice(0, 2000);
    if (!corps) {
      const error = new Error('Message vide');
      error.statusCode = 400;
      return next(error);
    }
    const acces = await accesCommande(commandeId, req.utilisateur);
    if (acces === null) {
      const error = new Error('Commande introuvable');
      error.statusCode = 404;
      return next(error);
    }
    if (acces === false) {
      const error = new Error('Accès refusé');
      error.statusCode = 403;
      return next(error);
    }

    let conv = await prisma.conversation.findUnique({ where: { commandeId } });
    if (!conv) conv = await prisma.conversation.create({ data: { commandeId } });

    const msg = await prisma.messageChat.create({
      data: {
        conversationId: conv.id,
        auteurId: req.utilisateur.id,
        corps,
      },
      include: { auteur: { select: { id: true, prenom: true, nom: true, role: true } } },
    });

    await prisma.conversation.update({ where: { id: conv.id }, data: { updatedAt: new Date() } });

    const payload = {
      type: 'message',
      message: {
        id: msg.id,
        corps: msg.corps,
        createdAt: msg.createdAt,
        auteur: msg.auteur,
      },
    };
    publier(canalChat(commandeId), payload);
    publier(`commande:${commandeId}`, payload);

    res.status(201).json({ success: true, data: payload.message });
  } catch (e) {
    next(e);
  }
};
