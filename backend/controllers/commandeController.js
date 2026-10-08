import { coordonneesVirement, estVirementEnAttente } from '../utils/virement.js';
import prisma from '../lib/prisma.js';
import { evaluerPromo, decrirePromo } from '../utils/promo.js';
import { genererNumeroCommande } from '../utils/helpers.js';
import { isValidId, serializeCommande } from '../utils/serialize.js';
import {
  envoyerEmailConfirmationCommande,
  envoyerEmailStatutCommande,
  envoyerEmailCommandePrete,
  envoyerEmailNouvelleCommandeAdmin,
  envoyerEmailMerciLivraison,
  envoyerEmailAvisNegatif,
  envoyerEmailCodeRemise,
  envoyerEmailRecuEspeces,
} from '../utils/email.js';
import {
  arrondir,
  controlerEncaissement,
  genererCodeRemise,
  plafondEspeces,
  syntheseLivreur,
} from '../utils/caisse.js';
import { pushVersRole, pushVersUtilisateur } from '../utils/push.js';
import { offrirRecompense } from '../utils/recompenses.js';

const TRANSITIONS_VALIDES = {
  en_attente: ['confirmee', 'annulee'],
  confirmee: ['en_preparation', 'annulee'],
  en_preparation: ['prete', 'annulee'],
  prete: ['en_livraison', 'annulee'],
  en_livraison: ['livree', 'annulee'],
  livree: ['remboursee'],
  annulee: [],
  remboursee: [],
};

const commandeInclude = {
  client: {
    select: { id: true, nom: true, prenom: true, email: true, telephone: true, avatar: true },
  },
  articles: {
    include: {
      plat: {
        select: {
          id: true,
          nom: true,
          prix: true,
          description: true,
          images: true,
        },
      },
    },
  },
  historiqueStatuts: { orderBy: { dateChangement: 'asc' } },
  livreur: {
    select: { id: true, nom: true, prenom: true, telephone: true },
  },
};

function peutEtreAnnulee(commande) {
  const statutsAnnulables = ['en_attente', 'confirmee'];
  const dates = commande.dates || {};
  const dateCmd = dates.commande ? new Date(dates.commande) : new Date(commande.createdAt);
  return (
    statutsAnnulables.includes(commande.statut) &&
    Date.now() - dateCmd.getTime() < 30 * 60 * 1000
  );
}

/**
 * Évalue un code promo pour ce client et ce panier.
 * Retourne { remise, codeApplique, promoId, promo } ou lève une erreur 400/404 avec la raison.
 */
async function appliquerPromo(codePromo, clientId, panier) {
  if (!codePromo) return { remise: 0, codeApplique: null, promoId: null };

  const code = String(codePromo).trim().toUpperCase();
  const promo = await prisma.promoCode.findUnique({ where: { code } });

  const [nbCommandesClient, nbUsagesClient] = promo
    ? await Promise.all([
        prisma.commande.count({ where: { clientId, statut: { notIn: ['annulee'] } } }),
        prisma.commande.count({
          where: { clientId, promoCodeId: promo.id, statut: { notIn: ['annulee', 'remboursee'] } },
        }),
      ])
    : [0, 0];

  const verdict = evaluerPromo(promo, {
    sousTotal: panier.sousTotal,
    fraisLivraison: panier.fraisLivraison,
    lignes: panier.articlesData.map((a) => ({
      categorie: a.informationsPlat.categorie,
      sousTotal: a.sousTotal,
    })),
    nbCommandesClient,
    nbUsagesClient,
    clientId,
  });

  if (!verdict.ok) {
    throw Object.assign(new Error(verdict.message), {
      statusCode: verdict.raison === 'introuvable' ? 404 : 400,
      raison: verdict.raison,
    });
  }
  return { remise: verdict.remise, codeApplique: code, promoId: promo.id, promo };
}

/**
 * Prix côté serveur : lit les plats en base, contrôle disponibilité / stock,
 * calcule sous-total et frais de livraison. Lève une erreur HTTP en cas de problème.
 */
