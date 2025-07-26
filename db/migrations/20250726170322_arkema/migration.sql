/*
  Warnings:

  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "soldToName" DROP NOT NULL,
ALTER COLUMN "soldToAddress" DROP NOT NULL,
ALTER COLUMN "shipToAddress" DROP NOT NULL,
ALTER COLUMN "vendorAddress" DROP NOT NULL,
ALTER COLUMN "poNumber" DROP NOT NULL,
ALTER COLUMN "poDate" DROP NOT NULL,
ALTER COLUMN "deliveryDate" DROP NOT NULL,
ALTER COLUMN "itemQuantity" DROP NOT NULL,
ALTER COLUMN "unitOfMeasure" DROP NOT NULL,
ALTER COLUMN "unitPrice" DROP NOT NULL,
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");
