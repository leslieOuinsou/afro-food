const fmt = (n) => `${Number(n).toFixed(2).replace('.', ',')} €`;
const norm = (s) => String(s ?? '').trim().toLowerCase();

/** Un code promo est-il utilisable à l'instant `maintenant` (hors conditions liées au panier) ? */
export function promoEstValide(promo, maintenant = new Date()) {
  if (!promo || !promo.actif) return false;
  if (promo.dateDebut > maintenant) return false;
  if (promo.dateFin && promo.dateFin < maintenant) return false;
  if (promo.utilisationsMax != null && promo.utilisations >= promo.utilisationsMax) return false;
  return true;
}

/**
 * Montant de remise sur `base` (jamais supérieur à `base`), arrondi au centime.
 * `fraisLivraison` n'est utilisé que pour le type « livraison » (livraison offerte).
 */
export function calculerRemise(promo, base, fraisLivraison = 0) {
  let remise;
  if (promo.typeRemise === 'livraison') {
    return Math.round(Math.max(0, fraisLivraison) * 100) / 100;
  }
  if (promo.typeRemise === 'fixe') {
    remise = promo.valeur;
  } else {
    remise = base * (promo.valeur / 100);
    if (promo.montantMax != null) remise = Math.min(remise, promo.montantMax);
  }
  remise = Math.min(remise, base);
  // Code « récompense » : remise sur les plats + frais de livraison offerts
  if (promo.livraisonOfferte) remise += Math.max(0, fraisLivraison);
  return Math.round(remise * 100) / 100;
}

/**
 * Évalue un code promo pour un panier donné.
 * ctx : { sousTotal, fraisLivraison, lignes: [{ categorie, sousTotal }],
 *         nbCommandesClient, nbUsagesClient, maintenant? }
 * Retourne { ok: true, remise } ou { ok: false, raison, message }.
 */
export function evaluerPromo(promo, ctx) {
  const maintenant = ctx.maintenant ?? new Date();
  const refus = (raison, message) => ({ ok: false, raison, message });

  if (!promo) return refus('introuvable', 'Code promo invalide');
  if (!promo.actif) return refus('inactif', "Ce code promo n'est plus actif");
  if (promo.dateDebut > maintenant) return refus('pas_commence', "Ce code promo n'est pas encore valable");
  if (promo.dateFin && promo.dateFin < maintenant) return refus('expire', 'Ce code promo a expiré');
  if (promo.utilisationsMax != null && promo.utilisations >= promo.utilisationsMax) {
    return refus('epuise', "Ce code promo n'est plus disponible");
  }

  if (promo.clientId && promo.clientId !== ctx.clientId) {
    return refus('personnel', 'Ce code est personnel : il est réservé au client à qui il a été envoyé');
  }
  if (promo.premiereCommandeSeulement && ctx.nbCommandesClient > 0) {
    return refus('premiere_commande', 'Ce code est réservé à la première commande');
  }
  if (promo.usageParClient != null && ctx.nbUsagesClient >= promo.usageParClient) {
    return refus(
      'deja_utilise',
      promo.usageParClient === 1
        ? 'Vous avez déjà utilisé ce code'
        : `Ce code est limité à ${promo.usageParClient} utilisations par client`
    );
  }
  if (promo.montantMinimum != null && ctx.sousTotal < promo.montantMinimum) {
    return refus(
      'minimum',
      `Ce code nécessite un panier d'au moins ${fmt(promo.montantMinimum)} (il manque ${fmt(promo.montantMinimum - ctx.sousTotal)})`
    );
  }

  let base = ctx.sousTotal;
  const categories = (promo.categories || []).map(norm).filter(Boolean);
  if (categories.length) {
    base = ctx.lignes.filter((l) => categories.includes(norm(l.categorie))).reduce((n, l) => n + l.sousTotal, 0);
    if (base <= 0) {
      return refus('categories', `Ce code ne s'applique qu'à : ${promo.categories.join(', ')}`);
    }
  }

  if (promo.typeRemise === 'livraison' && !promo.livraisonOfferte && !(ctx.fraisLivraison > 0)) {
    return refus('livraison_deja_offerte', 'La livraison est déjà offerte pour cette commande');
  }

  return { ok: true, remise: calculerRemise(promo, base, ctx.fraisLivraison) };
}

/** Conditions lisibles par le client. */
export function decrirePromo(promo) {
  const lignes = [];
  if (promo.typeRemise === 'livraison') lignes.push('Livraison offerte');
  else if (promo.typeRemise === 'fixe') lignes.push(`${fmt(promo.valeur)} de remise`);
  else {
    lignes.push(
      `${promo.valeur} % de remise${promo.montantMax != null ? ` (plafonnée à ${fmt(promo.montantMax)})` : ''}`
    );
  }
  if (promo.livraisonOfferte && promo.typeRemise !== 'livraison') lignes.push('Livraison offerte');
  if (promo.montantMinimum != null) lignes.push(`Dès ${fmt(promo.montantMinimum)} d'achat`);
  if (promo.premiereCommandeSeulement) lignes.push('Première commande uniquement');
  if (promo.usageParClient != null) lignes.push(`${promo.usageParClient} utilisation(s) par client`);
  if (promo.categories?.length) lignes.push(`Sur : ${promo.categories.join(', ')}`);
  if (promo.dateFin) lignes.push(`Valable jusqu'au ${new Date(promo.dateFin).toLocaleDateString('fr-FR')}`);
  return lignes;
}
