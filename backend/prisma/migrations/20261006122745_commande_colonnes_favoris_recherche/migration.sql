-- AlterTable
ALTER TABLE "commandes" ADD COLUMN     "codePromo" TEXT,
ADD COLUMN     "fraisLivraison" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "methodePaiement" "MethodePaiement" NOT NULL DEFAULT 'carte',
ADD COLUMN     "paiementReference" TEXT,
ADD COLUMN     "promoCodeId" TEXT,
ADD COLUMN     "remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sousTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "statutPaiement" "StatutPaiement" NOT NULL DEFAULT 'en_attente',
ADD COLUMN     "taxes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "favoris" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoris_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favoris_userId_createdAt_idx" ON "favoris"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "favoris_userId_platId_key" ON "favoris"("userId", "platId");

-- CreateIndex
CREATE INDEX "commandes_statutPaiement_idx" ON "commandes"("statutPaiement");

-- CreateIndex
CREATE INDEX "commandes_livreurId_idx" ON "commandes"("livreurId");

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_platId_fkey" FOREIGN KEY ("platId") REFERENCES "plats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill des colonnes typées depuis les Json existants
UPDATE "commandes" SET
  "sousTotal"       = COALESCE(("montants"->>'sousTotal')::double precision, 0),
  "fraisLivraison"  = COALESCE(("montants"->>'fraisLivraison')::double precision, 0),
  "taxes"           = COALESCE(("montants"->>'taxes')::double precision, 0),
  "remise"          = COALESCE(("montants"->>'remise')::double precision, 0),
  "total"           = COALESCE(("montants"->>'total')::double precision, 0),
  "codePromo"       = NULLIF("montants"->>'codePromo', ''),
  "methodePaiement" = CASE WHEN "paiement"->>'methode' IN ('carte','especes','mobile','virement')
                           THEN ("paiement"->>'methode')::"MethodePaiement" ELSE 'carte' END,
  "statutPaiement"  = CASE WHEN "paiement"->>'statut' IN ('en_attente','valide','echec','rembourse')
                           THEN ("paiement"->>'statut')::"StatutPaiement" ELSE 'en_attente' END;

-- Recherche tolérante aux fautes et aux accents
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() n'est pas IMMUTABLE : wrapper nécessaire pour l'indexer
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text AS
$$ SELECT public.unaccent('public.unaccent', $1) $$
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

CREATE INDEX "plats_recherche_trgm_idx" ON "plats"
  USING GIN (f_unaccent(lower("nom" || ' ' || "description")) gin_trgm_ops);
