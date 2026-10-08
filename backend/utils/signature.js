import crypto from 'crypto';

const CLE_ACTIVE = 'signature_active';
const prefixe = (id) => `signature:${id}`;
const TAILLE_MAX = 300 * 1024;

const estPng = (buf) =>
  buf.length > 24 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

/** Décode un data-URL PNG, ou lève une erreur 400. */
export function decoderPng(dataUrl) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ''));
  if (!m) throw Object.assign(new Error('Image de signature invalide (PNG attendu)'), { statusCode: 400 });
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length > TAILLE_MAX) throw Object.assign(new Error('Signature trop lourde (300 Ko maximum)'), { statusCode: 413 });
  if (!estPng(buf)) throw Object.assign(new Error('Image de signature invalide (PNG attendu)'), { statusCode: 400 });
  return buf;
}

/** Enregistre une nouvelle version de la signature et la rend active. Les anciennes versions sont conservées. */
export async function enregistrerSignature(prisma, { image, nom, fonction }) {
  const buf = decoderPng(image);
  const id = crypto.createHash('sha256').update(buf).update(`|${nom}|${fonction}`).digest('hex').slice(0, 16);
  const valeur = { image: buf.toString('base64'), nom: String(nom).slice(0, 60), fonction: String(fonction).slice(0, 60) };
  await prisma.setting.upsert({ where: { cle: prefixe(id) }, update: { valeur }, create: { cle: prefixe(id), valeur } });
  await prisma.setting.upsert({ where: { cle: CLE_ACTIVE }, update: { valeur: { id } }, create: { cle: CLE_ACTIVE, valeur: { id } } });
  return id;
}

export async function idSignatureActive(prisma) {
  const s = await prisma.setting.findUnique({ where: { cle: CLE_ACTIVE } });
  return s?.valeur?.id ?? null;
}

/** Charge une version de signature : { image: Buffer, nom, fonction } ou null. */
export async function chargerSignature(prisma, id) {
  if (!id) return null;
  const s = await prisma.setting.findUnique({ where: { cle: prefixe(id) } });
  if (!s?.valeur?.image) return null;
  return { image: Buffer.from(s.valeur.image, 'base64'), nom: s.valeur.nom, fonction: s.valeur.fonction };
}

export async function supprimerSignatureActive(prisma) {
  await prisma.setting.deleteMany({ where: { cle: CLE_ACTIVE } });
}
