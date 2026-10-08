/**
 * Sérialise les objets Prisma pour compatibilité API (ajoute _id = id).
 * Masque les champs sensibles.
 */
const SENSITIVE = new Set([
  'motDePasse',
  'tokenVerificationEmail',
  'expirationTokenEmail',
  'tokenResetMotDePasse',
  'expirationTokenReset',
  'adresseIP',
  'userAgent',
  'codeRemise', // visible uniquement par le client concerné (voir obtenirCommandeParId)
]);

export function serialize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value !== 'object') return value;

  // Decimal Prisma éventuel
  if (typeof value.toNumber === 'function') return value.toNumber();

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE.has(key)) continue;
    if (key === 'id') {
      out.id = val;
      out._id = val;
      continue;
    }
    // Remapper relations Prisma → forme API historique
    if (key === 'clientId') {
      out.client = out.client ?? val;
      continue;
    }
    if (key === 'utilisateurId') {
      out.utilisateur = out.utilisateur ?? val;
      continue;
    }
    if (key === 'platId') {
      out.plat = out.plat ?? val;
      continue;
    }
    if (key === 'commandeId') {
      out.commande = out.commande ?? val;
      continue;
    }
    if (key === 'creeParAdminId') {
      out.creeParAdmin = out.creeParAdmin ?? val;
      continue;
    }
    if (key === 'livreurId') {
      // aussi dans livraison
      continue;
    }
    if (key === 'reponseContenu' || key === 'reponseDate' || key === 'reponseAuteurId' || key === 'reponseAuteur') {
      continue;
    }
    out[key] = serialize(val);
  }

  // Reconstruire reponseRestaurant pour Avis
  if ('reponseContenu' in value && value.reponseContenu) {
    out.reponseRestaurant = {
      contenu: value.reponseContenu,
      dateReponse: value.reponseDate ? serialize(value.reponseDate) : null,
      auteur: value.reponseAuteur ? serialize(value.reponseAuteur) : value.reponseAuteurId || null,
    };
  }

  return out;
}

export function serializeUser(user) {
  if (!user) return null;
  const base = serialize(user);
  if (user.adresses) {
    base.adresses = user.adresses.map(serialize);
  }
  return base;
}

export function serializeCommande(commande) {
  if (!commande) return null;
  const base = serialize(commande);
  if (commande.client && typeof commande.client === 'object') {
    base.client = serializeUser(commande.client);
  } else if (commande.clientId) {
    base.client = commande.clientId;
  }
  if (commande.articles) {
    base.articles = commande.articles.map((a) => {
      const art = serialize(a);
      if (a.plat && typeof a.plat === 'object') {
        art.plat = serialize(a.plat);
      } else if (a.platId) {
        art.plat = a.platId;
      }
      return art;
    });
  }
  if (commande.historiqueStatuts) {
    base.historiqueStatut = commande.historiqueStatuts.map(serialize);
  }
  // Virtuals historiques
  const dates = commande.dates || {};
  const dateCmd = dates.commande ? new Date(dates.commande) : new Date(commande.createdAt);
  const statutsAnnulables = ['en_attente', 'confirmee'];
  base.peutEtreAnnulee =
    statutsAnnulables.includes(commande.statut) &&
    Date.now() - dateCmd.getTime() < 30 * 60 * 1000;
  const labels = {
    en_attente: 'En attente de confirmation',
    confirmee: 'Confirmée',
    en_preparation: 'En préparation',
    prete: 'Prête pour livraison',
    en_livraison: 'En cours de livraison',
    livree: 'Livrée',
    annulee: 'Annulée',
    remboursee: 'Remboursée',
  };
  base.statutAffichage = labels[commande.statut] || commande.statut;
  return base;
}

export function serializePlat(plat) {
  if (!plat) return null;
  const base = serialize(plat);
  const prix = plat.prix;
  const prixPromo = plat.prixPromo;
  base.prixEffectif = prixPromo && prixPromo > 0 && prixPromo < prix ? prixPromo : prix;
  base.enPromotion = !!(prixPromo && prixPromo > 0 && prixPromo < prix);
  base.pourcentageReduction = base.enPromotion
    ? Math.round(((prix - prixPromo) / prix) * 100)
    : 0;
  return base;
}

export function serializeAvis(avis) {
  if (!avis) return null;
  const base = serialize(avis);
  if (avis.utilisateur && typeof avis.utilisateur === 'object') {
    base.utilisateur = serializeUser(avis.utilisateur);
  }
  if (avis.plat && typeof avis.plat === 'object') {
    base.plat = serializePlat(avis.plat);
  }
  if (avis.commande && typeof avis.commande === 'object') {
    base.commande = {
      id: avis.commande.id,
      _id: avis.commande.id,
      numeroCommande: avis.commande.numeroCommande,
    };
  }
  return base;
}

/** Valide un ID cuid / uuid */
export function isValidId(id) {
  if (!id || typeof id !== 'string') return false;
  if (/^c[a-z0-9]{24,}$/i.test(id)) return true; // cuid
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    return true;
  return false;
}
