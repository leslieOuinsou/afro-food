-- AlterTable
ALTER TABLE "promo_codes" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "montantMinimum" DOUBLE PRECISION,
ADD COLUMN     "premiereCommandeSeulement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usageParClient" INTEGER,
ALTER COLUMN "valeur" SET DEFAULT 0;
