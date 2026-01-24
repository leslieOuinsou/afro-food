// Importation de mongoose - ODM (Object Data Modeling) pour MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

// Fonction pour connecter l'application à MongoDB
export const connectDB = async () => {
  try {
    // Récupération de l'URI de connexion MongoDB depuis les variables d'environnement
    // Si MONGODB_URI n'est pas définie, utilise une URI par défaut (MongoDB local)
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
    // En cas d'erreur, afficher le message d'erreur détaillé
    console.error('❌ Erreur lors de la connexion à MongoDB:', error.message);
    throw error; // Relancer l'erreur pour que le serveur ne démarre pas si la DB échoue
  }
};
