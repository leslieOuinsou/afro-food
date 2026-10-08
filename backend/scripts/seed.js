/**
 * Seed complet Prisma : admin + plats démo + promo BIENVENUE5 + settings.
 * Usage : node scripts/seed.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { platsDemo } from './seedPlats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'admin@afrofood.com';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'Admin123!';

const SETTINGS_DEFAUT = {
  livraison: {
    fraisStandard: 3.9,
    seuilGratuit: 30,
    zones: [],
    delaiEstimeMinutes: 45,
  },
  restaurant: {
    nom: 'Afro-food',
    telephone: '',
    email: 'contact@afro-food.com',
    adresse: '',
  },
  commandes: {
    taxesPourcentage: 10,
    annulationMinutes: 30,
  },
};

async function seedAdmin() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12);
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    if (existing.role !== 'admin') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'admin' },
      });
      console.log(`✓ Compte ${ADMIN_EMAIL} passé en admin`);
    } else {
      console.log(`✓ Admin déjà présent : ${ADMIN_EMAIL}`);
    }
    return existing;
  }

  const admin = await prisma.user.create({
    data: {
      nom: 'Admin',
      prenom: 'AfroFood',
      email: ADMIN_EMAIL,
      telephone: '+33000000000',
      motDePasse: hash,
      role: 'admin',
    },
  });
  console.log(`✓ Admin créé : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  return admin;
}

async function seedPlats() {
  const count = await prisma.plat.count();
  if (count > 0) {
    console.log(`ℹ️ ${count} plat(s) déjà en base — skip plats`);
    return;
  }

  for (const p of platsDemo) {
    await prisma.plat.create({
      data: {
        nom: p.nom,
        slug: p.slug,
        description: p.description,
        prix: p.prix,
        categorie: p.categorie,
        origineAfricaine: p.origineAfricaine || { pays: 'multiple', traditionnel: true },
        images: p.images || { principale: null },
        disponible: p.disponible !== false,
        tags: p.tags || [],
        allergenes: p.allergenes || [],
        regimesCompatibles: p.regimesCompatibles || [],
        niveauEpice: p.niveauEpice || 'moyen',
        ingredients: p.ingredients || [],
        variations: p.variations || [],
        estNouveaute: !!p.estNouveaute,
        estMisEnAvant: !!p.estMisEnAvant,
      },
    });
  }
  console.log(`✓ ${platsDemo.length} plat(s) de démonstration insérés`);
}

async function seedPromo() {
  await prisma.promoCode.upsert({
    where: { code: 'BIENVENUE5' },
    create: {
      code: 'BIENVENUE5',
      description: 'Bienvenue — 5% sur la première commande',
      typeRemise: 'pourcentage',
      valeur: 5,
      premiereCommandeSeulement: true,
      actif: true,
    },
    update: {
      actif: true,
      valeur: 5,
      montantMax: null,
      premiereCommandeSeulement: true,
    },
  });
  console.log('✓ Promo BIENVENUE5 prête');
}

async function seedSettings() {
  await prisma.setting.upsert({
    where: { cle: 'admin' },
    create: { cle: 'admin', valeur: SETTINGS_DEFAUT },
    update: {},
  });
  console.log('✓ Settings admin par défaut');
}

async function main() {
  console.log('🌱 Seed Prisma…');
  await seedAdmin();
  await seedPlats();
  await seedPromo();
  await seedSettings();
  console.log('✅ Seed terminé');
}

main()
  .catch((err) => {
    console.error('❌ Seed échoué:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