async function calculerPanier(articles, typeLivraison) {
  const httpError = (message, statusCode) => Object.assign(new Error(message), { statusCode });
  const articlesData = [];
  let sousTotal = 0;

  for (const article of articles) {
    if (!isValidId(article.platId)) throw httpError(`ID de plat invalide: ${article.platId}`, 400);
    const quantite = Number(article.quantite);
    if (!Number.isInteger(quantite) || quantite < 1) throw httpError('Quantité invalide', 400);

    const plat = await prisma.plat.findUnique({ where: { id: article.platId } });
    if (!plat) throw httpError(`Plat non trouvé: ${article.platId}`, 404);
    if (!plat.disponible || plat.enRupture) {
      throw httpError(`Le plat "${plat.nom}" n'est pas disponible`, 400);
    }
    if (plat.quantiteDisponible != null && quantite > plat.quantiteDisponible) {
      throw httpError(
        `Quantité insuffisante pour "${plat.nom}". Disponible: ${plat.quantiteDisponible}`,
        400
      );
    }

    const prixUnitaire = plat.prixPromo && plat.prixPromo > 0 ? plat.prixPromo : plat.prix;
    let supplementsTotal = 0;
    const variationsPlat = Array.isArray(plat.variations) ? plat.variations : [];
    if (article.variations) {
      for (const variation of article.variations) {
        const variationPlat = variationsPlat.find((v) => v.nom === variation.nom);
        const option = variationPlat?.options?.find((o) => o.nom === variation.optionChoisie);
        if (option) supplementsTotal += option.supplementPrix || 0;
      }
    }

    const sousArticle = (prixUnitaire + supplementsTotal) * quantite;
    const images = plat.images || {};
    articlesData.push({
      platId: plat.id,
      informationsPlat: {
        nom: plat.nom,
        description: plat.description,
        prix: prixUnitaire,
        image: images.principale || null,
        categorie: plat.categorie,
      },
      quantite,
      prixUnitaire,
      variations: article.variations || [],
      instructions: article.instructions || null,
      sousTotal: sousArticle,
    });
    sousTotal += sousArticle;
  }

  // Paramètres livraison / taxes (admin) avec fallbacks
  let fraisStandard = 3.9;
  let seuilGratuit = 30;
  let taxesPourcentage = 10;
  try {
    const setting = await prisma.setting.findUnique({ where: { cle: 'admin' } });
    const v = setting?.valeur || {};
    fraisStandard = Number(v.livraison?.fraisStandard ?? v.fraisLivraison ?? 3.9);
    seuilGratuit = Number(v.livraison?.seuilGratuit ?? v.montantMinimum ?? 30);
    taxesPourcentage = Number(v.commandes?.taxesPourcentage ?? 10);
  } catch {
    /* garder les défauts */
  }

  const fraisLivraison = typeLivraison === 'domicile' && sousTotal < seuilGratuit ? fraisStandard : 0;
  return { articlesData, sousTotal, fraisLivraison, taxesPourcentage };
}

async function changerStatutInterne(commande, nouveauStatut, commentaire, modifieParId) {
  const autorises = TRANSITIONS_VALIDES[commande.statut] || [];
  if (!autorises.includes(nouveauStatut)) {
    throw Object.assign(
      new Error(`Transition de statut non valide: ${commande.statut} -> ${nouveauStatut}`),
      { statusCode: 400 }
    );
  }

  const dates = { ...(commande.dates || {}) };
  const maintenant = new Date().toISOString();
  switch (nouveauStatut) {
    case 'confirmee':
      dates.confirmation = maintenant;
      break;
    case 'en_preparation':
      dates.preparation = maintenant;
      break;
    case 'prete':
      dates.prete = maintenant;
      break;
    case 'en_livraison':
      dates.expedition = maintenant;
      break;
    case 'livree':
      dates.livraison = maintenant;
      break;
    case 'annulee':
      dates.annulation = maintenant;
      break;
  }

  const miseAJour = await prisma.$transaction(async (tx) => {
    const updated = await tx.commande.update({
      where: { id: commande.id },
      data: {
        statut: nouveauStatut,
        dates,
        historiqueStatuts: {
          create: {
            statut: nouveauStatut,
            commentaire: commentaire || null,
            modifieParId: modifieParId || null,
          },
        },
      },
      include: commandeInclude,
    });

    // Annulation : remet en stock les plats à quantité limitée
    if (nouveauStatut === 'annulee') {
      for (const article of updated.articles) {
        const { count } = await tx.plat.updateMany({
          where: { id: article.platId, quantiteDisponible: { not: null } },
          data: { quantiteDisponible: { increment: article.quantite }, enRupture: false },
        });
        if (count > 0) {
          await tx.plat.update({
            where: { id: article.platId },
            data: { nombreCommandes: { decrement: article.quantite } },
          });
        }
      }

      if (updated.promoCodeId) {
        await tx.promoCode.updateMany({
          where: { id: updated.promoCodeId, utilisations: { gt: 0 } },
          data: { utilisations: { decrement: 1 } },
        });
      }
    }

    return updated;
  });

  const emailClient = miseAJour.informationsClient?.email;
  if (emailClient) {
    // Livrée : e-mail de remerciement avec notation (remplace le simple e-mail de statut)
    const envoi =
      nouveauStatut === 'livree'
        ? envoyerEmailMerciLivraison(emailClient, miseAJour)
        : envoyerEmailStatutCommande(emailClient, miseAJour, commentaire);
    await envoi.catch((err) => console.warn('Email statut commande non envoyé:', err.message));
  }

  // Commande de plus de 30 € confirmée : code promo offert (−10 % + livraison offerte) + e-mail
  if (nouveauStatut === 'confirmee') await offrirRecompense(miseAJour);

  // Notifications push (appareils où l'utilisateur les a activées)
  const MESSAGES_PUSH = {
    confirmee: 'Votre commande est confirmée.',
    en_preparation: 'Nos cuisiniers préparent votre commande.',
    prete: 'Votre commande est prête.',
    en_livraison: 'Votre commande est en route !',
    livree: 'Votre commande a été livrée. Bon appétit !',
    annulee: 'Votre commande a été annulée.',
    remboursee: 'Votre commande a été remboursée.',
  };
  if (MESSAGES_PUSH[nouveauStatut]) {
    pushVersUtilisateur(miseAJour.clientId, {
      titre: `Commande ${miseAJour.numeroCommande}`,
      corps: MESSAGES_PUSH[nouveauStatut],
      url: `/commande/${miseAJour.id}`,
    }).catch((err) => console.warn('Push client non envoyé:', err.message));
  }
  if (nouveauStatut === 'prete' && !miseAJour.livreurId) {
    pushVersRole('livreur', {
      titre: 'Commande prête à livrer',
      corps: `${miseAJour.numeroCommande} · ${miseAJour.adresseLivraison?.ville ?? ''}`.trim(),
      url: '/livreur',
    }).catch((err) => console.warn('Push livreurs non envoyé:', err.message));
  }

  // Commande prête sans livreur : prévient les livreurs actifs
  if (nouveauStatut === 'prete' && !miseAJour.livreurId) {
    // await : sur Vercel, le traitement s'arrête dès que la réponse HTTP part
    await prisma.user
      .findMany({ where: { role: 'livreur', estActif: true }, select: { email: true } })
      .then((livreurs) =>
        Promise.all(livreurs.map((l) => envoyerEmailCommandePrete(l.email, miseAJour)))
      )
      .catch((err) => console.warn('Email commande prête non envoyé:', err.message));
  }

  return miseAJour;
}

