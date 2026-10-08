const CLE = 'primes_livreur';

export const PRIMES_DEFAUT = {
  actif: true,
  paliersLivraisons: [
    { min: 8, prime: 5 },
    { min: 12, prime: 12 },
  ],
  noteMinimale: 4.5,
  avisMinimum: 3,
  primeAvis: 3,
};

export async function lirePrimes(prisma) {
  const s = await prisma.setting.findUnique({ where: { cle: CLE } });
  return { ...PRIMES_DEFAUT, ...(s?.valeur ?? {}) };
}

export async function enregistrerPrimes(prisma, d) {
  const paliers = (Array.isArray(d?.paliersLivraisons) ? d.paliersLivraisons : [])
    .map((p) => ({ min: Math.floor(Number(p.min)), prime: Math.round(Number(p.prime) * 100) / 100 }))
    .filter((p) => p.min >= 1 && p.min <= 200 && p.prime > 0 && p.prime <= 500)
    .sort((a, b) => a.min - b.min)
    .slice(0, 8);
  const valeur = {
    actif: Boolean(d?.actif),
    paliersLivraisons: paliers,
    noteMinimale: Math.max(1, Math.min(5, Number(d?.noteMinimale) || 4.5)),
    avisMinimum: Math.max(1, Math.min(50, Math.floor(Number(d?.avisMinimum)) || 3)),
    primeAvis: Math.max(0, Math.min(500, Math.round(Number(d?.primeAvis) * 100) / 100 || 0)),
  };
  await prisma.setting.upsert({ where: { cle: CLE }, update: { valeur }, create: { cle: CLE, valeur } });
  return valeur;
}

/**
 * Prime d'une journée : le plus haut palier de livraisons atteint, plus un bonus si la note moyenne des avis du jour est suffisante.
 * @param notes notes (1 à 5) des commandes livrées ce jour-là qui ont reçu un avis
 */
export function calculerPrime(config, { nbLivraisons, notes }) {
  if (!config.actif) return { prime: 0, detail: null };
  const parts = [];
  let prime = 0;
  const palier = [...config.paliersLivraisons].filter((p) => nbLivraisons >= p.min).sort((a, b) => b.min - a.min)[0];
  if (palier) {
    prime += palier.prime;
    parts.push(`${nbLivraisons} livraisons (≥ ${palier.min}) : +${palier.prime} €`);
  }
  if (config.primeAvis > 0 && notes.length >= config.avisMinimum) {
    const moyenne = notes.reduce((t, n) => t + n, 0) / notes.length;
    if (moyenne >= config.noteMinimale) {
      prime += config.primeAvis;
      parts.push(`note moyenne ${moyenne.toFixed(1).replace('.', ',')}/5 sur ${notes.length} avis : +${config.primeAvis} €`);
    }
  }
  return { prime: Math.round(prime * 100) / 100, detail: parts.length ? parts.join(' · ') : null };
}
