const CLE_REGLAGE = 'attribution_auto';
const cle_position = (id) => `position_livreur:${id}`;

export async function attributionActive(prisma) {
  const s = await prisma.setting.findUnique({ where: { cle: CLE_REGLAGE } });
  return s?.valeur?.actif !== false; // actif par défaut
}
export async function definirAttribution(prisma, actif) {
  const valeur = { actif: Boolean(actif) };
  await prisma.setting.upsert({ where: { cle: CLE_REGLAGE }, update: { valeur }, create: { cle: CLE_REGLAGE, valeur } });
  return valeur;
}

/** Dernière position connue d'un livreur en service (envoyée par son téléphone). */
export async function enregistrerPosition(prisma, livreurId, lat, lng) {
  const valeur = { lat, lng, date: new Date().toISOString() };
  await prisma.setting.upsert({ where: { cle: cle_position(livreurId) }, update: { valeur }, create: { cle: cle_position(livreurId), valeur } });
}
export async function lirePosition(prisma, livreurId, maxAgeMin = 20) {
  const s = await prisma.setting.findUnique({ where: { cle: cle_position(livreurId) } });
  const v = s?.valeur;
  if (!v || typeof v.lat !== 'number' || typeof v.lng !== 'number') return null;
  return Date.now() - new Date(v.date).getTime() <= maxAgeMin * 60000 ? v : null;
}

/** Distance à vol d'oiseau en km (formule de haversine). */
export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Choisit le livreur : le moins chargé d'abord, puis le plus proche de l'adresse (si les deux positions sont connues).
 * candidats : [{ id, charge, position: {lat,lng} | null }]
 */
export function choisirLivreur(candidats, destination) {
  if (!candidats.length) return null;
  const dist = (c) => (destination && c.position ? distanceKm(c.position, destination) : Infinity);
  return [...candidats].sort((a, b) => a.charge - b.charge || dist(a) - dist(b) || (a.id < b.id ? -1 : 1))[0];
}

/** Coordonnées d'une adresse française via l'API officielle adresse.data.gouv.fr (gratuite, sans clé). */
export async function geocoder(adresse) {
  const q = [adresse?.adresse, adresse?.codePostal, adresse?.ville].filter(Boolean).join(' ');
  if (!q.trim()) return null;
  try {
    const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const [lng, lat] = (await res.json())?.features?.[0]?.geometry?.coordinates ?? [];
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

/**
 * Attribue une commande « prête » au meilleur livreur en service.
 * Retourne l'identifiant du livreur choisi, ou null (personne en service, ou attribution désactivée).
 */
export async function attribuerCommande(prisma, commande) {
  if (!(await attributionActive(prisma))) return null;
  const sessions = await prisma.pointageLivreur.findMany({
    where: { fin: null, livreur: { estActif: true, role: 'livreur' } },
    select: { livreurId: true },
  });
  if (!sessions.length) return null;

  const ids = sessions.map((s) => s.livreurId);
  const [charges, plafonnes] = await Promise.all([
    prisma.commande.groupBy({ by: ['livreurId'], where: { livreurId: { in: ids }, statut: { in: ['prete', 'en_livraison'] } }, _count: true }),
    // Livreur ayant atteint le plafond d'espèces : pas de nouvelle course en espèces
    commande.methodePaiement === 'especes'
      ? prisma.commande.groupBy({ by: ['livreurId'], where: { livreurId: { in: ids }, especesStatut: 'a_reverser' }, _sum: { especesEncaissees: true } })
      : Promise.resolve([]),
  ]);
  const plafond = Number(process.env.PLAFOND_ESPECES) || 150;
  const bloques = new Set(plafonnes.filter((p) => (p._sum.especesEncaissees ?? 0) >= plafond).map((p) => p.livreurId));
  const chargeDe = new Map(charges.map((c) => [c.livreurId, c._count]));

  const destination = commande.adresseLivraison?.coords ?? null;
  const candidats = await Promise.all(
    ids
      .filter((id) => !bloques.has(id))
      .map(async (id) => ({ id, charge: chargeDe.get(id) ?? 0, position: await lirePosition(prisma, id) }))
  );
  const choisi = choisirLivreur(candidats, destination);
  if (!choisi) return null;

  const { count } = await prisma.commande.updateMany({
    where: { id: commande.id, livreurId: null, statut: 'prete' },
    data: { livreurId: choisi.id, livraison: { ...(commande.livraison || {}), livreur: choisi.id, attribueAuto: true } },
  });
  return count === 1 ? choisi.id : null;
}
