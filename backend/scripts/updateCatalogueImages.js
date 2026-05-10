/**
 * Met à jour images.principale (photos Wikimedia Commons, plats réels).
 * Gère les alias de slug selon la génération Mongoose (apostrophes, accents).
 * Usage : depuis backend → node scripts/updateCatalogueImages.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Plat from '../models/Plat.js';
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
  /** en base Mongoose génère souvent sans apostrophe */
  'jus-dananas': imagesCommons.ananas,
  'poulet-yassa': 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Poulet_yassa.jpg',
};

/** Slugs en base ≠ slugs « canon » dans le code */
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
    const r = await Plat.updateOne({ slug: s }, { $set: { 'images.principale': url } });
    if (r.matchedCount) return true;
  }
  return false;
}

async function run() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afro-food';
  await mongoose.connect(mongoURI);
  console.log('✅ Connecté à MongoDB\n');

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

  await Plat.deleteMany({ nom: 'Jollof Rice au Poulet', $or: [{ slug: null }, { slug: { $exists: false } }] });
  const jollof = await Plat.updateOne(
    { slug: 'jollof-rice-au-poulet' },
    { $set: { 'images.principale': imagesCommons.jollofRiz } }
  );
  if (jollof.matchedCount) {
    console.log('✅ jollof-rice-au-poulet (image seule)');
    ok += 1;
  }

  await mongoose.connection.close();
  console.log(`\nTerminé. ${ok} mise(s) à jour, ${miss} slug(s) non trouvé(s) dans la base.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
