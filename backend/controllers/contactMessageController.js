import { ContactMessage } from '../models/index.js';
import mongoose from 'mongoose';

/**
 * Créer un message depuis la page contact (public)
 * POST /api/contact
 */
export const creerMessage = async (req, res, next) => {
  try {
    const { nom, email, sujet, message } = req.body;
    if (!nom || !email || !sujet || !message) {
      const error = new Error('Tous les champs (nom, email, sujet, message) sont requis');
      error.statusCode = 400;
      return next(error);
    }
    const doc = await ContactMessage.create({ nom, email, sujet, message });
    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès. Nous vous répondrons rapidement.',
      data: { message: doc }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Liste des messages (admin)
 * GET /api/messages
 */
export const obtenirMessages = async (req, res, next) => {
  try {
    const { statut, page = 1, limite = 50 } = req.query;
    const query = statut ? { statut } : {};
    const skip = (parseInt(page, 10) - 1) * parseInt(limite, 10);
    const [messages, total] = await Promise.all([
      ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limite, 10)).lean(),
      ContactMessage.countDocuments(query)
    ]);
    res.json({
      success: true,
      message: 'Messages récupérés',
      data: { messages },
      pagination: { page: parseInt(page, 10), total, totalPages: Math.ceil(total / parseInt(limite, 10)) }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Détail d'un message + marquer comme lu (admin)
 * GET /api/messages/:id
 */
export const obtenirMessageParId = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de message invalide');
      error.statusCode = 400;
      return next(error);
    }
    const msg = await ContactMessage.findById(id).lean();
    if (!msg) {
      const error = new Error('Message non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    if (msg.statut === 'non_lu') {
      await ContactMessage.findByIdAndUpdate(id, { statut: 'lu', dateLecture: new Date() });
      msg.statut = 'lu';
      msg.dateLecture = new Date();
    }
    res.json({ success: true, message: 'Message récupéré', data: { message: msg } });
  } catch (err) {
    next(err);
  }
};

/**
 * Marquer un message comme lu (admin)
 * PATCH /api/messages/:id/lu
 */
export const marquerCommeLu = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de message invalide');
      error.statusCode = 400;
      return next(error);
    }
    const msg = await ContactMessage.findByIdAndUpdate(
      id,
      { statut: 'lu', dateLecture: new Date() },
      { new: true }
    ).lean();
    if (!msg) {
      const error = new Error('Message non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    res.json({ success: true, message: 'Message marqué comme lu', data: { message: msg } });
  } catch (err) {
    next(err);
  }
};

/**
 * Répondre à un message (admin)
 * POST /api/messages/:id/reply
 * Body: { corps: string }
 */
export const repondreMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { corps } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID de message invalide');
      error.statusCode = 400;
      return next(error);
    }
    if (!corps || typeof corps !== 'string' || !corps.trim()) {
      const error = new Error('Le contenu de la réponse est requis');
      error.statusCode = 400;
      return next(error);
    }
    const nomComplet = req.utilisateur
      ? [req.utilisateur.nom, req.utilisateur.prenom].filter(Boolean).join(' ').trim() || req.utilisateur.email
      : '';
    const auteur = nomComplet || 'Admin';
    const msg = await ContactMessage.findByIdAndUpdate(
      id,
      {
        $push: { reponses: { corps: corps.trim(), auteur } },
        statut: 'repondu'
      },
      { new: true }
    ).lean();
    if (!msg) {
      const error = new Error('Message non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    res.json({
      success: true,
      message: 'Réponse envoyée',
      data: { message: msg }
    });
  } catch (err) {
    next(err);
  }
};
