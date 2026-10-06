import prisma from '../lib/prisma.js';
import { serialize } from '../utils/serialize.js';

const CLE_ADMIN = 'admin';

const SETTINGS_DEFAUT = {
  nomRestaurant: 'Afro-food',
  email: 'contact@afro-food.com',
  telephone: '',
  adresse: '',
  description: '',
  fraisLivraison: 3.9,
  delaiLivraison: 45,
  zoneLivraison: '',
  montantMinimum: 30,
  notificationsEmail: true,
  notificationsSMS: false,
  notificationsCommandes: true,
  notificationsPromotions: true,
  paiementCarte: true,
  paiementEspeces: true,
  paiementLivraison: true,
  theme: 'clair',
  langue: 'fr',
  livraison: {
    fraisStandard: 3.9,
    seuilGratuit: 30,
    zones: [],
    delaiEstimeMinutes: 45,
  },
  restaurant: {
    nom: 'Afro-food',
    telephone: '',
    email: 'contact@afro-food.com',
    adresse: '',
  },
  commandes: {
    taxesPourcentage: 10,
    annulationMinutes: 30,
  },
};

function fusionnerAvecDefauts(valeur) {
  const existant = typeof valeur === 'object' && valeur !== null ? valeur : {};
  return {
    ...SETTINGS_DEFAUT,
    ...existant,
    livraison: {
      ...SETTINGS_DEFAUT.livraison,
      ...(existant.livraison || {}),
    },
    restaurant: {
      ...SETTINGS_DEFAUT.restaurant,
      ...(existant.restaurant || {}),
    },
    commandes: {
      ...SETTINGS_DEFAUT.commandes,
      ...(existant.commandes || {}),
    },
  };
}

async function getOrCreateAdminSettings() {
  let setting = await prisma.setting.findUnique({ where: { cle: CLE_ADMIN } });
  if (!setting) {
    setting = await prisma.setting.create({
      data: { cle: CLE_ADMIN, valeur: SETTINGS_DEFAUT },
    });
  } else {
    const fusion = fusionnerAvecDefauts(setting.valeur);
    const actuel = JSON.stringify(setting.valeur);
    const attendu = JSON.stringify(fusion);
    if (actuel !== attendu) {
      setting = await prisma.setting.update({
        where: { cle: CLE_ADMIN },
        data: { valeur: fusion },
      });
    }
  }
  return setting;
}

/**
 * GET /api/settings — admin
 */
export const obtenirParametres = async (req, res, next) => {
  try {
    const setting = await getOrCreateAdminSettings();
    res.status(200).json({
      success: true,
      message: 'Paramètres récupérés avec succès',
      data: { settings: setting.valeur, meta: serialize(setting) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings — admin
 */
export const mettreAJourParametres = async (req, res, next) => {
  try {
    const valeur = req.body?.settings ?? req.body;
    if (!valeur || typeof valeur !== 'object') {
      const error = new Error('Corps de paramètres invalide');
      error.statusCode = 400;
      return next(error);
    }

    const existant = await getOrCreateAdminSettings();
    const fusion = {
      ...SETTINGS_DEFAUT,
      ...(typeof existant.valeur === 'object' ? existant.valeur : {}),
      ...valeur,
      livraison: {
        ...SETTINGS_DEFAUT.livraison,
        ...(existant.valeur?.livraison || {}),
        ...(valeur.livraison || {}),
      },
      restaurant: {
        ...SETTINGS_DEFAUT.restaurant,
        ...(existant.valeur?.restaurant || {}),
        ...(valeur.restaurant || {}),
      },
      commandes: {
        ...SETTINGS_DEFAUT.commandes,
        ...(existant.valeur?.commandes || {}),
        ...(valeur.commandes || {}),
      },
    };

    const setting = await prisma.setting.upsert({
      where: { cle: CLE_ADMIN },
      create: { cle: CLE_ADMIN, valeur: fusion },
      update: { valeur: fusion },
    });

    res.status(200).json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      data: { settings: setting.valeur },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/settings/livraison — public
 */
export const obtenirParametresLivraison = async (req, res, next) => {
  try {
    const setting = await getOrCreateAdminSettings();
    const livraison = setting.valeur?.livraison || SETTINGS_DEFAUT.livraison;
    res.status(200).json({
      success: true,
      message: 'Paramètres de livraison récupérés',
      data: { livraison },
    });
  } catch (error) {
    next(error);
  }
};
