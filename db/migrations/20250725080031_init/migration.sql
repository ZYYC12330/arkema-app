/*
  Warnings:

  - You are about to drop the column `fileName` on the `Order` table. All the data in the column will be lost.
  - Added the required column `fileUrl` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "fileName",
ADD COLUMN     "fileUrl" VARCHAR(255) NOT NULL;