function buildCommandeWhere({ clientId, statut, dateDebut, dateFin, numeroCommande }) {
  const where = {};
  if (clientId) where.clientId = clientId;
  if (statut) where.statut = statut;
  if (numeroCommande) {
    where.numeroCommande = { contains: numeroCommande, mode: 'insensitive' };
  }
  if (dateDebut || dateFin) {
    where.createdAt = {};
    if (dateDebut) where.createdAt.gte = new Date(dateDebut);
    if (dateFin) where.createdAt.lte = new Date(dateFin);
  }
  return where;
}

export const validerCodePromo = async (req, res, next) => {
  try {
    const { code, articles, typeLivraison = 'domicile' } = req.body;
    if (!String(code || '').trim() || !Array.isArray(articles) || articles.length === 0) {
      throw Object.assign(new Error('Code et articles requis'), { statusCode: 400 });
    }
    const panier = await calculerPanier(articles, typeLivraison);
    const { remise, codeApplique, promo } = await appliquerPromo(code, req.utilisateur.id, panier);
    res.json({
      success: true,
      data: { code: codeApplique, remise, conditions: decrirePromo(promo) },
    });
  } catch (error) {
    next(error);
  }
};

export const creerCommande = async (req, res, next) => {
  try {
    const {
      articles,
      adresseLivraison,
      preferences,
      methodePaiement,
      typeLivraison = 'domicile',
      codePromo,
      instructions,
    } = req.body;

    if (!articles || articles.length === 0) {
      const error = new Error('Au moins un article est requis');
      error.statusCode = 400;
      return next(error);
    }
    if (!adresseLivraison) {
      const error = new Error("L'adresse de livraison est requise");
      error.statusCode = 400;
      return next(error);
    }
    if (!methodePaiement) {
      const error = new Error('La méthode de paiement est requise');
      error.statusCode = 400;
      return next(error);
    }

    const client = await prisma.user.findUnique({ where: { id: req.utilisateur.id } });
    if (!client) {
      const error = new Error('Client non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    const panier = await calculerPanier(articles, typeLivraison);
    const { articlesData, sousTotal, fraisLivraison, taxesPourcentage } = panier;

    // Un code promo fourni mais refusé bloque la commande (le client doit savoir qu'il ne l'a pas)
    const { remise, codeApplique, promoId } = await appliquerPromo(codePromo, client.id, panier);
    const taxes = (sousTotal + fraisLivraison - remise) * (taxesPourcentage / 100);
    const total = sousTotal + fraisLivraison + taxes - remise;

    const numeroCommande = await genererNumeroCommande(prisma);
    const maintenant = new Date().toISOString();

    const commande = await prisma.$transaction(async (tx) => {
      const created = await tx.commande.create({
        data: {
          numeroCommande,
          clientId: client.id,
          informationsClient: {
            nom: client.nom,
            prenom: client.prenom,
            email: client.email,
            telephone: client.telephone,
          },
          adresseLivraison,
          montants: {
            sousTotal,
            fraisLivraison,
            taxes,
            remise,
            codePromo: codeApplique,
            total,
          },
          statut: 'en_attente',
          sousTotal,
          fraisLivraison,
          taxes,
          remise,
          total,
          codePromo: codeApplique,
          promoCodeId: promoId || null,
          methodePaiement,
          statutPaiement: 'en_attente',
          paiement: {
            methode: methodePaiement,
            statut: 'en_attente',
          },
          livraison: {
            type: typeLivraison,
            instructions: instructions || null,
          },
          dates: { commande: maintenant },
          preferences: preferences || null,
          source: 'web',
          articles: {
            create: articlesData,
          },
          historiqueStatuts: {
            create: {
              statut: 'en_attente',
              commentaire: 'Commande créée',
              modifieParId: client.id,
            },
          },
        },
        include: commandeInclude,
      });

      for (const article of articlesData) {
        const plat = await tx.plat.findUnique({
          where: { id: article.platId },
          select: { nom: true, quantiteDisponible: true },
        });
        if (plat?.quantiteDisponible != null) {
          // décrément conditionnel : évite un stock négatif en cas de commandes concurrentes
          const { count } = await tx.plat.updateMany({
            where: { id: article.platId, quantiteDisponible: { gte: article.quantite } },
            data: { quantiteDisponible: { decrement: article.quantite } },
          });
          if (count === 0) {
            const err = new Error(`Stock insuffisant pour « ${plat.nom} »`);
            err.statusCode = 409;
            throw err;
          }
          await tx.plat.updateMany({
            where: { id: article.platId, quantiteDisponible: 0 },
            data: { enRupture: true },
          });
        }
        await tx.plat.update({
          where: { id: article.platId },
          data: { nombreCommandes: { increment: article.quantite } },
        });
      }

      await tx.user.update({
        where: { id: client.id },
        data: {
          nombreCommandes: { increment: 1 },
          montantTotalCommandes: { increment: total },
        },
      });

      if (promoId) {
        const { count } = await tx.promoCode.updateMany({
          where: {
            id: promoId,
            OR: [{ utilisationsMax: null }, { utilisations: { lt: tx.promoCode.fields.utilisationsMax } }],
          },
          data: { utilisations: { increment: 1 } },
        });
        if (count === 0) {
          const err = new Error('Code promo épuisé');
          err.statusCode = 409;
          throw err;
        }
      }

      return created;
    });

    try {
      await envoyerEmailConfirmationCommande(client.email, commande);
    } catch (emailErr) {
      console.warn('Email confirmation commande non envoyé:', emailErr.message);
    }

    pushVersRole('admin', {
      titre: 'Nouvelle commande',
      corps: `${commande.numeroCommande} · ${commande.montants?.total ?? commande.total ?? ''} €`,
      url: '/commande-admin',
    }).catch((err) => console.warn('Push admin non envoyé:', err.message));

    // Prévient les admins par e-mail (sans bloquer la réponse au client)
    // Adresse de réception dédiée (ADMIN_NOTIFICATION_EMAIL), sinon l'e-mail des comptes admin
    const adresseAdmin = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
    (adresseAdmin
      ? Promise.resolve([{ email: adresseAdmin }])
      : prisma.user.findMany({ where: { role: 'admin', estActif: true }, select: { email: true } })
    )
      .then((admins) => Promise.all(admins.map((a) => envoyerEmailNouvelleCommandeAdmin(a.email, commande))))
      .catch((err) => console.warn('Email nouvelle commande (admin) non envoyé:', err.message));

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: { commande: serializeCommande(commande) },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirMesCommandes = async (req, res, next) => {
  try {
    const { page = 1, limite = 10, statut, dateDebut, dateFin } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite, 10) || 10));

    const where = buildCommandeWhere({
      clientId: req.utilisateur.id,
      statut,
      dateDebut,
      dateFin,
    });

    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        where,
        include: commandeInclude,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limiteNum,
        take: limiteNum,
      }),
      prisma.commande.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Commandes récupérées avec succès',
      data: { commandes: commandes.map(serializeCommande) },
      pagination: {
        pageActuelle: pageNum,
        totalPages: Math.ceil(total / limiteNum),
        totalCommandes: total,
        commandesPourPage: limiteNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirCommandeParId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      const error = new Error('ID de commande invalide');
      error.statusCode = 400;
      return next(error);
    }

    const commande = await prisma.commande.findUnique({
      where: { id },
      include: commandeInclude,
    });

    if (!commande) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      return next(error);
    }

    const estLivreurAutorise =
      req.utilisateur.role === 'livreur' &&
      (commande.livreurId === req.utilisateur.id ||
        (!commande.livreurId && ['prete', 'en_livraison'].includes(commande.statut)));
    if (
      commande.clientId !== req.utilisateur.id &&
      req.utilisateur.role !== 'admin' &&
      !estLivreurAutorise
    ) {
      const error = new Error('Non autorisé à voir cette commande');
      error.statusCode = 403;
      return next(error);
    }

    const resultat = serializeCommande(commande);
    // La position du livreur n'est visible que pendant la livraison
    if (resultat.livraison?.positionLivreur && commande.statut !== 'en_livraison') {
      resultat.livraison = { ...resultat.livraison };
      delete resultat.livraison.positionLivreur;
    }

    if (
      commande.methodePaiement === 'especes' &&
      commande.statut === 'en_livraison' &&
      commande.clientId === req.utilisateur.id
    ) {
      resultat.codeRemise = commande.codeRemise;
    }

    if (estVirementEnAttente(commande) && commande.clientId === req.utilisateur.id) {
      resultat.virement = coordonneesVirement(commande);
      resultat.stripePaye = Boolean(commande.paiement?.stripe);
    }

    res.status(200).json({
      success: true,
      message: 'Commande récupérée avec succès',
      data: { commande: resultat },
    });
  } catch (error) {
    next(error);
  }
};

