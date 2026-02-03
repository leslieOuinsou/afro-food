// Importation de mongoose - ODM (Object Data Modeling) pour MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

// Fonction pour connecter l'application à MongoDB
export const connectDB = async () => {
  try {
    // Sur Vercel, MONGODB_URI est obligatoire (pas de MongoDB local)
    if (process.env.VERCEL === '1' && !process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI manquante. Ajoute-la dans Vercel → Projet backend → Settings → Environment Variables.');
    }
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afro-food';
    
    // Debug : vérifier que l'URI est bien lue (masquer le mot de passe pour la sécurité)
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI non trouvée dans .env, utilisation de la valeur par défaut');
    } else {
      const maskedURI = mongoURI.replace(/:[^:@]+@/, ':****@'); // Masquer le mot de passe
      console.log(`🔗 Tentative de connexion à: ${maskedURI}`);
    }
    
    // Vérifier que l'URI commence bien par mongodb:// ou mongodb+srv://
    if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      throw new Error(`URI invalide. L'URI doit commencer par "mongodb://" ou "mongodb+srv://". URI reçue: ${mongoURI.substring(0, 50)}...`);
    }
    
    // Connexion à MongoDB avec les options recommandées
    await mongoose.connect(mongoURI, {
      // Ces options sont recommandées par MongoDB pour éviter les avertissements
      // useNewUrlParser: true, // Déjà activé par défaut dans Mongoose 6+
      // useUnifiedTopology: true, // Déjà activé par défaut dans Mongoose 6+
    });

    // Affichage des messages de succès (console.log affiche toujours, même avec node --watch)
    console.log('✅ Connecté à MongoDB');
    console.log(`📊 Base de données: ${mongoose.connection.name}`);
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur de connexion MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Déconnecté de MongoDB');
    });

    // Gestion de la fermeture propre de l'application
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📴 Connexion MongoDB fermée');
      process.exit(0);
    });

  } catch (error) {
    // Message d'erreur détaillé selon le type d'erreur
    console.error('❌ Erreur lors de la connexion à MongoDB:', error.message);
    
    // Aide spécifique pour l'erreur "IP non autorisée" (Atlas)
    if (error.message && error.message.includes('whitelist')) {
      console.error('\n📌 SOLUTION : Ajoutez votre IP dans MongoDB Atlas :');
      console.error('   1. Allez sur https://cloud.mongodb.com');
      console.error('   2. Votre projet → Network Access → Add IP Address');
      console.error('   3. Cliquez "Add Current IP Address" ou "Allow Access from Anywhere" (0.0.0.0/0)');
      console.error('   4. Attendez 1-2 minutes puis relancez le serveur\n');
    }
    
    throw error; // Relancer l'erreur pour que le serveur ne démarre pas si la DB échoue
  }
};
