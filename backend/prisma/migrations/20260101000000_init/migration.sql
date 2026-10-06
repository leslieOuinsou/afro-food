-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('client', 'admin', 'livreur');

-- CreateEnum
CREATE TYPE "RegimeAlimentaire" AS ENUM ('aucun', 'vegetarien', 'vegan', 'halal', 'kasher');

-- CreateEnum
CREATE TYPE "NiveauEpice" AS ENUM ('doux', 'moyen', 'epicee', 'tres-epicee');

-- CreateEnum
CREATE TYPE "CategoriePlat" AS ENUM ('entrees', 'plats-principaux', 'accompagnements', 'desserts', 'boissons', 'specialites-africaines', 'vegetarien', 'vegan');

-- CreateEnum
CREATE TYPE "PaysOrigine" AS ENUM ('cameroun', 'benin', 'senegal', 'cote-ivoire', 'mali', 'burkina-faso', 'ghana', 'togo', 'niger', 'guinee', 'multiple');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('en_attente', 'confirmee', 'en_preparation', 'prete', 'en_livraison', 'livree', 'annulee', 'remboursee');

-- CreateEnum
CREATE TYPE "MethodePaiement" AS ENUM ('carte', 'especes', 'mobile', 'virement');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('en_attente', 'valide', 'echec', 'rembourse');

-- CreateEnum
CREATE TYPE "TypeLivraison" AS ENUM ('domicile', 'point_relais', 'retrait_sur_place');

-- CreateEnum
CREATE TYPE "StatutAvis" AS ENUM ('en_attente', 'approuve', 'rejete', 'signale');

