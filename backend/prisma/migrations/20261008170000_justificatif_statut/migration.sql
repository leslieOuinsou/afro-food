-- AlterTable
ALTER TABLE "justificatifs_virement" ADD COLUMN     "motifRefus" TEXT,
ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'en_attente',
ADD COLUMN     "traiteLe" TIMESTAMP(3),
ADD COLUMN     "traiteParId" TEXT;

-- CreateIndex
CREATE INDEX "justificatifs_virement_statut_createdAt_idx" ON "justificatifs_virement"("statut", "createdAt");

