const CLE = 'entreprise';

export const ENTREPRISE_DEFAUT = {
  nom: 'Afro-food',
  adresse: '',
  codePostal: '',
  ville: '',
  siret: '',
  tvaIntra: '',
  email: process.env.SUPPORT_EMAIL || 'support@afro-eats.com',
  telephone: '',
  formeJuridique: '',
};

const CHAMPS = Object.keys(ENTREPRISE_DEFAUT);

/** Coordonnées légales du vendeur, affichées sur les factures et bulletins. */
export async function lireEntreprise(prisma) {
  const s = await prisma.setting.findUnique({ where: { cle: CLE } });
  return { ...ENTREPRISE_DEFAUT, ...(s?.valeur ?? {}) };
}

export async function enregistrerEntreprise(prisma, donnees) {
  const valeur = {};
  for (const c of CHAMPS) valeur[c] = String(donnees?.[c] ?? '').trim().slice(0, 120);
  if (!valeur.nom) valeur.nom = ENTREPRISE_DEFAUT.nom;
  await prisma.setting.upsert({ where: { cle: CLE }, update: { valeur }, create: { cle: CLE, valeur } });
  return valeur;
}
