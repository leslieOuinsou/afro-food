-- AlterTable
ALTER TABLE "promo_codes" ADD COLUMN "livraisonOfferte" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "clientId" TEXT,
ADD COLUMN "sourceCommandeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_sourceCommandeId_key" ON "promo_codes"("sourceCommandeId");
