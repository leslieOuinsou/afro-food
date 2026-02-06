import express from 'express';
import {
  inscription,
  connexion,
  deconnexion,
  obtenirProfil,
  mettreAJourProfil,
  changerMotDePasse,
  ajouterAdresse,
  supprimerAdresse,
  verifierAuthentification
} from '../controllers/authController.js';
import {
  protegerRoute,
  loggerAuthentification,
  limiteurTaux
} from '../middleware/auth.js';
import {
  validerInscription,
  validerConnexion,
  validerProfilUpdate,
  validerChangementMotDePasse,
  validerAdresse,
  validerIdMongoDB
} from '../middleware/validation.js';

const router = express.Router();

// Appliquer le logger d'authentification à toutes les routes
router.use(loggerAuthentification);

// Routes publiques avec limitation du taux
// GET /api/auth/inscription → 405 (évite 404 si quelqu'un ouvre l'URL en GET)
router.get('/inscription', (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Méthode non autorisée. Utilisez POST pour l\'inscription.',
    allowed: ['POST'],
  });
});
router.post('/inscription', 
  limiteurTaux(5, 15 * 60 * 1000), // 5 tentatives par 15 minutes
  validerInscription,
  inscription
);

router.post('/connexion', 
  limiteurTaux(10, 15 * 60 * 1000), // 10 tentatives par 15 minutes
  validerConnexion,
  connexion
);

// Routes protégées
router.use(protegerRoute); // Toutes les routes suivantes nécessitent l'authentification

router.post('/deconnexion', deconnexion);
router.get('/profil', obtenirProfil);
router.put('/profil', validerProfilUpdate, mettreAJourProfil);
router.put('/mot-de-passe', validerChangementMotDePasse, changerMotDePasse);
router.get('/verifier', verifierAuthentification);

// Routes pour la gestion des adresses
router.post('/adresses', validerAdresse, ajouterAdresse);
router.delete('/adresses/:adresseId', validerIdMongoDB('adresseId'), supprimerAdresse);

export default router;