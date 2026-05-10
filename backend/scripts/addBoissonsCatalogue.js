/**
 * Ajoute les jus baobab / pastèque / ananas si absents (slug unique).
 * Usage : depuis backend → node scripts/addBoissonsCatalogue.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Plat from '../models/Plat.js';
import { imagesCommons } from './data/platsBenin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const boissons = [
  {
    nom: 'Jus de baobab',
    slug: 'jus-de-baobab',
    description:
      'Jus onctueux à base de pulpe de baobab, riche en vitamine C et légèrement acidulé. Rafraîchissant.',
    prix: 4.5,
    categorie: 'boissons',
    origineAfricaine: { pays: 'senegal', traditionnel: true },
    images: { principale: imagesCommons.baobabFruit },
    disponible: true,
  },
  {
    nom: 'Jus de pastèque',
    slug: 'jus-de-pasteque',
    description: 'Jus frais et léger, sucré et désaltérant, parfait avec les plats épicés.',
    prix: 4,
    categorie: 'boissons',
    origineAfricaine: { pays: 'cote-ivoire', traditionnel: true },
    images: { principale: imagesCommons.pasteque },
    disponible: true,
  },
  {
    nom: "Jus d'ananas",
    slug: 'jus-d-ananas',
    description:
      "Jus d'ananas pressé, parfumé et acidulé, boisson tropicale pleine de soleil.",
    prix: 4.5,
    categorie: 'boissons',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.ananas },
    disponible: true,
  },
];

async function run() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afro-food';
  await mongoose.connect(mongoURI);
  console.log('✅ Connecté à MongoDB\n');

  for (const doc of boissons) {
    const exists = await Plat.findOne({ slug: doc.slug });
    if (exists) {
      console.log(`ℹ️ Déjà présent : ${doc.nom} (${doc.slug})`);
      continue;
    }
    await Plat.create(doc);
    console.log(`✅ Ajouté : ${doc.nom}`);
  }

  await mongoose.connection.close();
  console.log('\nTerminé.');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
