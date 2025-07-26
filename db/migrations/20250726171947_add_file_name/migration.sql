/*
  Warnings:

  - You are about to drop the column `filename` on the `Order` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "filename",
ADD COLUMN     "fileName" VARCHAR(255) NOT NULL;
