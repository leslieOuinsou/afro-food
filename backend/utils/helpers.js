/**
 * Génère un slug URL-friendly à partir d'un nom.
 */
export function genererSlug(nom) {
  return String(nom)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Génère un numéro de commande unique CMD-YYYYMM-XXXX (compteur global)
 */
export async function genererNumeroCommande(prisma) {
  const now = new Date();
  const mois = String(now.getMonth() + 1).padStart(2, '0');
  // séquence Postgres : atomique, donc sans collision entre commandes simultanées
  const [{ n }] = await prisma.$queryRaw`SELECT nextval('commande_numero_seq')::int AS n`;
  return `CMD-${now.getFullYear()}${mois}-${String(n).padStart(4, '0')}`;
}
