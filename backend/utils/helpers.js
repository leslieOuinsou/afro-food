/**
 * Fonctions utilitaires pour l'application Afro-food
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * Génère un slug à partir d'un texte
 * @param {String} text - Texte à convertir en slug
 * @returns {String} - Slug généré
 */
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    // Remplacer les caractères accentués
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    // Remplacer les caractères spéciaux par des tirets
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Génère un identifiant unique
 * @param {Number} length - Longueur de l'identifiant (défaut: 16)
 * @returns {String} - Identifiant unique
 */
export const generateUniqueId = (length = 16) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Formate un prix en euros
 * @param {Number} price - Prix à formater
 * @returns {String} - Prix formaté
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(price);
};

/**
 * Formate une date en français
 * @param {Date|String} date - Date à formater
 * @param {String} format - Format de date ('short', 'long', 'datetime')
 * @returns {String} - Date formatée
 */
export const formatDate = (date, format = 'short') => {
  const dateObj = new Date(date);
  
  const options = {
    short: { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    },
    long: { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    },
    datetime: { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  };
  
  return dateObj.toLocaleDateString('fr-FR', options[format]);
};

/**
 * Calcule la distance entre deux coordonnées GPS
 * @param {Number} lat1 - Latitude point 1
 * @param {Number} lon1 - Longitude point 1
 * @param {Number} lat2 - Latitude point 2
 * @param {Number} lon2 - Longitude point 2
 * @returns {Number} - Distance en kilomètres
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Valide un email
 * @param {String} email - Email à valider
 * @returns {Boolean} - True si valide
 */
export const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 * @param {String} phone - Numéro à valider
 * @returns {Boolean} - True si valide
 */
export const isValidFrenchPhone = (phone) => {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Nettoie un numéro de téléphone
 * @param {String} phone - Numéro à nettoyer
 * @returns {String} - Numéro nettoyé
 */
export const cleanPhoneNumber = (phone) => {
  return phone.replace(/[\s.-]/g, '');
};

/**
 * Génère un mot de passe aléatoire
 * @param {Number} length - Longueur du mot de passe (défaut: 12)
 * @returns {String} - Mot de passe généré
 */
export const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Capitalise la première lettre d'une chaîne
 * @param {String} str - Chaîne à capitaliser
 * @returns {String} - Chaîne capitalisée
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convertit une chaîne en title case
 * @param {String} str - Chaîne à convertir
 * @returns {String} - Chaîne en title case
 */
export const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Tronque un texte à une longueur donnée
 * @param {String} text - Texte à tronquer
 * @param {Number} maxLength - Longueur maximale
 * @param {String} suffix - Suffixe à ajouter (défaut: '...')
 * @returns {String} - Texte tronqué
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Vérifie si un fichier existe
 * @param {String} filePath - Chemin du fichier
 * @returns {Boolean} - True si le fichier existe
 */
export const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Crée un dossier s'il n'existe pas
 * @param {String} dirPath - Chemin du dossier
 */
export const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

/**
 * Génère un nom de fichier unique
 * @param {String} originalName - Nom original du fichier
 * @param {String} prefix - Préfixe à ajouter (optionnel)
 * @returns {String} - Nom de fichier unique
 */
export const generateUniqueFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  
  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 20);
  
  return `${prefix}${prefix ? '-' : ''}${cleanName}-${timestamp}-${random}${extension}`;
};

/**
 * Calcule le temps de livraison estimé
 * @param {Number} distance - Distance en kilomètres
 * @param {String} traffic - Conditions de trafic ('low', 'medium', 'high')
 * @returns {Object} - Temps minimum et maximum en minutes
 */
export const calculateDeliveryTime = (distance, traffic = 'medium') => {
  const baseTime = 15; // Temps de base en minutes
  const timePerKm = 3; // Minutes par kilomètre
  
  const trafficMultipliers = {
    low: 1,
    medium: 1.2,
    high: 1.5
  };
  
  const multiplier = trafficMultipliers[traffic] || 1.2;
  const estimatedTime = (baseTime + (distance * timePerKm)) * multiplier;
  
  return {
    min: Math.ceil(estimatedTime * 0.8), // -20%
    max: Math.ceil(estimatedTime * 1.2)  // +20%
  };
};

/**
 * Valide les données d'une adresse
 * @param {Object} address - Objet adresse
 * @returns {Object} - Résultat de validation
 */
export const validateAddress = (address) => {
  const errors = [];
  
  if (!address.nom || address.nom.trim().length < 2) {
    errors.push('Le nom de l\'adresse est obligatoire');
  }
  
  if (!address.adresse || address.adresse.trim().length < 5) {
    errors.push('L\'adresse doit contenir au moins 5 caractères');
  }
  
  if (!address.ville || address.ville.trim().length < 2) {
    errors.push('La ville est obligatoire');
  }
  
  if (!address.codePostal || !/^[0-9]{5}$/.test(address.codePostal)) {
    errors.push('Le code postal doit contenir exactement 5 chiffres');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calcule les frais de livraison
 * @param {Number} distance - Distance en kilomètres
 * @param {Number} orderAmount - Montant de la commande
 * @param {String} deliveryType - Type de livraison
 * @returns {Number} - Frais de livraison
 */
export const calculateDeliveryFees = (distance, orderAmount, deliveryType = 'standard') => {
  // Livraison gratuite au-dessus de 30€
  if (orderAmount >= 30) {
    return 0;
  }
  
  const baseFee = 2.90;
  const feePerKm = 0.50;
  
  const typeMultipliers = {
    standard: 1,
    express: 1.5,
    scheduled: 0.8
  };
  
  const multiplier = typeMultipliers[deliveryType] || 1;
  const deliveryFee = (baseFee + (distance * feePerKm)) * multiplier;
  
  return Math.max(2.90, Math.round(deliveryFee * 100) / 100);
};

/**
 * Masque partiellement un email
 * @param {String} email - Email à masquer
 * @returns {String} - Email masqué
 */
export const maskEmail = (email) => {
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 2 
    ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
    : localPart;
  return `${maskedLocal}@${domain}`;
};

/**
 * Génère des statistiques basiques
 * @param {Array} data - Tableau de données
 * @param {String} field - Champ à analyser
 * @returns {Object} - Statistiques
 */
export const generateStats = (data, field) => {
  if (!data || data.length === 0) {
    return { count: 0, sum: 0, average: 0, min: 0, max: 0 };
  }
  
  const values = data.map(item => parseFloat(item[field]) || 0);
  const sum = values.reduce((acc, val) => acc + val, 0);
  
  return {
    count: data.length,
    sum: Math.round(sum * 100) / 100,
    average: Math.round((sum / data.length) * 100) / 100,
    min: Math.min(...values),
    max: Math.max(...values)
  };
};

export default {
  generateSlug,
  generateUniqueId,
  formatPrice,
  formatDate,
  calculateDistance,
  isValidEmail,
  isValidFrenchPhone,
  cleanPhoneNumber,
  generateRandomPassword,
  capitalize,
  toTitleCase,
  truncateText,
  fileExists,
  ensureDirectoryExists,
  generateUniqueFileName,
  calculateDeliveryTime,
  validateAddress,
  calculateDeliveryFees,
  maskEmail,
  generateStats
};