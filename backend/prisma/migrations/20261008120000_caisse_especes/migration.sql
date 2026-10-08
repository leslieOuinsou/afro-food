-- CreateEnum
CREATE TYPE "EspecesStatut" AS ENUM ('a_reverser', 'reverse');

-- AlterTable
ALTER TABLE "commandes" ADD COLUMN     "codeRemise" TEXT,
ADD COLUMN     "especesEcartRaison" TEXT,
ADD COLUMN     "especesEncaisseLe" TIMESTAMP(3),
ADD COLUMN     "especesEncaissees" DOUBLE PRECISION,
ADD COLUMN     "especesStatut" "EspecesStatut",
ADD COLUMN     "reversementId" TEXT;

-- CreateTable
CREATE TABLE "reversements_especes" (
    "id" TEXT NOT NULL,
    "livreurId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "annuleLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reversements_especes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_caisse" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "livreurId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "commandeId" TEXT,
    "reversementId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_caisse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reversements_especes_livreurId_createdAt_idx" ON "reversements_especes"("livreurId", "createdAt");

-- CreateIndex
CREATE INDEX "journal_caisse_livreurId_createdAt_idx" ON "journal_caisse"("livreurId", "createdAt");

-- CreateIndex
CREATE INDEX "journal_caisse_createdAt_idx" ON "journal_caisse"("createdAt");

-- CreateIndex
CREATE INDEX "commandes_especesStatut_livreurId_idx" ON "commandes"("especesStatut", "livreurId");

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_reversementId_fkey" FOREIGN KEY ("reversementId") REFERENCES "reversements_especes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reversements_especes" ADD CONSTRAINT "reversements_especes_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reversements_especes" ADD CONSTRAINT "reversements_especes_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_caisse" ADD CONSTRAINT "journal_caisse_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_caisse" ADD CONSTRAINT "journal_caisse_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_caisse" ADD CONSTRAINT "journal_caisse_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_caisse" ADD CONSTRAINT "journal_caisse_reversementId_fkey" FOREIGN KEY ("reversementId") REFERENCES "reversements_especes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

