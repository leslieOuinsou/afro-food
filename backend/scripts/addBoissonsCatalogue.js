/**
 * Ajoute les jus baobab / pastèque / ananas si absents (slug unique).
 * Usage : depuis backend → node scripts/addBoissonsCatalogue.js
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import prisma from '../lib/prisma.js';
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
  console.log('✅ Connexion PostgreSQL (Prisma)\n');

  for (const doc of boissons) {
    const exists = await prisma.plat.findUnique({ where: { slug: doc.slug } });
    if (exists) {
      console.log(`ℹ️ Déjà présent : ${doc.nom} (${doc.slug})`);
      continue;
    }
    await prisma.plat.create({
      data: {
        nom: doc.nom,
        description: doc.description,
        prix: doc.prix,
        categorie: doc.categorie,
        origineAfricaine: doc.origineAfricaine,
        images: doc.images,
        slug: doc.slug,
        disponible: true,
      },
    });
    console.log(`✅ Ajouté : ${doc.nom}`);
  }

  await prisma.$disconnect();
  console.log('\nTerminé.');
  process.exit(0);
}

run().catch(async (err) => {
  console.error('❌', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
