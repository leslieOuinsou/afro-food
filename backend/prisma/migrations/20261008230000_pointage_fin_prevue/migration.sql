-- AlterTable
ALTER TABLE "pointages_livreur" ADD COLUMN     "clotureAuto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "finPrevue" TIMESTAMP(3);

