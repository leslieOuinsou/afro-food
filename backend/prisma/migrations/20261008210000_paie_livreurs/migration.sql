-- CreateTable
CREATE TABLE "pointages_livreur" (
    "id" TEXT NOT NULL,
    "livreurId" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "jour" TEXT NOT NULL,
    "paieId" TEXT,
    "corrigeParId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pointages_livreur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paies_livreur" (
    "id" TEXT NOT NULL,
    "livreurId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "jour" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "tauxHoraire" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "nbLivraisons" INTEGER NOT NULL DEFAULT 0,
    "mode" TEXT NOT NULL DEFAULT 'especes',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ficheId" TEXT,

    CONSTRAINT "paies_livreur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiches_paie" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "livreurId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "du" TEXT NOT NULL,
    "au" TEXT NOT NULL,
    "totalMinutes" INTEGER NOT NULL,
    "totalMontant" DOUBLE PRECISION NOT NULL,
    "nbLivraisons" INTEGER NOT NULL DEFAULT 0,
    "signatureId" TEXT,
    "envoyeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "luLe" TIMESTAMP(3),

    CONSTRAINT "fiches_paie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pointages_livreur_livreurId_jour_idx" ON "pointages_livreur"("livreurId", "jour");

-- CreateIndex
CREATE INDEX "pointages_livreur_paieId_idx" ON "pointages_livreur"("paieId");

-- CreateIndex
CREATE INDEX "paies_livreur_livreurId_jour_idx" ON "paies_livreur"("livreurId", "jour");

-- CreateIndex
CREATE INDEX "paies_livreur_ficheId_idx" ON "paies_livreur"("ficheId");

-- CreateIndex
CREATE INDEX "paies_livreur_createdAt_idx" ON "paies_livreur"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fiches_paie_numero_key" ON "fiches_paie"("numero");

-- CreateIndex
CREATE INDEX "fiches_paie_livreurId_envoyeLe_idx" ON "fiches_paie"("livreurId", "envoyeLe");

-- AddForeignKey
ALTER TABLE "pointages_livreur" ADD CONSTRAINT "pointages_livreur_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages_livreur" ADD CONSTRAINT "pointages_livreur_paieId_fkey" FOREIGN KEY ("paieId") REFERENCES "paies_livreur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paies_livreur" ADD CONSTRAINT "paies_livreur_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paies_livreur" ADD CONSTRAINT "paies_livreur_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paies_livreur" ADD CONSTRAINT "paies_livreur_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "fiches_paie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiches_paie" ADD CONSTRAINT "fiches_paie_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiches_paie" ADD CONSTRAINT "fiches_paie_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

