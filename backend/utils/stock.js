import prisma from '../lib/prisma.js';
import { publier } from './events.js';

const SEUIL_BAS = Number(process.env.STOCK_SEUIL_BAS) || 5;

/**
 * Après une mise à jour de stock : crée une alerte si bas / rupture (déduplique les non traitées du même type).
 */
export async function verifierAlerteStock(plat) {
  if (!plat || plat.quantiteDisponible == null) return null;
  const q = plat.quantiteDisponible;
  const type = q <= 0 || plat.enRupture ? 'rupture' : q <= SEUIL_BAS ? 'bas' : null;
  if (!type) return null;

  const existante = await prisma.alerteStock.findFirst({
    where: { platId: plat.id, type, traitee: false },
  });
  if (existante) return existante;

  const alerte = await prisma.alerteStock.create({
    data: {
      platId: plat.id,
      type,
      quantite: q,
      message:
        type === 'rupture'
          ? `Rupture : « ${plat.nom} »`
          : `Stock bas : « ${plat.nom} » (${q} restant${q > 1 ? 's' : ''})`,
    },
  });
  publier('stock', { type: 'alerte', alerte });
  return alerte;
}
