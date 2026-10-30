-- Parrainage / Google sur users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "codeParrain" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "parraineParId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_codeParrain_key" ON "users"("codeParrain");
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId");
CREATE INDEX IF NOT EXISTS "users_parraineParId_idx" ON "users"("parraineParId");

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_parraineParId_fkey"
    FOREIGN KEY ("parraineParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Panier groupe
CREATE TABLE IF NOT EXISTS "paniers_groupe" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hoteId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'ouvert',
    "articles" JSONB NOT NULL DEFAULT '[]',
    "commandeId" TEXT,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "paniers_groupe_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "paniers_groupe_code_key" ON "paniers_groupe"("code");
CREATE INDEX IF NOT EXISTS "paniers_groupe_hoteId_statut_idx" ON "paniers_groupe"("hoteId", "statut");
DO $$ BEGIN
  ALTER TABLE "paniers_groupe" ADD CONSTRAINT "paniers_groupe_hoteId_fkey"
    FOREIGN KEY ("hoteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Chat commande
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_commandeId_key" ON "conversations"("commandeId");

CREATE TABLE IF NOT EXISTS "messages_chat" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_chat_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "messages_chat_conversationId_createdAt_idx" ON "messages_chat"("conversationId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "messages_chat" ADD CONSTRAINT "messages_chat_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "messages_chat" ADD CONSTRAINT "messages_chat_auteurId_fkey"
    FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Abonnements box
CREATE TABLE IF NOT EXISTS "abonnements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frequence" TEXT NOT NULL DEFAULT 'hebdo',
    "tailleBox" INTEGER NOT NULL DEFAULT 4,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "prochainCreneau" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "abonnements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "abonnements_userId_statut_idx" ON "abonnements"("userId", "statut");
DO $$ BEGIN
  ALTER TABLE "abonnements" ADD CONSTRAINT "abonnements_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Recettes
CREATE TABLE IF NOT EXISTS "recettes" (
    "id" TEXT NOT NULL,
    "platId" TEXT,
    "titre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resume" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "paysOrigine" TEXT,
    "dureeMin" INTEGER,
    "portions" INTEGER,
    "imageUrl" TEXT,
    "publie" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "recettes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "recettes_platId_key" ON "recettes"("platId");
CREATE UNIQUE INDEX IF NOT EXISTS "recettes_slug_key" ON "recettes"("slug");
CREATE INDEX IF NOT EXISTS "recettes_publie_createdAt_idx" ON "recettes"("publie", "createdAt");

-- Alertes stock
CREATE TABLE IF NOT EXISTS "alertes_stock" (
    "id" TEXT NOT NULL,
    "platId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "quantite" INTEGER,
    "traitee" BOOLEAN NOT NULL DEFAULT false,
    "traiteeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alertes_stock_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "alertes_stock_traitee_createdAt_idx" ON "alertes_stock"("traitee", "createdAt");
CREATE INDEX IF NOT EXISTS "alertes_stock_platId_idx" ON "alertes_stock"("platId");

-- Séquences numéros (hors schéma Prisma)
CREATE SEQUENCE IF NOT EXISTS "commande_numero_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "facture_numero_seq" START 1;
