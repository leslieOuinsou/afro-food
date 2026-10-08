-- CreateTable
CREATE TABLE "justificatifs_virement" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "donnees" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "justificatifs_virement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "justificatifs_virement_commandeId_idx" ON "justificatifs_virement"("commandeId");

-- AddForeignKey
ALTER TABLE "justificatifs_virement" ADD CONSTRAINT "justificatifs_virement_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

