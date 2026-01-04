/*
  Warnings:

  - The `theme` column on the `Item` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `url` column on the `Item` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `filePath` column on the `Item` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "theme",
ADD COLUMN     "theme" TEXT[],
DROP COLUMN "url",
ADD COLUMN     "url" TEXT[],
DROP COLUMN "filePath",
ADD COLUMN     "filePath" TEXT[];
