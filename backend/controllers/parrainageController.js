import { assurerCodeParrain } from '../utils/parrainage.js';
import prisma from '../lib/prisma.js';

/** GET /api/parrainage — mon code + stats */
export const monParrainage = async (req, res, next) => {
  try {
    const code = await assurerCodeParrain(req.utilisateur.id);
    const filleuls = await prisma.user.count({ where: { parraineParId: req.utilisateur.id } });
    const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    res.json({
      success: true,
      data: {
        code,
        filleuls,
        lien: `${front}/inscription?parrain=${encodeURIComponent(code)}`,
        recompenseFilleul: '−5 € dès 20 €',
        recompenseParrain: '+50 points à la 1re livraison du filleul',
      },
    });
  } catch (e) {
    next(e);
  }
};
