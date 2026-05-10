/**
 * Insère les plats du seed dont le slug est absent (ex. après ajouts partiels).
 * Usage : node scripts/insertMissingPlats.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Plat from '../models/Plat.js';
import { platsDemo } from './seedPlats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/afro-food');
  let n = 0;
  for (const doc of platsDemo) {
    const slug = doc.slug;
    if (!slug) continue;
    const exists = await Plat.findOne({ slug });
    if (exists) continue;
    try {
      await Plat.create(doc);
      console.log(`✅ Ajouté : ${doc.nom} (${slug})`);
      n += 1;
    } catch (e) {
      if (e.code === 11000) {
        console.log(`ℹ️ Doublon ignoré : ${slug}`);
      } else throw e;
    }
  }
  await mongoose.connection.close();
  console.log(`\nTerminé. ${n} plat(s) ajouté(s).`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
