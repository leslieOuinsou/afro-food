/**
 * Met à jour images.principale (photos Wikimedia Commons).
 * Usage : depuis backend → node scripts/updateCatalogueImages.js
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import prisma from '../lib/prisma.js';
import { platsBenin, imagesCommons } from './data/platsBenin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const seedBaseSlugs = {
  'jollof-rice-au-poulet': imagesCommons.jollofRiz,
  'mafe-de-boeuf': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Domoda.jpg',
  alloco: imagesCommons.alloco,
  'jus-de-bissap': imagesCommons.jusBissap,
  'jus-de-baobab': imagesCommons.baobabFruit,
  'jus-de-pasteque': imagesCommons.pasteque,
  'jus-dananas': imagesCommons.ananas,
  'jus-d-ananas': imagesCommons.ananas,
  'poulet-yassa': 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Poulet_yassa.jpg',
};

const slugAliases = {
  'soupe-pistache-boeuf': ['soupe-pistache-au-buf'],
  'salade-avocat-crevettes': ['salade-davocat-aux-crevettes'],
  'sauce-crincrin-poisson-fume': ['sauce-crincrin-au-poisson-fume'],
  'mafe-de-boeuf': ['mafe-de-buf'],
};

function buildSlugToUrl() {
  const fromBenin = Object.fromEntries(
    platsBenin.map((p) => [p.slug, p.images.principale])
  );
  return { ...seedBaseSlugs, ...fromBenin };
}

async function setImageBySlug(slug, url) {
  const aliases = slugAliases[slug] || [];
  const trySlugs = [slug, ...aliases];
  for (const s of trySlugs) {
    const plat = await prisma.plat.findUnique({ where: { slug: s } });
    if (!plat) continue;
    const images = typeof plat.images === 'object' && plat.images ? { ...plat.images } : {};
    images.principale = url;
    await prisma.plat.update({
      where: { id: plat.id },
      data: { images, derniereModification: new Date() },
    });
    return true;
  }
  return false;
}

async function run() {
  console.log('✅ Connexion PostgreSQL (Prisma)\n');

  const map = buildSlugToUrl();
  let ok = 0;
  let miss = 0;

  for (const [slug, url] of Object.entries(map)) {
    const done = await setImageBySlug(slug, url);
    if (done) {
      console.log(`✅ ${slug}`);
      ok += 1;
    } else {
      console.log(`⚠️ Slug absent : ${slug}`);
      miss += 1;
    }
  }

  await prisma.$disconnect();
  console.log(`\nTerminé. ${ok} mise(s) à jour, ${miss} slug(s) non trouvé(s).`);
  process.exit(0);
}

run().catch(async (err) => {
  console.error('❌', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
