-- DropForeignKey
ALTER TABLE "reversements_especes" DROP CONSTRAINT "reversements_especes_adminId_fkey";

-- AlterTable
ALTER TABLE "reversements_especes" ADD COLUMN     "motifRefus" TEXT,
ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'valide',
ALTER COLUMN "adminId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "reversements_especes" ADD CONSTRAINT "reversements_especes_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

