/**
 * Crée (ou promeut) un compte livreur.
 * Usage : node scripts/seedLivreur.js [email] [motDePasse]
 *
 * Par défaut : livreur@afrofood.com / Livreur123!
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const email = (process.argv[2] || 'livreur@afrofood.com').toLowerCase().trim();
const motDePasse = process.argv[3] || 'Livreur123!';

try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: 'livreur' } });
    console.log(`\nLe compte ${email} est maintenant livreur (mot de passe inchangé).\n`);
  } else {
    const hash = await bcrypt.hash(motDePasse, parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12);
    await prisma.user.create({
      data: {
        nom: 'Livreur',
        prenom: 'AfroFood',
        email,
        telephone: '+33000000001',
        motDePasse: hash,
        role: 'livreur',
        emailVerifie: true,
      },
    });
    console.log(`\nLivreur créé : ${email} / ${motDePasse}\n`);
  }
} catch (err) {
  console.error('Erreur :', err.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