-- CreateEnum
CREATE TYPE "StatutMessage" AS ENUM ('non_lu', 'lu', 'repondu');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'client',
    "preferences" JSONB NOT NULL DEFAULT '{"allergies":[],"regimeAlimentaire":"aucun","niveauEpice":"moyen"}',
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifie" BOOLEAN NOT NULL DEFAULT false,
    "telephoneVerifie" BOOLEAN NOT NULL DEFAULT false,
    "tokenVerificationEmail" TEXT,
    "expirationTokenEmail" TIMESTAMP(3),
    "tokenResetMotDePasse" TEXT,
    "expirationTokenReset" TIMESTAMP(3),
    "nombreCommandes" INTEGER NOT NULL DEFAULT 0,
    "montantTotalCommandes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "derniereConnexion" TIMESTAMP(3),
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adresses" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'domicile',
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT 'France',
    "parDefaut" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "adresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plats" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionLongue" TEXT,
    "prix" DOUBLE PRECISION NOT NULL,
    "prixPromo" DOUBLE PRECISION,
    "categorie" TEXT NOT NULL,
    "sousCategorie" TEXT,
    "origineAfricaine" JSONB NOT NULL,
    "images" JSONB NOT NULL,
    "nutrition" JSONB,
    "allergenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "regimesCompatibles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "niveauEpice" TEXT NOT NULL DEFAULT 'moyen',
    "ingredients" JSONB NOT NULL DEFAULT '[]',
    "tempsPreparation" INTEGER,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "enRupture" BOOLEAN NOT NULL DEFAULT false,
    "quantiteDisponible" INTEGER,
    "notemoyenne" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nombreAvis" INTEGER NOT NULL DEFAULT 0,
    "nombreCommandes" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slug" TEXT NOT NULL,
    "metaDescription" TEXT,
    "creeParAdminId" TEXT,
    "derniereModification" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estMisEnAvant" BOOLEAN NOT NULL DEFAULT false,
    "estNouveaute" BOOLEAN NOT NULL DEFAULT false,
    "dateFinNouveaute" TIMESTAMP(3),
    "variations" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" TEXT NOT NULL,
    "numeroCommande" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "informationsClient" JSONB NOT NULL,
    "adresseLivraison" JSONB NOT NULL,
    "montants" JSONB NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'en_attente',
    "paiement" JSONB NOT NULL,
    "livraison" JSONB NOT NULL,
    "dates" JSONB NOT NULL,
    "preferences" JSONB,
    "evaluation" JSONB,
    "serviceClient" JSONB,
    "source" TEXT NOT NULL DEFAULT 'web',
    "deviceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "livreurId" TEXT,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles_commande" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "platId" TEXT NOT NULL,
    "informationsPlat" JSONB NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "variations" JSONB NOT NULL DEFAULT '[]',
    "instructions" TEXT,
    "sousTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "articles_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_statuts" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "statut" "StatutCommande" NOT NULL,
    "dateChangement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,
    "modifieParId" TEXT,

    CONSTRAINT "historique_statuts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis" (
    "id" TEXT NOT NULL,
    "platId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "titre" TEXT,
    "commentaire" TEXT NOT NULL,
    "evaluations" JSONB,
    "recommande" BOOLEAN NOT NULL,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "statut" "StatutAvis" NOT NULL DEFAULT 'en_attente',
    "dateApprobation" TIMESTAMP(3),
    "modereParId" TEXT,
    "raisonRejet" TEXT,
    "utile" INTEGER NOT NULL DEFAULT 0,
    "pasUtile" INTEGER NOT NULL DEFAULT 0,
    "reponseContenu" TEXT,
    "reponseDate" TIMESTAMP(3),
    "reponseAuteurId" TEXT,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "adresseIP" TEXT,
    "userAgent" TEXT,
    "achatVerifie" BOOLEAN NOT NULL DEFAULT false,
    "dateAchat" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_votes" (
    "id" TEXT NOT NULL,
    "avisId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "dateVote" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_signalements" (
    "id" TEXT NOT NULL,
    "avisId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "raison" TEXT NOT NULL,
    "description" TEXT,
    "dateSignalement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "avis_signalements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "statut" "StatutMessage" NOT NULL DEFAULT 'non_lu',
    "dateLecture" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_reponses" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "auteur" TEXT NOT NULL DEFAULT 'Admin',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_reponses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "typeRemise" TEXT NOT NULL DEFAULT 'pourcentage',
    "valeur" DOUBLE PRECISION NOT NULL,
    "montantMax" DOUBLE PRECISION,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "utilisationsMax" INTEGER,
    "utilisations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telephone_key" ON "users"("telephone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "adresses_userId_idx" ON "adresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "plats_slug_key" ON "plats"("slug");

-- CreateIndex
CREATE INDEX "plats_categorie_idx" ON "plats"("categorie");

-- CreateIndex
CREATE INDEX "plats_disponible_enRupture_idx" ON "plats"("disponible", "enRupture");

-- CreateIndex
CREATE INDEX "plats_nombreCommandes_idx" ON "plats"("nombreCommandes");

-- CreateIndex
CREATE INDEX "plats_notemoyenne_idx" ON "plats"("notemoyenne");

-- CreateIndex
CREATE INDEX "plats_nom_idx" ON "plats"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_numeroCommande_key" ON "commandes"("numeroCommande");

-- CreateIndex
CREATE INDEX "commandes_clientId_createdAt_idx" ON "commandes"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "commandes_statut_idx" ON "commandes"("statut");

-- CreateIndex
CREATE INDEX "commandes_createdAt_idx" ON "commandes"("createdAt");

-- CreateIndex
CREATE INDEX "articles_commande_commandeId_idx" ON "articles_commande"("commandeId");

-- CreateIndex
CREATE INDEX "articles_commande_platId_idx" ON "articles_commande"("platId");

-- CreateIndex
CREATE INDEX "historique_statuts_commandeId_idx" ON "historique_statuts"("commandeId");

-- CreateIndex
CREATE INDEX "avis_platId_createdAt_idx" ON "avis"("platId", "createdAt");

-- CreateIndex
CREATE INDEX "avis_utilisateurId_idx" ON "avis"("utilisateurId");

-- CreateIndex
CREATE INDEX "avis_statut_idx" ON "avis"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "avis_utilisateurId_commandeId_platId_key" ON "avis"("utilisateurId", "commandeId", "platId");

-- CreateIndex
CREATE UNIQUE INDEX "avis_votes_avisId_utilisateurId_key" ON "avis_votes"("avisId", "utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "avis_signalements_avisId_utilisateurId_key" ON "avis_signalements"("avisId", "utilisateurId");

-- CreateIndex
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

-- CreateIndex
CREATE INDEX "contact_messages_statut_idx" ON "contact_messages"("statut");

-- CreateIndex
CREATE INDEX "contact_reponses_messageId_idx" ON "contact_reponses"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "settings_cle_key" ON "settings"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plats" ADD CONSTRAINT "plats_creeParAdminId_fkey" FOREIGN KEY ("creeParAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commande" ADD CONSTRAINT "articles_commande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commande" ADD CONSTRAINT "articles_commande_platId_fkey" FOREIGN KEY ("platId") REFERENCES "plats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts" ADD CONSTRAINT "historique_statuts_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts" ADD CONSTRAINT "historique_statuts_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_platId_fkey" FOREIGN KEY ("platId") REFERENCES "plats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_reponseAuteurId_fkey" FOREIGN KEY ("reponseAuteurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_votes" ADD CONSTRAINT "avis_votes_avisId_fkey" FOREIGN KEY ("avisId") REFERENCES "avis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_votes" ADD CONSTRAINT "avis_votes_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_signalements" ADD CONSTRAINT "avis_signalements_avisId_fkey" FOREIGN KEY ("avisId") REFERENCES "avis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_signalements" ADD CONSTRAINT "avis_signalements_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_reponses" ADD CONSTRAINT "contact_reponses_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "contact_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

