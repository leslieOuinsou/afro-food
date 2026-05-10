/**
 * Script de seed : insère des plats de démonstration pour tester la liste et le CRUD.
 * Usage : depuis le dossier backend → node scripts/seedPlats.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Plat from '../models/Plat.js';
import { platsBenin, imagesCommons } from './data/platsBenin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const platsDemoBase = [
  {
    nom: 'Jollof Rice au Poulet',
    slug: 'jollof-rice-au-poulet',
    description: 'Riz savoureux à la sauce tomate épicée, poulet grillé et légumes. Un classique ouest-africain.',
    prix: 15.5,
    categorie: 'plats-principaux',
    origineAfricaine: { pays: 'senegal', traditionnel: true },
    images: { principale: imagesCommons.jollofRiz },
    disponible: true
  },
  {
    nom: 'Mafé de Bœuf',
    slug: 'mafe-de-boeuf',
    description: 'Ragoût de bœuf à la sauce arachide, légumes et riz. Réconfortant et parfumé.',
    prix: 17,
    categorie: 'plats-principaux',
    origineAfricaine: { pays: 'senegal', traditionnel: true },
    images: { principale: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Domoda.jpg' },
    disponible: true
  },
  {
    nom: 'Alloco',
    slug: 'alloco',
    description: 'Plantains frits, croustillants et fondants. Parfait en accompagnement ou en snack.',
    prix: 6.5,
    categorie: 'accompagnements',
    origineAfricaine: { pays: 'cote-ivoire', traditionnel: true },
    images: { principale: imagesCommons.alloco },
    disponible: true
  },
  {
    nom: 'Jus de Bissap',
    slug: 'jus-de-bissap',
    description: 'Boisson à base de fleurs d\'hibiscus, douce et acidulée. Rafraîchissant.',
    prix: 4,
    categorie: 'boissons',
    origineAfricaine: { pays: 'senegal', traditionnel: true },
    images: { principale: imagesCommons.jusBissap },
    disponible: true
  },
  {
    nom: 'Jus de baobab',
    slug: 'jus-de-baobab',
    description: 'Jus onctueux à base de pulpe de baobab, riche en vitamine C et légèrement acidulé. Rafraîchissant.',
    prix: 4.5,
    categorie: 'boissons',
    origineAfricaine: { pays: 'senegal', traditionnel: true },
    images: { principale: imagesCommons.baobabFruit },
    disponible: true
  },
  {
    nom: 'Jus de pastèque',
    slug: 'jus-de-pasteque',
    description: 'Jus frais et léger, sucré et désaltérant, parfait avec les plats épicés.',
    prix: 4,
    categorie: 'boissons',
    origineAfricaine: { pays: 'cote-ivoire', traditionnel: true },
    images: { principale: imagesCommons.pasteque },
    disponible: true
  },
  {
    nom: 'Jus d\'ananas',
    slug: 'jus-d-ananas',
    description: 'Jus d’ananas pressé, parfumé et acidulé, boisson tropicale pleine de soleil.',
    prix: 4.5,
    categorie: 'boissons',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.ananas },
    disponible: true
  },
  {
    nom: 'Poulet Yassa',
    slug: 'poulet-yassa',
    description: 'Poulet mariné citron-moutarde, oignons caramélisés et riz. Spécialité sénégalaise.',
    prix: 16.5,
    categorie: 'specialites-africaines',
    origineAfricaine: { pays: 'senegal', traditionnel: true },
    images: { principale: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Poulet_yassa.jpg' },
    disponible: true
  }
];

export const platsDemo = [...platsDemoBase, ...platsBenin];

async function seed() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afro-food';
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    const count = await Plat.countDocuments();
    if (count > 0) {
      console.log(`ℹ️ La base contient déjà ${count} plat(s). Pas d\'insertion pour éviter les doublons.`);
      console.log('   Pour réinitialiser : supprimez les plats depuis l\'admin ou la base, puis relancez ce script.');
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    await Plat.insertMany(platsDemo);
    console.log(`✅ ${platsDemo.length} plat(s) de démonstration insérés.`);
    console.log('   Rafraîchissez la page Gestion des plats pour voir la liste.');
  } catch (err) {
    console.error('❌ Erreur seed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  path.normalize(fileURLToPath(import.meta.url)) === path.normalize(process.argv[1]);
if (isMain) seed();
