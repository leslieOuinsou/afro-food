/**
 * Insère les plats béninois du catalogue s'ils n'existent pas (slug unique).
 * Usage : depuis backend → node scripts/addPlatsBenin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Plat from '../models/Plat.js';
import { platsBenin } from './data/platsBenin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function run() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afro-food';
  await mongoose.connect(mongoURI);
  console.log('✅ Connecté à MongoDB\n');

  let ajoutes = 0;
  for (const doc of platsBenin) {
    const exists = await Plat.findOne({ slug: doc.slug });
    if (exists) {
      console.log(`ℹ️ Déjà présent : ${doc.nom}`);
      continue;
    }
    await Plat.create(doc);
    console.log(`✅ Ajouté : ${doc.nom}`);
    ajoutes += 1;
  }

  await mongoose.connection.close();
  console.log(`\nTerminé. ${ajoutes} nouveau(x) plat(s).`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
