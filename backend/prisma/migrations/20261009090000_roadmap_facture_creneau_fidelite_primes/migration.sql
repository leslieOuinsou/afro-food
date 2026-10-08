-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pointsFidelite" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "commandes" ADD COLUMN     "creneauLivraison" TIMESTAMP(3),
ADD COLUMN     "factureLe" TIMESTAMP(3),
ADD COLUMN     "numeroFacture" TEXT,
ADD COLUMN     "pointsGagnes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "paies_livreur" ADD COLUMN     "prime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "primeDetail" TEXT;

-- CreateTable
CREATE TABLE "mouvements_points" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "motif" TEXT NOT NULL,
    "commandeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mouvements_points_userId_createdAt_idx" ON "mouvements_points"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_numeroFacture_key" ON "commandes"("numeroFacture");

-- AddForeignKey
ALTER TABLE "mouvements_points" ADD CONSTRAINT "mouvements_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Numérotation continue des factures (une valeur par facture émise)
CREATE SEQUENCE IF NOT EXISTS "facture_numero_seq" START 1;
