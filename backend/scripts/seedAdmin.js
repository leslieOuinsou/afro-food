/**
 * Crée un utilisateur admin (Prisma / PostgreSQL).
 * Usage : node scripts/seedAdmin.js
 *
 * Identifiants par défaut :
 *   Email        : admin@afrofood.com
 *   Mot de passe : Admin123!
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'admin@afrofood.com';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'Admin123!';

async function seedAdmin() {
  try {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existing) {
      if (existing.role === 'admin') {
        console.log(`\nUn admin existe déjà : ${ADMIN_EMAIL}`);
        console.log('Vous pouvez vous connecter avec cet email et son mot de passe.\n');
      } else {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: 'admin' },
        });
        console.log(`\nLe compte ${ADMIN_EMAIL} a été passé en rôle admin.`);
        console.log('Connectez-vous avec cet email et votre mot de passe actuel.\n');
      }
    } else {
      const hash = await bcrypt.hash(
        ADMIN_PASSWORD,
        parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12
      );
      await prisma.user.create({
        data: {
          nom: 'Admin',
          prenom: 'AfroFood',
          email: ADMIN_EMAIL,
          telephone: '+33000000000',
          motDePasse: hash,
          role: 'admin',
        },
      });
      console.log('\nCompte admin créé avec succès.');
      console.log('  Email    :', ADMIN_EMAIL);
      console.log('  Mot de passe :', ADMIN_PASSWORD);
      console.log('\nAllez sur /login pour vous connecter.\n');
    }
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seedAdmin();