export const annulerCommande = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;

    if (!isValidId(id)) {
      const error = new Error('ID de commande invalide');
      error.statusCode = 400;
      return next(error);
    }

    const commande = await prisma.commande.findUnique({
      where: { id },
      include: { articles: true },
    });

    if (!commande) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      return next(error);
    }

    if (commande.clientId !== req.utilisateur.id) {
      const error = new Error('Non autorisé à annuler cette commande');
      error.statusCode = 403;
      return next(error);
    }

    if (!peutEtreAnnulee(commande)) {
      const error = new Error('Cette commande ne peut plus être annulée');
      error.statusCode = 400;
      return next(error);
    }

    const miseAJour = await changerStatutInterne(
      commande,
      'annulee',
      raison || 'Annulée par le client',
      req.utilisateur.id
    );

    res.status(200).json({
      success: true,
      message: 'Commande annulée avec succès',
      data: { commande: serializeCommande(miseAJour) },
    });
  } catch (error) {
    next(error);
  }
};

export const evaluerCommande = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, commentaire, recommande } = req.body;

    if (!isValidId(id)) {
      const error = new Error('ID de commande invalide');
      error.statusCode = 400;
      return next(error);
    }

    if (!note || note < 1 || note > 5) {
      const error = new Error('La note doit être entre 1 et 5');
      error.statusCode = 400;
      return next(error);
    }

    const commande = await prisma.commande.findUnique({ where: { id } });
    if (!commande) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      return next(error);
    }

    if (commande.clientId !== req.utilisateur.id) {
      const error = new Error('Non autorisé à évaluer cette commande');
      error.statusCode = 403;
      return next(error);
    }

    if (commande.statut !== 'livree') {
      const error = new Error('Seules les commandes livrées peuvent être évaluées');
      error.statusCode = 400;
      return next(error);
    }

    if (commande.evaluation) {
      const error = new Error('Cette commande a déjà été évaluée');
      error.statusCode = 400;
      return next(error);
    }

    const miseAJour = await prisma.commande.update({
      where: { id },
      data: {
        evaluation: {
          note,
          commentaire: commentaire || null,
          recommande: recommande ?? null,
          dateEvaluation: new Date().toISOString(),
        },
      },
      include: commandeInclude,
    });

    // Alerte admin : push pour tout avis, e-mail si la note est de 2 étoiles ou moins
    const eval_ = miseAJour.evaluation;
    pushVersRole('admin', {
      titre: `Nouvel avis ${'★'.repeat(note)}${'☆'.repeat(5 - note)}`,
      corps: `${miseAJour.numeroCommande}${commentaire ? ` · ${String(commentaire).slice(0, 80)}` : ''}`,
      url: '/admin-avis',
    }).catch((err) => console.warn('Push avis non envoyé:', err.message));
    if (note <= 2) {
      const adresseAdmin = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
      (adresseAdmin
        ? Promise.resolve([{ email: adresseAdmin }])
        : prisma.user.findMany({ where: { role: 'admin', estActif: true }, select: { email: true } })
      )
        .then((admins) => Promise.all(admins.map((a) => envoyerEmailAvisNegatif(a.email, miseAJour, eval_))))
        .catch((err) => console.warn('Email avis négatif non envoyé:', err.message));
    }

    res.status(200).json({
      success: true,
      message: 'Évaluation ajoutée avec succès',
      data: { commande: serializeCommande(miseAJour) },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirToutesCommandes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limite = 20,
      statut,
      dateDebut,
      dateFin,
      numeroCommande,
      clientId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite, 10) || 20));

    const where = buildCommandeWhere({
      clientId,
      statut,
      dateDebut,
      dateFin,
      numeroCommande,
    });

    // Livreur : ses commandes + celles sans livreur (prêtes à prendre, ou déjà passées
    // « en livraison » par l'admin sans livreur assigné)
    if (req.utilisateur.role === 'livreur') {
      // Jamais de course à prendre tant qu'un virement ou un paiement par carte n'est pas confirmé
      where.NOT = {
        methodePaiement: { in: ['virement', 'carte'] },
        statutPaiement: { not: 'valide' },
        statut: { in: ['prete', 'en_livraison'] },
      };
      where.OR = [
        { livreurId: req.utilisateur.id },
        { livreurId: null, statut: { in: ['prete', 'en_livraison'] } },
      ];
    }

    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        where,
        include: commandeInclude,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limiteNum,
        take: limiteNum,
      }),
      prisma.commande.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Commandes récupérées avec succès',
      data: { commandes: commandes.map(serializeCommande) },
      pagination: {
        pageActuelle: pageNum,
        totalPages: Math.ceil(total / limiteNum),
        totalCommandes: total,
        commandesPourPage: limiteNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changerStatutCommande = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut, commentaire, livreurId } = req.body;

    if (!isValidId(id)) {
      const error = new Error('ID de commande invalide');
      error.statusCode = 400;
      return next(error);
    }

    const commande = await prisma.commande.findUnique({ where: { id } });
    if (!commande) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      return next(error);
    }

    const estLivreur = req.utilisateur.role === 'livreur';
    if (estLivreur) {
      if (!['en_livraison', 'livree'].includes(statut)) {
        const error = new Error('Un livreur ne peut que prendre en charge ou livrer une commande');
        error.statusCode = 403;
        return next(error);
      }
      if (commande.livreurId && commande.livreurId !== req.utilisateur.id) {
        const error = new Error('Commande assignée à un autre livreur');
        error.statusCode = 403;
        return next(error);
      }
    }

    // Virement et carte : payer avant la livraison (le paiement doit être confirmé)
    if (
      ['virement', 'carte'].includes(commande.methodePaiement) &&
      commande.statutPaiement !== 'valide' &&
      ['en_livraison', 'livree'].includes(statut)
    ) {
      const error = new Error(
        commande.methodePaiement === 'virement'
          ? "Virement non reçu : confirmez le virement (« Virement reçu ») avant de lancer la livraison."
          : 'Paiement par carte non confirmé : la livraison ne peut pas démarrer.'
      );
      error.statusCode = 400;
      return next(error);
    }

    // Paiement en espèces : plafond avant la prise en charge, preuve de remise avant la livraison
    const estEspeces = commande.methodePaiement === 'especes';
    const livreurResponsable = estLivreur ? req.utilisateur.id : livreurId || commande.livreurId || null;
    let encaissement = null;
    if (estEspeces && statut === 'en_livraison' && livreurResponsable) {
      const nonReverses = await prisma.commande.findMany({
        where: { livreurId: livreurResponsable, especesStatut: 'a_reverser' },
        select: { especesEncaissees: true, especesEncaisseLe: true },
      });
      if (syntheseLivreur(nonReverses).plafondAtteint) {
        const error = new Error(
          `Plafond d'espèces non reversées atteint (${plafondEspeces()} €). Remettez d'abord les espèces à l'administrateur.`
        );
        error.statusCode = 403;
        return next(error);
      }
    }
    if (estEspeces && statut === 'livree') {
      const controle = controlerEncaissement(
        commande,
        {
          codeRemise: req.body.codeRemise,
          montantEncaisse: estLivreur ? req.body.montantEncaisse : (req.body.montantEncaisse ?? commande.total),
          raisonEcart: req.body.raisonEcart,
        },
        { exigerCode: estLivreur }
      );
      if (!controle.ok) {
        const error = new Error(controle.message);
        error.statusCode = 400;
        return next(error);
      }
      encaissement = controle;
    }

    let livreurUpdate = {};
    if (estLivreur && ['en_livraison', 'livree'].includes(statut) && !commande.livreurId) {
      // un livreur ne peut s'assigner que lui-même
      livreurUpdate = {
        livreurId: req.utilisateur.id,
        livraison: { ...(commande.livraison || {}), livreur: req.utilisateur.id },
      };
    } else if (statut === 'en_livraison' && livreurId) {
      if (!isValidId(livreurId)) {
        const error = new Error('ID de livreur invalide');
        error.statusCode = 400;
        return next(error);
      }
      const livreur = await prisma.user.findFirst({
        where: { id: livreurId, role: 'livreur' },
      });
      if (!livreur) {
        const error = new Error('Livreur non trouvé');
        error.statusCode = 404;
        return next(error);
      }
      const livraison = { ...(commande.livraison || {}), livreur: livreurId };
      livreurUpdate = { livreurId, livraison };
    }

    if (Object.keys(livreurUpdate).length) {
      await prisma.commande.update({
        where: { id },
        data: livreurUpdate,
      });
      Object.assign(commande, livreurUpdate);
    }

    const miseAJour = await changerStatutInterne(
      commande,
      statut,
      commentaire,
      req.utilisateur.id
    );

    if (estEspeces && statut === 'en_livraison') {
      const code = genererCodeRemise();
      await prisma.commande.update({ where: { id }, data: { codeRemise: code } });
      const emailClient = miseAJour.informationsClient?.email;
      if (emailClient) {
        await envoyerEmailCodeRemise(emailClient, miseAJour, code).catch((err) =>
          console.warn('Email code de remise non envoyé:', err.message)
        );
      }
      await pushVersUtilisateur(miseAJour.clientId, {
        titre: 'Votre livreur arrive',
        corps: `Code de remise ${code} : à donner au livreur lors du paiement en espèces.`,
        url: `/commande/${miseAJour.id}`,
      });
    }

    if (estEspeces && statut === 'livree') {
      const livreurFinal = commande.livreurId;
      const maintenant = new Date();
      await prisma.$transaction(async (tx) => {
        await tx.commande.update({
          where: { id },
          data: {
            statutPaiement: 'valide',
            paiement: { ...(commande.paiement || {}), statut: 'valide', methode: 'especes', dateEncaissement: maintenant.toISOString() },
            ...(livreurFinal && {
              especesEncaissees: encaissement.montant,
              especesEncaisseLe: maintenant,
              especesEcartRaison: encaissement.raison,
              especesStatut: 'a_reverser',
            }),
          },
        });
        if (livreurFinal) {
          await tx.journalCaisse.create({
            data: {
              type: 'encaissement',
              montant: encaissement.montant,
              livreurId: livreurFinal,
              auteurId: req.utilisateur.id,
              commandeId: id,
              note: encaissement.raison,
            },
          });
        }
      });
      const emailClient = miseAJour.informationsClient?.email;
      const livreurFiche = livreurFinal
        ? await prisma.user.findUnique({ where: { id: livreurFinal }, select: { prenom: true } })
        : null;
      if (emailClient) {
        await envoyerEmailRecuEspeces(emailClient, miseAJour, encaissement.montant, livreurFiche?.prenom).catch((err) =>
          console.warn('Reçu espèces non envoyé:', err.message)
        );
      }
      if (encaissement.ecart !== 0) {
        await pushVersRole('admin', {
          titre: 'Écart d’encaissement',
          corps: `${miseAJour.numeroCommande} : ${arrondir(encaissement.montant)} € encaissés pour ${arrondir(miseAJour.total)} € (${encaissement.raison}).`,
          url: '/admin-caisse',
        }).catch(() => undefined);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Statut de la commande mis à jour avec succès',
      data: { commande: serializeCommande(miseAJour) },
    });
  } catch (error) {
    if (error.message?.includes('Transition de statut non valide')) {
      error.statusCode = 400;
    }
    next(error);
  }
};

