import dotenv from 'dotenv';
import prisma from '../lib/prisma.js';

dotenv.config();

let connected = false;

/**
 * Connecte Prisma à PostgreSQL.
 */
export const connectDB = async () => {
  try {
    if (process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL manquante. Ajoute-la dans Vercel → Projet backend → Settings → Environment Variables.'
      );
    }

    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL non trouvée dans .env');
    } else {
      const masked = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
      console.log(`🔗 Tentative de connexion PostgreSQL: ${masked}`);
    }

    await prisma.$connect();
    connected = true;
    console.log('✅ Connecté à PostgreSQL (Prisma)');

    process.on('SIGINT', async () => {
      await disconnectDB();
      console.log('📴 Connexion PostgreSQL fermée');
      process.exit(0);
    });

    return prisma;
  } catch (error) {
    console.error('❌ Erreur lors de la connexion à PostgreSQL:', error.message);
    throw error;
  }
};

export const disconnectDB = async () => {
  if (connected) {
    await prisma.$disconnect();
    connected = false;
  }
};

export { prisma };
export default connectDB;
