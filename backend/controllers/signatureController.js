import prisma from '../lib/prisma.js';
import { chargerSignature, enregistrerSignature, idSignatureActive, supprimerSignatureActive } from '../utils/signature.js';

/** GET /api/signature — signature active (admin) */
export const lireSignature = async (req, res, next) => {
  try {
    const id = await idSignatureActive(prisma);
    const s = await chargerSignature(prisma, id);
    res.json({
      success: true,
      data: s ? { id, nom: s.nom, fonction: s.fonction, image: `data:image/png;base64,${s.image.toString('base64')}` } : null,
    });
  } catch (e) {
    next(e);
  }
};

/** PUT /api/signature { image, nom, fonction } — nouvelle signature, appliquée aux prochains justificatifs (admin) */
export const definirSignature = async (req, res, next) => {
  try {
    const nom = String(req.body?.nom ?? '').trim();
    const fonction = String(req.body?.fonction ?? '').trim();
    if (nom.length < 2) return next(Object.assign(new Error('Indiquez le nom du signataire'), { statusCode: 400 }));
    const id = await enregistrerSignature(prisma, { image: req.body?.image, nom, fonction: fonction || 'Afro-food' });
    res.json({ success: true, message: 'Signature enregistrée', data: { id } });
  } catch (e) {
    next(e);
  }
};

/** DELETE /api/signature — revient à la signature par défaut */
export const retirerSignature = async (req, res, next) => {
  try {
    await supprimerSignatureActive(prisma);
    res.json({ success: true, message: 'Signature par défaut rétablie' });
  } catch (e) {
    next(e);
  }
};