const STATUTS_NON_REVENU = ['annulee', 'remboursee'];

function lirePeriode(query) {
  const maintenant = new Date();
  const dateDebut = query.dateDebut
    ? new Date(query.dateDebut)
    : new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const dateFin = query.dateFin ? new Date(query.dateFin) : maintenant;
  if (Number.isNaN(dateDebut.getTime()) || Number.isNaN(dateFin.getTime())) {
    throw Object.assign(new Error('Période invalide'), { statusCode: 400 });
  }
  return { dateDebut, dateFin };
}

export const obtenirStatistiques = async (req, res, next) => {
  try {
    const { dateDebut, dateFin } = lirePeriode(req.query);
    const where = { createdAt: { gte: dateDebut, lte: dateFin } };

    const [parStatut, evaluations, evolution, topArticles] = await Promise.all([
      prisma.commande.groupBy({
        by: ['statut'],
        where,
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.commande.findMany({
        where: { ...where, evaluation: { not: null } },
        select: { evaluation: true },
      }),
      prisma.$queryRaw`
        SELECT date_trunc('day', "createdAt") AS jour,
               COUNT(*)::int AS "nombreCommandes",
               COALESCE(SUM("total"), 0)::float AS revenus
        FROM "commandes"
        WHERE "createdAt" >= ${dateDebut} AND "createdAt" <= ${dateFin}
          AND "statut" NOT IN ('annulee', 'remboursee')
        GROUP BY 1 ORDER BY 1`,
      prisma.articleCommande.groupBy({
        by: ['platId'],
        where: { commande: { ...where, statut: { notIn: STATUTS_NON_REVENU } } },
        _sum: { quantite: true, sousTotal: true },
        orderBy: { _sum: { quantite: 'desc' } },
        take: 5,
      }),
    ]);

    const totalCommandes = parStatut.reduce((n, g) => n + g._count._all, 0);
    const revenuGroupes = parStatut.filter((g) => !STATUTS_NON_REVENU.includes(g.statut));
    const totalRevenu = revenuGroupes.reduce((n, g) => n + (g._sum.total || 0), 0);
    const commandesRevenu = revenuGroupes.reduce((n, g) => n + g._count._all, 0);
    const compte = (statut) => parStatut.find((g) => g.statut === statut)?._count._all || 0;

    const notes = evaluations.map((e) => e.evaluation?.note).filter((n) => typeof n === 'number');

    const plats = await prisma.plat.findMany({
      where: { id: { in: topArticles.map((t) => t.platId) } },
      select: { id: true, nom: true },
    });
    const nomsPlats = new Map(plats.map((p) => [p.id, p.nom]));

    res.status(200).json({
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: {
        statistiques: {
          totalCommandes,
          totalRevenu,
          commandesLivrees: compte('livree'),
          commandesAnnulees: compte('annulee'),
          panierMoyen: commandesRevenu ? totalRevenu / commandesRevenu : 0,
          noteMovenne: notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : 0,
        },
        statsParStatut: parStatut.map((g) => ({
          _id: g.statut,
          statut: g.statut,
          nombre: g._count._all,
          montantTotal: g._sum.total || 0,
        })),
        evolutionQuotidienne: evolution.map((r) => {
          const d = new Date(r.jour);
          return {
            _id: { annee: d.getFullYear(), mois: d.getMonth() + 1, jour: d.getDate() },
            nombreCommandes: r.nombreCommandes,
            revenus: r.revenus,
          };
        }),
        topPlats: topArticles.map((t) => ({
          platId: t.platId,
          nom: nomsPlats.get(t.platId) || 'Plat supprimé',
          quantite: t._sum.quantite || 0,
          chiffreAffaires: t._sum.sousTotal || 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const echapperCsv = (v) => {
  const t = v == null ? '' : String(v);
  // neutralise l'injection de formules Excel
  const sur = /^[=+\-@]/.test(t) ? `'${t}` : t;
  return /[";\n\r]/.test(sur) ? `"${sur.replace(/"/g, '""')}"` : sur;
};

/** GET /api/commandes/export/csv?dateDebut&dateFin&statut */
export const exporterCommandesCsv = async (req, res, next) => {
  try {
    const { dateDebut, dateFin } = lirePeriode(req.query);
    const where = { createdAt: { gte: dateDebut, lte: dateFin } };
    if (req.query.statut) where.statut = req.query.statut;

    const commandes = await prisma.commande.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        numeroCommande: true,
        createdAt: true,
        statut: true,
        informationsClient: true,
        sousTotal: true,
        fraisLivraison: true,
        taxes: true,
        remise: true,
        total: true,
        codePromo: true,
        methodePaiement: true,
        statutPaiement: true,
      },
    });

    const entetes = ['Numéro', 'Date', 'Statut', 'Client', 'E-mail', 'Sous-total', 'Livraison', 'Taxes', 'Remise', 'Total', 'Code promo', 'Paiement', 'Statut paiement'];
    const lignes = commandes.map((c) =>
      [
        c.numeroCommande,
        c.createdAt.toISOString(),
        c.statut,
        `${c.informationsClient?.prenom || ''} ${c.informationsClient?.nom || ''}`.trim(),
        c.informationsClient?.email,
        c.sousTotal,
        c.fraisLivraison,
        c.taxes,
        c.remise,
        c.total,
        c.codePromo,
        c.methodePaiement,
        c.statutPaiement,
      ].map(echapperCsv).join(';')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="commandes.csv"');
    res.send('\uFEFF' + [entetes.join(';'), ...lignes].join('\r\n'));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/commandes/:id/position — le livreur assigné partage sa position GPS.
 * Stockée dans livraison.positionLivreur (JSON), sans migration de schéma.
 */
export const mettreAJourPositionLivreur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      const error = new Error('Coordonnées GPS invalides');
      error.statusCode = 400;
      return next(error);
    }

    const commande = await prisma.commande.findUnique({ where: { id } });
    if (!commande) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      return next(error);
    }
    if (commande.statut !== 'en_livraison') {
      const error = new Error("La position n'est partagée que pendant la livraison");
      error.statusCode = 409;
      return next(error);
    }
    if (req.utilisateur.role === 'livreur' && commande.livreurId && commande.livreurId !== req.utilisateur.id) {
      const error = new Error('Commande assignée à un autre livreur');
      error.statusCode = 403;
      return next(error);
    }

    const prendEnCharge = req.utilisateur.role === 'livreur' && !commande.livreurId;
    await prisma.commande.update({
      where: { id },
      data: {
        ...(prendEnCharge ? { livreurId: req.utilisateur.id } : {}),
        livraison: {
          ...(commande.livraison || {}),
          positionLivreur: { lat, lng, date: new Date().toISOString() },
        },
      },
    });

    res.status(200).json({ success: true, message: 'Position enregistrée', data: null });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/commandes/avis — liste des avis clients (admin) avec note moyenne et répartition.
 * Query : note (1-5, filtre), limite (≤ 100).
 */
export const obtenirAvis = async (req, res, next) => {
  try {
    const noteFiltre = parseInt(req.query.note, 10);
    const limite = Math.max(1, Math.min(100, parseInt(req.query.limite, 10) || 50));

    const commandes = await prisma.commande.findMany({
      where: { evaluation: { not: null } },
      select: {
        id: true,
        numeroCommande: true,
        total: true,
        evaluation: true,
        informationsClient: true,
        createdAt: true,
      },
    });

    const tous = commandes
      .filter((c) => typeof c.evaluation?.note === 'number')
      .map((c) => ({
        commandeId: c.id,
        numeroCommande: c.numeroCommande,
        total: c.total,
        note: c.evaluation.note,
        commentaire: c.evaluation.commentaire || null,
        date: c.evaluation.dateEvaluation || c.createdAt,
        client: {
          nom: [c.informationsClient?.prenom, c.informationsClient?.nom].filter(Boolean).join(' '),
          email: c.informationsClient?.email || null,
        },
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const repartition = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    tous.forEach((a) => {
      repartition[a.note] = (repartition[a.note] || 0) + 1;
    });
    const moyenne = tous.length ? tous.reduce((n, a) => n + a.note, 0) / tous.length : null;

    const avis = (noteFiltre >= 1 && noteFiltre <= 5 ? tous.filter((a) => a.note === noteFiltre) : tous).slice(0, limite);

    res.status(200).json({
      success: true,
      message: 'Avis récupérés avec succès',
      data: {
        avis,
        total: tous.length,
        moyenne: moyenne == null ? null : Math.round(moyenne * 10) / 10,
        repartition,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Note minimale d'un commentaire pour être affiché publiquement (la moyenne, elle, compte tous les avis). */
const NOTE_MIN_AFFICHAGE_PUBLIC = 4;

/**
 * GET /api/avis-publics — note moyenne et derniers commentaires, sans authentification.
 * Données minimales : prénom + initiale du nom, note, commentaire, date. Jamais d'e-mail.
 */
export const obtenirAvisPublics = async (req, res, next) => {
  try {
    const limite = Math.max(1, Math.min(12, parseInt(req.query.limite, 10) || 6));
    const commandes = await prisma.commande.findMany({
      where: { evaluation: { not: null } },
      select: { evaluation: true, informationsClient: true, createdAt: true },
    });
    const tous = commandes
      .filter((c) => typeof c.evaluation?.note === 'number')
      .map((c) => {
        const prenom = c.informationsClient?.prenom || '';
        const initiale = (c.informationsClient?.nom || '').trim().charAt(0).toUpperCase();
        return {
          note: c.evaluation.note,
          commentaire: (c.evaluation.commentaire || '').trim(),
          date: c.evaluation.dateEvaluation || c.createdAt,
          auteur: prenom ? `${prenom}${initiale ? ` ${initiale}.` : ''}` : 'Client',
        };
      });

    const moyenne = tous.length ? tous.reduce((n, a) => n + a.note, 0) / tous.length : null;
    const avis = tous
      .filter((a) => a.commentaire && a.note >= NOTE_MIN_AFFICHAGE_PUBLIC)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limite);

    res.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    res.status(200).json({
      success: true,
      message: 'Avis publics',
      data: { moyenne: moyenne == null ? null : Math.round(moyenne * 10) / 10, total: tous.length, avis },
    });
  } catch (error) {
    next(error);
  }
};
