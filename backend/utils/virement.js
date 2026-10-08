/** Coordonnées bancaires pour le paiement par virement (variables d'environnement VIREMENT_*). */
export function coordonneesVirement(commande) {
  const iban = (process.env.VIREMENT_IBAN || '').trim();
  if (!iban) return null;
  return {
    titulaire: (process.env.VIREMENT_TITULAIRE || 'Afro-food').trim(),
    iban,
    bic: (process.env.VIREMENT_BIC || '').trim(),
    banque: (process.env.VIREMENT_BANQUE || '').trim(),
    reference: commande?.numeroCommande || '',
  };
}

export const estVirementEnAttente = (commande) =>
  commande?.methodePaiement === 'virement' && commande?.statutPaiement !== 'valide';
