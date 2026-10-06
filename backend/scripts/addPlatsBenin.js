/**
 * Insère les plats béninois du catalogue s'ils n'existent pas (slug unique).
 * Usage : depuis backend → node scripts/addPlatsBenin.js
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import prisma from '../lib/prisma.js';
import { platsBenin } from './data/platsBenin.js';
import { genererSlug } from '../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function run() {
  console.log('✅ Connexion PostgreSQL (Prisma)\n');

  let ajoutes = 0;
  for (const doc of platsBenin) {
    const slug = doc.slug || genererSlug(doc.nom);
    const exists = await prisma.plat.findUnique({ where: { slug } });
    if (exists) {
      console.log(`ℹ️ Déjà présent : ${doc.nom}`);
      continue;
    }
    await prisma.plat.create({
      data: {
        nom: doc.nom,
        description: doc.description,
        descriptionLongue: doc.descriptionLongue || null,
        prix: doc.prix,
        prixPromo: doc.prixPromo || null,
        categorie: doc.categorie,
        origineAfricaine: doc.origineAfricaine || { pays: 'benin', traditionnel: true },
        images: doc.images || { principale: '', galerie: [] },
        slug,
        disponible: doc.disponible !== false,
        tags: doc.tags || [],
        allergenes: doc.allergenes || [],
        regimesCompatibles: doc.regimesCompatibles || [],
        niveauEpice: doc.niveauEpice || 'moyen',
        ingredients: doc.ingredients || [],
        variations: doc.variations || [],
      },
    });
    console.log(`✅ Ajouté : ${doc.nom}`);
    ajoutes += 1;
  }

  await prisma.$disconnect();
  console.log(`\nTerminé. ${ajoutes} nouveau(x) plat(s).`);
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
