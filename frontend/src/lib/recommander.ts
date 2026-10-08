import type { CartItem } from '@/context/CartContext';
import { fetchPlatById, prixUnitaireAffiche, quantiteMaxPourPanier } from '@/services/plats';

type LigneCommande = { platId?: string; quantite: number; informationsPlat?: { nom?: string } };

/**
 * Prépare le panier d'une ancienne commande avec les prix et la disponibilité du jour.
 * Les plats retirés du catalogue ou épuisés sont signalés dans `indisponibles`.
 */
export async function preparerRecommande(lignes: LigneCommande[]): Promise<{ articles: CartItem[]; indisponibles: string[] }> {
  const articles: CartItem[] = [];
  const indisponibles: string[] = [];
  for (const l of lignes) {
    if (!l.platId) continue;
    const res = await fetchPlatById(l.platId).catch(() => null);
    const plat = res?.success ? res.data : null;
    const max = plat ? quantiteMaxPourPanier(plat) : 0;
    if (!plat || max === 0) {
      indisponibles.push(l.informationsPlat?.nom ?? 'Plat');
      continue;
    }
    articles.push({
      id: plat._id,
      nom: plat.nom,
      prixUnitaire: prixUnitaireAffiche(plat),
      quantite: max == null ? l.quantite : Math.min(l.quantite, max),
      image: plat.images?.principale ?? '',
      quantiteMax: max,
    });
  }
  return { articles, indisponibles };
}
