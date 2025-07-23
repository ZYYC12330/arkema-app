-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "soldToName" VARCHAR(255) NOT NULL,
    "soldToAddress" TEXT NOT NULL,
    "arkemaSoldToCode" VARCHAR(50),
    "shipToName" VARCHAR(255) NOT NULL,
    "shipToAddress" TEXT NOT NULL,
    "arkemaShipToCode" VARCHAR(50),
    "vendorName" VARCHAR(255) NOT NULL,
    "vendorAddress" TEXT NOT NULL,
    "vendorSalesArea" VARCHAR(100),
    "poNumber" VARCHAR(50) NOT NULL,
    "poDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "deliveryByDate" TIMESTAMP(3),
    "lineNumber" VARCHAR(20),
    "arkemaProductCode" VARCHAR(50),
    "itemQuantity" DECIMAL(15,3) NOT NULL,
    "unitOfMeasure" VARCHAR(20) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_poNumber_key" ON "Order"("poNumber");
