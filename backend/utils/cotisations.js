const CLE = 'paie_cotisations';
export const COTISATIONS_DEFAUT = { tauxSalarial: 22, tauxPatronal: 42 };

export async function lireCotisations(prisma) {
  const s = await prisma.setting.findUnique({ where: { cle: CLE } });
  return { ...COTISATIONS_DEFAUT, ...(s?.valeur ?? {}) };
}

export async function enregistrerCotisations(prisma, d) {
  const borne = (v, def) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 100) / 100 : def;
  };
  const valeur = { tauxSalarial: borne(d?.tauxSalarial, COTISATIONS_DEFAUT.tauxSalarial), tauxPatronal: borne(d?.tauxPatronal, COTISATIONS_DEFAUT.tauxPatronal) };
  await prisma.setting.upsert({ where: { cle: CLE }, update: { valeur }, create: { cle: CLE, valeur } });
  return valeur;
}

const arrondir = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Décomposition simplifiée d'une rémunération brute : cotisations salariales, net avant impôt, coût employeur. */
export function calculerBulletin(brut, { tauxSalarial, tauxPatronal }) {
  const cotisationsSalariales = arrondir((brut * tauxSalarial) / 100);
  const cotisationsPatronales = arrondir((brut * tauxPatronal) / 100);
  return {
    brut: arrondir(brut),
    cotisationsSalariales,
    netAvantImpot: arrondir(brut - cotisationsSalariales),
    cotisationsPatronales,
    coutEmployeur: arrondir(brut + cotisationsPatronales),
  };
}
