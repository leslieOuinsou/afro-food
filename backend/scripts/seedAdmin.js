/**
 * Crée un utilisateur admin pour se connecter à la page admin.
 * Usage : depuis le dossier backend → node scripts/seedAdmin.js
 *
 * Identifiants par défaut (à changer en production) :
 *   Email    : admin@afrofood.com
 *   Mot de passe : Admin123!
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { User } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'admin@afrofood.com';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'Admin123!';

async function seedAdmin() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afro-food';
    await mongoose.connect(uri);
    console.log('Connecté à MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`\nUn admin existe déjà : ${ADMIN_EMAIL}`);
        console.log('Vous pouvez vous connecter avec cet email et son mot de passe.\n');
      } else {
        existing.role = 'admin';
        await existing.save();
        console.log(`\nLe compte ${ADMIN_EMAIL} a été passé en rôle admin.`);
        console.log('Connectez-vous avec cet email et votre mot de passe actuel.\n');
      }
    } else {
      await User.create({
        nom: 'Admin',
        prenom: 'AfroFood',
        email: ADMIN_EMAIL,
        telephone: '+33000000000',
        motDePasse: ADMIN_PASSWORD,
        role: 'admin',
        adresses: [],
      });
      console.log('\nCompte admin créé avec succès.');
      console.log('  Email    :', ADMIN_EMAIL);
      console.log('  Mot de passe :', ADMIN_PASSWORD);
      console.log('\nAllez sur /login (ou /login sur votre site déployé) pour vous connecter.\n');
    }
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
