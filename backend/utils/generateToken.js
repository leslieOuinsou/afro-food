import jwt from 'jsonwebtoken';

/**
 * Génère un token JWT pour un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @param {String} expiresIn - Durée d'expiration (ex: '7d', '1h', '30m')
 * @returns {String} - Token JWT signé
 */
export const generateToken = (userId, expiresIn = null) => {
  const payload = { id: userId };
  const options = {};
  
  if (expiresIn) {
    options.expiresIn = expiresIn;
  } else {
    options.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Génère un token de vérification (pour email, reset password, etc.)
 * @param {String} userId - ID de l'utilisateur
 * @param {String} purpose - But du token (email, reset, etc.)
 * @param {String} expiresIn - Durée d'expiration
 * @returns {String} - Token de vérification
 */
export const generateVerificationToken = (userId, purpose = 'verification', expiresIn = '1h') => {
  const payload = { 
    id: userId,
    purpose,
    timestamp: Date.now()
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Vérifie et décode un token
 * @param {String} token - Token à vérifier
 * @returns {Object} - Payload décodé
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error(`Token invalide: ${error.message}`);
  }
};

/**
 * Décode un token sans le vérifier (utile pour debug)
 * @param {String} token - Token à décoder
 * @returns {Object} - Payload décodé (non vérifié)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

export default {
  generateToken,
  generateVerificationToken,
  verifyToken,
  decodeToken
};